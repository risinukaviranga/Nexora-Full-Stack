import { useCallback, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

export const inputCls =
  "h-10 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20";
export const selectCls = `${inputCls} [&>option]:bg-slate-900`;

export const tooltipStyle = {
  background: "rgba(2,6,23,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
};
export const tooltipLabelStyle = { color: "#cbd5e1", marginBottom: 4 };
export const axisProps = { stroke: "#64748b", fontSize: 12, tickLine: false, axisLine: false } as const;

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/50",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-[1400px] space-y-6 p-6">{children}</main>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
          {title}
        </h1>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export type Tone = "green" | "amber" | "red" | "indigo" | "slate" | "cyan";
const toneCls: Record<Tone, string> = {
  green: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  red: "bg-red-500/10 text-red-400 ring-red-500/20",
  indigo: "bg-indigo-500/10 text-indigo-300 ring-indigo-500/20",
  slate: "bg-slate-500/10 text-slate-300 ring-slate-500/20",
  cyan: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/20",
};

export function Badge({ tone = "slate", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", toneCls[tone], className)}>
      {children}
    </span>
  );
}

export function Button({
  variant = "primary", className, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:brightness-110",
        variant === "ghost" && "border border-white/10 bg-slate-900/60 text-slate-300 hover:border-indigo-500/50 hover:text-slate-100",
        variant === "danger" && "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
        className,
      )}
    />
  );
}

export function Tabs<T extends string>({
  tabs, value, onChange,
}: { tabs: { id: T; label: string; icon?: LucideIcon }[]; value: T; onChange: (id: T) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-slate-950/50 p-1 text-sm font-medium">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-1.5 transition active:scale-[0.98]",
            value === id ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950" : "text-slate-400 hover:text-slate-100",
          )}
        >
          {Icon && <Icon className="h-4 w-4" />}
          {label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "bg-gradient-to-r from-indigo-500 to-cyan-400" : "bg-slate-700",
      )}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function Progress({ value, tone = "indigo" }: { value: number; tone?: "indigo" | "red" | "green" | "amber" }) {
  const bar = { indigo: "from-indigo-500 to-cyan-400", red: "from-red-500 to-orange-400", green: "from-emerald-500 to-cyan-400", amber: "from-amber-500 to-yellow-300" }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
      <div className={cn("h-full rounded-full bg-gradient-to-r", bar)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function StatTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "green" | "red" | "amber" }) {
  return (
    <Card className="p-5 hover:-translate-y-1 hover:shadow-2xl">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold tracking-tight text-slate-100", tone === "green" && "text-emerald-400", tone === "red" && "text-red-400", tone === "amber" && "text-amber-400")}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(null), 2600);
  }, []);
  const toast = msg ? (
    <div className="fixed bottom-6 right-6 z-[60] rounded-xl border border-emerald-500/30 bg-slate-900/95 px-4 py-3 text-sm text-slate-100 shadow-2xl backdrop-blur-md">
      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
      {msg}
    </div>
  ) : null;
  return { toast, show };
}

export const money = (n: number) => `Rs. ${n.toLocaleString()}`;
export const initials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("");
