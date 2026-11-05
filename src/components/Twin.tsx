"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/profile";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What does a forward deployment with Tahir look like?",
  "Which agent systems has he shipped?",
  "How does he keep agents safe in production?",
  "Is he open to remote roles?",
];

export default function Twin() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<string | null>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" }); }, [msgs]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const history: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-12).filter((m) => m.content) }),
      });
      setMode(res.headers.get("X-Twin-Mode"));
      if (!res.ok || !res.body) {
        const t = await res.text();
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: t || "I couldn't answer that right now." }]);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: acc }]);
      }
    } catch {
      setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: "Connection lost. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card glow-edge flex min-w-0 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-ice to-ice-deep font-mono text-[11px] font-semibold text-ink">MTH</span>
        <div className="min-w-0">
          <div className="text-[15px] font-medium">{profile.shortName} · AI twin</div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
            <span className="live-dot" /> {mode === "demo" ? "demo mode · offline answers" : "Claude · grounded in this portfolio"}
          </div>
        </div>
      </div>

      <div ref={log} data-lenis-prevent className="flex h-[380px] flex-col gap-3 overflow-y-auto px-5 py-5" aria-live="polite">
        <Bubble role="assistant" content={`Hi, I'm ${profile.shortName}'s AI twin. I know his deployments, stack, playbook and availability. Ask me anything an interviewer would.`} />
        {msgs.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content || "…"} pending={!m.content} />
        ))}
      </div>

      {msgs.length === 0 && (
        <div className="flex flex-wrap gap-2 px-5 pb-4">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => ask(s)} className="chip text-left text-[12.5px] transition-colors hover:border-ice hover:text-ice">
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2 border-t border-line p-3">
        <label htmlFor="twin-input" className="sr-only">Ask a question</label>
        <input
          id="twin-input" value={input} maxLength={600} onChange={(e) => setInput(e.target.value)} autoComplete="off"
          placeholder="Ask about deployments, stack, availability…"
          className="min-w-0 flex-1 rounded-xl border border-line-2 bg-ink px-4 py-3 text-[15px] outline-none placeholder:text-dim focus:border-ice"
        />
        <button type="submit" disabled={busy || !input.trim()} className="rounded-xl bg-fg px-4 text-[14px] font-semibold text-ink disabled:opacity-40">
          Send
        </button>
      </form>
    </div>
  );
}

function Bubble({ role, content, pending }: Msg & { pending?: boolean }) {
  const me = role === "user";
  return (
    <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed ${
      me ? "self-end rounded-br-md bg-ice text-ink" : "self-start rounded-bl-md border border-line bg-panel-2"
    } ${pending ? "animate-pulse text-muted" : ""}`}>
      {content}
    </div>
  );
}
