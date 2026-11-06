import { useEffect, useState } from "react";
import { Bell, Search, Sun, Moon, LogOut, Wifi, WifiOff } from "lucide-react";
import { checkApiHealth, logout, NexoraUser } from "../lib/api";

export default function Header({ user }: { user: NexoraUser }) {
  const [theme, setTheme] = useState<"dark" | "light">(() => (localStorage.getItem("nexora_theme") as "dark" | "light") || "dark");
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("nexora_theme", theme);
  }, [theme]);

  useEffect(() => {
    let active = true;
    const check = async () => { const ok = await checkApiHealth(); if (active) setApiOnline(ok); };
    check();
    const id = window.setInterval(check, 15000);
    return () => { active = false; window.clearInterval(id); };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-obsidian/70 px-6 backdrop-blur-xl">
      <div className="group relative w-full max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input placeholder="Search customers, orders, products…" className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/60 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/60" />
      </div>
      <div className="flex items-center gap-2">
        <span className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs sm:inline-flex ${apiOnline ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>
          {apiOnline ? <Wifi size={13}/> : <WifiOff size={13}/>}
          API {apiOnline ? "Connected" : "Offline"}
        </span>
        <span className="hidden text-xs text-slate-400 lg:inline">{user.name}</span>
        <button title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 hover:text-indigo-500">
          {theme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}
        </button>
        <button title="Sign out" onClick={logout} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 hover:text-rose-500"><LogOut size={17}/></button>
        <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-300">
          <Bell size={18}/><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500"/>
        </button>
      </div>
    </header>
  );
}
