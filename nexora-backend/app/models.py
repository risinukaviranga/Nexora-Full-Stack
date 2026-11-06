"""SQLAlchemy models generated from ER_Model_Omnichannel_Platform.xlsx (42 entities).

Follows the sheet's Design Decisions:
  * UUID primary keys, shared schema, tenant_id on every business table
  * tenant_id also added to the junction tables ROLE_PERMISSION, USER_ROLE, SEGMENT_MEMBER
  * tenant-scoped uniques: UNIQUE(tenant_id, sku), (tenant_id, invoice_no), (tenant_id, external_msg_id)
  * composite index (tenant_id, conversation_id, sent_at) on MESSAGE
  * jsonb for details/content/rules, pgvector for KB_CHUNK.embedding

Small additions the sheet does not list (needed by the existing dashboard API):
  USER_ACCOUNT.full_name, CUSTOMER.created_at, CONVERSATION.created_at,
  CAMPAIGN.name, CAMPAIGN.created_at
"""
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import (Boolean, Date, DateTime, Float, ForeignKey, Index, Integer, Numeric,
                        String, Text, UniqueConstraint, Uuid)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import config
from .database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def pk():
    return mapped_column(Uuid, primary_key=True, default=uuid.uuid4)


def fk(target: str, *, nullable=False, ondelete="CASCADE", pk_=False, unique=False):
    return mapped_column(Uuid, ForeignKey(target, ondelete=ondelete), nullable=nullable,
                         primary_key=pk_, index=not pk_, unique=unique)


def tenant_col(pk_=False):
    return fk("tenant.id", pk_=pk_)


TS = DateTime(timezone=True)
MONEY = Numeric(12, 2)

# ============================================================ RBAC & Security


class Tenant(Base):
    __tablename__ = "tenant"
    id: Mapped[uuid.UUID] = pk()
    name: Mapped[str] = mapped_column(String(255))
    plan: Mapped[str] = mapped_column(String(50), default="free")
    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime] = mapped_column(TS, default=_now)


class Store(Base):
    __tablename__ = "store"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    name: Mapped[str] = mapped_column(String(255))
    currency: Mapped[str] = mapped_column(String(10), default="LKR")
    domain: Mapped[Optional[str]] = mapped_column(String(255))


class UserAccount(Base):
    __tablename__ = "user_account"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    email: Mapped[str] = mapped_column(String(255), unique=True)  # global: login is by email only
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    full_name: Mapped[str] = mapped_column(String(255), default="")  # addition


class Role(Base):
    __tablename__ = "role"
    __table_args__ = (UniqueConstraint("tenant_id", "name"),)
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    name: Mapped[str] = mapped_column(String(100))


class Permission(Base):  # global catalogue, no tenant_id by design
    __tablename__ = "permission"
    id: Mapped[uuid.UUID] = pk()
    code: Mapped[str] = mapped_column(String(100), unique=True)


class RolePermission(Base):
    __tablename__ = "role_permission"
    role_id: Mapped[uuid.UUID] = fk("role.id", pk_=True)
    permission_id: Mapped[uuid.UUID] = fk("permission.id", pk_=True)
    tenant_id: Mapped[uuid.UUID] = tenant_col()  # added per Design Decision 5


class UserRole(Base):
    __tablename__ = "user_role"
    user_id: Mapped[uuid.UUID] = fk("user_account.id", pk_=True)
    role_id: Mapped[uuid.UUID] = fk("role.id", pk_=True)
    store_id: Mapped[Optional[uuid.UUID]] = fk("store.id", nullable=True)  # optional store scoping
    tenant_id: Mapped[uuid.UUID] = tenant_col()  # added per Design Decision 5


class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    user_id: Mapped[Optional[uuid.UUID]] = fk("user_account.id", nullable=True, ondelete="SET NULL")
    action: Mapped[str] = mapped_column(String(255))
    details: Mapped[Optional[dict]] = mapped_column(JSONB)

# ============================================================ Messaging & CRM


class ChannelAccount(Base):
    __tablename__ = "channel_account"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    store_id: Mapped[uuid.UUID] = fk("store.id")
    type: Mapped[str] = mapped_column(String(50))  # whatsapp | facebook | instagram | email | sms | web
    external_id: Mapped[Optional[str]] = mapped_column(String(255))
    credentials_enc: Mapped[Optional[str]] = mapped_column(Text)  # encrypt at app level (Fernet/KMS)


