import { useEffect, useRef } from "react";
import { Bot, Database, Send, ShieldAlert, Sparkles, UserRound } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ChatMessage, Conversation } from "../../types";
import { suggestedPrompts } from "../../data/chat";
import { channelMeta } from "./channelMeta";

interface ChatWindowProps {
  conversation: Conversation;
  typing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (text: string) => void;
  onTakeOver: () => void;
  onHandBack: () => void;
}

function Bubble({ message }: { message: ChatMessage }) {
  if (message.sender === "system") {
    return (
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
          <ShieldAlert className="h-3 w-3" />
          {message.text}
        </span>
      </div>
    );
  }

  const isCustomer = message.sender === "customer";
  const isAi = message.sender === "ai";

  return (
    <div className={cn("flex", isCustomer ? "justify-start" : "justify-end")}>
      <div className={cn("max-w-[78%] space-y-1.5", !isCustomer && "items-end")}>
        {!isCustomer && (
          <p className={cn("flex items-center gap-1.5 text-[11px] font-medium", isAi ? "justify-end text-cyan-300" : "justify-end text-emerald-300")}>
            {isAi ? <Bot className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
            {isAi ? "Nexora AI Agent" : "You (Human agent)"}
          </p>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isCustomer && "rounded-tl-sm border border-white/10 bg-slate-800/70 text-slate-100",
            isAi && "rounded-tr-sm border border-indigo-400/20 bg-gradient-to-br from-indigo-500/25 to-cyan-400/15 text-slate-100",
            message.sender === "agent" && "rounded-tr-sm border border-emerald-400/20 bg-emerald-500/15 text-slate-100",
          )}
        >
          {message.text}
        </div>
        {isAi && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {message.sources.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-900/70 px-2 py-0.5 text-[10px] text-slate-400">
                <Database className="h-2.5 w-2.5 text-cyan-400" />
                {s}
              </span>
            ))}
          </div>
        )}
        <p className={cn("text-[10px] text-slate-500", !isCustomer && "text-right")}>{message.time}</p>
      </div>
    </div>
  );
}

export default function ChatWindow({
  conversation, typing, draft, onDraftChange, onSend, onTakeOver, onHandBack,
}: ChatWindowProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const ch = channelMeta[conversation.channel];
  const isAi = conversation.mode === "ai";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation.id, conversation.messages.length, typing]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
  };

  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500/40 to-cyan-400/30 text-sm font-semibold text-slate-100">
            {conversation.customer.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-100">{conversation.customer.name}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <ch.icon className={cn("h-3 w-3", ch.text)} />
              {conversation.channel}
              <span className="text-slate-600">•</span>
              {conversation.customer.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
              isAi ? "bg-cyan-500/10 text-cyan-300 ring-cyan-500/20" : "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
            )}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            {isAi ? "AI is handling" : "Human agent active"}
          </span>
          <button
            onClick={isAi ? onTakeOver : onHandBack}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-transform active:scale-[0.98]",
              isAi
                ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 shadow-[0_0_18px_rgba(99,102,241,0.35)] hover:brightness-110"
                : "border border-white/10 bg-slate-800/70 text-slate-200 hover:border-indigo-500/50",
            )}
          >
            {isAi ? "Take over" : "Hand back to AI"}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent px-5 py-5">
        {conversation.messages.map((msg) => <Bubble key={msg.id} message={msg} />)}

        {typing && (
          <div className="flex justify-end">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tr-sm border border-indigo-400/20 bg-indigo-500/15 px-4 py-3">
              <span className="mr-1 text-[11px] text-cyan-300">AI is retrieving data</span>
              {[0, 150, 300].map((d) => (
                <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="space-y-3 border-t border-white/10 p-4">
        {isAi && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <Sparkles className="h-3 w-3 text-indigo-400" /> Simulate customer:
            </span>
            {suggestedPrompts.map((p) => (
              <button
                key={p}
                onClick={() => onSend(p)}
                className="rounded-full border border-white/10 bg-slate-800/50 px-3 py-1 text-xs text-slate-300 transition hover:border-indigo-500/50 hover:text-slate-100 active:scale-[0.98]"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={isAi ? "Type as the customer to test the AI agent…" : `Reply to ${conversation.customer.name} on ${conversation.channel}…`}
            className="h-11 flex-1 rounded-xl border border-white/10 bg-slate-950/50 px-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 shadow-[0_0_18px_rgba(99,102,241,0.35)] transition-transform hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
