"""PostgreSQL Row-Level Security (Design Decision 2).

Every table with a tenant_id gets a policy:
    row visible/writable  <=>  tenant_id = current_setting('app.tenant_id')
                               OR current_setting('app.bypass_rls') = 'on'
The `tenant` table is matched on its own id. Run by scripts/init_db.py as the table owner.
"""
from sqlalchemy import text
from sqlalchemy.engine import Engine

from .database import Base

_TENANT = "NULLIF(current_setting('app.tenant_id', true), '')::uuid"
_BYPASS = "current_setting('app.bypass_rls', true) = 'on'"


def enable_rls(engine: Engine, app_role: str) -> list[str]:
    protected = []
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if "tenant_id" in table.c:
                col = "tenant_id"
            elif table.name == "tenant":
                col = "id"
            else:
                continue  # permission: global catalogue
            expr = f"({col} = {_TENANT} OR {_BYPASS})"
            conn.execute(text(f'ALTER TABLE "{table.name}" ENABLE ROW LEVEL SECURITY'))
            conn.execute(text(f'ALTER TABLE "{table.name}" FORCE ROW LEVEL SECURITY'))
            conn.execute(text(f'DROP POLICY IF EXISTS tenant_isolation ON "{table.name}"'))
            conn.execute(text(
                f'CREATE POLICY tenant_isolation ON "{table.name}" FOR ALL '
                f"USING {expr} WITH CHECK {expr}"
            ))
            protected.append(table.name)

        # least-privilege grants for the API role (must be a NON-superuser so RLS applies)
        exists = conn.execute(text("SELECT 1 FROM pg_roles WHERE rolname = :r"), {"r": app_role}).scalar()
        if exists:
            conn.execute(text(f'GRANT USAGE ON SCHEMA public TO "{app_role}"'))
            conn.execute(text(f'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "{app_role}"'))
        else:
            print(f"WARNING: role '{app_role}' does not exist; no grants were made.")
    return protected
