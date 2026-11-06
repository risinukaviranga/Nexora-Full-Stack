"""Shared query helpers that translate ER tables into the shapes the frontend expects."""
from collections import Counter, defaultdict
from datetime import datetime, timezone
from decimal import Decimal
from typing import Iterable

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import models as m
from .deps import Ctx


def f(x) -> float:
    return float(x or 0)


def user_out(db: Session, user: m.UserAccount) -> dict:
    tenant = db.get(m.Tenant, user.tenant_id)
    role = db.scalar(select(m.Role.name).join(m.UserRole, m.UserRole.role_id == m.Role.id)
                     .where(m.UserRole.user_id == user.id).limit(1))
    return {"id": user.id, "name": user.full_name or user.email, "email": user.email,
            "tenant_id": user.tenant_id, "business_name": tenant.name, "role": role or "member"}


def get_or_create_segment(ctx: Ctx, name: str) -> m.Segment:
    seg = ctx.db.scalar(select(m.Segment).where(m.Segment.store_id == ctx.store_id, m.Segment.name == name))
    if not seg:
        seg = m.Segment(tenant_id=ctx.tenant_id, store_id=ctx.store_id, name=name, rules={})
        ctx.db.add(seg)
        ctx.db.flush()
    return seg


# ------------------------------------------------------------------ contacts
def tags_for(db: Session, customer_ids: Iterable) -> dict:
    out = defaultdict(list)
    rows = db.execute(select(m.SegmentMember.customer_id, m.Segment.name)
                      .join(m.Segment, m.Segment.id == m.SegmentMember.segment_id)
                      .where(m.SegmentMember.customer_id.in_(list(customer_ids)))
                      .order_by(m.Segment.name))
    for cid, name in rows:
        out[cid].append(name)
    return out


def contact_views(db: Session, customers: list[m.Customer]) -> list[dict]:
    tags = tags_for(db, [c.id for c in customers]) if customers else {}
    return [{"id": c.id, "name": c.full_name, "email": c.email, "phone": c.phone,
             "tags": tags.get(c.id, []), "created_at": c.created_at} for c in customers]


# ------------------------------------------------------------------ conversations
def conversation_views(db: Session, convs: list[m.Conversation]) -> list[dict]:
    """last message + unread, derived from MESSAGE.
    unread = inbound messages newer than the last outbound reply (the ER has no read flag).
    Demo-scale implementation; move to SQL aggregates if inboxes get large."""
    if not convs:
        return []
    ids = [c.id for c in convs]
    rn = func.row_number().over(partition_by=m.Message.conversation_id,
                                order_by=m.Message.sent_at.desc()).label("rn")
    sub = (select(m.Message.conversation_id.label("cid"), m.Message.body, m.Message.sent_at, rn)
           .where(m.Message.conversation_id.in_(ids)).subquery())
    last = {r.cid: r for r in db.execute(select(sub).where(sub.c.rn == 1))}
    out_max = dict(db.execute(
        select(m.Message.conversation_id, func.max(m.Message.sent_at))
        .where(m.Message.conversation_id.in_(ids), m.Message.direction == "outbound")
        .group_by(m.Message.conversation_id)).all())
    unread = Counter(
        cid for cid, t in db.execute(
            select(m.Message.conversation_id, m.Message.sent_at)
            .where(m.Message.conversation_id.in_(ids), m.Message.direction == "inbound"))
        if cid not in out_max or t > out_max[cid])
    views = []
    for c in convs:
        lm = last.get(c.id)
        views.append({
            "id": c.id, "contact_id": c.customer_id, "contact_name": c.customer.full_name,
            "channel": c.channel_account.type, "last_message": lm.body if lm else "",
            "last_message_at": lm.sent_at if lm else c.created_at,
            "unread": unread.get(c.id, 0), "status": c.status})
    return views


# ------------------------------------------------------------------ invoices
def invoice_views(db: Session, invoices: list[m.Invoice]) -> list[dict]:
    if not invoices:
        return []
    order_ids = [i.order_id for i in invoices]
    paid = dict(db.execute(select(m.Payment.order_id, func.sum(m.Payment.amount))
                           .where(m.Payment.order_id.in_(order_ids), m.Payment.status == "succeeded")
                           .group_by(m.Payment.order_id)).all())
    items = defaultdict(list)
    for oid, name, qty in db.execute(
            select(m.OrderItem.order_id, m.Product.name, m.OrderItem.qty)
            .join(m.ProductVariant, m.ProductVariant.id == m.OrderItem.variant_id)
            .join(m.Product, m.Product.id == m.ProductVariant.product_id)
            .where(m.OrderItem.order_id.in_(order_ids))):
        items[oid].append(f"{name} x{qty}")
    today = datetime.now(timezone.utc).date()
    views = []
    for i in invoices:
        if (paid.get(i.order_id) or Decimal(0)) >= i.total:
            status = "paid"
        elif i.due_date < today:
            status = "overdue"
        else:
            status = "sent"
        views.append({
            "id": i.id, "invoice_no": i.invoice_no, "order_id": i.order_id,
            "contact_id": i.order.customer_id, "contact_name": i.order.customer.full_name,
            "amount": f(i.total), "due_date": i.due_date, "status": status,
            "items": items.get(i.order_id, []), "created_at": i.order.placed_at})
    return views


def load_invoices(db: Session, ctx: Ctx, invoice_id=None) -> list[m.Invoice]:
    from sqlalchemy.orm import selectinload
    q = (select(m.Invoice).join(m.SalesOrder, m.SalesOrder.id == m.Invoice.order_id)
         .where(m.SalesOrder.store_id == ctx.store_id)
         .options(selectinload(m.Invoice.order).selectinload(m.SalesOrder.customer))
         .order_by(m.SalesOrder.placed_at.desc()))
    if invoice_id:
        q = q.where(m.Invoice.id == invoice_id)
    return list(db.scalars(q))


# ------------------------------------------------------------------ campaigns
def campaign_views(db: Session, campaigns: list[m.Campaign]) -> list[dict]:
    if not campaigns:
        return []
    counts = defaultdict(Counter)
    for cid, status, n in db.execute(
            select(m.CampaignVariant.campaign_id, m.CampaignDelivery.status, func.count())
            .join(m.CampaignDelivery, m.CampaignDelivery.variant_id == m.CampaignVariant.id)
            .where(m.CampaignVariant.campaign_id.in_([c.id for c in campaigns]))
            .group_by(m.CampaignVariant.campaign_id, m.CampaignDelivery.status)):
        counts[cid][status] = n
    views = []
    for c in campaigns:
        k = counts[c.id]
        views.append({
            "id": c.id, "name": c.name, "channel": c.channel,
            "audience_tag": c.segment.name if c.segment else None,
            "message": c.variants[0].content if c.variants else "",
            "status": c.status, "sent": sum(k.values()),
            "opened": k["opened"] + k["converted"], "converted": k["converted"],
            "created_at": c.created_at})
    return views
