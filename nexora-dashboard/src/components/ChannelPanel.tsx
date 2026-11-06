import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import { activityFeed, channelData } from "../data/mock";
import { cn } from "../lib/utils";

const toneStyles = {
  positive: { dot: "bg-emerald-400", ping: "bg-emerald-400" },
  alert: { dot: "bg-red-500", ping: "bg-red-500" },
  info: { dot: "bg-cyan-400", ping: "bg-cyan-400" },
} as const;

export default function ChannelPanel() {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [tab, setTab] = useState<"channels" | "activity">("channels");
  const active = channelData[activeIdx];

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/50">
      <div className="mb-5 flex rounded-xl border border-white/10 bg-slate-950/50 p-1 text-xs font-medium">
        {(["channels", "activity"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 transition active:scale-[0.98]",
              tab === t ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950" : "text-slate-400 hover:text-slate-100",
            )}
          >
            {t === "channels" ? "Channel mix" : "Live AI activity"}
          </button>
        ))}
      </div>

      {tab === "channels" ? (
        <>
          <div className="relative h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  dataKey="value"
                  innerRadius={62}
                  outerRadius={84}
                  paddingAngle={3}
                  stroke="none"
                  activeIndex={activeIdx}
                  activeShape={(props: any) => <Sector {...props} outerRadius={props.outerRadius + 5} />}
                  onMouseEnter={(_: unknown, i: number) => setActiveIdx(i)}
                >
                  {channelData.map((c) => <Cell key={c.name} fill={c.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-3xl font-semibold text-slate-100">{active.value}%</p>
                <p className="text-xs text-slate-400">{active.name}</p>
              </div>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {channelData.map((c, i) => (
              <li
                key={c.name}
                onMouseEnter={() => setActiveIdx(i)}
                className="flex cursor-default items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition hover:bg-slate-800/40"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="flex-1 text-slate-300">{c.name}</span>
                <span className="font-medium text-slate-100">{c.value}%</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="space-y-4">
          {activityFeed.map((a) => (
            <li key={a.id} className="flex gap-3">
              <span className="relative mt-1.5 flex h-2.5 w-2.5 shrink-0">
                <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", toneStyles[a.tone].ping)} />
                <span className={cn("relative inline-flex h-2.5 w-2.5 animate-pulse rounded-full", toneStyles[a.tone].dot)} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-slate-300">{a.text}</p>
                <p className="mt-0.5 text-xs text-slate-500">{a.time}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
