import type { LucideIcon } from "lucide-react";

export type TransactionStatus = "Paid" | "Pending" | "Failed";
export type Channel = "WhatsApp" | "Messenger" | "Instagram" | "Email" | "Web Chat";

export type PageId =
  | "dashboard" | "inbox" | "ai-agent" | "crm" | "products"
  | "orders" | "marketing" | "seo" | "analytics";

export interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export interface RevenuePoint {
  month: string;
  revenue: number;
  profit: number;
}

export interface ChannelSlice {
  name: Channel;
  value: number;
  color: string;
}

export interface Transaction {
  id: string;
  customer: string;
  channel: Channel;
  amount: number;
  status: TransactionStatus;
  date: string;
}

export interface ActivityItem {
  id: string;
  text: string;
  time: string;
  tone: "positive" | "alert" | "info";
}

export interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: LucideIcon;
  hero?: boolean;
  hint?: string;
}

export type Sender = "customer" | "ai" | "agent" | "system";
export type Sentiment = "positive" | "neutral" | "negative";
export type HandlerMode = "ai" | "human";

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  time: string;
  sources?: string[];
}

export interface CustomerProfile {
  id: string;
  name: string;
  segment: string;
  value: number;
  phone?: string;
  email?: string;
  instagram?: string;
  orders: string[];
}

export interface Conversation {
  id: string;
  customer: CustomerProfile;
  channel: Channel;
  sentiment: Sentiment;
  mode: HandlerMode;
  unread: number;
  lastTime: string;
  messages: ChatMessage[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  description: string;
  features: string[];
}

export type OrderStatus =
  | "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED"
  | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

export type Courier = "DHL" | "FedEx" | "Pronto" | "—";

export interface Order {
  id: string;
  customer: string;
  productName: string;
  qty: number;
  price: number;
  fee: number;
  cogs: number;
  status: OrderStatus;
  courier: Courier;
  tracking: string;
  eta: string;
  date: string;
  channel: Channel;
}

export type CustomerSegment = "New" | "Regular" | "High-value" | "Inactive" | "At-risk";

export interface Customer {
  id: string;
  name: string;
  segment: CustomerSegment;
  value: number;
  orders: number;
  phone?: string;
  email?: string;
  instagram?: string;
  lastActive: string;
  churnRisk: number;
  channels: Channel[];
}
