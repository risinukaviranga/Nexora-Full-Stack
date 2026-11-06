import { useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { BarChart3, Check, Lock, ShieldAlert, ShieldCheck, Smile, X } from "lucide-react";
import MetricCard from "../components/MetricCard";
import {
  Badge, Card, CardTitle, PageContainer, PageHeader, StatTile, Tabs, axisProps, money, selectCls, tooltipLabelStyle, tooltipStyle,
} from "../components/ui-kit";
import {
  customerGrowth, deliveryPerformance, flaggedConversations, fraudTransactions, initialPermissions, modules, roleNames,
  salesByProduct, sentimentSplit, sentimentTrend, type ModuleName, type RoleName,
} from "../data/analytics";
import { Coins, Package, ShoppingBag, Users } from "lucide-react";
import { cn } from "../lib/utils";

type Tab = "overview" | "intel" | "rbac";
const tabs: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "intel", label: "Sentiment & Fraud", icon: ShieldAlert },
  { id: "rbac", label: "Access control", icon: ShieldCheck },
];

const grid = <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />;

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [threshold, setThreshold] = useState(50);
  const [perms, setPerms] = useState<Record<RoleName, ModuleName[]>>(initialPermissions);
  const [preview, setPreview] = useState<RoleName>("Support Agent");

  const togglePerm = (role: RoleName, mod: ModuleName) => {
    if (role === "Business Owner") return;
    setPerms((prev) => ({ ...prev, [role]: prev[role].includes(mod) ? prev[role].filter((m) => m !== mod) : [...prev[role], mod] }));
  };

  return (
    <PageContainer>
      <PageHeader title="Intelligence Analytics & RBAC" subtitle="Dashboards, sentiment, fraud detection and access control" actions={<Tabs tabs={tabs} value={tab} onChange={setTab} />} />

      {tab === "overview" && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Total sales" value="Rs. 1.12M" change="+14.2%" positive icon={Coins} hero />
            <MetricCard title="Orders" value="1,046" change="+9.8%" positive icon={ShoppingBag} />
            <MetricCard title="Customers" value="2,815" change="+34%" positive icon={Users} />
            <MetricCard title="Delivery on-time" value="91%" change="+2.1%" positive icon={Package} />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <CardTitle title="Product performance" subtitle="Units sold this month" />
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByProduct} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                    {grid}<XAxis dataKey="name" {...axisProps} fontSize={11} /><YAxis {...axisProps} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
                    <Bar dataKey="sales" name="Units" radius={[6, 6, 0, 0]}>
                      {salesByProduct.map((_, i) => <Cell key={i} fill={i === 0 ? "#22d3ee" : "#6366f1"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <CardTitle title="Delivery performance" />
              <div className="h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deliveryPerformance} dataKey="value" innerRadius={50} outerRadius={72} paddingAngle={3} stroke="none">
                      {deliveryPerformance.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {deliveryPerformance.map((d) => (
                  <li key={d.name} className="flex items-center gap-2 text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="flex-1">{d.name}</span><span className="font-medium text-slate-100">{d.value}%</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="p-6">
            <CardTitle title="Customer growth" subtitle="New vs. returning customers" />
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={customerGrowth} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                  {grid}<XAxis dataKey="month" {...axisProps} /><YAxis {...axisProps} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
                  <Line type="monotone" dataKey="newCustomers" name="New" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="returning" name="Returning" stroke="#818cf8" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {tab === "intel" && (
        <>
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="p-6">
              <CardTitle title="Sentiment analysis" subtitle="All conversations, last 7 days" />
              <div className="h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sentimentSplit} dataKey="value" innerRadius={50} outerRadius={72} paddingAngle={3} stroke="none">
                      {sentimentSplit.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {sentimentSplit.map((d) => (
                  <li key={d.name} className="flex items-center gap-2 text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="flex-1">{d.name}</span><span className="font-medium text-slate-100">{d.value}%</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <CardTitle title="Sentiment trend" subtitle="Share of positive vs. negative conversations (%)" />
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sentimentTrend} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.4} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                      <linearGradient id="gNeg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                    </defs>
                    {grid}<XAxis dataKey="day" {...axisProps} /><YAxis {...axisProps} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
                    <Area type="monotone" dataKey="positive" name="Positive" stroke="#10b981" strokeWidth={2} fill="url(#gPos)" />
                    <Area type="monotone" dataKey="negative" name="Negative" stroke="#ef4444" strokeWidth={2} fill="url(#gNeg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <CardTitle title="Conversations needing attention" subtitle="Negative sentiment detected" />
            <ul className="divide-y divide-white/5">
              {flaggedConversations.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                  <Smile className="h-4 w-4 text-red-400" />
                  <span className="w-44 font-medium text-slate-100">{f.customer}</span>
                  <span className="min-w-0 flex-1 text-slate-400">“{f.text}”</span>
                  <Badge tone="slate">{f.channel}</Badge>
                  <Badge tone="red">{f.score.toFixed(2)}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 p-6 pb-3">
              <CardTitle title="Fraud detection" subtitle="Each transaction receives a risk score" />
              <label className="flex items-center gap-3 text-sm text-slate-400">
                Suspicious above
                <input type="range" min={20} max={90} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="accent-indigo-500" />
                <span className="w-8 font-semibold text-cyan-300">{threshold}</span>
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-y border-white/10 text-xs uppercase tracking-wider text-slate-500">
                    {["Transaction", "Customer", "Amount", "Signals", "Risk score", "Verdict"].map((h) => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {fraudTransactions.map((t) => {
                    const bad = t.risk >= threshold;
                    return (
                      <tr key={t.id} className={cn("transition-colors hover:bg-slate-800/40", bad && "bg-red-500/5")}>
                        <td className="px-6 py-3.5 font-mono text-xs text-cyan-300">{t.id}</td>
                        <td className="px-6 py-3.5 text-slate-100">{t.customer}</td>
                        <td className="px-6 py-3.5 text-slate-300">{money(t.amount)}</td>
                        <td className="px-6 py-3.5 text-slate-400">{t.signals}</td>
                        <td className="px-6 py-3.5 font-semibold text-slate-100">{t.risk}</td>
                        <td className="px-6 py-3.5"><Badge tone={bad ? "red" : "green"}>{bad ? "Suspicious" : "Normal"}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === "rbac" && (
        <>
          <div className="grid gap-5 sm:grid-cols-3">
            <StatTile label="Active tenant" value="SHOP001" sub="All queries scoped to this tenant" />
            <StatTile label="Roles" value={String(roleNames.length)} sub="Business owner, admin, support, finance, marketing" />
            <StatTile label="Tenant isolation" value="Enforced" sub="Cross-tenant access blocked" tone="green" />
          </div>

          <Card className="overflow-hidden">
            <div className="p-6 pb-3"><CardTitle title="Permission matrix" subtitle="Click a cell to grant or revoke access (Business Owner is locked)" /></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-white/10 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3 text-left font-medium">Module</th>
                    {roleNames.map((r) => <th key={r} className="px-4 py-3 text-center font-medium">{r}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {modules.map((m) => (
                    <tr key={m} className="transition-colors hover:bg-slate-800/40">
                      <td className="px-6 py-3 text-slate-200">{m}</td>
                      {roleNames.map((r) => {
                        const on = perms[r].includes(m);
                        return (
                          <td key={r} className="px-4 py-3 text-center">
                            <button
                              onClick={() => togglePerm(r, m)}
                              disabled={r === "Business Owner"}
                              className={cn("mx-auto grid h-7 w-7 place-items-center rounded-lg transition active:scale-[0.95]",
                                on ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-800/60 text-slate-600 hover:text-slate-300",
                                r === "Business Owner" && "cursor-not-allowed")}
                              aria-label={`${r} ${m}`}
                            >
                              {r === "Business Owner" ? <Lock className="h-3.5 w-3.5" /> : on ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6">
            <CardTitle
              title="Preview as role"
              subtitle="What this role can open"
              action={<select value={preview} onChange={(e) => setPreview(e.target.value as RoleName)} className={cn(selectCls, "w-48")}>{roleNames.map((r) => <option key={r}>{r}</option>)}</select>}
            />
            <div className="flex flex-wrap gap-2">
              {modules.map((m) => {
                const on = perms[preview].includes(m);
                return <Badge key={m} tone={on ? "green" : "slate"} className={cn(!on && "line-through opacity-60")}>{on ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}{m}</Badge>;
              })}
            </div>
          </Card>
        </>
      )}
    </PageContainer>
  );
}
