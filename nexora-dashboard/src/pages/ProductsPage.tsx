import { useMemo, useState } from "react";
import { Bot, MoreHorizontal, Minus, Pencil, Plus, Search, ShoppingCart, Trash2, TriangleAlert } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Badge, Button, Card, CardTitle, Modal, PageContainer, PageHeader, StatTile, inputCls, money, selectCls, useToast,
} from "../components/ui-kit";
import { LOW_STOCK_THRESHOLD, initialProducts } from "../data/products";
import type { Product } from "../types";
import { cn } from "../lib/utils";

interface FormState { name: string; brand: string; category: string; price: string; cost: string; stock: string; description: string; features: string }
const emptyForm: FormState = { name: "", brand: "", category: "Smartphones", price: "", cost: "", stock: "", description: "", features: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedId, setSelectedId] = useState(initialProducts[0].id);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const { toast, show } = useToast();

  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const visible = products.filter(
    (p) => (category === "All" || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase()),
  );
  const low = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD);
  const selected = products.find((p) => p.id === selectedId) ?? products[0];
  const stockValue = products.reduce((sum, p) => sum + p.stock * p.cost, 0);

  const setStock = (id: string, delta: number) =>
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p)));

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, brand: p.brand, category: p.category, price: String(p.price), cost: String(p.cost), stock: String(p.stock), description: p.description, features: p.features.join(", ") });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim() || !form.price) return show("Name and price are required");
    const data = {
      name: form.name.trim(), brand: form.brand.trim() || "Generic", category: form.category,
      price: Number(form.price) || 0, cost: Number(form.cost) || 0, stock: Number(form.stock) || 0,
      description: form.description.trim(),
      features: form.features.split(",").map((f) => f.trim()).filter(Boolean),
    };
    if (editing) {
      setProducts((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...data } : p)));
      show(`${data.name} updated`);
    } else {
      const id = `P${String(products.length + 1).padStart(3, "0")}-${Math.random().toString(36).slice(2, 5)}`;
      setProducts((prev) => [...prev, { id, ...data }]);
      show(`${data.name} added and synced to the AI agent`);
    }
    setOpen(false);
  };

  const remove = (p: Product) => { setProducts((prev) => prev.filter((x) => x.id !== p.id)); show(`${p.name} deleted`); };
  const sale = (p: Product) => {
    if (p.stock < 2) return show(`Not enough stock for ${p.name}`);
    setStock(p.id, -2);
    show(`Order placed: ${p.name} stock ${p.stock} → ${p.stock - 2}`);
  };

  const field = (label: string, key: keyof FormState, type = "text") => (
    <label className="block text-sm">
      <span className="mb-1.5 block text-slate-400">{label}</span>
      <input type={type} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className={inputCls} />
    </label>
  );

  return (
    <PageContainer>
      <PageHeader title="Products & Inventory" subtitle="Catalogue and stock that feed the AI agent" actions={<Button onClick={openNew}><Plus className="h-4 w-4" />Add product</Button>} />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Products" value={String(products.length)} sub={`${categories.length - 1} categories`} />
        <StatTile label="Units in stock" value={products.reduce((s, p) => s + p.stock, 0).toLocaleString()} />
        <StatTile label="Stock value (at cost)" value={money(stockValue)} />
        <StatTile label="Low-stock items" value={String(low.length)} sub={`≤ ${LOW_STOCK_THRESHOLD} units`} tone={low.length ? "red" : "green"} />
      </div>

      {low.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-amber-200"><span className="font-semibold">Low-stock alert:</span> {low.map((p) => `${p.name} (${p.stock})`).join(", ")}</p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="flex flex-wrap items-center gap-3 p-5 pb-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className={cn(inputCls, "pl-10")} />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={cn(selectCls, "w-44")}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-white/10 text-xs uppercase tracking-wider text-slate-500">
                  {["Product", "Price", "Margin", "Stock", "Status", ""].map((h, i) => <th key={i} className="px-5 py-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visible.map((p) => {
                  const margin = p.price ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;
                  return (
                    <tr key={p.id} onClick={() => setSelectedId(p.id)} className={cn("cursor-pointer transition-colors hover:bg-slate-800/40", p.id === selected.id && "bg-indigo-500/10")}>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-100">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.brand} · {p.category}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-100">{money(p.price)}</td>
                      <td className="px-5 py-3.5 text-emerald-400">{margin}%</td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/40 p-0.5">
                          <button onClick={() => setStock(p.id, -1)} className="rounded-md p-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 active:scale-[0.95]"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-8 text-center font-medium text-slate-100">{p.stock}</span>
                          <button onClick={() => setStock(p.id, 1)} className="rounded-md p-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 active:scale-[0.95]"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {p.stock === 0 ? <Badge tone="red">Out of stock</Badge> : p.stock <= LOW_STOCK_THRESHOLD ? <Badge tone="amber">Low stock</Badge> : <Badge tone="green">In stock</Badge>}
                      </td>
                      <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"><MoreHorizontal className="h-4 w-4" /></button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="gap-2" onSelect={() => openEdit(p)}><Pencil className="h-4 w-4" />Edit</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onSelect={() => sale(p)}><ShoppingCart className="h-4 w-4" />Simulate order (−2)</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-red-400" onSelect={() => remove(p)}><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No products found</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="h-fit p-5">
          <CardTitle title="What the AI sees" subtitle="Live product data used to answer customers" />
          {selected && (
            <>
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm">
                <p className="text-xs text-slate-500">Customer</p>
                <p className="mb-3 text-slate-200">“Do you have {selected.name}?”</p>
                <p className="flex items-center gap-1.5 text-xs text-cyan-300"><Bot className="h-3 w-3" />AI agent</p>
                <p className="mt-1 text-slate-200">
                  {selected.stock > 0
                    ? `Yes, we have ${selected.stock} unit${selected.stock === 1 ? "" : "s"} of the ${selected.name} in stock at ${money(selected.price)}.`
                    : `Sorry, the ${selected.name} is currently out of stock. Would you like to be notified when it returns?`}
                </p>
              </div>
              <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wider text-slate-500">Product record</p>
              <p className="text-sm text-slate-300">{selected.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{selected.features.map((f) => <Badge key={f} tone="indigo">{f}</Badge>)}</div>
            </>
          )}
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit product" : "Add product"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("Product name", "name")}</div>
          {field("Brand", "brand")}
          <label className="block text-sm">
            <span className="mb-1.5 block text-slate-400">Category</span>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className={selectCls}>
              {["Smartphones", "Audio", "Accessories", "Laptops", "Other"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          {field("Price (Rs.)", "price", "number")}
          {field("Cost (Rs.)", "cost", "number")}
          {field("Stock", "stock", "number")}
          <div className="sm:col-span-2">{field("Features (comma separated)", "features")}</div>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block text-slate-400">Description</span>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className={cn(inputCls, "h-auto py-2.5")} />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save}>{editing ? "Save changes" : "Add product"}</Button>
        </div>
      </Modal>
      {toast}
    </PageContainer>
  );
}