class Customer(Base):
    __tablename__ = "customer"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    store_id: Mapped[uuid.UUID] = fk("store.id")
    full_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(TS, default=_now)  # addition


class CustomerIdentity(Base):
    __tablename__ = "customer_identity"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    customer_id: Mapped[uuid.UUID] = fk("customer.id")
    channel_account_id: Mapped[uuid.UUID] = fk("channel_account.id")
    handle: Mapped[str] = mapped_column(String(255))


class Conversation(Base):
    __tablename__ = "conversation"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    customer_id: Mapped[uuid.UUID] = fk("customer.id")
    channel_account_id: Mapped[uuid.UUID] = fk("channel_account.id", ondelete="RESTRICT")
    status: Mapped[str] = mapped_column(String(20), default="open")
    handled_by: Mapped[str] = mapped_column(String(20), default="human")  # ai | human
    created_at: Mapped[datetime] = mapped_column(TS, default=_now)  # addition

    customer: Mapped["Customer"] = relationship()
    channel_account: Mapped["ChannelAccount"] = relationship()


class Message(Base):
    __tablename__ = "message"
    __table_args__ = (
        UniqueConstraint("tenant_id", "external_msg_id"),  # idempotent webhook ingestion
        Index("ix_message_tenant_conv_sent", "tenant_id", "conversation_id", "sent_at"),
    )
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    conversation_id: Mapped[uuid.UUID] = fk("conversation.id")
    direction: Mapped[str] = mapped_column(String(20))      # inbound | outbound
    sender_type: Mapped[str] = mapped_column(String(20))    # customer | agent | ai
    body: Mapped[str] = mapped_column(Text)
    external_msg_id: Mapped[Optional[str]] = mapped_column(String(255))
    sent_at: Mapped[datetime] = mapped_column(TS, default=_now)


class MessageAttachment(Base):
    __tablename__ = "message_attachment"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    message_id: Mapped[uuid.UUID] = fk("message.id")
    url: Mapped[str] = mapped_column(String(1000))
    mime_type: Mapped[Optional[str]] = mapped_column(String(100))


class Escalation(Base):
    __tablename__ = "escalation"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    conversation_id: Mapped[uuid.UUID] = fk("conversation.id")
    assigned_user_id: Mapped[Optional[uuid.UUID]] = fk("user_account.id", nullable=True, ondelete="SET NULL")
    reason: Mapped[Optional[str]] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="open")

# ============================================================ AI Conversation Agent (RAG)


class AiAgentConfig(Base):
    __tablename__ = "ai_agent_config"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    store_id: Mapped[uuid.UUID] = fk("store.id")
    model: Mapped[str] = mapped_column(String(100))
    system_prompt: Mapped[Optional[str]] = mapped_column(Text)
    escalation_threshold: Mapped[float] = mapped_column(Float, default=0.5)


class AiRun(Base):
    __tablename__ = "ai_run"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    agent_config_id: Mapped[uuid.UUID] = fk("ai_agent_config.id")
    message_id: Mapped[uuid.UUID] = fk("message.id")
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    confidence: Mapped[Optional[float]] = mapped_column(Float)
    escalated: Mapped[bool] = mapped_column(Boolean, default=False)


class KbDocument(Base):
    __tablename__ = "kb_document"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    store_id: Mapped[uuid.UUID] = fk("store.id")
    source_type: Mapped[str] = mapped_column(String(50))  # catalogue | policy | faq
    title: Mapped[str] = mapped_column(String(255))


class KbChunk(Base):
    __tablename__ = "kb_chunk"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    document_id: Mapped[uuid.UUID] = fk("kb_document.id")
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[Optional[list[float]]] = mapped_column(Vector(config.EMBEDDING_DIM))

# ============================================================ Catalog, Orders & Tracking


class Product(Base):
    __tablename__ = "product"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    store_id: Mapped[uuid.UUID] = fk("store.id")
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String(100))


class ProductVariant(Base):
    __tablename__ = "product_variant"
    __table_args__ = (UniqueConstraint("tenant_id", "sku"),)
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    product_id: Mapped[uuid.UUID] = fk("product.id")
    sku: Mapped[str] = mapped_column(String(100))
    price: Mapped[Decimal] = mapped_column(MONEY)
    unit_cost: Mapped[Decimal] = mapped_column(MONEY, default=0)
    stock_qty: Mapped[int] = mapped_column(Integer, default=0)

    product: Mapped["Product"] = relationship()


