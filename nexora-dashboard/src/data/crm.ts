import type { Customer } from "../types";

export const initialCustomers: Customer[] = [
  { id: "CUS001", name: "Kamal Perera", segment: "High-value", value: 285000, orders: 14, phone: "+94 77 123 4567", email: "kamal@gmail.com", instagram: "@kamal123", lastActive: "Today", churnRisk: 8, channels: ["WhatsApp", "Instagram", "Email"] },
  { id: "CUS014", name: "Shanika Jayasuriya", segment: "At-risk", value: 42000, orders: 3, phone: "+94 71 555 0198", email: "shanika.j@mail.com", lastActive: "6 months ago", churnRisk: 86, channels: ["Messenger", "Email"] },
  { id: "CUS022", name: "Nimali Fernando", segment: "New", value: 18500, orders: 1, instagram: "@nimali.f", lastActive: "Today", churnRisk: 35, channels: ["Instagram"] },
  { id: "CUS031", name: "Ruwan Silva", segment: "Regular", value: 156000, orders: 7, email: "ruwan.silva@company.lk", lastActive: "Yesterday", churnRisk: 15, channels: ["Email"] },
  { id: "CUS040", name: "Dilan Wickramasinghe", segment: "Regular", value: 93000, orders: 5, phone: "+94 76 222 8841", lastActive: "3 days ago", churnRisk: 22, channels: ["Web Chat", "WhatsApp"] },
  { id: "CUS052", name: "Tharindu Gamage", segment: "Inactive", value: 64800, orders: 4, phone: "+94 70 981 2230", lastActive: "4 months ago", churnRisk: 71, channels: ["WhatsApp"] },
  { id: "CUS063", name: "Amaya Rathnayake", segment: "New", value: 50000, orders: 1, instagram: "@amaya.r", lastActive: "Today", churnRisk: 30, channels: ["Instagram"] },
  { id: "CUS071", name: "Chamod Dias", segment: "At-risk", value: 119000, orders: 9, email: "chamod.dias@mail.com", lastActive: "6 months ago", churnRisk: 92, channels: ["Email"] },
];

export interface MergeSuggestion {
  id: string;
  customerId: string;
  identities: { type: "WhatsApp" | "Email" | "Instagram"; value: string }[];
  confidence: number;
}

export const initialMerges: MergeSuggestion[] = [
  { id: "m1", customerId: "CUS022", confidence: 94, identities: [{ type: "WhatsApp", value: "+94 75 440 1187" }, { type: "Email", value: "nimali.fernando@gmail.com" }] },
  { id: "m2", customerId: "CUS063", confidence: 88, identities: [{ type: "WhatsApp", value: "+94 72 318 6620" }] },
];

export const timeline = [
  { key: "Conversation", text: "Asked about product availability on WhatsApp", when: "10 days ago" },
  { key: "Product inquiry", text: "Viewed and enquired about Samsung A55", when: "10 days ago" },
  { key: "Order", text: "Order placed and confirmed", when: "9 days ago" },
  { key: "Payment", text: "Payment received", when: "9 days ago" },
  { key: "Courier", text: "Shipped via DHL", when: "8 days ago" },
  { key: "Delivery", text: "Delivered to customer", when: "6 days ago" },
  { key: "Feedback", text: "Left a positive review", when: "5 days ago" },
] as const;
