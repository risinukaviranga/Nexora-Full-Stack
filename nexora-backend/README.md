# Nexora API (FastAPI + PostgreSQL + SQLAlchemy)

Backend for the Nexora dashboard (React + TypeScript + Vite + Tailwind + shadcn/ui).
Data lives in PostgreSQL 16 (+ pgvector), modelled from `ER_Model_Omnichannel_Platform.xlsx`
(42 tables). It is multi-tenant: shared schema, `tenant_id` on every business table, and
PostgreSQL **Row-Level Security** driven by the JWT. No AI logic yet (the AI/RAG tables exist but are unused).

## 1. Run the backend

```bash
cd nexora-backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # Windows: copy .env.example .env

docker compose up -d               # PostgreSQL 16 + pgvector (also creates the 'nexora_app' role)
export $(grep -v '^#' .env | xargs)   # Windows PowerShell: set the variables from .env manually
python -m scripts.init_db          # creates 42 tables, RLS policies, grants, demo tenant
uvicorn app.main:app --reload --port 8000
```

- Swagger docs: http://localhost:8000/docs
- Demo login: `admin@nexora.lk` / `admin123`
- Reset the database (development only): `python -m scripts.init_db --reset`
- Run the test-suite (starts its own throw-away Postgres, no Docker needed): `python -m tests.test_api`

Two database users are used on purpose:

| URL | Role | Used by |
|---|---|---|
| `DATABASE_ADMIN_URL` | `nexora` (owner/superuser) | `scripts.init_db` only: tables, RLS, grants |
| `DATABASE_URL` | `nexora_app` (non-superuser) | the API. **Superusers ignore RLS**, so the API must not use the admin role (the app logs a warning at startup if it does). |

## 2. Endpoints (all prefixed with `/api`, all except auth need `Authorization: Bearer <token>`)

