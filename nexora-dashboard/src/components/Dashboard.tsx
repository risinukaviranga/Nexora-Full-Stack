import { useEffect, useState } from "react";
import { Activity, Bot, MessagesSquare, Wallet } from "lucide-react";
import MetricCard from "./MetricCard";
import RevenueChart from "./RevenueChart";
import ChannelPanel from "./ChannelPanel";
import TransactionsTable from "./TransactionsTable";
import type { MetricCardProps } from "../types";
import { api } from "../lib/api";

type Overview = {
  kpis?: { revenue?: number; unread_messages?: number; [key: string]: unknown };
};

const fallbackMetrics: MetricCardProps[] = [
  { title: "Total Revenue", value: "—", change: "Live data", positive: true, icon: Wallet, hero: true },
  { title: "Active Conversations", value: "—", change: "Live data", positive: true, icon: MessagesSquare },
  { title: "AI Resolution Rate", value: "—", change: "Not yet connected", positive: true, icon: Bot, hint: "AI metrics endpoint not implemented" },
  { title: "System Health", value: "Connected", change: "API available", positive: true, icon: Activity, hint: "Backend health check" },
];

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricCardProps[]>(fallbackMetrics);
  const [notice, setNotice] = useState("Loading live dashboard data…");

  useEffect(() => {
    api<Overview>("/dashboard/overview").then((data) => {
      const kpis = data.kpis || {};
      const revenue = Number(kpis.revenue ?? 0);
      const unread = Number(kpis.unread_messages ?? 0);
      setMetrics([
        { title: "Total Revenue", value: `Rs. ${revenue.toLocaleString()}`, change: "From PostgreSQL", positive: true, icon: Wallet, hero: true },
        { title: "Unread Messages", value: unread.toLocaleString(), change: "Live API data", positive: true, icon: MessagesSquare },
        { title: "AI Resolution Rate", value: "—", change: "Not available yet", positive: true, icon: Bot, hint: "AI analytics endpoint not implemented" },
        { title: "System Health", value: "Operational", change: "API connected", positive: true, icon: Activity, hint: "Backend health check" },
      ]);
      setNotice("Live metrics loaded from the Nexora API.");
    }).catch((error) => setNotice(`Dashboard API: ${error.message}`));
  }, []);

  return (
    <main className="mx-auto max-w-[1400px] space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">Business Command Center</h1>
          <p className="text-sm text-slate-400">Unified view across messaging, orders, finance and AI</p>
          <p className="mt-1 text-xs text-slate-500">{notice}</p>
        </div>
        <span className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-300">Live workspace</span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => <MetricCard key={m.title} {...m} />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-3"><RevenueChart /><ChannelPanel /></div>
      <TransactionsTable />
    </main>
  );
}
