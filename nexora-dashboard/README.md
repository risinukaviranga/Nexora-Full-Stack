# Nexora – Omni-Channel Business Automation Platform (Frontend)

React + TypeScript + Vite + Tailwind CSS + shadcn/ui (Radix) + Recharts + lucide-react.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Pages (sidebar)
| Page | File | Covers |
|---|---|---|
| Dashboard | `components/Dashboard.tsx` | KPIs, revenue chart, channel mix, transactions |
| Omnichannel Inbox | `components/ChatPage.tsx` | Unified inbox, AI chat, human hand-over, CRM panel |
| AI Agent | `pages/AiAgentPage.tsx` | Telemetry, RAG pipeline, knowledge sources, escalation rules |
| CRM | `pages/CrmPage.tsx` | Unified profiles, identity merging, activity timeline |
| Products & Inventory | `pages/ProductsPage.tsx` | Product CRUD, stock updates, low-stock alerts, "what the AI sees" |
| Orders & Finance | `pages/OrdersPage.tsx` | Order lifecycle, financial ledger, cashflow forecast, courier tracking |
| Marketing & Growth | `pages/MarketingPage.tsx` | Segments, churn prediction, campaign builder, A/B testing |
| SEO / AEO / GEO | `pages/SeoPage.tsx` | Metadata, auto FAQ, JSON-LD, knowledge graph |
| Analytics & RBAC | `pages/AnalyticsPage.tsx` | KPIs, sentiment, fraud scoring, permission matrix |

## Structure
- `src/components/ui-kit.tsx` shared Card, Badge, Button, Tabs, Modal, Toggle, Toast helpers
- `src/data/*.ts` mock data per module – replace with FastAPI calls
- `src/types/index.ts` shared TypeScript interfaces
- Pages are lazy-loaded from `src/App.tsx`
