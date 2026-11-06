export interface Campaign {
  id: string;
  name: string;
  channel: "Email" | "SMS" | "Social";
  segment: string;
  status: "Running" | "Scheduled" | "Completed";
  sent: number;
  openRate: number;
  conversions: number;
  winner?: "A" | "B";
}

export const segmentsInfo = [
  { name: "New customers", count: 412, desc: "First purchase in the last 30 days" },
  { name: "Regular customers", count: 1284, desc: "3+ orders, active in 90 days" },
  { name: "High-value customers", count: 186, desc: "Top 10% by lifetime value" },
  { name: "Inactive customers", count: 539, desc: "No activity for 120+ days" },
  { name: "Product-specific", count: 268, desc: "Bought or asked about Samsung A55" },
  { name: "At-risk customers", count: 126, desc: "High churn probability" },
];

export const initialCampaigns: Campaign[] = [
  { id: "cp1", name: "Win-back: 15% off for at-risk", channel: "Email", segment: "At-risk customers", status: "Running", sent: 126, openRate: 48, conversions: 17, winner: "B" },
  { id: "cp2", name: "Samsung A55 stock update", channel: "SMS", segment: "Product-specific", status: "Completed", sent: 268, openRate: 91, conversions: 34, winner: "A" },
  { id: "cp3", name: "VIP early access", channel: "Email", segment: "High-value customers", status: "Completed", sent: 186, openRate: 62, conversions: 41 },
  { id: "cp4", name: "Welcome series", channel: "Social", segment: "New customers", status: "Scheduled", sent: 0, openRate: 0, conversions: 0 },
];

export const churnReasons: Record<string, string[]> = {
  CUS014: ["No purchase for 6 months", "Previously purchased frequently", "Low recent engagement"],
  CUS071: ["No purchase for 6 months", "Declining order value", "Ignored last 3 emails"],
  CUS052: ["No purchase for 4 months", "Unresolved late delivery", "Low recent engagement"],
};
