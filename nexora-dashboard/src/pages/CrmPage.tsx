import { useMemo, useState } from "react";
import {
  CheckCircle2, CreditCard, Instagram, Link2, Mail, MessageSquare, Package, Phone,
  Search, ShoppingBag, Star, Truck, UserPlus,
} from "lucide-react";
import {
  Badge, Button, Card, CardTitle, PageContainer, PageHeader, StatTile, inputCls, initials, money, selectCls, useToast,
  type Tone,
} from "../components/ui-kit";
import { initialCustomers, initialMerges, timeline, type MergeSuggestion } from "../data/crm";
import type { Customer, CustomerSegment } from "../types";
import { cn } from "../lib/utils";

const segTone: Record<CustomerSegment, Tone> = {
  New: "cyan", Regular: "indigo", "High-value": "green", Inactive: "slate", "At-risk": "red",
};
const tlIcon = { Conversation: MessageSquare, "Product inquiry": Package, Order: ShoppingBag, Payment: CreditCard, Courier: Truck, Delivery: CheckCircle2, Feedback: Star };

export default function CrmPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [merges, setMerges] = useState<MergeSuggestion[]>(initialMerges);
  const [selectedId, setSelectedId] = useState(initialCustomers[0].id);
  const [query, setQuery] = useState("");
  const [seg, setSeg] = useState<"All" | CustomerSegment>("All");
  const { toast, show } = useToast();

  const visible = useMemo(
    () => customers.filter((c) => (seg === "All" || c.segment === seg) && c.name.toLowerCase().includes(query.toLowerCase())),
    [customers, seg, query],
  );
  const selected = customers.find((c) => c.id === selectedId) ?? customers[0];

  const merge = (m: MergeSuggestion) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== m.customerId) return c;
        const next: Customer = { ...c, channels: [...c.channels] };
        m.identities.forEach((i) => {
          if (i.type === "WhatsApp") next.phone = next.phone ?? i.value;
          if (i.type === "Email") next.email = next.email ?? i.value;
          if (i.type === "Instagram") next.instagram = next.instagram ?? i.value;
          if (!next.channels.includes(i.type)) next.channels.push(i.type);
        });
        return next;
      }),
    );
    setMerges((prev) => prev.filter((x) => x.id !== m.id));
    const name = customers.find((c) => c.id === m.customerId)?.name;
    show(`Identities merged into ${name}'s unified profile`);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Customers (CRM)"
        subtitle="One unified profile across every channel"
        actions={<Button onClick={() => show("Customer registration form coming soon")}><UserPlus className="h-4 w-4" />Add customer</Button>}
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total customers" value="2,815" sub="across 5 channels" />
        <StatTile label="New this month" value="412" sub="+34% vs last month" tone="green" />
        <StatTile label="High-value" value="186" sub="top 10% by lifetime value" />
        <StatTile label="At-risk" value="126" sub="high churn probability" tone="red" />
      </div>

      {merges.length > 0 && (
        <Card className="border-indigo-500/30 p-5">
          <CardTitle title="Identity merge suggestions" subtitle="The same person seems to be contacting you from different accounts" />
          <div className="grid gap-3 lg:grid-cols-2">
            {merges.map((m) => {
              const c = customers.find((x) => x.id === m.customerId)!;
              return (
                <div key={m.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
                  <Link2 className="h-5 w-5 shrink-0 text-cyan-300" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium text-slate-100">{c.name} <span className="text-slate-500">({c.id})</span></p>
                    <p className="truncate text-xs text-slate-400">{m.identities.map((i) => `${i.type}: ${i.value}`).join("  +  ")}</p>
                    <p className="mt-0.5 text-xs text-emerald-400">{m.confidence}% match confidence</p>
                  </div>
                  <Button onClick={() => merge(m)}>Merge</Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="flex flex-wrap items-center gap-3 p-5 pb-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers…" className={cn(inputCls, "pl-10")} />
            </div>
            <select value={seg} onChange={(e) => setSeg(e.target.value as "All" | CustomerSegment)} className={cn(selectCls, "w-44")}>
              {["All", "New", "Regular", "High-value", "Inactive", "At-risk"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-white/10 text-xs uppercase tracking-wider text-slate-500">
                  {["Customer", "Segment", "Channels", "Orders", "Value", "Last active"].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visible.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn("cursor-pointer transition-colors hover:bg-slate-800/40", c.id === selected.id && "bg-indigo-500/10")}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500/40 to-cyan-400/30 text-xs font-semibold text-slate-100">{initials(c.name)}</span>
                        <div>
                          <p className="font-medium text-slate-100">{c.name}</p>
                          <p className="font-mono text-[11px] text-slate-500">{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><Badge tone={segTone[c.segment]}>{c.segment}</Badge></td>
                    <td className="px-5 py-3.5 text-slate-400">{c.channels.length}</td>
                    <td className="px-5 py-3.5 text-slate-300">{c.orders}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-100">{money(c.value)}</td>
                    <td className="px-5 py-3.5 text-slate-400">{c.lastActive}</td>
                  </tr>
                ))}
                {visible.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No customers match</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-base font-bold text-slate-950">{initials(selected.name)}</span>
              <div>
                <p className="font-semibold text-slate-100">{selected.name}</p>
                <p className="text-xs text-slate-500">{selected.id} · {money(selected.value)} lifetime value</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {selected.phone && <li className="flex items-center gap-2.5"><Phone className="h-3.5 w-3.5 text-cyan-300" />{selected.phone}</li>}
              {selected.email && <li className="flex items-center gap-2.5"><Mail className="h-3.5 w-3.5 text-cyan-300" />{selected.email}</li>}
              {selected.instagram && <li className="flex items-center gap-2.5"><Instagram className="h-3.5 w-3.5 text-cyan-300" />{selected.instagram}</li>}
            </ul>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {selected.channels.map((ch) => <Badge key={ch} tone="slate">{ch}</Badge>)}
            </div>
          </Card>

          <Card className="p-5">
            <CardTitle title="Activity timeline" />
            <ol className="relative space-y-4 border-l border-white/10 pl-5">
              {timeline.map((t) => {
                const Icon = tlIcon[t.key];
                return (
                  <li key={t.key} className="relative">
                    <span className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-slate-900">
                      <Icon className="h-3 w-3 text-cyan-300" />
                    </span>
                    <p className="text-sm font-medium text-slate-100">{t.key}</p>
                    <p className="text-xs text-slate-400">{t.text}</p>
                    <p className="text-[11px] text-slate-600">{t.when}</p>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>
      {toast}
    </PageContainer>
  );
}
