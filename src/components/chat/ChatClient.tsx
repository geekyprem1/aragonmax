"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowUp, ArrowUpRight, Paperclip, Sparkles, Trash2, X, MessageSquare, PenLine, Lightbulb, BookOpen, Mail } from "lucide-react";
import DotMatrix, { GlyphOrb } from "@/components/ui/DotMatrix";
import Markdown from "@/components/Markdown";
import { createClient } from "@/lib/supabase/client";
import { countWords } from "@/lib/words";
import type { AiModel, Conversation } from "@/types/db";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  { label: "Create something", icon: PenLine, prompt: "Write a catchy Instagram caption for a coffee brand" },
  { label: "Understand anything", icon: BookOpen, prompt: "Explain how blockchain works in simple terms" },
  { label: "Find a fresh idea", icon: Lightbulb, prompt: "Give me 5 startup ideas in the fitness space" },
  { label: "Get the words right", icon: Mail, prompt: "Write a professional email asking for a refund" },
];

/** Streams an AI response, emitting throttled snapshots (~100ms). Returns full text. */
async function readChatStream(
  body: ReadableStream<Uint8Array>,
  onText: (text: string) => void
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let lastFlush = 0;
  let rendered = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    const now = performance.now();
    if (now - lastFlush >= 100) {
      lastFlush = now;
      rendered = full;
      onText(full);
    }
  }
  if (full !== rendered) onText(full);
  return full;
}

