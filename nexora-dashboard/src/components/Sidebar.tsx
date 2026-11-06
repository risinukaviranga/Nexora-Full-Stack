import { useState } from "react";
import { ChevronsLeft, ChevronsRight, LogOut, Settings } from "lucide-react";
import { cn } from "../lib/utils";
import { navItems } from "../data/mock";
import type { PageId } from "../types";

const AVAILABLE: PageId[] = ["dashboard", "inbox", "ai-agent", "crm", "products", "orders", "marketing", "seo", "analytics"];

interface SidebarProps {
  page: PageId;
  onNavigate: (page: PageId) => void;
}

export default function Sidebar({ page, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-ink/90 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-[0_0_24px_rgba(99,102,241,0.55)]">
          <span className="text-lg font-bold text-slate-950">N</span>
          <span className="absolute -inset-px rounded-xl ring-1 ring-white/30" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-base font-semibold tracking-tight text-slate-100">Nexora</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Business Automation</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(({ id, label, icon: Icon, badge }) => {
          const active = page === id;
          const available = AVAILABLE.includes(id);
          return (
          <button
            key={id}
            onClick={() => available && onNavigate(id)}
            title={collapsed ? label : available ? undefined : `${label} (coming soon)`}
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
              active
                ? "bg-gradient-to-r from-indigo-500/20 to-cyan-400/10 text-slate-100 ring-1 ring-indigo-500/30"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100",
              !available && "cursor-not-allowed opacity-50",
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-400 to-cyan-300" />
            )}
            <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-cyan-300")} />
            {!collapsed && <span className="flex-1 truncate text-left">{label}</span>}
            {!collapsed && badge && (
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                {badge}
              </span>
            )}
          </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="mx-3 mb-2 flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-xs text-slate-400 transition hover:border-indigo-500/50 hover:text-slate-100 active:scale-[0.98]"
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Collapse</>}
      </button>

      {/* Profile */}
      <div className="flex items-center gap-3 border-t border-white/10 p-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-xs font-bold text-slate-950">
          BO
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-100">Business Owner</p>
              <p className="truncate text-xs text-slate-500">Tenant · SHOP001</p>
            </div>
            <Settings className="h-4 w-4 text-slate-500 transition hover:text-slate-200" />
            <LogOut className="h-4 w-4 text-slate-500 transition hover:text-rose-400" />
          </>
        )}
      </div>
    </aside>
  );
}