class SalesOrder(Base):
    __tablename__ = "sales_order"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    store_id: Mapped[uuid.UUID] = fk("store.id")
    customer_id: Mapped[uuid.UUID] = fk("customer.id", ondelete="RESTRICT")
    status: Mapped[str] = mapped_column(String(50), default="pending")
    total: Mapped[Decimal] = mapped_column(MONEY, default=0)
    placed_at: Mapped[datetime] = mapped_column(TS, default=_now)

    customer: Mapped["Customer"] = relationship()


class OrderItem(Base):
    __tablename__ = "order_item"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    order_id: Mapped[uuid.UUID] = fk("sales_order.id")
    variant_id: Mapped[uuid.UUID] = fk("product_variant.id", ondelete="RESTRICT")
    qty: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[Decimal] = mapped_column(MONEY)  # copied from variant at sale time
    unit_cost: Mapped[Decimal] = mapped_column(MONEY)   # copied at sale time; drives COGS

    variant: Mapped["ProductVariant"] = relationship()


class CarrierAccount(Base):
    __tablename__ = "carrier_account"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    store_id: Mapped[uuid.UUID] = fk("store.id")
    carrier: Mapped[str] = mapped_column(String(100))
    credentials_enc: Mapped[Optional[str]] = mapped_column(Text)


class Shipment(Base):
    __tablename__ = "shipment"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    order_id: Mapped[uuid.UUID] = fk("sales_order.id")
    carrier_account_id: Mapped[Optional[uuid.UUID]] = fk("carrier_account.id", nullable=True, ondelete="SET NULL")
    tracking_no: Mapped[Optional[str]] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), default="created")


class ShipmentEvent(Base):
    __tablename__ = "shipment_event"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    shipment_id: Mapped[uuid.UUID] = fk("shipment.id")
    milestone: Mapped[str] = mapped_column(String(100))
    location: Mapped[Optional[str]] = mapped_column(String(255))
    occurred_at: Mapped[datetime] = mapped_column(TS, default=_now)

# ============================================================ Financial Ledger


class Payment(Base):
    __tablename__ = "payment"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    order_id: Mapped[uuid.UUID] = fk("sales_order.id", ondelete="RESTRICT")
    gateway: Mapped[str] = mapped_column(String(50))
    amount: Mapped[Decimal] = mapped_column(MONEY)
    gateway_fee: Mapped[Decimal] = mapped_column(MONEY, default=0)
    status: Mapped[str] = mapped_column(String(50), default="succeeded")


class Invoice(Base):
    __tablename__ = "invoice"
    __table_args__ = (UniqueConstraint("tenant_id", "invoice_no"),)
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    order_id: Mapped[uuid.UUID] = fk("sales_order.id", ondelete="RESTRICT")
    invoice_no: Mapped[str] = mapped_column(String(50))
    total: Mapped[Decimal] = mapped_column(MONEY)
    due_date: Mapped[date] = mapped_column(Date)

    order: Mapped["SalesOrder"] = relationship()


class LedgerEntry(Base):  # append-only; corrections are new reversing entries
    __tablename__ = "ledger_entry"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    store_id: Mapped[uuid.UUID] = fk("store.id")
    payment_id: Mapped[Optional[uuid.UUID]] = fk("payment.id", nullable=True, ondelete="RESTRICT")
    entry_type: Mapped[str] = mapped_column(String(20))  # revenue | fee | cogs
    amount: Mapped[Decimal] = mapped_column(MONEY)
    posted_at: Mapped[datetime] = mapped_column(TS, default=_now)


class Expense(Base):
    __tablename__ = "expense"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    store_id: Mapped[uuid.UUID] = fk("store.id")
    category: Mapped[str] = mapped_column(String(100))
    amount: Mapped[Decimal] = mapped_column(MONEY)
    incurred_on: Mapped[date] = mapped_column(Date)


class DailyBrief(Base):
    __tablename__ = "daily_brief"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    store_id: Mapped[uuid.UUID] = fk("store.id")
    brief_date: Mapped[date] = mapped_column(Date)
    net_profit: Mapped[Decimal] = mapped_column(MONEY, default=0)
    summary: Mapped[Optional[str]] = mapped_column(Text)

