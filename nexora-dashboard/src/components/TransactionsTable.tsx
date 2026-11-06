import { Eye, MoreHorizontal, Package, RefreshCcw, Truck } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "../lib/utils";
import { transactions } from "../data/mock";
import type { TransactionStatus } from "../types";

const statusStyles: Record<TransactionStatus, string> = {
  Paid: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  Pending: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  Failed: "bg-red-500/10 text-red-400 ring-red-500/20",
};

export default function TransactionsTable() {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/50">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100">Recent Transactions</h3>
          <p className="text-sm text-slate-400">Orders captured across all channels</p>
        </div>
        <button className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-transform hover:brightness-110 active:scale-[0.98]">
          View all
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-y border-white/10 text-xs uppercase tracking-wider text-slate-500">
              {["Order", "Customer", "Channel", "Amount", "Status", "Date", ""].map((h, i) => (
                <th key={i} className="px-6 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map((t) => (
              <tr key={t.id} className="transition-colors hover:bg-slate-800/40">
                <td className="px-6 py-4 font-mono text-xs text-cyan-300">{t.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500/40 to-cyan-400/30 text-xs font-semibold text-slate-100">
                      {t.customer.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </span>
                    <span className="font-medium text-slate-100">{t.customer}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-400">{t.channel}</td>
                <td className="px-6 py-4 font-medium text-slate-100">Rs. {t.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", statusStyles[t.status])}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {t.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400">{t.date}</td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 active:scale-[0.98]">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" />View order</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2"><Truck className="h-4 w-4" />Track courier</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2"><Package className="h-4 w-4" />Update status</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-red-400"><RefreshCcw className="h-4 w-4" />Refund</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
