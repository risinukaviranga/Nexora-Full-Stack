from dotenv import load_dotenv

load_dotenv()

import os

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg://nexora_app:nexora_app@localhost:5432/nexora"
)
# Used only by scripts/init_db.py (creates tables, RLS policies, grants, seed data).
DATABASE_ADMIN_URL = os.getenv("DATABASE_ADMIN_URL", DATABASE_URL)
APP_DB_ROLE = os.getenv("APP_DB_ROLE", "nexora_app")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
]
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "1536"))
