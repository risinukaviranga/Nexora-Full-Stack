import { useState } from "react";
import { generateAiReply, initialConversations } from "../data/chat";
import type { ChatMessage, Conversation } from "../types";
import ConversationList from "./chat/ConversationList";
import ChatWindow from "./chat/ChatWindow";
import CustomerPanel from "./chat/CustomerPanel";

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const uid = () => Math.random().toString(36).slice(2, 10);

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string>(initialConversations[0].id);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];

  const update = (id: string, fn: (c: Conversation) => Conversation) =>
    setConversations((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));

  const append = (id: string, ...msgs: ChatMessage[]) =>
    update(id, (c) => ({ ...c, messages: [...c.messages, ...msgs], lastTime: msgs[msgs.length - 1].time }));

  const select = (id: string) => {
    setActiveId(id);
    setDraft("");
    update(id, (c) => ({ ...c, unread: 0 }));
  };

  const handleSend = (text: string) => {
    const id = active.id;
    setDraft("");

    // Human mode: the composer sends as the human agent
    if (active.mode === "human") {
      append(id, { id: uid(), sender: "agent", text, time: now() });
      return;
    }

    // AI mode: the composer simulates a customer message and the AI answers
    append(id, { id: uid(), sender: "customer", text, time: now() });
    setTypingId(id);
    const reply = generateAiReply(text);

    window.setTimeout(() => {
      setTypingId(null);
      const aiMsg: ChatMessage = { id: uid(), sender: "ai", text: reply.text, time: now(), sources: reply.sources };
      if (reply.escalate) {
        const sys: ChatMessage = {
          id: uid(), sender: "system", time: now(),
          text: "AI escalated this conversation to a human agent",
        };
        update(id, (c) => ({
          ...c, mode: "human", sentiment: "negative",
          messages: [...c.messages, aiMsg, sys], lastTime: sys.time,
        }));
      } else {
        append(id, aiMsg);
      }
    }, 1100);
  };

  const takeOver = () => {
    update(active.id, (c) => ({ ...c, mode: "human" }));
    append(active.id, { id: uid(), sender: "system", text: "You took over this conversation", time: now() });
  };

  const handBack = () => {
    update(active.id, (c) => ({ ...c, mode: "ai" }));
    append(active.id, { id: uid(), sender: "system", text: "Conversation handed back to the AI agent", time: now() });
  };

  return (
    <main className="h-[calc(100vh-4rem)] p-4">
      <div className="grid h-full gap-4 md:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        <ConversationList conversations={conversations} activeId={active.id} onSelect={select} />
        <ChatWindow
          conversation={active}
          typing={typingId === active.id}
          draft={draft}
          onDraftChange={setDraft}
          onSend={handleSend}
          onTakeOver={takeOver}
          onHandBack={handBack}
        />
        <CustomerPanel conversation={active} />
      </div>
    </main>
  );
}
