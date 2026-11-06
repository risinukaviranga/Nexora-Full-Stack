"""End-to-end test against a real, throw-away PostgreSQL 16 (+pgvector) started by `pgserver`.

    python -m tests.test_api
"""
import os
import tempfile
import warnings

warnings.filterwarnings("ignore")
import pgserver  # noqa: E402

srv = pgserver.get_server(tempfile.mkdtemp(prefix="nexora_pg_"))
base = srv.get_uri().replace("postgresql://", "postgresql+psycopg://")
srv.psql("CREATE ROLE nexora_app LOGIN PASSWORD 'x' NOSUPERUSER NOBYPASSRLS;")
os.environ["DATABASE_ADMIN_URL"] = base
os.environ["DATABASE_URL"] = base.replace("postgres:@", "nexora_app:x@")

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app import models as m  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from scripts.init_db import main as init_db  # noqa: E402

init_db(reset=True)


def auth(c, email, password):
    r = c.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": "Bearer " + r.json()["access_token"]}


with TestClient(app) as c:
    # ---------------- auth
    assert c.post("/api/auth/login", json={"email": "admin@nexora.lk", "password": "wrong"}).status_code == 401
    h = auth(c, "admin@nexora.lk", "admin123")
    me = c.get("/api/auth/me", headers=h).json()
    assert me["role"] == "owner" and me["business_name"] == "Demo Business", me
    assert c.get("/api/contacts").status_code == 401
    print("auth ok")

    # ---------------- dashboard
    k = c.get("/api/dashboard/overview", headers=h).json()["kpis"]
    print("kpis:", k)
    assert k["total_contacts"] == 4 and k["open_conversations"] == 3
    assert k["unread_messages"] == 4          # 2 + 2 + 0 (third thread was answered)
    assert k["pending_invoices"] == 1 and k["conversion_rate"] == 50.0

    # ---------------- messaging
    convs = c.get("/api/conversations", headers=h).json()
    assert len(convs) == 3 and {x["channel"] for x in convs} == {"whatsapp", "facebook", "instagram"}
    first = next(x for x in convs if x["unread"] == 2)
    assert len(c.get(f"/api/conversations/{first['id']}/messages", headers=h).json()) == 2
    assert c.post(f"/api/conversations/{first['id']}/messages", headers=h, json={"text": "hello"}).status_code == 201
    after = {x["id"]: x for x in c.get("/api/conversations", headers=h).json()}
    assert after[first["id"]]["unread"] == 0 and after[first["id"]]["last_message"] == "hello"
    c.post(f"/api/conversations/{first['id']}/simulate-incoming", headers=h, json={"text": "thanks!"})
    assert c.get("/api/conversations?channel=" + first["channel"], headers=h).json()[0]["unread"] == 1
    assert c.patch(f"/api/conversations/{first['id']}", headers=h, json={"status": "closed"}).json()["status"] == "closed"
    print("messaging ok")

    # ---------------- contacts
    people = c.get("/api/contacts", headers=h).json()
    assert {t for p in people for t in p["tags"]} == {"vip", "lead", "customer"}
    assert len(c.get("/api/contacts?tag=lead", headers=h).json()) == 2
    assert len(c.get("/api/contacts?q=nimali", headers=h).json()) == 1
    new = c.post("/api/contacts", headers=h, json={"name": "Test User", "email": "t@x.com", "tags": ["vip", "beta"]}).json()
    assert sorted(new["tags"]) == ["beta", "vip"]
    upd = c.put(f"/api/contacts/{new['id']}", headers=h, json={"name": "Test U2", "tags": ["beta"]}).json()
    assert upd["name"] == "Test U2" and upd["tags"] == ["beta"]
    assert c.delete(f"/api/contacts/{new['id']}", headers=h).status_code == 204
    assert c.delete(f"/api/contacts/{people[0]['id']}", headers=h).status_code == 409   # has orders
    print("contacts ok")

    # ---------------- finance
    s0 = c.get("/api/finance/summary", headers=h).json()
    assert len(s0["monthly"]) >= 6 and s0["net_profit"] == s0["total_income"] - s0["total_expense"]
    cats = {x["category"] for x in s0["expense_by_category"]}
    assert {"COGS", "Gateway fees", "Marketing", "Operations"} <= cats, cats
    exp = c.post("/api/finance/transactions", headers=h, json={"type": "expense", "category": "Rent", "amount": 1000}).json()
    assert c.delete(f"/api/finance/transactions/{exp['id']}", headers=h).status_code == 204
    led = next(t for t in c.get("/api/finance/transactions?type=income", headers=h).json())
    assert c.delete(f"/api/finance/transactions/{led['id']}", headers=h).status_code == 409   # append-only

    inv = c.get("/api/finance/invoices", headers=h).json()
    assert sorted(i["status"] for i in inv).count("paid") == 6 and sum(i["status"] == "sent" for i in inv) == 1
    unpaid = next(i for i in inv if i["status"] == "sent")
    paid = c.patch(f"/api/finance/invoices/{unpaid['id']}/status", headers=h, json={"status": "paid"}).json()
    assert paid["status"] == "paid"
    s1 = c.get("/api/finance/summary", headers=h).json()
    assert round(s1["total_income"] - s0["total_income"], 2) == 45000
    created = c.post("/api/finance/invoices", headers=h, json={
        "contact_id": people[1]["id"], "amount": 1234.5, "due_date": "2020-01-01"}).json()
    assert created["status"] == "overdue" and created["invoice_no"].startswith("INV-")
    print("finance ok")

    # ---------------- campaigns
    camps = c.get("/api/campaigns", headers=h).json()
    w = camps[0]
    assert (w["name"], w["audience_tag"], w["sent"], w["opened"], w["converted"]) == ("Welcome Offer", "lead", 2, 2, 1), w
    nc = c.post("/api/campaigns", headers=h, json={"name": "VIP Promo", "channel": "email",
                                                   "audience_tag": "vip", "message": "Hi VIP"}).json()
    assert nc["status"] == "draft" and nc["sent"] == 0
    run = c.patch(f"/api/campaigns/{nc['id']}/status", headers=h, json={"status": "running"}).json()
    assert run["status"] == "running" and run["sent"] == 1
    assert c.delete(f"/api/campaigns/{nc['id']}", headers=h).status_code == 204
    print("campaigns ok")

    # ---------------- multi-tenancy + Row-Level Security
    r2 = c.post("/api/auth/register", json={"business_name": "Bob Co", "name": "Bob", "email": "bob@x.com", "password": "secret1"})
    assert r2.status_code == 201, r2.text
    assert c.post("/api/auth/register", json={"business_name": "Dup", "name": "Dup", "email": "BOB@x.com", "password": "secret1"}).status_code == 409
    h2 = {"Authorization": "Bearer " + r2.json()["access_token"]}
    t1_ids = {p["id"] for p in c.get("/api/contacts", headers=h).json()}
    t2_ids = {p["id"] for p in c.get("/api/contacts", headers=h2).json()}
    assert t1_ids and t2_ids and not (t1_ids & t2_ids)
    assert c.get(f"/api/contacts/{people[0]['id']}", headers=h2).status_code == 404
    assert c.get(f"/api/conversations/{first['id']}/messages", headers=h2).status_code == 404
    assert c.get("/api/dashboard/overview", headers=h2).json()["kpis"]["total_contacts"] == 4

    # raw SQL as the (non-superuser) API role: the database itself enforces isolation
    tid1 = me["tenant_id"]
    with SessionLocal() as s:
        assert s.execute(text("SELECT count(*) FROM customer")).scalar() == 0          # no tenant set -> sees nothing
    with SessionLocal() as s:
        s.info["tenant_id"] = tid1
        assert s.execute(text("SELECT count(*) FROM customer")).scalar() >= 4
        assert s.execute(text("SELECT count(DISTINCT tenant_id) FROM customer")).scalar() == 1
    with SessionLocal() as s:                                                           # cross-tenant INSERT is rejected
        s.info["tenant_id"] = tid1
        from sqlalchemy.exc import DBAPIError
        try:
            s.execute(text("INSERT INTO store (id, tenant_id, name, currency) VALUES (gen_random_uuid(), :t, 'x', 'LKR')"),
                      {"t": r2.json()["user"]["tenant_id"]})
            raise AssertionError("cross-tenant insert should have failed")
        except DBAPIError as e:
            assert "row-level security" in str(e).lower()
    print("multi-tenancy + RLS ok")

    # ---------------- pgvector + jsonb columns from the ER
    with SessionLocal() as s:
        s.info["bypass_rls"] = True
        tenant = s.query(m.Tenant).first()
        store = s.query(m.Store).filter_by(tenant_id=tenant.id).first()
        doc = m.KbDocument(tenant_id=tenant.id, store_id=store.id, source_type="faq", title="Returns policy")
        s.add(doc); s.flush()
        s.add(m.KbChunk(tenant_id=tenant.id, document_id=doc.id, content="30-day returns", embedding=[0.1] * 1536))
        s.add(m.SeoAsset(tenant_id=tenant.id, store_id=store.id, asset_type="json_ld", content={"@type": "Product"}))
        s.commit()
        near = s.execute(text("SELECT content FROM kb_chunk ORDER BY embedding <-> :v LIMIT 1"),
                         {"v": str([0.1] * 1536)}).scalar()
        assert near == "30-day returns"
    print("pgvector + jsonb ok")

print("\nALL TESTS PASSED")
