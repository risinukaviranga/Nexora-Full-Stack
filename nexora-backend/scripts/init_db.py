"""One-time (and re-runnable) database setup.

    python -m scripts.init_db            # create extension + tables + RLS + grants + demo tenant
    python -m scripts.init_db --reset    # DROP everything first (development only!)

Uses DATABASE_ADMIN_URL (the table owner). The API itself runs as DATABASE_URL.
"""
import sys

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app import config, models  # noqa: F401  (import registers all tables)
from app.database import Base
from app.rls import enable_rls
from app.seed import ensure_permissions, seed_demo_tenant


def main(reset: bool = False) -> None:
    engine = create_engine(config.DATABASE_ADMIN_URL)
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    if reset:
        print("Dropping all tables ...")
        Base.metadata.drop_all(engine)
    print(f"Creating {len(Base.metadata.tables)} tables ...")
    Base.metadata.create_all(engine)
    protected = enable_rls(engine, config.APP_DB_ROLE)
    print(f"Row-Level Security enabled on {len(protected)} tables; grants given to '{config.APP_DB_ROLE}'")
    with Session(engine) as db:
        db.info["bypass_rls"] = True
        ensure_permissions(db)
        seed_demo_tenant(db)
        db.commit()
    print("Done. Demo login: admin@nexora.lk / admin123")


if __name__ == "__main__":
    main(reset="--reset" in sys.argv)
