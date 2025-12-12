"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Thread = {
  conversationId: string;
  peer?: { id: string; name: string; email: string } | null;
  last?: { text?: string | null; createdAt?: string | null } | null;
};
type Message = { id: string; conversationId: string; senderId: string; text: string; createdAt?: string };

export default function MessagingPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const [myId, setMyId] = useState<string | null>(null);

  // Load single assigned thread for student
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // who am I
        try {
          const s = await fetch("/api/auth/session", { cache: "no-store" });
          const sj = await s.json();
          if (sj?.user?.id) setMyId(sj.user.id);
        } catch {}

        const res = await fetch("/api/chat/threads", { cache: "no-store" });
        const data = await res.json();
        const items: Thread[] = Array.isArray(data.items) ? data.items : [];
        setThreads(items);
        if (items[0]?.conversationId) setConversationId(items[0].conversationId);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load messages for selected conversation
  useEffect(() => {
    if (!conversationId) return;
    const load = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      const data = await res.json();
      setMessages(Array.isArray(data.items) ? data.items : []);
      // Scroll to bottom
      setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };
    load();
    const id = setInterval(load, 15000); // 15s instead of 5s
    return () => clearInterval(id);
  }, [conversationId]);

  const title = useMemo(() => {
    const t = threads.find((x) => x.conversationId === conversationId) || threads[0];
    return t?.peer?.name || "Counsellor";
  }, [threads, conversationId]);

  const onSend = async () => {
    if (!conversationId || !input.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, text: input }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((m) => [...m, data.message]);
        setInput("");
        setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-3xl">
      <h1 className="text-xl font-bold mb-4">Messaging</h1>
      {loading ? (
        <p>Loading…</p>
      ) : threads.length === 0 ? (
        <p className="text-sm">No counsellor assigned yet.</p>
      ) : (
        <div className="flex-1 flex flex-col rounded border overflow-hidden">
          <div className="px-4 py-2 border-b bg-[var(--color-surface)] font-medium">Chat with {title}</div>
          <div className="flex-1 p-4 space-y-2 overflow-y-auto bg-white/40 dark:bg-black/10">
            {messages.map((m) => {
              const mine = myId && m.senderId === myId;
              return (
                <div key={m.id} className={`w-full flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`${mine ? "bg-teal-500 text-white" : "bg-white dark:bg-black/30 text-[var(--color-foreground)]"} max-w-[80%] rounded px-3 py-2 shadow text-sm`}
                  >
                    <div>{m.text}</div>
                    <div className={`text-[10px] mt-1 ${mine ? "opacity-80" : "opacity-60"}`}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</div>
                  </div>
                </div>
              );
            })}
            <div ref={listEndRef} />
          </div>
          <div className="p-3 flex gap-2 border-t bg-[var(--color-surface)]">
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder="Type a message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
            />
            <button className="px-4 py-2 rounded bg-[var(--color-primary)] text-white disabled:opacity-60" disabled={sending} onClick={onSend}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
