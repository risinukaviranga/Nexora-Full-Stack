export const salesByProduct = [
  { name: "Samsung A55", sales: 86 },
  { name: "Redmi Note 13", sales: 64 },
  { name: "JBL Flip 6", sales: 48 },
  { name: "iPhone 15", sales: 31 },
  { name: "Anker 20K", sales: 27 },
  { name: "Sony CH720N", sales: 19 },
];

export const customerGrowth = [
  { month: "Jun", newCustomers: 180, returning: 420 },
  { month: "Jul", newCustomers: 214, returning: 468 },
  { month: "Aug", newCustomers: 260, returning: 540 },
  { month: "Sep", newCustomers: 305, returning: 612 },
  { month: "Oct", newCustomers: 412, returning: 704 },
];

export const deliveryPerformance = [
  { name: "On time", value: 91, color: "#10b981" },
  { name: "Delayed", value: 7, color: "#f59e0b" },
  { name: "Failed", value: 2, color: "#ef4444" },
];

export const sentimentSplit = [
  { name: "Positive", value: 58, color: "#10b981" },
  { name: "Neutral", value: 31, color: "#64748b" },
  { name: "Negative", value: 11, color: "#ef4444" },
];

export const sentimentTrend = [
  { day: "Mon", positive: 52, negative: 9 },
  { day: "Tue", positive: 55, negative: 12 },
  { day: "Wed", positive: 57, negative: 10 },
  { day: "Thu", positive: 54, negative: 14 },
  { day: "Fri", positive: 60, negative: 9 },
  { day: "Sat", positive: 62, negative: 8 },
  { day: "Sun", positive: 58, negative: 11 },
];

export const flaggedConversations = [
  { id: "f1", customer: "Shanika Jayasuriya", channel: "Messenger", text: "I'm very disappointed. My order is late.", score: -0.82 },
  { id: "f2", customer: "Tharindu Gamage", channel: "WhatsApp", text: "Nobody replied to my refund request for days.", score: -0.74 },
  { id: "f3", customer: "Chamod Dias", channel: "Email", text: "The last parcel arrived damaged, not happy.", score: -0.69 },
];

export const fraudTransactions = [
  { id: "TXN-9041", customer: "Kamal Perera", amount: 50000, signals: "Known device, usual location", risk: 8 },
  { id: "TXN-9042", customer: "Unknown (new)", amount: 245000, signals: "New account, high value, 3 failed cards", risk: 91 },
  { id: "TXN-9043", customer: "Nimali Fernando", amount: 28500, signals: "First order, normal basket", risk: 27 },
  { id: "TXN-9044", customer: "Unknown (new)", amount: 98000, signals: "Mismatched billing & shipping country", risk: 74 },
  { id: "TXN-9045", customer: "Ruwan Silva", amount: 62000, signals: "Repeat customer, usual card", risk: 12 },
  { id: "TXN-9046", customer: "Guest checkout", amount: 38500, signals: "Rapid repeat attempts from same IP", risk: 58 },
];

export const modules = [
  "Omnichannel Inbox", "AI Agent", "CRM", "Products & Inventory", "Orders & Finance",
  "Marketing & Growth", "SEO / AEO / GEO", "Analytics", "System Administration",
] as const;
export type ModuleName = (typeof modules)[number];

export const roleNames = ["Business Owner", "Admin", "Support Agent", "Finance Staff", "Marketing Staff"] as const;
export type RoleName = (typeof roleNames)[number];

export const initialPermissions: Record<RoleName, ModuleName[]> = {
  "Business Owner": [...modules],
  Admin: ["Omnichannel Inbox", "AI Agent", "CRM", "Products & Inventory", "Analytics", "System Administration"],
  "Support Agent": ["Omnichannel Inbox", "CRM"],
  "Finance Staff": ["Orders & Finance", "Analytics"],
  "Marketing Staff": ["Marketing & Growth", "SEO / AEO / GEO", "Analytics"],
};
