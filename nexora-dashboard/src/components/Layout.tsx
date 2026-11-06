import type { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import type { PageId } from "../types";
import type { NexoraUser } from "../lib/api";

interface LayoutProps {
  page: PageId;
  onNavigate: (page: PageId) => void;
  children: ReactNode;
  user: NexoraUser;
}

export default function Layout({ page, onNavigate, children, user }: LayoutProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-obsidian">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/3 h-[480px] w-[480px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute right-0 top-1/2 h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>
      <Sidebar page={page} onNavigate={onNavigate} />
      <div className="relative z-10 pl-[76px] lg:pl-64">
        <Header user={user} />
        {children}
      </div>
    </div>
  );
}
