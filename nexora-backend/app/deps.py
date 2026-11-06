import uuid
from dataclasses import dataclass
from typing import Optional

import jwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models as m
from .database import get_db
from .security import decode_token

oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login-form")


def current_user(token: str = Depends(oauth2), db: Session = Depends(get_db)) -> m.UserAccount:
    err = HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token",
                        headers={"WWW-Authenticate": "Bearer"})
    try:
        data = decode_token(token)
        tenant_id, user_id = uuid.UUID(data["tenant_id"]), uuid.UUID(data["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise err
    db.info["tenant_id"] = tenant_id          # from here on, PostgreSQL RLS scopes every query
    user = db.get(m.UserAccount, user_id)
    if not user or not user.is_active or user.tenant_id != tenant_id:
        raise err
    return user


@dataclass
class Ctx:
    db: Session
    user: m.UserAccount
    tenant_id: uuid.UUID
    store_id: uuid.UUID


def get_ctx(
    user: m.UserAccount = Depends(current_user),
    db: Session = Depends(get_db),
    x_store_id: Optional[uuid.UUID] = Header(default=None),
) -> Ctx:
    """Request context: DB session + user + the store being worked on.
    Send an `X-Store-Id` header to pick a store; otherwise the tenant's first store is used."""
    q = select(m.Store.id).order_by(m.Store.name, m.Store.id)
    if x_store_id:
        q = q.where(m.Store.id == x_store_id)
    store_id = db.scalar(q.limit(1))
    if not store_id:
        raise HTTPException(404, "Store not found")
    return Ctx(db=db, user=user, tenant_id=user.tenant_id, store_id=store_id)
