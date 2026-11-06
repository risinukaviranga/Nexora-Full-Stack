import { useMemo, useState } from "react";
import { Bot, Search, UserRound } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Conversation } from "../../types";
import { channelMeta, sentimentMeta } from "./channelMeta";

type Filter = "all" | "ai" | "human";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
}

const initials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("");

export default function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () =>
      conversations.filter((c) => {
        const matchesFilter = filter === "all" || c.mode === filter;
        const matchesQuery = c.customer.name.toLowerCase().includes(query.toLowerCase());
        return matchesFilter && matchesQuery;
      }),
    [conversations, filter, query],
  );

  return (
    <aside className="hidden min-h-0 flex-col rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md md:flex">
      <div className="space-y-3 border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">Inbox</h2>
          <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-300">
            {conversations.length} chats
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers…"
            className="h-9 w-full rounded-lg border border-white/10 bg-slate-950/50 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-500/60"
          />
        </div>

        <div className="flex rounded-lg border border-white/10 bg-slate-950/50 p-1 text-xs font-medium">
          {(["all", "ai", "human"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 rounded-md px-2 py-1 transition active:scale-[0.98]",
                filter === f ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950" : "text-slate-400 hover:text-slate-100",
              )}
            >
              {f === "all" ? "All" : f === "ai" ? "AI handled" : "Human"}
            </button>
          ))}
        </div>
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto">
        {visible.length === 0 && <li className="p-6 text-center text-sm text-slate-500">No conversations found</li>}
        {visible.map((c) => {
          const ch = channelMeta[c.channel];
          const last = c.messages[c.messages.length - 1];
          const isActive = c.id === activeId;
          return (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c.id)}
                className={cn(
                  "flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-800/40",
                  isActive && "bg-gradient-to-r from-indigo-500/15 to-transparent shadow-[inset_2px_0_0_0_#818cf8]",
                )}
              >
                <div className="relative shrink-0">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500/40 to-cyan-400/30 text-sm font-semibold text-slate-100">
                    {initials(c.customer.name)}
                  </span>
                  <span className={cn("absolute -bottom-0.5 -right-0.5 grid h-[18px] w-[18px] place-items-center rounded-full ring-2 ring-slate-900", ch.bg)}>
                    <ch.icon className={cn("h-2.5 w-2.5", ch.text)} />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-100">{c.customer.name}</p>
                    <span className="shrink-0 text-[11px] text-slate-500">{c.lastTime}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{last?.text}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", sentimentMeta[c.sentiment].dot)} />
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                      {c.mode === "ai" ? <Bot className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
                      {c.mode === "ai" ? "AI agent" : "Human agent"}
                    </span>
                    {c.unread > 0 && (
                      <span className="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-1 text-[10px] font-bold text-slate-950">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
