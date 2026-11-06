import { useState } from "react";
import { FlaskConical, Mail, MessageSquare, Share2, Sparkles, Target, TrendingDown } from "lucide-react";
import {
  Badge, Button, Card, CardTitle, PageContainer, PageHeader, Progress, inputCls, money, selectCls, useToast, type Tone,
} from "../components/ui-kit";
import { churnReasons, initialCampaigns, segmentsInfo, type Campaign } from "../data/marketing";
import { initialCustomers } from "../data/crm";
import { cn } from "../lib/utils";

const channelIcon = { Email: Mail, SMS: MessageSquare, Social: Share2 };
const statusTone: Record<Campaign["status"], Tone> = { Running: "green", Scheduled: "amber", Completed: "slate" };

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [segment, setSegment] = useState(segmentsInfo[5].name);
  const [channel, setChannel] = useState<Campaign["channel"]>("Email");
  const [name, setName] = useState("Win-back offer");
  const [schedule, setSchedule] = useState("Send now");
  const [abTest, setAbTest] = useState(true);
  const [variantA, setVariantA] = useState("We miss you! Enjoy 15% off your next order.");
  const [variantB, setVariantB] = useState("Your favourites are back in stock — 15% off, just for you.");
  const [generating, setGenerating] = useState(false);
  const [contacted, setContacted] = useState<string[]>([]);
  const { toast, show } = useToast();

  const atRisk = initialCustomers.filter((c) => c.churnRisk >= 70).sort((a, b) => b.churnRisk - a.churnRisk);
  const segCount = segmentsInfo.find((s) => s.name === segment)?.count ?? 0;

  const generate = () => {
    setGenerating(true);
    window.setTimeout(() => {
      setVariantA(`Hi {{first_name}}, a little something for our ${segment.toLowerCase()}: 15% off this week.`);
      setVariantB(`{{first_name}}, we picked products you'll love — shop now and save 15%.`);
      setGenerating(false);
    }, 900);
  };

  const launch = () => {
    if (!name.trim()) return show("Give the campaign a name");
    const c: Campaign = {
      id: `cp${Date.now()}`, name: name.trim(), channel, segment,
      status: schedule === "Send now" ? "Running" : "Scheduled",
      sent: schedule === "Send now" ? segCount : 0, openRate: 0, conversions: 0,
    };
    setCampaigns((prev) => [c, ...prev]);
    show(schedule === "Send now" ? `Campaign sent to ${segCount} customers` : `Campaign scheduled: ${schedule}`);
  };

  const winBack = (id: string, who: string) => {
    setContacted((p) => [...p, id]);
    show(`Personalised win-back offer sent to ${who}`);
  };

  return (
    <PageContainer>
      <PageHeader title="Marketing & Growth" subtitle="Segmentation, churn prediction and personalised campaigns" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {segmentsInfo.map((s) => (
          <button
            key={s.name}
            onClick={() => setSegment(s.name)}
            className={cn(
              "rounded-2xl border bg-slate-900/60 p-5 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-2xl active:scale-[0.99]",
              segment === s.name ? "border-indigo-500/60 shadow-[0_0_24px_rgba(99,102,241,0.2)]" : "border-white/10",
            )}
          >
            <div className="flex items-center justify-between">
              <Target className="h-4 w-4 text-cyan-300" />
              {segment === s.name && <Badge tone="indigo">Selected</Badge>}
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-100">{s.count.toLocaleString()}</p>
            <p className="text-sm font-medium text-slate-200">{s.name}</p>
            <p className="text-xs text-slate-500">{s.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <CardTitle title="Campaign builder" subtitle={`Targeting ${segCount.toLocaleString()} customers in “${segment}”`} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block text-slate-400">Campaign name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-slate-400">Channel</span>
              <select value={channel} onChange={(e) => setChannel(e.target.value as Campaign["channel"])} className={selectCls}>
                {["Email", "SMS", "Social"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-slate-400">Schedule</span>
              <select value={schedule} onChange={(e) => setSchedule(e.target.value)} className={selectCls}>
                {["Send now", "Tomorrow 9:00 AM", "Friday 6:00 PM"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>

            <div className="sm:col-span-2">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-slate-400">Message {abTest ? "variants" : ""}</span>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                  <input type="checkbox" checked={abTest} onChange={(e) => setAbTest(e.target.checked)} className="accent-indigo-500" />
                  <FlaskConical className="h-3.5 w-3.5 text-cyan-300" />A/B test
                </label>
              </div>
              <div className={cn("grid gap-3", abTest && "sm:grid-cols-2")}>
                <div>
                  {abTest && <p className="mb-1 text-xs font-medium text-indigo-300">Variant A</p>}
                  <textarea rows={4} value={variantA} onChange={(e) => setVariantA(e.target.value)} className={cn(inputCls, "h-auto py-2.5")} />
                </div>
                {abTest && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-cyan-300">Variant B</p>
                    <textarea rows={4} value={variantB} onChange={(e) => setVariantB(e.target.value)} className={cn(inputCls, "h-auto py-2.5")} />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={generate} disabled={generating}>
              <Sparkles className={cn("h-4 w-4", generating && "animate-pulse")} />{generating ? "Generating…" : "Generate with AI"}
            </Button>
            <Button onClick={launch}>{schedule === "Send now" ? "Launch campaign" : "Schedule campaign"}</Button>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <CardTitle title="Churn prediction" subtitle="Customers likely to stop purchasing" />
          <ul className="space-y-4">
            {atRisk.map((c) => (
              <li key={c.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-100">{c.name}</p>
                  <Badge tone="red"><TrendingDown className="h-3 w-3" />{c.churnRisk}% risk</Badge>
                </div>
                <div className="my-2"><Progress value={c.churnRisk} tone="red" /></div>
                <ul className="mb-3 space-y-0.5 text-xs text-slate-500">
                  {(churnReasons[c.id] ?? ["Low recent engagement"]).map((r) => <li key={r}>• {r}</li>)}
                </ul>
                <Button
                  variant="ghost" className="w-full py-1.5 text-xs" disabled={contacted.includes(c.id)}
                  onClick={() => winBack(c.id, c.name)}
                >
                  {contacted.includes(c.id) ? "Offer sent" : `Send win-back offer · ${money(c.value)} LTV`}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 pb-3"><CardTitle title="Campaigns" subtitle="Performance and A/B test results" /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-y border-white/10 text-xs uppercase tracking-wider text-slate-500">
                {["Campaign", "Channel", "Segment", "Status", "Sent", "Open rate", "Conversions", "A/B winner"].map((h) => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaigns.map((c) => {
                const Icon = channelIcon[c.channel];
                return (
                  <tr key={c.id} className="transition-colors hover:bg-slate-800/40">
                    <td className="px-6 py-3.5 font-medium text-slate-100">{c.name}</td>
                    <td className="px-6 py-3.5 text-slate-400"><span className="inline-flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{c.channel}</span></td>
                    <td className="px-6 py-3.5 text-slate-400">{c.segment}</td>
                    <td className="px-6 py-3.5"><Badge tone={statusTone[c.status]}>{c.status}</Badge></td>
                    <td className="px-6 py-3.5 text-slate-300">{c.sent.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-slate-300">{c.openRate ? `${c.openRate}%` : "—"}</td>
                    <td className="px-6 py-3.5 text-slate-300">{c.conversions || "—"}</td>
                    <td className="px-6 py-3.5">{c.winner ? <Badge tone="indigo">Variant {c.winner}</Badge> : <span className="text-slate-600">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {toast}
    </PageContainer>
  );
}
