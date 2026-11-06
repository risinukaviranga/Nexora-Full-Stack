import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Ban, Bell, Check, ChevronRight, Truck, Wallet, Package } from "lucide-react";
import {
  Badge, Button, Card, CardTitle, PageContainer, PageHeader, StatTile, Tabs, axisProps, money, tooltipLabelStyle, tooltipStyle,
  useToast, type Tone,
} from "../components/ui-kit";
import { cashflow, initialOrders, statusFlow, statusLabel } from "../data/orders";
import type { Order, OrderStatus } from "../types";
import { cn } from "../lib/utils";

type Tab = "orders" | "finance" | "courier";
const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "orders", label: "Orders", icon: Package },
  { id: "finance", label: "Finance", icon: Wallet },
  { id: "courier", label: "Courier", icon: Truck },
];

const statusTone: Record<OrderStatus, Tone> = {
  PENDING: "amber", CONFIRMED: "indigo", PROCESSING: "indigo", SHIPPED: "cyan",
  OUT_FOR_DELIVERY: "cyan", DELIVERED: "green", CANCELLED: "red",
};

const net = (o: Order) => o.price - o.fee - o.cogs;

export default function OrdersPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [trackId, setTrackId] = useState("ORD1025");
  const { toast, show } = useToast();

  const active = orders.filter((o) => o.status !== "CANCELLED");
  const revenue = active.reduce((s, o) => s + o.price, 0);
  const fees = active.reduce((s, o) => s + o.fee, 0);
  const cogs = active.reduce((s, o) => s + o.cogs, 0);
  const gross = revenue - cogs;
  const netProfit = revenue - fees - cogs;
  const margin = revenue ? ((netProfit / revenue) * 100).toFixed(1) : "0.0";

  const visible = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: orders.length };
    orders.forEach((o) => { c[o.status] = (c[o.status] ?? 0) + 1; });
    return c;
  }, [orders]);

  const advance = (id: string) =>
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next = statusFlow[statusFlow.indexOf(o.status) + 1];
        if (!next) return o;
        const shipping = next === "SHIPPED" && o.courier === "—";
        return {
          ...o, status: next,
          courier: shipping ? "DHL" : o.courier,
          tracking: shipping ? `DHL-${Math.floor(10000000 + Math.random() * 89999999)}` : o.tracking,
          eta: next === "DELIVERED" ? "Delivered" : next === "OUT_FOR_DELIVERY" ? "Today" : shipping ? "In 2 days" : o.eta,
        };
      }),
    );
  const cancel = (id: string) => setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "CANCELLED" } : o)));

  const shipments = orders.filter((o) => o.tracking !== "—" && o.status !== "CANCELLED");
  const tracked = shipments.find((o) => o.id === trackId) ?? shipments[0];
  const trackSteps = ["Order confirmed", "Picked up by courier", "In transit", "Out for delivery", "Delivered"];
  const trackProgress = tracked ? { SHIPPED: 3, OUT_FOR_DELIVERY: 4, DELIVERED: 5 }[tracked.status as "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED"] ?? 1 : 0;

  return (
    <PageContainer>
      <PageHeader title="Orders, Finance & Courier" subtitle="Order lifecycle, financial ledger and shipment tracking in one place" actions={<Tabs tabs={tabs} value={tab} onChange={setTab} />} />

      {tab === "orders" && (
        <>
          <div className="flex flex-wrap gap-2">
            {(["ALL", ...statusFlow, "CANCELLED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition active:scale-[0.98]",
                  filter === s ? "border-transparent bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950" : "border-white/10 bg-slate-900/60 text-slate-400 hover:text-slate-100",
                )}
              >
                {s === "ALL" ? "All" : statusLabel(s)} · {counts[s] ?? 0}
              </button>
            ))}
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                    {["Order", "Customer", "Product", "Total", "Progress", "Status", ""].map((h, i) => <th key={i} className="px-5 py-3 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {visible.map((o) => {
                    const idx = statusFlow.indexOf(o.status);
                    const done = o.status === "DELIVERED" || o.status === "CANCELLED";
                    return (
                      <tr key={o.id} className="transition-colors hover:bg-slate-800/40">
                        <td className="px-5 py-3.5"><p className="font-mono text-xs text-cyan-300">{o.id}</p><p className="text-[11px] text-slate-500">{o.date} · {o.channel}</p></td>
                        <td className="px-5 py-3.5 font-medium text-slate-100">{o.customer}</td>
                        <td className="px-5 py-3.5 text-slate-400">{o.productName} × {o.qty}</td>
                        <td className="px-5 py-3.5 text-slate-100">{money(o.price)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex w-32 gap-1">
                            {statusFlow.map((s, i) => (
                              <span key={s} className={cn("h-1.5 flex-1 rounded-full", o.status === "CANCELLED" ? "bg-red-500/40" : i <= idx ? "bg-gradient-to-r from-indigo-500 to-cyan-400" : "bg-slate-800")} />
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3.5"><Badge tone={statusTone[o.status]}>{statusLabel(o.status)}</Badge></td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" className="px-3 py-1.5 text-xs" disabled={done} onClick={() => advance(o.id)}>Next <ChevronRight className="h-3 w-3" /></Button>
                            <Button variant="danger" className="px-3 py-1.5 text-xs" disabled={done} onClick={() => cancel(o.id)}><Ban className="h-3 w-3" />Cancel</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === "finance" && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <StatTile label="Gross revenue" value={money(revenue)} sub="active orders only" />
            <StatTile label="Payment fees" value={money(fees)} />
            <StatTile label="Cost of goods sold" value={money(cogs)} />
            <StatTile label="Gross profit" value={money(gross)} />
            <StatTile label="Net profit" value={money(netProfit)} tone="green" />
            <StatTile label="Profit margin" value={`${margin}%`} tone="green" />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <CardTitle title="Rolling cashflow forecast" subtitle="Net cashflow: actual vs. forecast" />
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashflow} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gAct" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                      <linearGradient id="gFc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} /><stop offset="100%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                    <XAxis dataKey="month" {...axisProps} />
                    <YAxis {...axisProps} tickFormatter={(v: number) => `${v / 1000}k`} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
                    <Area type="monotone" dataKey="actual" name="Actual" stroke="#818cf8" strokeWidth={2.5} fill="url(#gAct)" />
                    <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#67e8f9" strokeWidth={2} strokeDasharray="5 4" fill="url(#gFc)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <CardTitle title="Worked example" subtitle="How net profit is calculated" />
              <dl className="space-y-3 text-sm">
                {[["Selling price", "Rs. 50,000"], ["Payment fee", "− Rs. 1,000"], ["COGS", "− Rs. 30,000"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><dt className="text-slate-400">{k}</dt><dd className="text-slate-100">{v}</dd></div>
                ))}
                <div className="flex justify-between border-t border-white/10 pt-3 font-semibold"><dt className="text-slate-200">Net profit</dt><dd className="text-emerald-400">Rs. 19,000</dd></div>
              </dl>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="p-6 pb-3"><CardTitle title="Financial ledger" subtitle="Automatically recorded per order" /></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-y border-white/10 text-xs uppercase tracking-wider text-slate-500">
                    {["Order", "Selling price", "Payment fee", "COGS", "Net profit", "Margin"].map((h) => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {active.map((o) => (
                    <tr key={o.id} className="transition-colors hover:bg-slate-800/40">
                      <td className="px-6 py-3.5 font-mono text-xs text-cyan-300">{o.id}</td>
                      <td className="px-6 py-3.5 text-slate-100">{money(o.price)}</td>
                      <td className="px-6 py-3.5 text-slate-400">{money(o.fee)}</td>
                      <td className="px-6 py-3.5 text-slate-400">{money(o.cogs)}</td>
                      <td className="px-6 py-3.5 font-medium text-emerald-400">{money(net(o))}</td>
                      <td className="px-6 py-3.5 text-slate-300">{((net(o) / o.price) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === "courier" && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="overflow-hidden lg:col-span-2">
            <div className="p-6 pb-3"><CardTitle title="Shipments" subtitle="DHL, FedEx and local carriers via courier APIs" /></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-y border-white/10 text-xs uppercase tracking-wider text-slate-500">
                    {["Order", "Courier", "Tracking", "Status", "ETA"].map((h) => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {shipments.map((o) => (
                    <tr key={o.id} onClick={() => setTrackId(o.id)} className={cn("cursor-pointer transition-colors hover:bg-slate-800/40", tracked?.id === o.id && "bg-indigo-500/10")}>
                      <td className="px-6 py-3.5 font-mono text-xs text-cyan-300">{o.id}</td>
                      <td className="px-6 py-3.5 text-slate-100">{o.courier}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-400">{o.tracking}</td>
                      <td className="px-6 py-3.5"><Badge tone={statusTone[o.status]}>{statusLabel(o.status)}</Badge></td>
                      <td className="px-6 py-3.5 text-slate-300">{o.eta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {tracked && (
            <Card className="p-6">
              <CardTitle title="Tracking history" subtitle={`${tracked.id} · ${tracked.courier} · ${tracked.tracking}`} />
              <ol className="space-y-4">
                {trackSteps.map((s, i) => {
                  const done = i < trackProgress;
                  return (
                    <li key={s} className="flex items-center gap-3">
                      <span className={cn("grid h-6 w-6 place-items-center rounded-full border", done ? "border-transparent bg-gradient-to-br from-indigo-500 to-cyan-400" : "border-white/10 bg-slate-900")}>
                        {done && <Check className="h-3 w-3 text-slate-950" />}
                      </span>
                      <span className={cn("text-sm", done ? "text-slate-100" : "text-slate-500")}>{s}</span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-5 text-sm text-slate-400">Estimated delivery: <span className="text-slate-100">{tracked.eta}</span></p>
              <Button className="mt-4 w-full" onClick={() => show(`Delivery update sent to ${tracked.customer} via ${tracked.channel}`)}>
                <Bell className="h-4 w-4" />Notify customer
              </Button>
            </Card>
          )}
        </div>
      )}
      {toast}
    </PageContainer>
  );
}
