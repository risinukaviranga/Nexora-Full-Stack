import {
  LayoutDashboard, MessagesSquare, Bot, Users, Package, Wallet, Megaphone, Search, ShieldCheck,
} from "lucide-react";
import type { ActivityItem, ChannelSlice, NavItem, RevenuePoint, Transaction } from "../types";

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inbox", label: "Omnichannel Inbox", icon: MessagesSquare, badge: "12" },
  { id: "ai-agent", label: "AI Agent", icon: Bot },
  { id: "crm", label: "CRM", icon: Users },
  { id: "products", label: "Products & Inventory", icon: Package },
  { id: "orders", label: "Orders & Finance", icon: Wallet },
  { id: "marketing", label: "Marketing & Growth", icon: Megaphone },
  { id: "seo", label: "SEO / AEO / GEO", icon: Search },
  { id: "analytics", label: "Analytics & RBAC", icon: ShieldCheck },
];

export const revenueData: RevenuePoint[] = [
  { month: "Jan", revenue: 420000, profit: 130000 },
  { month: "Feb", revenue: 510000, profit: 164000 },
  { month: "Mar", revenue: 480000, profit: 152000 },
  { month: "Apr", revenue: 620000, profit: 210000 },
  { month: "May", revenue: 710000, profit: 248000 },
  { month: "Jun", revenue: 680000, profit: 231000 },
  { month: "Jul", revenue: 830000, profit: 301000 },
  { month: "Aug", revenue: 905000, profit: 336000 },
  { month: "Sep", revenue: 980000, profit: 372000 },
  { month: "Oct", revenue: 1120000, profit: 428000 },
];

export const channelData: ChannelSlice[] = [
  { name: "WhatsApp", value: 42, color: "#10b981" },
  { name: "Messenger", value: 21, color: "#6366f1" },
  { name: "Instagram", value: 17, color: "#e879f9" },
  { name: "Email", value: 11, color: "#22d3ee" },
  { name: "Web Chat", value: 9, color: "#f59e0b" },
];

export const transactions: Transaction[] = [
  { id: "ORD1025", customer: "Kamal Perera", channel: "WhatsApp", amount: 50000, status: "Paid", date: "02 Nov 2026" },
  { id: "ORD1024", customer: "Nimali Fernando", channel: "Instagram", amount: 18500, status: "Pending", date: "02 Nov 2026" },
  { id: "ORD1023", customer: "Ruwan Silva", channel: "Email", amount: 72300, status: "Paid", date: "01 Nov 2026" },
  { id: "ORD1022", customer: "Shanika Jayasuriya", channel: "Messenger", amount: 9400, status: "Failed", date: "01 Nov 2026" },
  { id: "ORD1021", customer: "Dilan Wickramasinghe", channel: "Web Chat", amount: 31200, status: "Paid", date: "31 Oct 2026" },
  { id: "ORD1020", customer: "Tharindu Gamage", channel: "WhatsApp", amount: 64800, status: "Pending", date: "31 Oct 2026" },
];

export const activityFeed: ActivityItem[] = [
  { id: "1", text: "AI resolved “Is the Samsung A55 available?” via WhatsApp", time: "now", tone: "positive" },
  { id: "2", text: "Negative sentiment detected on ORD1019 — escalated to human agent", time: "2m", tone: "alert" },
  { id: "3", text: "Low-stock alert: Samsung A55 reached threshold (18 left)", time: "6m", tone: "info" },
  { id: "4", text: "Identity merged: WhatsApp + Instagram → CUS001", time: "14m", tone: "info" },
  { id: "5", text: "Churn campaign sent to 126 at-risk customers", time: "31m", tone: "positive" },
];
