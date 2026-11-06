"""Bootstrap + demo data. Used by scripts/init_db.py and POST /auth/register."""
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models as m
from .security import hash_password

PERMISSIONS = [
    "messages.read", "messages.write", "customers.read", "customers.write",
    "finance.read", "finance.write", "campaigns.manage", "settings.manage", "users.manage",
]
ROLE_GRANTS = {
    "owner": PERMISSIONS,
    "support_agent": ["messages.read", "messages.write", "customers.read", "customers.write"],
    "finance": ["finance.read", "finance.write", "customers.read"],
}


def now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_permissions(db: Session) -> dict[str, m.Permission]:
    existing = {p.code: p for p in db.scalars(select(m.Permission))}
    for code in PERMISSIONS:
        if code not in existing:
            existing[code] = m.Permission(code=code)
            db.add(existing[code])
    db.flush()
    return existing


def create_tenant_with_defaults(db: Session, business_name: str):
    """Tenant + default store + the three standard roles (with their permissions)."""
    perms = ensure_permissions(db)
    tenant = m.Tenant(name=business_name)
    db.add(tenant)
    db.flush()
    store = m.Store(tenant_id=tenant.id, name="Main Store", currency="LKR")
    db.add(store)
    roles = {}
    for name, codes in ROLE_GRANTS.items():
        role = m.Role(tenant_id=tenant.id, name=name)
        db.add(role)
        db.flush()
        roles[name] = role
        for code in codes:
            db.add(m.RolePermission(role_id=role.id, permission_id=perms[code].id, tenant_id=tenant.id))
    db.flush()
    return tenant, store, roles


def create_user(db: Session, tenant, full_name, email, password, role: m.Role) -> m.UserAccount:
    user = m.UserAccount(tenant_id=tenant.id, email=email.lower(), full_name=full_name,
                         password_hash=hash_password(password))
    db.add(user)
    db.flush()
    db.add(m.UserRole(user_id=user.id, role_id=role.id, tenant_id=tenant.id))
    db.flush()
    return user


