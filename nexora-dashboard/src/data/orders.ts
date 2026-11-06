import type { Order, OrderStatus } from "../types";

export const statusFlow: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED",
];

export const statusLabel = (s: OrderStatus) =>
  s.split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ");

export const initialOrders: Order[] = [
  { id: "ORD1025", customer: "Kamal Perera", productName: "Samsung A55", qty: 1, price: 50000, fee: 1000, cogs: 30000, status: "SHIPPED", courier: "DHL", tracking: "DHL-48213907", eta: "Tomorrow", date: "02 Nov", channel: "WhatsApp" },
  { id: "ORD1024", customer: "Nimali Fernando", productName: "JBL Flip 6", qty: 1, price: 28500, fee: 570, cogs: 19000, status: "PENDING", courier: "—", tracking: "—", eta: "—", date: "02 Nov", channel: "Instagram" },
  { id: "ORD1023", customer: "Ruwan Silva", productName: "iPhone 15", qty: 1, price: 245000, fee: 4900, cogs: 210000, status: "DELIVERED", courier: "FedEx", tracking: "FDX-77120345", eta: "Delivered", date: "01 Nov", channel: "Email" },
  { id: "ORD1022", customer: "Shanika Jayasuriya", productName: "Sony WH-CH720N", qty: 1, price: 38500, fee: 770, cogs: 27000, status: "CANCELLED", courier: "—", tracking: "—", eta: "—", date: "01 Nov", channel: "Messenger" },
  { id: "ORD1021", customer: "Dilan Wickramasinghe", productName: "Redmi Note 13", qty: 1, price: 62000, fee: 1240, cogs: 48000, status: "OUT_FOR_DELIVERY", courier: "Pronto", tracking: "PRN-5502981", eta: "Today", date: "31 Oct", channel: "Web Chat" },
  { id: "ORD1020", customer: "Tharindu Gamage", productName: "Anker 20K Power Bank", qty: 2, price: 25800, fee: 516, cogs: 16400, status: "PROCESSING", courier: "—", tracking: "—", eta: "—", date: "31 Oct", channel: "WhatsApp" },
  { id: "ORD1019", customer: "Amaya Rathnayake", productName: "Samsung A55", qty: 1, price: 50000, fee: 1000, cogs: 30000, status: "CONFIRMED", courier: "—", tracking: "—", eta: "—", date: "30 Oct", channel: "Instagram" },
  { id: "ORD1018", customer: "Kamal Perera", productName: "JBL Flip 6", qty: 1, price: 28500, fee: 570, cogs: 19000, status: "DELIVERED", courier: "DHL", tracking: "DHL-48199120", eta: "Delivered", date: "28 Oct", channel: "WhatsApp" },
];

export const cashflow = [
  { month: "Aug", actual: 210000, forecast: null as number | null },
  { month: "Sep", actual: 248000, forecast: null },
  { month: "Oct", actual: 301000, forecast: 301000 },
  { month: "Nov", actual: null as number | null, forecast: 336000 },
  { month: "Dec", actual: null, forecast: 392000 },
  { month: "Jan", actual: null, forecast: 371000 },
];
