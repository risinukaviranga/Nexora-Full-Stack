import { Bot, Clock, Gauge, Instagram, Mail, Phone, ShoppingBag, Smile } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Conversation } from "../../types";
import { sentimentMeta } from "./channelMeta";

export default function CustomerPanel({ conversation }: { conversation: Conversation }) {
  const { customer, sentiment } = conversation;
  const s = sentimentMeta[sentiment];

  const identities = [
    { icon: Phone, value: customer.phone },
    { icon: Mail, value: customer.email },
    { icon: Instagram, value: customer.instagram },
  ].filter((i) => i.value);

  const card = "rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/50";

  return (
    <aside className="hidden min-h-0 space-y-4 overflow-y-auto xl:block">
      {/* CRM profile */}
      <div className={card}>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-base font-bold text-slate-950">
            {customer.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-100">{customer.name}</p>
            <p className="text-xs text-slate-500">{customer.id} · {customer.segment}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <p className="text-[11px] text-slate-500">Customer value</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">Rs. {customer.value.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <p className="text-[11px] text-slate-500">Sentiment</p>
            <span className={cn("mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", s.badge)}>
              <Smile className="h-3 w-3" />
              {s.label}
            </span>
          </div>
        </div>

        <p className="mb-2 mt-5 text-[11px] font-medium uppercase tracking-wider text-slate-500">Merged identities</p>
        <ul className="space-y-2">
          {identities.map(({ icon: Icon, value }) => (
            <li key={value} className="flex items-center gap-2.5 text-sm text-slate-300">
              <Icon className="h-3.5 w-3.5 text-cyan-300" />
              <span className="truncate">{value}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Orders */}
      <div className={card}>
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
          <ShoppingBag className="h-4 w-4 text-indigo-300" /> Order history
        </p>
        <ul className="space-y-2">
          {customer.orders.map((o) => (
            <li key={o} className="flex items-center justify-between rounded-lg px-2 py-1.5 transition hover:bg-slate-800/40">
              <span className="font-mono text-xs text-cyan-300">{o}</span>
              <span className="text-[11px] text-slate-500">View</span>
            </li>
          ))}
        </ul>
      </div>

      {/* AI telemetry */}
      <div className={card}>
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
          <Bot className="h-4 w-4 text-cyan-300" /> AI agent telemetry
        </p>
        <div className="grid grid-cols-2 gap-3 text-center">
          {[
            { icon: Clock, label: "Avg response", value: "1.2s" },
            { icon: Gauge, label: "Resolution", value: "87%" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <Icon className="mx-auto h-4 w-4 text-slate-400" />
              <p className="mt-1.5 text-base font-semibold text-slate-100">{value}</p>
              <p className="text-[11px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