export default function ChatClient({
  models,
  defaultModel,
  templateId,
  personaName,
  userId,
  initialConversations,
  pro,
}: {
  models: AiModel[];
  defaultModel: string;
  templateId?: string;
  personaName?: string;
  userId: string;
  initialConversations: Conversation[];
  pro: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [model, setModel] = useState(defaultModel);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(
    initialConversations
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingConvo, setLoadingConvo] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Monotonic id so stale conversation loads can't overwrite newer ones.
  const loadSeqRef = useRef(0);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function isNearBottom() {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }

  function scrollToBottom(force = false) {
    if (!force && !isNearBottom()) return;
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
    );
  }

  function newChat() {
    if (loading) return;
    loadSeqRef.current++;
    setInput("");
    setImage(null);
    setActiveId(null);
    setMessages([]);
    setError(null);
    setShowList(false);
  }

  async function openConversation(id: string) {
    if (loading) return;
    const seq = ++loadSeqRef.current;
    setActiveId(id);
    setError(null);
    setLoadingConvo(true);
    const { data } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    // A newer load started while this one was in flight — drop these results.
    if (seq !== loadSeqRef.current) return;
    setMessages((data as Msg[]) ?? []);
    setLoadingConvo(false);
    setShowList(false);
    scrollToBottom(true);
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this chat?")) return;
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((c) => c.filter((x) => x.id !== id));
    if (activeId === id) newChat();
  }

  async function send() {
    const text = input.trim();
    if ((!text && !image) || loading || loadingConvo) return;
    setError(null);

    const sentImage = image;
    const userMsg: Msg = {
      role: "user",
      content: sentImage ? `${text}\n[📎 image attached]` : text,
    };
    // Only the last 15 messages go to the API (long chats stay fast/cheap).
    let apiMessages: Msg[] = [...messages.slice(-15), userMsg];
    // Providers expect the history to start with a user message.
    const firstUser = apiMessages.findIndex((m) => m.role === "user");
    if (firstUser > 0) apiMessages = apiMessages.slice(firstUser);
    setMessages([...messages, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setImage(null);
    setLoading(true);
    scrollToBottom(true);

    // Persist conversation + user message in the background so they never
    // delay the AI request. Resolves with the conversation id (or null).
    const persist = (async (): Promise<string | null> => {
      try {
        let convoId = activeId;
        if (!convoId) {
          const title = text.slice(0, 60);
          const { data, error: convoErr } = await supabase
            .from("conversations")
            .insert({ user_id: userId, title, model })
            .select("id, user_id, title, model, created_at")
            .single();
          if (convoErr || !data) return null;
          convoId = data.id;
          setActiveId(data.id);
          setConversations((c) => [data as Conversation, ...c]);
        }
        await supabase.from("messages").insert({
          conversation_id: convoId,
          role: "user",
          content: text,
          words_used: 0,
        });
        return convoId;
      } catch {
        return null;
      }
    })();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          templateId,
          messages: apiMessages,
          image: sentImage ?? undefined,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Request failed");
        setMessages((m) =>
          m.length &&
          m[m.length - 1].role === "assistant" &&
          !m[m.length - 1].content
            ? m.slice(0, -1)
            : m
        );
        setLoading(false);
        return;
      }

      const full = await readChatStream(res.body, (text) => {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: text };
          return copy;
        });
        scrollToBottom();
      });

      // Persist the assistant reply in the background.
      if (full) {
        void persist
          .then(async (convoId) => {
            if (!convoId) return;
            await supabase.from("messages").insert({
              conversation_id: convoId,
              role: "assistant",
              content: full,
              words_used: countWords(full),
            });
          })
          .catch(() => {});
      }
    } catch {
      setError("Network error");
      // Drop the empty assistant placeholder so it never enters the history.
      setMessages((m) =>
        m.length &&
        m[m.length - 1].role === "assistant" &&
        !m[m.length - 1].content
          ? m.slice(0, -1)
          : m
      );
    } finally {
      setLoading(false);
      window.setTimeout(() => router.refresh(), 1500);
    }
  }

  return (
    <div className="os-chat relative flex h-full min-h-0">
      {showList && <div className="absolute inset-0 z-10 bg-black/60 md:hidden" onClick={() => setShowList(false)} />}
      <aside aria-label="Chat history" className={`os-history ${showList ? "absolute z-20 flex" : "hidden"} inset-y-0 left-0 flex-col md:static md:z-auto md:flex`}>
        <div className="flex items-center gap-2 p-4">
          <button onClick={newChat} disabled={loading} className="os-new-chat"><Plus size={18} /> New chat <span className="ml-auto opacity-50">↗</span></button>
          <button onClick={() => setShowList(false)} aria-label="Close chat history" className="p-2 md:hidden"><X size={18} /></button>
        </div>
        <div className="os-history-heading"><span>Recent chats</span><span>({conversations.length.toString().padStart(2, "0")})</span></div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
          {conversations.length === 0 && <p className="px-3 py-5 text-xs leading-relaxed text-muted">A fresh start.<br />Your conversations will appear here.</p>}
          {conversations.map((c) => (
            <div key={c.id} className={`os-conversation group ${activeId === c.id ? "is-active" : ""}`}>
              <button onClick={() => openConversation(c.id)} disabled={loading} aria-current={activeId === c.id ? "true" : undefined} className="flex min-w-0 flex-1 items-center gap-2.5 py-3 pl-3 text-left">
                <MessageSquare size={14} className="shrink-0 opacity-60" /><span className="truncate">{c.title}</span>
              </button>
              <button onClick={(e) => deleteConversation(c.id, e)} disabled={loading} className="os-delete" aria-label={`Delete chat: ${c.title}`}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <div className="os-history-footer"><span className="os-status-dot" /> A little space for your thoughts.</div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="os-chat-header">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setShowList(true)} className="rounded-full border p-2 md:hidden" aria-label="Open chat history"><MessageSquare size={17} /></button>
            <span className="os-header-icon hidden sm:flex"><Sparkles size={18} /></span>
            <div className="min-w-0"><h1 className="text-sm font-medium">{personaName || "AI Chat"}</h1><p className="os-eyebrow mt-1 truncate">{personaName ? "Personalized assistant" : "Space to think bigger"}</p></div>
          </div>
          <div className="os-model-picker">
            <span className="os-status-dot hidden sm:block" />
            <select aria-label="AI model" value={model} onChange={(e) => setModel(e.target.value)} disabled={loading}>
              {models.map((m) => <option key={m.model_key} value={m.model_key}>{m.display_name}{m.badge ? ` · ${m.badge}` : ""}</option>)}
            </select>
          </div>
        </header>

        <div ref={scrollRef} className={`os-chat-scroll flex-1 overflow-y-auto scrollbar-thin ${messages.length === 0 && !loadingConvo ? "is-empty" : ""}`}>
          <div className="mx-auto w-full max-w-3xl space-y-6">
            {messages.length === 0 && !loadingConvo && (
              <div className="os-chat-welcome">
                <GlyphOrb className="os-glyph" />
                <p className="os-eyebrow mb-5">ArgonMax AI / Your thinking partner</p>
                <h2 className="os-chat-title"><DotMatrix text="MAKE SPACE." /><span>For your next big idea.</span></h2>
                <p className="mt-4 text-sm leading-relaxed text-muted">A question. A spark. A blank page. Start anywhere.</p>
                <div className="os-suggestions">
                  {SUGGESTIONS.map(({ label, icon: Icon, prompt }) => (
                    <button key={label} onClick={() => { setInput(prompt); inputRef.current?.focus(); }} className="os-suggestion">
                      <div className="flex items-center justify-between"><Icon size={18} strokeWidth={1.5} /><ArrowUpRight size={15} className="os-suggestion-arrow" /></div>
                      <span className="mt-5 block text-xs font-semibold">{label}</span>
                      <span className="mt-2 block text-xs leading-relaxed opacity-60">{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {loadingConvo && <p className="mt-20 text-center text-sm text-muted" role="status">Loading conversation…</p>}
            {messages.map((m, i) => m.role === "user" ? (
              <div key={i} className="flex justify-end"><div className="os-user-message">{m.content}</div></div>
            ) : (
              <div key={i} className="flex items-start gap-3">
                <span className="os-assistant-avatar"><Sparkles size={16} /></span>
                <div className="min-w-0 max-w-[85%] rounded-2xl border bg-surface px-4 py-3 text-sm">
                  {m.content.trim() ? <Markdown content={m.content} /> : <span className="flex items-center gap-2 text-muted" role="status"><span className="thinking-spark">✦</span><span>ArgonMax is thinking</span><span className="thinking-dots"><span>.</span><span>.</span><span>.</span></span></span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="mx-auto mb-2 w-full max-w-3xl px-6"><p role="alert" className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">{error}</p></div>}
        <div className="os-composer-area">
          <div className="mx-auto max-w-3xl">
            {image && <div className="mb-3 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Image attachment" className="h-12 w-12 rounded-lg border object-cover" />
              <button onClick={() => setImage(null)} className="flex items-center gap-1 text-xs text-primary"><X size={12} /> Remove image</button>
            </div>}
            <div className="os-composer">
              {pro && <label className="os-attachment" title="Attach image (Pro)"><Paperclip size={19} /><input type="file" aria-label="Attach image" accept="image/*" onChange={handleImage} className="sr-only" /></label>}
              <textarea ref={inputRef} aria-label="Message" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} rows={1} placeholder="What's on your mind?" className="max-h-40 min-w-0 flex-1 resize-none bg-transparent px-2 py-3 text-sm outline-none" />
              <button onClick={send} disabled={loading || loadingConvo || (!input.trim() && !image)} className="os-send" aria-label="Send message"><ArrowUp size={21} /></button>
            </div>
            <div className="os-composer-caption"><span>ArgonMax AI can make mistakes. Check important info.</span><span className="hidden sm:block">↵ Send <span className="ml-3">⇧ ↵ New line</span></span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
