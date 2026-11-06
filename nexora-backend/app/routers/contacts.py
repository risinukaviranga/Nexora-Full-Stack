import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError

from .. import models as m, schemas
from ..deps import Ctx, get_ctx
from ..services import contact_views, get_or_create_segment

router = APIRouter(prefix="/contacts", tags=["Contacts"])


def _find(ctx: Ctx, contact_id: uuid.UUID) -> m.Customer:
    c = ctx.db.get(m.Customer, contact_id)
    if not c or c.store_id != ctx.store_id:
        raise HTTPException(404, "Contact not found")
    return c


def _set_tags(ctx: Ctx, customer: m.Customer, tags: list[str]) -> None:
    ctx.db.execute(delete(m.SegmentMember).where(m.SegmentMember.customer_id == customer.id))
    for name in dict.fromkeys(t.strip() for t in tags if t.strip()):
        seg = get_or_create_segment(ctx, name)
        ctx.db.add(m.SegmentMember(segment_id=seg.id, customer_id=customer.id, tenant_id=ctx.tenant_id))


@router.get("", response_model=list[schemas.ContactOut])
def list_contacts(q: Optional[str] = None, tag: Optional[str] = None, ctx: Ctx = Depends(get_ctx)):
    stmt = select(m.Customer).where(m.Customer.store_id == ctx.store_id).order_by(m.Customer.created_at)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(m.Customer.full_name.ilike(like) | m.Customer.email.ilike(like))
    if tag:
        stmt = stmt.where(m.Customer.id.in_(
            select(m.SegmentMember.customer_id)
            .join(m.Segment, m.Segment.id == m.SegmentMember.segment_id).where(m.Segment.name == tag)))
    return contact_views(ctx.db, list(ctx.db.scalars(stmt)))


@router.post("", response_model=schemas.ContactOut, status_code=201)
def create_contact(body: schemas.ContactIn, ctx: Ctx = Depends(get_ctx)):
    c = m.Customer(tenant_id=ctx.tenant_id, store_id=ctx.store_id, full_name=body.name,
                   email=body.email, phone=body.phone)
    ctx.db.add(c)
    ctx.db.flush()
    _set_tags(ctx, c, body.tags)
    ctx.db.commit()
    return contact_views(ctx.db, [c])[0]


@router.get("/{contact_id}", response_model=schemas.ContactOut)
def get_contact(contact_id: uuid.UUID, ctx: Ctx = Depends(get_ctx)):
    return contact_views(ctx.db, [_find(ctx, contact_id)])[0]


@router.put("/{contact_id}", response_model=schemas.ContactOut)
def update_contact(contact_id: uuid.UUID, body: schemas.ContactIn, ctx: Ctx = Depends(get_ctx)):
    c = _find(ctx, contact_id)
    c.full_name, c.email, c.phone = body.name, body.email, body.phone
    _set_tags(ctx, c, body.tags)
    ctx.db.commit()
    return contact_views(ctx.db, [c])[0]


@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: uuid.UUID, ctx: Ctx = Depends(get_ctx)):
    c = _find(ctx, contact_id)
    try:
        ctx.db.delete(c)
        ctx.db.commit()
    except IntegrityError:
        ctx.db.rollback()
        raise HTTPException(409, "Contact has orders/invoices and cannot be deleted")
