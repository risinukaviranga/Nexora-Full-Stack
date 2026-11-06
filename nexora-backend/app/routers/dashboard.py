from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from .. import models as m
from ..deps import Ctx, get_ctx
from ..services import conversation_views, f, invoice_views, load_invoices

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview")
def overview(ctx: Ctx = Depends(get_ctx)):
    db, sid = ctx.db, ctx.store_id

    ledger = dict(db.execute(select(m.LedgerEntry.entry_type, func.sum(m.LedgerEntry.amount))
                             .where(m.LedgerEntry.store_id == sid).group_by(m.LedgerEntry.entry_type)).all())
    expenses = db.scalar(select(func.coalesce(func.sum(m.Expense.amount), 0)).where(m.Expense.store_id == sid))
    revenue = f(ledger.get("revenue"))
    net_profit = revenue - f(ledger.get("fee")) - f(ledger.get("cogs")) - f(expenses)

    convs = list(db.scalars(
        select(m.Conversation).join(m.Customer, m.Customer.id == m.Conversation.customer_id)
        .where(m.Customer.store_id == sid)
        .options(selectinload(m.Conversation.customer), selectinload(m.Conversation.channel_account))))
    views = sorted(conversation_views(db, convs), key=lambda v: v["last_message_at"], reverse=True)

    deliveries = Counter(dict(db.execute(
        select(m.CampaignDelivery.status, func.count())
        .join(m.CampaignVariant, m.CampaignVariant.id == m.CampaignDelivery.variant_id)
        .join(m.Campaign, m.Campaign.id == m.CampaignVariant.campaign_id)
        .where(m.Campaign.store_id == sid).group_by(m.CampaignDelivery.status)).all()))
    sent = sum(deliveries.values())

    invoices = invoice_views(db, load_invoices(db, ctx))
    return {
        "kpis": {
            "total_contacts": db.scalar(select(func.count()).select_from(m.Customer).where(m.Customer.store_id == sid)),
            "open_conversations": sum(1 for v in views if v["status"] == "open"),
            "unread_messages": sum(v["unread"] for v in views),
            "revenue": revenue,
            "net_profit": round(net_profit, 2),
            "pending_invoices": sum(1 for i in invoices if i["status"] in ("sent", "overdue")),
            "conversion_rate": round(deliveries["converted"] / sent * 100, 1) if sent else 0,
        },
        "conversations_by_channel": [{"channel": k, "count": v} for k, v in Counter(v["channel"] for v in views).items()],
        "recent_conversations": views[:5],
    }