# ============================================================ SEO / AEO / GEO


class SeoAsset(Base):
    __tablename__ = "seo_asset"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    store_id: Mapped[uuid.UUID] = fk("store.id")
    product_id: Mapped[Optional[uuid.UUID]] = fk("product.id", nullable=True, ondelete="SET NULL")
    asset_type: Mapped[str] = mapped_column(String(50))  # json_ld | faq | summary | description
    content: Mapped[Optional[dict]] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(String(50), default="draft")

# ============================================================ Marketing & Growth


class Segment(Base):
    __tablename__ = "segment"
    __table_args__ = (UniqueConstraint("tenant_id", "store_id", "name"),)
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    store_id: Mapped[uuid.UUID] = fk("store.id")
    name: Mapped[str] = mapped_column(String(100))
    rules: Mapped[Optional[dict]] = mapped_column(JSONB)


class SegmentMember(Base):
    __tablename__ = "segment_member"
    segment_id: Mapped[uuid.UUID] = fk("segment.id", pk_=True)
    customer_id: Mapped[uuid.UUID] = fk("customer.id", pk_=True)
    tenant_id: Mapped[uuid.UUID] = tenant_col()  # added per Design Decision 5
    added_at: Mapped[datetime] = mapped_column(TS, default=_now)


class ChurnScore(Base):
    __tablename__ = "churn_score"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    customer_id: Mapped[uuid.UUID] = fk("customer.id")
    risk: Mapped[float] = mapped_column(Float)
    scored_on: Mapped[date] = mapped_column(Date)


class Campaign(Base):
    __tablename__ = "campaign"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    store_id: Mapped[uuid.UUID] = fk("store.id")
    segment_id: Mapped[Optional[uuid.UUID]] = fk("segment.id", nullable=True, ondelete="SET NULL")
    channel: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(50), default="draft")
    name: Mapped[str] = mapped_column(String(255), default="")                # addition
    created_at: Mapped[datetime] = mapped_column(TS, default=_now)           # addition

    segment: Mapped[Optional["Segment"]] = relationship()
    variants: Mapped[list["CampaignVariant"]] = relationship(
        order_by="CampaignVariant.label", cascade="all, delete-orphan", passive_deletes=True)


class CampaignVariant(Base):
    __tablename__ = "campaign_variant"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    campaign_id: Mapped[uuid.UUID] = fk("campaign.id")
    label: Mapped[str] = mapped_column(String(50))
    content: Mapped[str] = mapped_column(Text)
    conversion_rate: Mapped[Optional[float]] = mapped_column(Float)


class CampaignDelivery(Base):
    __tablename__ = "campaign_delivery"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    variant_id: Mapped[uuid.UUID] = fk("campaign_variant.id")
    customer_id: Mapped[uuid.UUID] = fk("customer.id")
    status: Mapped[str] = mapped_column(String(50), default="sent")  # sent | opened | converted | failed
    sent_at: Mapped[datetime] = mapped_column(TS, default=_now)


class SocialPost(Base):
    __tablename__ = "social_post"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    store_id: Mapped[uuid.UUID] = fk("store.id")
    platform: Mapped[str] = mapped_column(String(50))
    content: Mapped[str] = mapped_column(Text)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(TS)

# ============================================================ Analytics & Fraud


class SentimentScore(Base):
    __tablename__ = "sentiment_score"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    message_id: Mapped[uuid.UUID] = fk("message.id", unique=True)  # 1 : 0..1
    score: Mapped[float] = mapped_column(Float)
    label: Mapped[Optional[str]] = mapped_column(String(50))


class AgentMetric(Base):
    __tablename__ = "agent_metric"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    user_id: Mapped[uuid.UUID] = fk("user_account.id")
    metric_date: Mapped[date] = mapped_column(Date)
    avg_response_secs: Mapped[int] = mapped_column(Integer, default=0)
    resolved_count: Mapped[int] = mapped_column(Integer, default=0)


class FraudAlert(Base):
    __tablename__ = "fraud_alert"
    id: Mapped[uuid.UUID] = pk()
    tenant_id: Mapped[uuid.UUID] = tenant_col()
    order_id: Mapped[uuid.UUID] = fk("sales_order.id")
    risk_score: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(50), default="open")
