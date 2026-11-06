-- Runs once, on first container start.
CREATE EXTENSION IF NOT EXISTS vector;

-- The API connects as this role. It is NOT a superuser and does NOT own the tables,
-- so PostgreSQL Row-Level Security policies are enforced for it.
CREATE ROLE nexora_app LOGIN PASSWORD 'nexora_app' NOSUPERUSER NOBYPASSRLS;
GRANT CONNECT ON DATABASE nexora TO nexora_app;
GRANT USAGE ON SCHEMA public TO nexora_app;