def seed_demo_data(db: Session, tenant: m.Tenant, store: m.Store) -> None:
    n = now()
    tid, sid = tenant.id, store.id

    # --- channels
    chans = []
    for t, ext in (("whatsapp", "+94770000001"), ("facebook", "page_1001"), ("instagram", "ig_2002")):
        c = m.ChannelAccount(tenant_id=tid, store_id=sid, type=t, external_id=ext, credentials_enc=None)
        db.add(c)
        chans.append(c)

    # --- customers + identities
    people = [("Nimali Perera", "nimali@example.com", "+94771234567", 30),
              ("Kasun Fernando", "kasun@example.com", "+94712345678", 12),
              ("Dilini Silva", "dilini@example.com", "+94761112222", 5),
              ("Ruwan Jayasinghe", "ruwan@example.com", "+94755550000", 3)]
    customers = []
    for name, email, phone, age in people:
        c = m.Customer(tenant_id=tid, store_id=sid, full_name=name, email=email, phone=phone,
                       created_at=n - timedelta(days=age))
        db.add(c)
        customers.append(c)
    db.flush()
    for i, c in enumerate(customers[:3]):
        db.add(m.CustomerIdentity(tenant_id=tid, customer_id=c.id, channel_account_id=chans[i].id,
                                  handle=c.phone or c.email))

    # --- segments (shown as "tags" in the contacts API)
    seg = {}
    for name in ("vip", "lead", "customer"):
        s = m.Segment(tenant_id=tid, store_id=sid, name=name, rules={})
        db.add(s)
        seg[name] = s
    db.flush()
    for cust, names in ((customers[0], ["vip", "customer"]), (customers[1], ["lead"]),
                        (customers[2], ["customer"]), (customers[3], ["lead"])):
        for nm in names:
            db.add(m.SegmentMember(segment_id=seg[nm].id, customer_id=cust.id, tenant_id=tid))

    # --- conversations + messages
    for i, c in enumerate(customers[:3]):
        conv = m.Conversation(tenant_id=tid, customer_id=c.id, channel_account_id=chans[i].id,
                              status="open", handled_by="human", created_at=n - timedelta(hours=i * 5 + 2))
        db.add(conv)
        db.flush()
        t = n - timedelta(hours=i * 5 + 1)
        db.add(m.Message(tenant_id=tid, conversation_id=conv.id, direction="inbound", sender_type="customer",
                         body="Hi, I'm interested in your product.", external_msg_id=f"seed-{uuid.uuid4().hex}",
                         sent_at=t - timedelta(minutes=5)))
        db.add(m.Message(tenant_id=tid, conversation_id=conv.id, direction="inbound", sender_type="customer",
                         body="Is this still available?", external_msg_id=f"seed-{uuid.uuid4().hex}", sent_at=t))
        if i == 2:  # one thread already answered -> unread 0
            db.add(m.Message(tenant_id=tid, conversation_id=conv.id, direction="outbound", sender_type="agent",
                             body="Yes, it is in stock!", sent_at=t + timedelta(minutes=3)))

    # --- catalogue
    prod = m.Product(tenant_id=tid, store_id=sid, name="Ceylon Tea Gift Box", category="Gifts",
                     description="Assorted premium Ceylon teas.")
    db.add(prod)
    db.flush()
    variants = [m.ProductVariant(tenant_id=tid, product_id=prod.id, sku="TEA-BOX-S", price=Decimal("4500"),
                                 unit_cost=Decimal("2800"), stock_qty=120),
                m.ProductVariant(tenant_id=tid, product_id=prod.id, sku="TEA-BOX-L", price=Decimal("8200"),
                                 unit_cost=Decimal("5100"), stock_qty=60)]
    db.add_all(variants)
    db.flush()

    # --- six months of paid orders -> payments, invoices, ledger (revenue / fee / cogs)
    for months_ago in range(5, -1, -1):
        placed = n - timedelta(days=30 * months_ago + 2)
        v = variants[months_ago % 2]
        qty = 8 + (5 - months_ago) * 2
        total = v.price * qty
        order = m.SalesOrder(tenant_id=tid, store_id=sid, customer_id=customers[months_ago % 4].id,
                             status="paid", total=total, placed_at=placed)
        db.add(order)
        db.flush()
        db.add(m.OrderItem(tenant_id=tid, order_id=order.id, variant_id=v.id, qty=qty,
                           unit_price=v.price, unit_cost=v.unit_cost))
        fee = (total * Decimal("0.029")).quantize(Decimal("0.01"))
        pay = m.Payment(tenant_id=tid, order_id=order.id, gateway="payhere", amount=total,
                        gateway_fee=fee, status="succeeded")
        db.add(pay)
        db.flush()
        db.add(m.Invoice(tenant_id=tid, order_id=order.id, invoice_no=f"INV-{uuid.uuid4().hex[:8].upper()}",
                         total=total, due_date=(placed + timedelta(days=14)).date()))
        db.add(m.LedgerEntry(tenant_id=tid, store_id=sid, payment_id=pay.id, entry_type="revenue",
                             amount=total, posted_at=placed))
        db.add(m.LedgerEntry(tenant_id=tid, store_id=sid, payment_id=pay.id, entry_type="fee",
                             amount=fee, posted_at=placed))
        db.add(m.LedgerEntry(tenant_id=tid, store_id=sid, payment_id=pay.id, entry_type="cogs",
                             amount=v.unit_cost * qty, posted_at=placed))
        db.add(m.Expense(tenant_id=tid, store_id=sid, category="Marketing", amount=Decimal(4000 + months_ago * 300),
                         incurred_on=placed.date()))
        db.add(m.Expense(tenant_id=tid, store_id=sid, category="Operations", amount=Decimal(6000 + (months_ago % 3) * 500),
                         incurred_on=placed.date()))

    # --- one open (unpaid) invoice
    order = m.SalesOrder(tenant_id=tid, store_id=sid, customer_id=customers[0].id, status="pending",
                         total=Decimal("45000"), placed_at=n - timedelta(days=2))
    db.add(order)
    db.flush()
    db.add(m.Invoice(tenant_id=tid, order_id=order.id, invoice_no=f"INV-{uuid.uuid4().hex[:8].upper()}",
                     total=Decimal("45000"), due_date=(n + timedelta(days=7)).date()))

    # --- a running campaign with two A/B variants and deliveries to the "lead" segment
    camp = m.Campaign(tenant_id=tid, store_id=sid, segment_id=seg["lead"].id, channel="whatsapp",
                      status="running", name="Welcome Offer", created_at=n - timedelta(days=3))
    db.add(camp)
    db.flush()
    va = m.CampaignVariant(tenant_id=tid, campaign_id=camp.id, label="A", content="Get 10% off your first order!")
    vb = m.CampaignVariant(tenant_id=tid, campaign_id=camp.id, label="B", content="Free delivery on your first order!")
    db.add_all([va, vb])
    db.flush()
    for cust, var, status in ((customers[1], va, "converted"), (customers[3], vb, "opened")):
        db.add(m.CampaignDelivery(tenant_id=tid, variant_id=var.id, customer_id=cust.id, status=status,
                                  sent_at=n - timedelta(days=2)))
    db.flush()


def seed_demo_tenant(db: Session) -> None:
    """Demo login: admin@nexora.lk / admin123 (skipped if it already exists)."""
    if db.scalar(select(m.UserAccount).where(m.UserAccount.email == "admin@nexora.lk")):
        return
    tenant, store, roles = create_tenant_with_defaults(db, "Demo Business")
    create_user(db, tenant, "Demo Admin", "admin@nexora.lk", "admin123", roles["owner"])
    seed_demo_data(db, tenant, store)
