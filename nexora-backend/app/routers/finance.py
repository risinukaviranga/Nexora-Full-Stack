import uuid
from collections import defaultdict
from datetime import datetime, time, timezone
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select

from .. import models as m, schemas
from ..deps import Ctx, get_ctx
from ..services import f, invoice_views, load_invoices

router = APIRouter(prefix="/finance", tags=["Finance"])

LEDGER_LABEL = {"revenue": "Revenue", "fee": "Gateway fees", "cogs": "COGS"}


def _transactions(ctx: Ctx) -> list[dict]:
    """LEDGER_ENTRY (revenue = income; fee/cogs = expense) + EXPENSE, as one list."""
    rows = []
    for e in ctx.db.scalars(select(m.LedgerEntry).where(m.LedgerEntry.store_id == ctx.store_id)):
        rows.append({"id": e.id, "type": "income" if e.entry_type == "revenue" else "expense",
                     "category": LEDGER_LABEL.get(e.entry_type, e.entry_type),
                     "amount": f(e.amount), "date": e.posted_at})
    for x in ctx.db.scalars(select(m.Expense).where(m.Expense.store_id == ctx.store_id)):
        rows.append({"id": x.id, "type": "expense", "category": x.category, "amount": f(x.amount),
                     "date": datetime.combine(x.incurred_on, time.min, tzinfo=timezone.utc)})
    return sorted(rows, key=lambda r: r["date"], reverse=True)


@router.get("/transactions", response_model=list[schemas.TransactionOut])
def list_transactions(type: Optional[str] = None, limit: int = 200, ctx: Ctx = Depends(get_ctx)):
    rows = _transactions(ctx)
    if type:
        rows = [r for r in rows if r["type"] == type]
    return rows[:limit]


@router.post("/transactions", response_model=schemas.TransactionOut, status_code=201)
def add_transaction(body: schemas.TransactionIn, ctx: Ctx = Depends(get_ctx)):
    when = body.date or datetime.now(timezone.utc)
    amount = Decimal(str(body.amount))
    if body.type == "income":
        row = m.LedgerEntry(tenant_id=ctx.tenant_id, store_id=ctx.store_id, entry_type="revenue",
                            amount=amount, posted_at=when)
        category = "Revenue"
    else:
        row = m.Expense(tenant_id=ctx.tenant_id, store_id=ctx.store_id, category=body.category,
                        amount=amount, incurred_on=when.date())
        category = body.category
    ctx.db.add(row)
    ctx.db.commit()
    return {"id": row.id, "type": body.type, "category": category, "amount": f(amount), "date": when}


@router.delete("/transactions/{tid}", status_code=204)
def delete_transaction(tid: uuid.UUID, ctx: Ctx = Depends(get_ctx)):
    expense = ctx.db.get(m.Expense, tid)
    if expense and expense.store_id == ctx.store_id:
        ctx.db.delete(expense)
        ctx.db.commit()
        return
    entry = ctx.db.get(m.LedgerEntry, tid)
    if entry and entry.store_id == ctx.store_id:
        raise HTTPException(409, "Ledger entries are append-only. Post a reversing entry instead.")
    raise HTTPException(404, "Transaction not found")


@router.get("/summary")
def summary(ctx: Ctx = Depends(get_ctx)):
    """Net profit = revenue - gateway fees - COGS - expenses (Design Decision 7)."""
    rows = _transactions(ctx)
    income = sum(r["amount"] for r in rows if r["type"] == "income")
    expense = sum(r["amount"] for r in rows if r["type"] == "expense")
    monthly = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
    by_cat = defaultdict(float)
    for r in rows:
        monthly[r["date"].strftime("%Y-%m")][r["type"]] += r["amount"]
        if r["type"] == "expense":
            by_cat[r["category"]] += r["amount"]
    return {
        "total_income": income, "total_expense": expense, "net_profit": income - expense,
        "monthly": [{"month": k, **v, "profit": v["income"] - v["expense"]} for k, v in sorted(monthly.items())],
        "expense_by_category": [{"category": k, "amount": v} for k, v in by_cat.items()],
    }


@router.get("/invoices", response_model=list[schemas.InvoiceOut])
def list_invoices(status: Optional[str] = None, ctx: Ctx = Depends(get_ctx)):
    views = invoice_views(ctx.db, load_invoices(ctx.db, ctx))
    return [v for v in views if not status or v["status"] == status]


@router.post("/invoices", response_model=schemas.InvoiceOut, status_code=201)
def create_invoice(body: schemas.InvoiceIn, ctx: Ctx = Depends(get_ctx)):
    customer = ctx.db.get(m.Customer, body.contact_id)
    if not customer or customer.store_id != ctx.store_id:
        raise HTTPException(404, "Contact not found")
    total = Decimal(str(body.amount))
    order = m.SalesOrder(tenant_id=ctx.tenant_id, store_id=ctx.store_id, customer_id=customer.id,
                         status="pending", total=total)
    ctx.db.add(order)
    ctx.db.flush()
    inv = m.Invoice(tenant_id=ctx.tenant_id, order_id=order.id, invoice_no=f"INV-{uuid.uuid4().hex[:8].upper()}",
                    total=total, due_date=body.due_date)
    ctx.db.add(inv)
    ctx.db.commit()
    return invoice_views(ctx.db, load_invoices(ctx.db, ctx, inv.id))[0]


@router.patch("/invoices/{inv_id}/status", response_model=schemas.InvoiceOut)
def mark_invoice_paid(inv_id: uuid.UUID, body: schemas.InvoiceStatusIn, ctx: Ctx = Depends(get_ctx)):
    """Status is derived (paid / overdue / sent). Marking paid records a PAYMENT and posts revenue."""
    invs = load_invoices(ctx.db, ctx, inv_id)
    if not invs:
        raise HTTPException(404, "Invoice not found")
    inv = invs[0]
    already = ctx.db.scalar(select(func.coalesce(func.sum(m.Payment.amount), 0))
                            .where(m.Payment.order_id == inv.order_id, m.Payment.status == "succeeded"))
    remaining = inv.total - Decimal(already)
    if remaining > 0:
        pay = m.Payment(tenant_id=ctx.tenant_id, order_id=inv.order_id, gateway="manual",
                        amount=remaining, gateway_fee=0, status="succeeded")
        ctx.db.add(pay)
        ctx.db.flush()
        ctx.db.add(m.LedgerEntry(tenant_id=ctx.tenant_id, store_id=ctx.store_id, payment_id=pay.id,
                                 entry_type="revenue", amount=remaining))
        inv.order.status = "paid"
        ctx.db.commit()
    return invoice_views(ctx.db, load_invoices(ctx.db, ctx, inv_id))[0]
