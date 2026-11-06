from datetime import date, datetime
from typing import Literal, Optional
import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Channel = Literal["whatsapp", "facebook", "instagram", "email", "sms", "web"]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth ----------
class RegisterIn(BaseModel):
    business_name: str = Field(min_length=2)
    name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    tenant_id: uuid.UUID
    business_name: str
    role: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Contacts (CUSTOMER; tags = SEGMENT names) ----------
class ContactIn(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    tags: list[str] = []


class ContactOut(ContactIn):
    id: uuid.UUID
    created_at: datetime


# ---------- Unified messaging ----------
class MessageOut(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender: Literal["customer", "agent", "ai"]
    text: str
    sent_at: datetime


class ConversationOut(BaseModel):
    id: uuid.UUID
    contact_id: uuid.UUID
    contact_name: str
    channel: Channel
    last_message: str
    last_message_at: datetime
    unread: int
    status: Literal["open", "closed"]


class SendMessageIn(BaseModel):
    text: str = Field(min_length=1)


class ConversationUpdate(BaseModel):
    status: Optional[Literal["open", "closed"]] = None


# ---------- Finance (LEDGER_ENTRY + EXPENSE, SALES_ORDER + INVOICE + PAYMENT) ----------
class TransactionIn(BaseModel):
    type: Literal["income", "expense"]
    category: str = "General"      # stored for expenses; income is posted as a 'revenue' ledger entry
    amount: float = Field(gt=0)
    date: Optional[datetime] = None


class TransactionOut(BaseModel):
    id: uuid.UUID
    type: Literal["income", "expense"]
    category: str
    amount: float
    date: datetime


class InvoiceIn(BaseModel):
    contact_id: uuid.UUID
    amount: float = Field(gt=0)
    due_date: date


class InvoiceOut(BaseModel):
    id: uuid.UUID
    invoice_no: str
    order_id: uuid.UUID
    contact_id: uuid.UUID
    contact_name: str
    amount: float
    due_date: date
    status: Literal["sent", "paid", "overdue"]   # derived from payments + due date
    items: list[str]
    created_at: datetime


class InvoiceStatusIn(BaseModel):
    status: Literal["paid"]


# ---------- Growth (CAMPAIGN + CAMPAIGN_VARIANT + CAMPAIGN_DELIVERY) ----------
class CampaignIn(BaseModel):
    name: str
    channel: Channel
    audience_tag: Optional[str] = None   # SEGMENT name
    message: str                         # content of variant "A"


class CampaignOut(BaseModel):
    id: uuid.UUID
    name: str
    channel: Channel
    audience_tag: Optional[str]
    message: str
    status: Literal["draft", "running", "paused", "completed"]
    sent: int
    opened: int
    converted: int
    created_at: datetime


class CampaignStatusIn(BaseModel):
    status: Literal["draft", "running", "paused", "completed"]