Same URLs and JSON shapes as the in-memory version, with these differences:
ids are UUID strings; invoice `due_date` is a date (`YYYY-MM-DD`); invoice `status` is derived
(`paid` / `overdue` / `sent`) and `PATCH .../status` only accepts `"paid"`; message `sender` can
also be `"ai"`; `unread` = customer messages since the last agent reply; transaction
`description` and campaign `budget` were removed (no such columns in the ER); invoice create no
longer takes `items`. Optional header `X-Store-Id` selects a store (default: the tenant's first store).

| Area | Method + path | Notes |
|---|---|---|
| Auth | `POST /auth/register` | `{business_name, name, email, password}` -> token + user |
| | `POST /auth/login` | `{email, password}` -> `{access_token, user}` |
| | `GET /auth/me` | current user |
| Dashboard | `GET /dashboard/overview` | KPIs, channel breakdown, recent conversations |
| Messaging | `GET /conversations?channel=&status=` | unified inbox |
| | `GET /conversations/{id}/messages` | also marks thread as read |
| | `POST /conversations/{id}/messages` | `{text}` agent reply |
| | `PATCH /conversations/{id}` | `{status: "open"|"closed"}` |
| | `POST /conversations/{id}/simulate-incoming` | dev helper: fake a customer message |
| Contacts | `GET/POST /contacts`, `GET/PUT/DELETE /contacts/{id}` | `?q=` search, `?tag=` filter |
| Finance | `GET /finance/summary` | totals + monthly + expense by category (chart-ready) |
| | `GET/POST /finance/transactions`, `DELETE /finance/transactions/{id}` | |
| | `GET/POST /finance/invoices`, `PATCH /finance/invoices/{id}/status` | marking `paid` auto-creates income |
| Growth | `GET/POST /campaigns`, `PATCH /campaigns/{id}/status`, `DELETE /campaigns/{id}` | |

## 3. Connect the frontend

### Step 1: environment variable
In the **frontend** project root create `.env`:

```
VITE_API_URL=http://localhost:8000/api
```

Restart `npm run dev` after editing `.env`.

### Step 2: CORS
The backend already allows `http://localhost:5173` (Vite's default port). If your
frontend runs elsewhere, set it before starting uvicorn:

```bash
CORS_ORIGINS=http://localhost:3000 uvicorn app.main:app --reload
```

### Step 3: API client (`src/lib/api.ts`)

```ts
const BASE = import.meta.env.VITE_API_URL;

export const tokenStore = {
  get: () => localStorage.getItem("nexora_token"),
  set: (t: string) => localStorage.setItem("nexora_token", t),
  clear: () => localStorage.removeItem("nexora_token"),
};

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    tokenStore.clear();
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
```

### Step 4: types (`src/types.ts`)

```ts
export type Channel = "whatsapp" | "facebook" | "instagram" | "email" | "sms" | "web";

export interface User { id: string; name: string; email: string; tenant_id: string; business_name: string; role: string }
export interface Conversation {
  id: string; contact_id: string; contact_name: string; channel: Channel;
  last_message: string; last_message_at: string; unread: number; status: "open" | "closed";
}
export interface Message { id: string; conversation_id: string; sender: "customer" | "agent"; text: string; sent_at: string }
export interface Contact { id: string; name: string; email?: string; phone?: string; tags: string[]; created_at: string }
```

### Step 5: login (`src/lib/auth.ts`)

```ts
import { api, tokenStore } from "./api";
import type { User } from "../types";

export async function login(email: string, password: string) {
  const data = await api<{ access_token: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  tokenStore.set(data.access_token);
  return data.user;
}

export const logout = () => { tokenStore.clear(); window.location.href = "/login"; };
```

Protect routes by checking `tokenStore.get()` (or calling `GET /auth/me` on app load)
and redirecting to `/login` when it is missing.

### Step 6: fetch data in components (TanStack Query recommended)

```bash
npm i @tanstack/react-query
```

```tsx
// main.tsx: wrap <App /> in <QueryClientProvider client={new QueryClient()}>

// Inbox.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Conversation, Message } from "@/types";

export function useConversations() {
  return useQuery({ queryKey: ["conversations"], queryFn: () => api<Conversation[]>("/conversations") });
}

export function useMessages(id: string) {
  return useQuery({ queryKey: ["messages", id], queryFn: () => api<Message[]>(`/conversations/${id}/messages`), enabled: !!id });
}

export function useSendMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => api<Message>(`/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ text }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
```

Dashboard KPIs:

```tsx
const { data } = useQuery({ queryKey: ["overview"], queryFn: () => api<any>("/dashboard/overview") });
// data.kpis.revenue, data.kpis.unread_messages, data.conversations_by_channel ...
```

Finance chart data (Recharts-ready): `GET /finance/summary` -> `monthly: [{month, income, expense, profit}]`.

### Step 7: live-ish updates without websockets
Add `refetchInterval: 5000` to the inbox queries to poll. Use
`POST /conversations/{id}/simulate-incoming` in Swagger to see new messages appear.

## 4. Troubleshooting

| Problem | Fix |
|---|---|
| CORS error in browser console | Frontend origin not in `CORS_ORIGINS`; restart uvicorn after changing |
| `401` right after login | Token not stored, or header must be exactly `Authorization: Bearer <token>` |
| `Failed to fetch` | Backend not running, or wrong `VITE_API_URL` (restart Vite after editing `.env`) |
| Data disappeared | Expected: in-memory store resets on restart (and `--reload` restarts on every code save) |
| Field name mismatch | The API uses `snake_case` (`contact_name`); adapt your components or map in the client |

## 5. How the API maps onto the ER model

| API area | ER tables |
|---|---|
| Auth / users | `TENANT`, `STORE`, `USER_ACCOUNT`, `ROLE`, `USER_ROLE`, `PERMISSION`, `ROLE_PERMISSION` |
| Contacts (`tags`) | `CUSTOMER`; tags are `SEGMENT` names via `SEGMENT_MEMBER` |
| Conversations / messages | `CONVERSATION`, `MESSAGE`, `CHANNEL_ACCOUNT` (channel = `type`) |
| Transactions / summary | `LEDGER_ENTRY` (revenue, fee, cogs) + `EXPENSE`; net profit = revenue - fees - COGS - expenses |
| Invoices | `INVOICE` -> `SALES_ORDER` -> `CUSTOMER`; paying creates `PAYMENT` + revenue `LEDGER_ENTRY` |
| Campaigns | `CAMPAIGN`, `CAMPAIGN_VARIANT` (variant "A" = message), `CAMPAIGN_DELIVERY` (sent/opened/converted counts) |
| Tables with a model but no endpoints yet | products, variants, order items, shipments, carriers, AI config/runs, KB docs/chunks (pgvector), SEO assets, churn, social posts, sentiment, agent metrics, fraud alerts, daily briefs, escalations, audit log |

Additions to the ER (needed by the dashboard): `USER_ACCOUNT.full_name`, `CUSTOMER.created_at`,
`CONVERSATION.created_at`, `CAMPAIGN.name`, `CAMPAIGN.created_at`. As the sheet recommends,
`tenant_id` was also added to `ROLE_PERMISSION`, `USER_ROLE` and `SEGMENT_MEMBER`.

### Row-Level Security
`app/rls.py` creates a `tenant_isolation` policy on all 41 tenant-scoped tables. For every request
the JWT's `tenant_id` is applied with `set_config('app.tenant_id', ...)` at the start of each
transaction (`app/database.py`), so PostgreSQL itself blocks cross-tenant reads and writes, even
if an endpoint forgets a filter. Only the login/register endpoints turn on `app.bypass_rls`,
because they must look up a user before the tenant is known.

### Next steps
- Alembic migrations instead of `create_all` once the schema starts changing.
- Enforce RBAC: check `ROLE_PERMISSION` codes per endpoint (the tables are seeded already).
- Encrypt `credentials_enc` (Fernet/KMS) before storing channel/carrier secrets.
- Endpoints for products, orders, shipments; partition `MESSAGE`/`LEDGER_ENTRY` later (Design Decision 10).
