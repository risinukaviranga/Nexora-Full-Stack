import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from .. import models as m, schemas
from ..deps import Ctx, get_ctx
from ..services import conversation_views

router = APIRouter(prefix="/conversations", tags=["Unified Messaging"])


def _find(ctx: Ctx, conv_id: uuid.UUID) -> m.Conversation:
    c = ctx.db.scalar(
        select(m.Conversation).join(m.Customer, m.Customer.id == m.Conversation.customer_id)
        .where(m.Conversation.id == conv_id, m.Customer.store_id == ctx.store_id)
        .options(selectinload(m.Conversation.customer), selectinload(m.Conversation.channel_account)))
    if not c:
        raise HTTPException(404, "Conversation not found")
    return c


def _msg_out(msg: m.Message) -> dict:
    return {"id": msg.id, "conversation_id": msg.conversation_id,
            "sender": msg.sender_type if msg.sender_type in ("customer", "agent", "ai") else "agent",
            "text": msg.body, "sent_at": msg.sent_at}


@router.get("", response_model=list[schemas.ConversationOut])
def list_conversations(channel: Optional[str] = None, status: Optional[str] = None,
                       ctx: Ctx = Depends(get_ctx)):
    stmt = (select(m.Conversation)
            .join(m.Customer, m.Customer.id == m.Conversation.customer_id)
            .join(m.ChannelAccount, m.ChannelAccount.id == m.Conversation.channel_account_id)
            .where(m.Customer.store_id == ctx.store_id)
            .options(selectinload(m.Conversation.customer), selectinload(m.Conversation.channel_account)))
    if channel:
        stmt = stmt.where(m.ChannelAccount.type == channel)
    if status:
        stmt = stmt.where(m.Conversation.status == status)
    views = conversation_views(ctx.db, list(ctx.db.scalars(stmt)))
    return sorted(views, key=lambda v: v["last_message_at"], reverse=True)


@router.get("/{conv_id}/messages", response_model=list[schemas.MessageOut])
def get_messages(conv_id: uuid.UUID, ctx: Ctx = Depends(get_ctx)):
    _find(ctx, conv_id)
    msgs = ctx.db.scalars(select(m.Message).where(m.Message.conversation_id == conv_id)
                          .order_by(m.Message.sent_at))
    return [_msg_out(x) for x in msgs]


@router.post("/{conv_id}/messages", response_model=schemas.MessageOut, status_code=201)
def send_message(conv_id: uuid.UUID, body: schemas.SendMessageIn, ctx: Ctx = Depends(get_ctx)):
    _find(ctx, conv_id)
    msg = m.Message(tenant_id=ctx.tenant_id, conversation_id=conv_id, direction="outbound",
                    sender_type="agent", body=body.text)
    ctx.db.add(msg)
    ctx.db.commit()
    return _msg_out(msg)


@router.patch("/{conv_id}", response_model=schemas.ConversationOut)
def update_conversation(conv_id: uuid.UUID, body: schemas.ConversationUpdate, ctx: Ctx = Depends(get_ctx)):
    conv = _find(ctx, conv_id)
    if body.status:
        conv.status = body.status
    ctx.db.commit()
    return conversation_views(ctx.db, [conv])[0]


@router.post("/{conv_id}/simulate-incoming", response_model=schemas.MessageOut, tags=["Dev tools"])
def simulate_incoming(conv_id: uuid.UUID, body: schemas.SendMessageIn, ctx: Ctx = Depends(get_ctx)):
    """Dev helper: pretend the customer replied (real channel webhooks come later)."""
    _find(ctx, conv_id)
    msg = m.Message(tenant_id=ctx.tenant_id, conversation_id=conv_id, direction="inbound",
                    sender_type="customer", body=body.text, external_msg_id=f"sim-{uuid.uuid4().hex}")
    ctx.db.add(msg)
    ctx.db.commit()
    return _msg_out(msg)
