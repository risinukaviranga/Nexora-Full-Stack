from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models as m, schemas, seed
from ..database import get_db
from ..deps import current_user
from ..security import create_token, verify_password
from ..services import user_out

router = APIRouter(prefix="/auth", tags=["Auth"])


def _login(db: Session, email: str, password: str) -> dict:
    db.info["bypass_rls"] = True  # tenant is unknown until the user row is found
    user = db.scalar(select(m.UserAccount).where(m.UserAccount.email == email.lower()))
    if not user or not user.is_active or not verify_password(password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return {"access_token": create_token(user.id, user.tenant_id), "token_type": "bearer",
            "user": user_out(db, user)}


@router.post("/register", response_model=schemas.TokenOut, status_code=201)
def register(body: schemas.RegisterIn, db: Session = Depends(get_db)):
    db.info["bypass_rls"] = True
    if db.scalar(select(m.UserAccount.id).where(m.UserAccount.email == body.email.lower())):
        raise HTTPException(409, "Email already registered")
    tenant, store, roles = seed.create_tenant_with_defaults(db, body.business_name)
    seed.create_user(db, tenant, body.name, body.email, body.password, roles["owner"])
    seed.seed_demo_data(db, tenant, store)   # start every new tenant with sample data
    db.commit()
    return _login(db, body.email, body.password)


@router.post("/login", response_model=schemas.TokenOut)
def login(body: schemas.LoginIn, db: Session = Depends(get_db)):
    return _login(db, body.email, body.password)


@router.post("/login-form", include_in_schema=False)  # Swagger "Authorize" button
def login_form(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return _login(db, form.username, form.password)


@router.get("/me", response_model=schemas.UserOut)
def me(user: m.UserAccount = Depends(current_user), db: Session = Depends(get_db)):
    return user_out(db, user)
