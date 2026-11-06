from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from . import config


class Base(DeclarativeBase):
    pass


engine = create_engine(config.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(engine, expire_on_commit=False)


@event.listens_for(Session, "after_begin")
def _apply_rls_context(session, transaction, connection):
    """At the start of every transaction, tell PostgreSQL which tenant this request is for.

    The RLS policies read these two settings (see app/rls.py):
      app.tenant_id  - set from the JWT for normal requests
      app.bypass_rls - 'on' only inside the auth endpoints (login/register must look
                       up a user before the tenant is known)
    """
    if connection.dialect.name != "postgresql":
        return
    tid = session.info.get("tenant_id")
    bypass = session.info.get("bypass_rls", False)
    connection.execute(
        text("SELECT set_config('app.tenant_id', :t, true), set_config('app.bypass_rls', :b, true)"),
        {"t": str(tid) if tid else "", "b": "on" if bypass else "off"},
    )


def get_db():
    with SessionLocal() as session:
        yield session
