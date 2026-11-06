import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { revenueData } from "../data/mock";

interface TooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

const GlassTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3 text-xs shadow-2xl backdrop-blur-md">
      <p className="mb-1.5 font-medium text-slate-300">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-slate-400">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="ml-auto font-semibold text-slate-100">Rs. {p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

export default function RevenueChart() {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/50 lg:col-span-2">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-100">Revenue & Profit</h3>
          <p className="text-sm text-slate-400">Order revenue vs. net profit (after payment fees and COGS)</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-400" />Revenue</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-300" />Profit</span>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#64748b" fontSize={12} tickLine={false} axisLine={false}
              tickFormatter={(v: number) => `${v / 1000}k`}
            />
            <Tooltip content={<GlassTooltip />} cursor={{ stroke: "rgba(99,102,241,0.4)", strokeWidth: 1 }} />
            <Area
              type="monotone" dataKey="revenue" name="revenue" stroke="#818cf8" strokeWidth={2.5}
              fill="url(#gRevenue)" style={{ filter: "url(#glow)" }}
            />
            <Area
              type="monotone" dataKey="profit" name="profit" stroke="#67e8f9" strokeWidth={2}
              fill="url(#gProfit)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
