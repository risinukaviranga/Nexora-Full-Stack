import { useMemo, useState } from "react";
import { Check, Copy, Globe, HelpCircle, Network, RefreshCw, Search, Sparkles } from "lucide-react";
import {
  Badge, Button, Card, CardTitle, PageContainer, PageHeader, Tabs, money, selectCls, useToast,
} from "../components/ui-kit";
import { initialProducts } from "../data/products";
import type { Product } from "../types";
import { cn } from "../lib/utils";

type Tab = "seo" | "aeo" | "geo";
const tabs: { id: Tab; label: string; icon: typeof Search }[] = [
  { id: "seo", label: "SEO", icon: Search },
  { id: "aeo", label: "AEO", icon: HelpCircle },
  { id: "geo", label: "GEO", icon: Network },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function buildSeo(p: Product) {
  return {
    title: `${p.name} Price in Sri Lanka | Buy Online – Nexora`,
    description: `Buy the ${p.name} by ${p.brand} online. ${p.features.slice(0, 3).join(", ")}. Price ${money(p.price)}. Fast island-wide delivery.`,
    keywords: [p.name, `${p.name} price`, `buy ${p.name} online`, p.brand, p.category, "Sri Lanka"],
    url: `nexora.lk › products › ${slug(p.name)}`,
  };
}

function buildFaq(p: Product, version: number) {
  const base = [
    { q: `Is the ${p.name} available?`, a: p.stock > 0 ? `Yes, the ${p.name} is currently in stock (${p.stock} units).` : `The ${p.name} is currently out of stock.` },
    { q: `What is the price of the ${p.name}?`, a: `The ${p.name} is priced at ${money(p.price)}.` },
    { q: "How long does delivery take?", a: "Delivery normally takes 2–3 business days island-wide." },
    { q: `What are the key features of the ${p.name}?`, a: `${p.features.join(", ")}.` },
  ];
  return version % 2 === 0 ? base : [...base, { q: `Is the ${p.name} good value?`, a: `${p.description} At ${money(p.price)}, it is a popular ${p.category.toLowerCase()} choice.` }];
}

export default function SeoPage() {
  const [tab, setTab] = useState<Tab>("seo");
  const [productId, setProductId] = useState(initialProducts[0].id);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast, show } = useToast();

  const p = initialProducts.find((x) => x.id === productId) ?? initialProducts[0];
  const seo = useMemo(() => buildSeo(p), [p]);
  const faq = useMemo(() => buildFaq(p, version), [p, version]);

  const jsonLd = useMemo(
    () =>
      JSON.stringify(
        [
          {
            "@context": "https://schema.org", "@type": "Product", name: p.name, brand: { "@type": "Brand", name: p.brand },
            description: p.description, category: p.category,
            offers: { "@type": "Offer", priceCurrency: "LKR", price: p.price, availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
          },
          { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
        ],
        null, 2,
      ),
    [p, faq],
  );

  const titleOk = seo.title.length <= 60;
  const descOk = seo.description.length >= 70 && seo.description.length <= 160;
  const score = 60 + (titleOk ? 15 : 0) + (descOk ? 15 : 0) + (p.stock > 0 ? 10 : 0);

  const regenerate = () => {
    setBusy(true);
    window.setTimeout(() => { setVersion((v) => v + 1); setBusy(false); show("AI regenerated the FAQ content"); }, 900);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(jsonLd); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { show("Copy failed — select the code manually"); }
  };

  const nodes = [
    { label: "Brand", value: p.brand }, { label: "Price", value: money(p.price) },
    { label: "Availability", value: p.stock > 0 ? "In stock" : "Out of stock" },
    { label: "Features", value: `${p.features.length} items` }, { label: "FAQ", value: `${faq.length} Q&A` },
    { label: "Category", value: p.category },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="SEO / AEO / GEO Engine"
        subtitle="Content optimised for search engines and AI answer engines"
        actions={
          <>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className={cn(selectCls, "w-56")}>
              {initialProducts.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <Tabs tabs={tabs} value={tab} onChange={setTab} />
          </>
        }
      />

      {tab === "seo" && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="space-y-5 p-6 lg:col-span-2">
            <CardTitle title="Generated metadata" subtitle="Page title, meta description and keywords" />
            <div>
              <div className="mb-1.5 flex justify-between text-sm"><span className="text-slate-400">Page title</span><span className={titleOk ? "text-emerald-400" : "text-amber-400"}>{seo.title.length}/60</span></div>
              <p className="rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100">{seo.title}</p>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-sm"><span className="text-slate-400">Meta description</span><span className={descOk ? "text-emerald-400" : "text-amber-400"}>{seo.description.length}/160</span></div>
              <p className="rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100">{seo.description}</p>
            </div>
            <div>
              <p className="mb-1.5 text-sm text-slate-400">Keywords</p>
              <div className="flex flex-wrap gap-2">{seo.keywords.map((k) => <Badge key={k} tone="indigo">{k}</Badge>)}</div>
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="p-6">
              <CardTitle title="Search preview" />
              <div className="rounded-xl bg-white p-4">
                <p className="flex items-center gap-1.5 text-xs text-slate-600"><Globe className="h-3 w-3" />{seo.url}</p>
                <p className="mt-1 text-[17px] leading-snug text-blue-700">{seo.title}</p>
                <p className="mt-1 text-sm leading-snug text-slate-600">{seo.description}</p>
              </div>
            </Card>
            <Card className="p-6 text-center">
              <CardTitle title="SEO score" />
              <p className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-5xl font-bold text-transparent">{score}</p>
              <p className="mt-1 text-xs text-slate-500">out of 100</p>
            </Card>
          </div>
        </div>
      )}

      {tab === "aeo" && (
        <Card className="p-6">
          <CardTitle
            title="Auto-generated FAQ"
            subtitle={`Direct answers for ${p.name} that answer engines can quote`}
            action={<Button variant="ghost" onClick={regenerate} disabled={busy}><RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} />Regenerate</Button>}
          />
          <ul className="space-y-3">
            {faq.map((f) => (
              <li key={f.q} className="rounded-xl border border-white/10 bg-slate-950/40 p-4 transition hover:border-indigo-500/50">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-100"><HelpCircle className="h-4 w-4 text-cyan-300" />{f.q}</p>
                <p className="mt-1.5 pl-6 text-sm text-slate-400">{f.a}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === "geo" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-6">
            <CardTitle
              title="JSON-LD structured data"
              subtitle="Product + FAQPage schema for generative engines"
              action={<Button variant="ghost" onClick={copy}>{copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy"}</Button>}
            />
            <pre className="max-h-[420px] overflow-auto rounded-xl border border-white/10 bg-slate-950/70 p-4 text-xs leading-relaxed text-cyan-200">{jsonLd}</pre>
          </Card>

          <div className="space-y-5">
            <Card className="p-6">
              <CardTitle title="Dynamic knowledge graph" subtitle="Entities AI systems can extract" />
              <svg viewBox="0 0 400 260" className="w-full">
                {nodes.map((n, i) => {
                  const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
                  const x = 200 + Math.cos(a) * 130; const y = 130 + Math.sin(a) * 95;
                  return (
                    <g key={n.label}>
                      <line x1={200} y1={130} x2={x} y2={y} stroke="rgba(129,140,248,0.4)" strokeWidth={1.5} />
                      <rect x={x - 42} y={y - 17} width={84} height={34} rx={10} fill="#0f172a" stroke="rgba(255,255,255,0.15)" />
                      <text x={x} y={y - 3} textAnchor="middle" fontSize={9} fill="#94a3b8">{n.label}</text>
                      <text x={x} y={y + 10} textAnchor="middle" fontSize={10} fill="#e2e8f0" fontWeight={600}>{n.value}</text>
                    </g>
                  );
                })}
                <circle cx={200} cy={130} r={34} fill="url(#kg)" />
                <defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
                <text x={200} y={134} textAnchor="middle" fontSize={10} fontWeight={700} fill="#020617">{p.name.length > 14 ? p.name.slice(0, 13) + "…" : p.name}</text>
              </svg>
            </Card>

            <Card className="p-6">
              <CardTitle title="AI-optimised summary" action={<Sparkles className="h-4 w-4 text-cyan-300" />} />
              <p className="text-sm leading-relaxed text-slate-300">
                The <span className="text-slate-100">{p.name}</span> is a {p.category.toLowerCase().replace(/s$/, "")} from <span className="text-slate-100">{p.brand}</span>, sold by Nexora in Sri Lanka at {money(p.price)}.
                {" "}{p.description} Key attributes: {p.features.join(", ")}. Availability: {p.stock > 0 ? "in stock" : "out of stock"}.
              </p>
            </Card>
          </div>
        </div>
      )}
      {toast}
    </PageContainer>
  );
}
