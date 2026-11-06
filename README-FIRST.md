# Nexora – full-stack local development bundle

This folder combines the supplied React dashboard and FastAPI backend.

## Stack
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: FastAPI + SQLAlchemy
- Database: PostgreSQL 16 + pgvector
- Authentication: JWT bearer token
- UI: dark/light theme toggle (saved in browser local storage)

## Requirements (Windows 11)
1. Install **Python 3.11+**.
2. Install **Node.js LTS** (includes npm).
3. Install **Docker Desktop** and start it.
4. Install **Visual Studio Code**.

## Open in VS Code
Open the extracted `Nexora-Full-Stack` folder (the folder containing `nexora-dashboard` and `nexora-backend`) in VS Code.

## Step 1 – Start PostgreSQL
Open a VS Code terminal (PowerShell):

```powershell
cd nexora-backend
docker compose up -d
```

This starts PostgreSQL 16 with pgvector on port 5432 and creates the database plus the restricted `nexora_app` database role.

Check:
```powershell
docker compose ps
```

## Step 2 – Configure and initialize the backend
Open a **second terminal**:

```powershell
cd nexora-backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
python -m scripts.init_db
```

If PowerShell blocks activation, run this once in the current terminal:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

The `.env` file uses two PostgreSQL URLs:
- `DATABASE_ADMIN_URL` is used only for creating tables, policies and demo data.
- `DATABASE_URL` is used by the API. Keep it as the non-superuser `nexora_app` role so PostgreSQL Row-Level Security works.

Start the API:
```powershell
uvicorn app.main:app --reload --port 8000
```

Open API docs: http://localhost:8000/docs  
Health check: http://localhost:8000/api/health

Demo account:
- Email: `admin@nexora.lk`
- Password: `admin123`

Change the development `SECRET_KEY` in `.env` before using this beyond a local demo. Do not publish the demo credentials or commit `.env`.

## Step 3 – Start the frontend
Open a **third terminal** in VS Code:

```powershell
cd nexora-dashboard
Copy-Item .env.example .env
npm install
npm run dev
```

Open the URL printed by Vite, normally http://localhost:5173.

Sign in using the demo account above. The frontend calls the FastAPI backend at `http://localhost:8000/api`. The header shows whether the API health endpoint is reachable. Use the sun/moon button to switch between light and dark mode.

## Run both smoothly
Keep these three processes running:
1. Docker PostgreSQL (`docker compose up -d`) – start once; it can remain running.
2. FastAPI (`uvicorn app.main:app --reload --port 8000`) – backend terminal.
3. Vite (`npm run dev`) – frontend terminal.

Stop the two development servers with `Ctrl+C`. Stop PostgreSQL only when needed:
```powershell
cd nexora-backend
docker compose down
```
Database data persists in the Docker volume. To remove the database data as well (destructive):
```powershell
docker compose down -v
```

## PostgreSQL connection details
For pgAdmin or another SQL client:
- Host: `localhost`
- Port: `5432`
- Database: `nexora`
- Admin username: `nexora`
- Admin password: `nexora`

The API itself connects with:
- Username: `nexora_app`
- Password: `nexora_app`
- SQLAlchemy URL: `postgresql+psycopg://nexora_app:nexora_app@localhost:5432/nexora`

Do not change the API `DATABASE_URL` to the admin account; this backend enables tenant-level PostgreSQL Row-Level Security.

## What is connected, and what is still demo UI?
- Login, session verification, API health status and the dashboard overview metrics are connected to FastAPI.
- The supplied dashboard's remaining modules (inbox, AI agent, CRM, products, orders, marketing, SEO and analytics visual components) still contain sample/mock presentation data. Their API endpoints or complete CRUD wiring are not all present in the supplied backend. This bundle does not pretend those modules are fully live.
- The backend currently provides auth, dashboard overview, conversations/messages, contacts, finance and campaigns endpoints. Check `/docs` for the exact schemas.

## Troubleshooting
- **Docker command not found:** install/start Docker Desktop, then reopen VS Code.
- **Port 5432 already in use:** stop the other PostgreSQL service or change the published port in `docker-compose.yml` and update both database URLs.
- **`ModuleNotFoundError`:** activate `.venv` in the backend terminal and run `pip install -r requirements.txt`.
- **`password authentication failed`:** confirm Docker is running and `.env` matches the compose credentials. If you changed compose credentials after the first database initialization, the existing volume retains old credentials; for a fresh local database only, `docker compose down -v` then `docker compose up -d` (this deletes local DB data).
- **Frontend says API Offline:** keep Uvicorn running, then open `http://localhost:8000/api/health`. Check `VITE_API_URL` in `nexora-dashboard/.env`, then restart Vite.
- **CORS error:** ensure backend `.env` has `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`, then restart Uvicorn.
- **Login fails:** initialize the database using `python -m scripts.init_db`, then use the demo credentials.

## Build check
Frontend production build:
```powershell
cd nexora-dashboard
npm run build
```

Backend tests (requires the test dependencies and the supported test setup):
```powershell
cd nexora-backend
python -m tests.test_api
```
