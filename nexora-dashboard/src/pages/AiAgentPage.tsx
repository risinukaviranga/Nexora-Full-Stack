import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowRight, Bot, Brain, CheckCircle2, Database, FileText, Headset, MessageSquare,
  RefreshCw, Search, Send, Smile, Timer, TriangleAlert,
} from "lucide-react";
import MetricCard from "../components/MetricCard";
import {
  Badge, Button, Card, CardTitle, PageContainer, PageHeader, Toggle, axisProps, tooltipLabelStyle, tooltipStyle,
} from "../components/ui-kit";
import { cn } from "../lib/utils";

const weekly = [
  { day: "Mon", handled: 182, escalated: 21 },
  { day: "Tue", handled: 204, escalated: 25 },
  { day: "Wed", handled: 231, escalated: 24 },
  { day: "Thu", handled: 219, escalated: 30 },
  { day: "Fri", handled: 268, escalated: 29 },
  { day: "Sat", handled: 190, escalated: 18 },
  { day: "Sun", handled: 161, escalated: 14 },
];

const pipeline = [
  { icon: MessageSquare, label: "Customer message" },
  { icon: Brain, label: "Query understanding" },
  { icon: Search, label: "RAG search" },
  { icon: FileText, label: "Relevant context" },
  { icon: Bot, label: "LLM" },
  { icon: Send, label: "Response" },
];

interface Source { name: string; docs: number; synced: string; syncing: boolean }
const initialSources: Source[] = [
  { name: "Product catalog", docs: 214, synced: "2 min ago", syncing: false },
  { name: "Inventory & availability", docs: 214, synced: "2 min ago", syncing: false },
  { name: "Order history", docs: 3820, synced: "5 min ago", syncing: false },
  { name: "Shipping policies", docs: 12, synced: "1 day ago", syncing: false },
  { name: "Pricing", docs: 214, synced: "2 min ago", syncing: false },
  { name: "Customer information", docs: 1284, synced: "10 min ago", syncing: false },
  { name: "Delivery information", docs: 540, synced: "5 min ago", syncing: false },
];

const faqs = [
  { q: "Where is my order?", n: 412 },
  { q: "Is the Samsung A55 available?", n: 301 },
  { q: "How long does delivery take?", n: 255 },
  { q: "Do you offer free shipping?", n: 176 },
  { q: "Can I change my delivery address?", n: 98 },
];

export default function AiAgentPage() {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [settings, setSettings] = useState({ autoReply: true, negative: true, refund: true, personalize: true });
  const [threshold, setThreshold] = useState(75);

  const reindex = () => {
    setSources((s) => s.map((x) => ({ ...x, syncing: true })));
    window.setTimeout(() => setSources((s) => s.map((x) => ({ ...x, syncing: false, synced: "Just now" }))), 1600);
  };

  const toggles: { key: keyof typeof settings; label: string; desc: string }[] = [
    { key: "autoReply", label: "Autonomous replies", desc: "AI answers routine questions without approval" },
    { key: "negative", label: "Escalate on negative sentiment", desc: "Hand over to a human agent when the customer is upset" },
    { key: "refund", label: "Escalate refunds & complaints", desc: "Sensitive requests always reach a human" },
    { key: "personalize", label: "Personalised responses", desc: "Use CRM profile and order history in replies" },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="AI Conversation Agent"
        subtitle="RAG-powered agent answering customers with real business data"
        actions={<Badge tone="green"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />Agent online</Badge>}
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Conversations handled" value="1,455" change="+12.4%" positive icon={Bot} hero hint="this week" />
        <MetricCard title="Avg response time" value="1.2s" change="-0.3s" positive icon={Timer} hint="faster than last week" />
        <MetricCard title="AI resolution rate" value="87.4%" change="+3.6%" positive icon={CheckCircle2} />
        <MetricCard title="Human escalations" value="161" change="+4.1%" positive={false} icon={Headset} hint="11.1% of chats" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <CardTitle title="Agent performance" subtitle="Conversations handled vs. escalated to humans" />
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="day" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
                <Bar dataKey="handled" name="AI handled" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="escalated" name="Escalated" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <CardTitle title="Agent telemetry" subtitle="Quality signals" />
          <ul className="space-y-4 text-sm">
            {[
              { icon: Smile, label: "Customer sentiment", value: "4.4 / 5", tone: "text-emerald-400" },
              { icon: TriangleAlert, label: "Failed responses", value: "23 (1.6%)", tone: "text-amber-400" },
              { icon: CheckCircle2, label: "Successful resolutions", value: "1,272", tone: "text-emerald-400" },
              { icon: Headset, label: "Human handovers", value: "161", tone: "text-cyan-300" },
            ].map(({ icon: Icon, label, value, tone }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-800/70"><Icon className={cn("h-4 w-4", tone)} /></span>
                <span className="flex-1 text-slate-400">{label}</span>
                <span className="font-semibold text-slate-100">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-6">
        <CardTitle title="RAG pipeline" subtitle="How every customer message becomes a grounded answer" />
        <div className="flex flex-wrap items-center gap-2">
          {pipeline.map(({ icon: Icon, label }, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3.5 py-2.5 transition hover:border-indigo-500/50">
                <Icon className="h-4 w-4 text-cyan-300" />
                <span className="text-sm text-slate-200">{label}</span>
              </div>
              {i < pipeline.length - 1 && <ArrowRight className="h-4 w-4 text-slate-600" />}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <CardTitle
            title="Knowledge sources"
            subtitle="Business data indexed in pgvector for retrieval"
            action={<Button variant="ghost" onClick={reindex}><RefreshCw className={cn("h-4 w-4", sources[0].syncing && "animate-spin")} />Re-index all</Button>}
          />
          <ul className="divide-y divide-white/5">
            {sources.map((s) => (
              <li key={s.name} className="flex items-center gap-3 py-3 text-sm transition hover:bg-slate-800/30">
                <Database className="h-4 w-4 text-indigo-300" />
                <span className="flex-1 font-medium text-slate-100">{s.name}</span>
                <span className="text-slate-500">{s.docs.toLocaleString()} docs</span>
                <Badge tone={s.syncing ? "amber" : "green"} className="w-28 justify-center">
                  {s.syncing ? "Syncing…" : s.synced}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <CardTitle title="Agent behaviour" subtitle="Escalation & personalisation rules" />
          <ul className="space-y-4">
            {toggles.map((t) => (
              <li key={t.key} className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-100">{t.label}</p>
                  <p className="text-xs text-slate-500">{t.desc}</p>
                </div>
                <Toggle checked={settings[t.key]} onChange={(v) => setSettings((s) => ({ ...s, [t.key]: v }))} />
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-300">Confidence threshold</span>
              <span className="font-semibold text-cyan-300">{threshold}%</span>
            </div>
            <input type="range" min={50} max={95} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-indigo-500" />
            <p className="mt-1 text-xs text-slate-500">Below this score the AI escalates to a human agent.</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <CardTitle title="Most frequently asked questions" subtitle="Used to improve answers and the AEO FAQ engine" />
        <ul className="space-y-3">
          {faqs.map((f) => (
            <li key={f.q} className="flex items-center gap-4 text-sm">
              <span className="w-72 truncate text-slate-200">{f.q}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${(f.n / 412) * 100}%` }} />
              </div>
              <span className="w-10 text-right text-slate-400">{f.n}</span>
            </li>
          ))}
        </ul>
      </Card>
    </PageContainer>
  );
}
