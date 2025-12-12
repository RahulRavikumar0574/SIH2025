"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Thread = {
  conversationId: string;
  peer?: { id: string; name: string; email: string } | null;
  last?: { text?: string | null; createdAt?: string | null } | null;
};
type Message = { id: string; conversationId: string; senderId: string; text: string; createdAt?: string };

export default function CounsellorChatsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const [myId, setMyId] = useState<string | null>(null);

  // Load thread list for counsellor
  useEffect(() => {
    const load = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
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
        if (!conversationId && items[0]?.conversationId) setConversationId(items[0].conversationId);
      } finally {
        setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30000); // 30s
    return () => clearInterval(id);
  }, []);

  // Load messages for selected conversation
  useEffect(() => {
    if (!conversationId) return;
    const load = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      const data = await res.json();
      setMessages(Array.isArray(data.items) ? data.items : []);
      setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };
    load();
    const id = setInterval(load, 15000); // 15s
    return () => clearInterval(id);
  }, [conversationId]);

  const title = useMemo(() => {
    const t = threads.find((x) => x.conversationId === conversationId);
    return t?.peer?.name || "Select a student";
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
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-bold mb-4">Chats</h1>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="flex border rounded overflow-hidden min-h-[60vh]">
          {/* Threads list */}
          <aside className="w-72 border-r bg-[var(--color-surface)]">
            <div className="px-3 py-2 font-medium border-b">Students</div>
            <div className="divide-y">
              {threads.length === 0 && <div className="p-3 text-sm">No assigned students.</div>}
              {threads.map((t) => (
                <button
                  key={t.conversationId}
                  onClick={() => setConversationId(t.conversationId)}
                  className={`w-full text-left px-3 py-3 hover:bg-white/40 dark:hover:bg-black/10 ${conversationId === t.conversationId ? "bg-white/60 dark:bg-black/20" : ""}`}
                >
                  <div className="font-medium">{t.peer?.name || t.peer?.email}</div>
                  <div className="text-xs opacity-60 truncate">{t.last?.text}</div>
                </button>
              ))}
            </div>
          </aside>

          {/* Messages pane */}
          <section className="flex-1 flex flex-col">
            <div className="px-4 py-2 border-b bg-[var(--color-surface)] font-medium">{title}</div>
            <div className="flex-1 p-4 space-y-2 overflow-y-auto bg-white/40 dark:bg-black/10">
              {conversationId ? (
                messages.map((m) => {
                  const mine = myId && m.senderId === myId;
                  return (
                    <div key={m.id} className={`w-full flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`${mine ? "bg-teal-500 text-white" : "bg-white dark:bg-black/30 text-[var(--color-foreground)]"} max-w-[80%] rounded px-3 py-2 shadow text-sm`}>
                        <div>{m.text}</div>
                        <div className={`text-[10px] mt-1 ${mine ? "opacity-80" : "opacity-60"}`}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm opacity-70">Select a student to view messages.</p>
              )}
              <div ref={listEndRef} />
            </div>
            <div className="p-3 flex gap-2 border-t bg-[var(--color-surface)]">
              <input
                className="flex-1 border rounded px-3 py-2"
                placeholder="Type a message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
                disabled={!conversationId}
              />
              <button className="px-4 py-2 rounded bg-[var(--color-primary)] text-white disabled:opacity-60" disabled={sending || !conversationId} onClick={onSend}>
                Send
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
