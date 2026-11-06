import { Facebook, Globe, Instagram, Mail, MessageCircle, type LucideIcon } from "lucide-react";
import type { Channel, Sentiment } from "../../types";

export const channelMeta: Record<Channel, { icon: LucideIcon; text: string; bg: string }> = {
  WhatsApp: { icon: MessageCircle, text: "text-emerald-400", bg: "bg-emerald-500/10" },
  Messenger: { icon: Facebook, text: "text-indigo-400", bg: "bg-indigo-500/10" },
  Instagram: { icon: Instagram, text: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
  Email: { icon: Mail, text: "text-cyan-400", bg: "bg-cyan-500/10" },
  "Web Chat": { icon: Globe, text: "text-amber-400", bg: "bg-amber-500/10" },
};

export const sentimentMeta: Record<Sentiment, { label: string; dot: string; badge: string }> = {
  positive: { label: "Positive", dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" },
  neutral: { label: "Neutral", dot: "bg-slate-400", badge: "bg-slate-500/10 text-slate-300 ring-slate-500/20" },
  negative: { label: "Negative", dot: "bg-red-500", badge: "bg-red-500/10 text-red-400 ring-red-500/20" },
};
