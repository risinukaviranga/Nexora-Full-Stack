import type { ChatMessage, Conversation } from "../types";

export const suggestedPrompts: string[] = [
  "Is the Samsung A55 available?",
  "Where is my order?",
  "How long does delivery take?",
  "I'm very disappointed. My order is late.",
];

export interface AiReply {
  text: string;
  sources: string[];
  escalate: boolean;
}

/**
 * Mock RAG responder. Replace with a call to your FastAPI AI-agent endpoint
 * (query understanding -> pgvector retrieval -> LLM response).
 */
export function generateAiReply(input: string): AiReply {
  const t = input.toLowerCase();

  if (/(refund|complain|disappoint|angry|manager|terrible|worst|\blate\b|\bdelay)/.test(t)) {
    return {
      text: "I'm really sorry about this experience. This needs a personal touch, so I'm connecting you with a human agent who will pick up right away.",
      sources: ["Sentiment: Negative"],
      escalate: true,
    };
  }
  if (/(a55|samsung|available|in stock|stock)/.test(t)) {
    return {
      text: "Yes, the Samsung A55 is in stock — 18 units available at Rs. 50,000. Would you like me to place an order for you?",
      sources: ["Product: Samsung A55", "Inventory: 18 units"],
      escalate: false,
    };
  }
  if (/(where|track|status|ord\d+|my order)/.test(t)) {
    return {
      text: "Your order #ORD1025 has shipped with DHL (tracking DHL-48213907). It is out on the way and the estimated delivery is tomorrow.",
      sources: ["Order: ORD1025", "Courier API: DHL"],
      escalate: false,
    };
  }
  if (/(deliver|shipping|ship|how long)/.test(t)) {
    return {
      text: "Delivery normally takes 2–3 business days island-wide. Orders over Rs. 25,000 ship free of charge.",
      sources: ["Policy: Shipping & Delivery"],
      escalate: false,
    };
  }
  return {
    text: "I can help with product availability, order tracking and delivery questions. Could you tell me a little more about what you need?",
    sources: [],
    escalate: false,
  };
}

const m = (id: string, sender: ChatMessage["sender"], text: string, time: string, sources?: string[]): ChatMessage => ({
  id, sender, text, time, sources,
});

export const initialConversations: Conversation[] = [
  {
    id: "c1",
    customer: {
      id: "CUS001", name: "Kamal Perera", segment: "High-value", value: 285000,
      phone: "+94 77 123 4567", email: "kamal@gmail.com", instagram: "@kamal123",
      orders: ["ORD1025", "ORD015", "ORD001"],
    },
    channel: "WhatsApp", sentiment: "positive", mode: "ai", unread: 0, lastTime: "10:42",
    messages: [
      m("1", "customer", "Is the Samsung A55 available?", "10:41"),
      m("2", "ai", "Yes, the Samsung A55 is in stock — 18 units available at Rs. 50,000. Would you like me to place an order for you?", "10:41", ["Product: Samsung A55", "Inventory: 18 units"]),
      m("3", "customer", "Great. Where is my previous order?", "10:42"),
      m("4", "ai", "Your order #ORD1025 has shipped with DHL (tracking DHL-48213907). It is out on the way and the estimated delivery is tomorrow.", "10:42", ["Order: ORD1025", "Courier API: DHL"]),
    ],
  },
  {
    id: "c2",
    customer: {
      id: "CUS014", name: "Shanika Jayasuriya", segment: "At-risk", value: 42000,
      phone: "+94 71 555 0198", email: "shanika.j@mail.com",
      orders: ["ORD1022"],
    },
    channel: "Messenger", sentiment: "negative", mode: "human", unread: 2, lastTime: "10:38",
    messages: [
      m("1", "customer", "I'm very disappointed. My order is late.", "10:37"),
      m("2", "ai", "I'm really sorry about this experience. This needs a personal touch, so I'm connecting you with a human agent who will pick up right away.", "10:37", ["Sentiment: Negative"]),
      m("3", "system", "AI escalated this conversation to a human agent", "10:37"),
      m("4", "customer", "Payment failed twice and nobody replied to me.", "10:38"),
    ],
  },
  {
    id: "c3",
    customer: {
      id: "CUS022", name: "Nimali Fernando", segment: "New customer", value: 18500,
      instagram: "@nimali.f", orders: ["ORD1024"],
    },
    channel: "Instagram", sentiment: "neutral", mode: "ai", unread: 1, lastTime: "10:21",
    messages: [
      m("1", "customer", "How long does delivery take?", "10:21"),
    ],
  },
  {
    id: "c4",
    customer: {
      id: "CUS031", name: "Ruwan Silva", segment: "Regular", value: 156000,
      email: "ruwan.silva@company.lk", orders: ["ORD1023", "ORD0980"],
    },
    channel: "Email", sentiment: "positive", mode: "ai", unread: 0, lastTime: "09:58",
    messages: [
      m("1", "customer", "Thanks, the package arrived today. Very happy with the service!", "09:57"),
      m("2", "ai", "That's wonderful to hear, Ruwan! Thank you for shopping with us. Let us know if you need anything else.", "09:58"),
    ],
  },
  {
    id: "c5",
    customer: {
      id: "CUS040", name: "Dilan Wickramasinghe", segment: "Regular", value: 93000,
      phone: "+94 76 222 8841", orders: ["ORD1021"],
    },
    channel: "Web Chat", sentiment: "neutral", mode: "ai", unread: 0, lastTime: "Yesterday",
    messages: [
      m("1", "customer", "Do you offer free shipping?", "Yesterday"),
      m("2", "ai", "Delivery normally takes 2–3 business days island-wide. Orders over Rs. 25,000 ship free of charge.", "Yesterday", ["Policy: Shipping & Delivery"]),
    ],
  },
];
