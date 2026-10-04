"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function DocumentsClient() {
  const router = useRouter();
  const [docText, setDocText] = useState("");
  const [fileName, setFileName] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollDown() {
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
    );
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMessages([]);
    setExtracting(true);
    setFileName(file.name);
    try {
      let text = "";
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        text = await extractPdf(file);
      } else {
        text = await file.text();
      }
      text = text.trim();
      if (!text) {
        setError("Could not read any text from this file (is it scanned/image-only?).");
        setDocText("");
      } else {
        setDocText(text);
      }
    } catch {
      setError("Failed to read the file.");
      setDocText("");
    } finally {
      setExtracting(false);
    }
  }

  async function extractPdf(file: File): Promise<string> {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    let out = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      out +=
        content.items
          .map((it) => ("str" in it ? (it as { str: string }).str : ""))
          .join(" ") + "\n";
    }
    return out;
  }

  async function ask() {
    const q = input.trim();
    if (!q || loading || !docText) return;
    setError(null);
    const history = messages.slice(-6);
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    scrollDown();

    try {
      const res = await fetch("/api/documents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, context: docText, history }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Request failed");
        setMessages((m) => m.slice(0, -1));
        setLoading(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const c = [...m];
          c[c.length - 1] = { role: "assistant", content: full };
          return c;
        });
        scrollDown();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      router.refresh();
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-3">
        <h1 className="font-medium">Chat with Documents</h1>
        <p className="text-xs text-muted">
          Upload a PDF or text file, then ask questions about it.
        </p>
      </div>

      <div className="flex items-center gap-3 border-b px-6 py-3">
        <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
          {extracting ? "Reading…" : "Upload PDF / TXT"}
          <input
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain"
            onChange={handleFile}
            className="hidden"
          />
        </label>
        {fileName && (
          <span className="text-sm text-muted">
            {fileName}
            {docText && (
              <span className="ml-2 text-green-400">
                · {docText.length.toLocaleString()} chars loaded
              </span>
            )}
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {!docText && !extracting && (
            <div className="mt-20 text-center text-muted">
              <p className="text-lg">Upload a document to begin</p>
              <p className="text-sm">PDF or text files supported.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : ""}>
              {m.role === "user" ? (
                <div className="inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-2.5 text-sm text-white">
                  {m.content}
                </div>
              ) : (
                <div className="inline-block max-w-[85%] rounded-2xl border bg-surface px-4 py-2.5 text-sm">
                  {m.content ? (
                    <Markdown content={m.content} />
                  ) : (
                    loading && (
                      <span className="flex items-center gap-2 text-muted">
                        <span className="thinking-spark">✦</span>
                        <span>ArgonMax K3 is reading</span>
                        <span className="thinking-dots">
                          <span>.</span>
                          <span>.</span>
                          <span>.</span>
                        </span>
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-auto mb-2 w-full max-w-3xl px-6">
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        </div>
      )}

      <div className="border-t px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask();
              }
            }}
            rows={1}
            disabled={!docText}
            placeholder={docText ? "Ask about the document…" : "Upload a document first"}
            className="max-h-40 flex-1 resize-none rounded-xl border bg-surface px-4 py-3 text-sm outline-none focus:border-primary disabled:opacity-50"
          />
          <button
            onClick={ask}
            disabled={loading || !input.trim() || !docText}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
