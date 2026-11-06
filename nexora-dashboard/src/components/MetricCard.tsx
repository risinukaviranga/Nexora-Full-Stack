import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "../lib/utils";
import type { MetricCardProps } from "../types";

export default function MetricCard({ title, value, change, positive, icon: Icon, hero, hint }: MetricCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-md",
        "transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-2xl",
        hero && "shadow-[0_0_30px_rgba(99,102,241,0.15)]",
      )}
    >
      {/* ambient light */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-70",
          "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]",
          hero ? "from-indigo-500/25 via-transparent to-transparent" : "from-slate-500/10 via-transparent to-transparent",
        )}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p
            className={cn(
              "mt-2 font-semibold tracking-tight text-slate-100",
              hero ? "bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-4xl text-transparent" : "text-3xl",
            )}
          >
            {value}
          </p>
        </div>
        <div
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl border border-white/10",
            hero ? "bg-gradient-to-br from-indigo-500 to-cyan-400 text-slate-950" : "bg-slate-800/70 text-slate-300",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-2 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold",
            positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400",
          )}
        >
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {change}
        </span>
        <span className="text-slate-500">{hint ?? "vs last month"}</span>
      </div>
    </div>
  );
}
