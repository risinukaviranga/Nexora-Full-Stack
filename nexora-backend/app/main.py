import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from . import config
from .database import SessionLocal
from .routers import auth, contacts, dashboard, finance, growth, messages

log = logging.getLogger("nexora")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Safety check: superusers and BYPASSRLS roles ignore Row-Level Security completely.
    with SessionLocal() as s:
        sup, byp = s.execute(text(
            "SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user")).one()
        if sup or byp:
            log.warning("DATABASE_URL role bypasses Row-Level Security (superuser=%s). "
                        "Use the non-superuser 'nexora_app' role so tenant isolation is enforced.", sup)
    yield


app = FastAPI(title="Nexora API", version="0.2.0", lifespan=lifespan,
              description="Omni-Channel Business Automation backend (PostgreSQL + SQLAlchemy, multi-tenant RLS).")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth, dashboard, messages, contacts, finance, growth):
    app.include_router(r.router, prefix="/api")


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok"}
