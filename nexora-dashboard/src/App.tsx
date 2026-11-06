import { Suspense, lazy, useEffect, useState } from "react";
import Layout from "./components/Layout";
import LoginPage from "./components/LoginPage";
import type { PageId } from "./types";
import { getCurrentUser, NexoraUser, tokenStore } from "./lib/api";

const Dashboard = lazy(() => import("./components/Dashboard"));
const ChatPage = lazy(() => import("./components/ChatPage"));
const AiAgentPage = lazy(() => import("./pages/AiAgentPage"));
const CrmPage = lazy(() => import("./pages/CrmPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const MarketingPage = lazy(() => import("./pages/MarketingPage"));
const SeoPage = lazy(() => import("./pages/SeoPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));

const pages: Record<PageId, React.LazyExoticComponent<() => JSX.Element>> = {
  dashboard: Dashboard, inbox: ChatPage, "ai-agent": AiAgentPage, crm: CrmPage,
  products: ProductsPage, orders: OrdersPage, marketing: MarketingPage,
  seo: SeoPage, analytics: AnalyticsPage,
};

export default function App() {
  const [page, setPage] = useState<PageId>("dashboard");
  const [user, setUser] = useState<NexoraUser | null>(null);
  const [checking, setChecking] = useState(Boolean(tokenStore.get()));
  useEffect(() => {
    if (!tokenStore.get()) return;
    getCurrentUser().then(setUser).catch(() => tokenStore.clear()).finally(() => setChecking(false));
  }, []);

  if (checking) return <div className="app-loading">Checking your session…</div>;
  if (!user) return <LoginPage onLogin={setUser} />;

  const Page = pages[page];
  return (
    <Layout page={page} onNavigate={setPage} user={user}>
      <Suspense fallback={<div className="grid h-[60vh] place-items-center text-sm text-slate-500">Loading…</div>}>
        <Page />
      </Suspense>
    </Layout>
  );
}
