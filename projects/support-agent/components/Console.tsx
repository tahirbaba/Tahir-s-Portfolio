"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SCENARIOS } from "@/data/scenarios";

type Turn = { role: "user" | "assistant"; content: string };
type Action = { id: string; type: string; orderId?: string; amount?: number; reason?: string; status: string; detail?: string };
type ToolEvent = { kind: "tool"; name: string; input: Record<string, unknown>; output: Record<string, unknown>; isError: boolean; ms: number };
type ModelEvent = { kind: "model"; step: number; ms: number; stop: string | null };
type TurnMeta = { trace: (ToolEvent | ModelEvent)[]; latencyMs: number; costUsd: number; usage: { input: number; output: number; cacheRead: number; cacheWrite: number }; model: string };

const URDU_ONLY = /[ٹڈڑںےۓہھ]/;
const ARABIC = /[؀-ۿ]/;
const scriptClass = (t: string) => (URDU_ONLY.test(t) ? "urdu" : ARABIC.test(t) ? "arabic" : "");

const ACTION_STYLE: Record<string, { label: string; tone: string }> = {
  refund: { label: "Refund", tone: "text-ok border-ok/30 bg-ok/10" },
  return: { label: "Return label", tone: "text-ice border-ice/30 bg-ice/10" },
  address_change: { label: "Address changed", tone: "text-ice border-ice/30 bg-ice/10" },
  cancellation: { label: "Order cancelled", tone: "text-ice border-ice/30 bg-ice/10" },
  escalation: { label: "Handed to human", tone: "text-rose border-rose/30 bg-rose/10" },
};

export default function Console() {
  const [history, setHistory] = useState<Turn[]>([]);
  const [stateToken, setStateToken] = useState<string>("");
  const [actions, setActions] = useState<Action[]>([]);
  const [verified, setVerified] = useState<string[]>([]);
  const [metas, setMetas] = useState<TurnMeta[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [live, setLive] = useState<boolean | null>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => { fetch("/api/chat").then((r) => r.json()).then((d) => setLive(!!d.live)).catch(() => setLive(false)); }, []);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" }); }, [history, busy]);

  function reset() { setHistory([]); setStateToken(""); setActions([]); setVerified([]); setMetas([]); setError(""); }

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || busy) return;
    const next: Turn[] = [...history, { role: "user", content: msg }];
    setHistory(next); setInput(""); setBusy(true); setError("");
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ history: next, state: stateToken || undefined }) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Something went wrong."); setHistory(history); setInput(msg); return; }
      setHistory([...next, { role: "assistant", content: d.reply }]);
      setStateToken(d.state); setActions(d.actions); setVerified(d.verified);
      setMetas((m) => [...m, { trace: d.trace, latencyMs: d.latencyMs, costUsd: d.costUsd, usage: d.usage, model: d.model }]);
    } catch {
      setError("Connection lost. Please try again."); setHistory(history); setInput(msg);
    } finally { setBusy(false); }
  }

  const lastMeta = metas[metas.length - 1];
  const totalCost = metas.reduce((t, m) => t + m.costUsd, 0);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-4 py-5 lg:grid-cols-[290px_minmax(0,1fr)_380px]">
      {/* Scenarios */}
      <aside className="flex min-w-0 flex-col gap-4">
        <div className="panel p-4">
          <p className="eyebrow mb-3">Try a customer</p>
          <ul className="flex flex-col gap-2">
            {SCENARIOS.map((s) => (
              <li key={s.id}>
                <button type="button" disabled={busy} onClick={() => { reset(); setInput(s.message); }}
                  className="w-full rounded-xl border border-line bg-panel-2/60 px-3 py-2.5 text-left transition-colors hover:border-ice/50 disabled:opacity-50">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-medium">{s.title}</span>
                    <span className="shrink-0 rounded-md border border-line-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">{s.lang}</span>
                  </span>
                  <span className="mt-1 block font-mono text-[11px] text-dim">{s.order} · {s.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-4 text-[13px] leading-relaxed text-muted">
          <p className="eyebrow mb-2">How it's built</p>
          <ul className="flex flex-col gap-1.5">
            <li>• Refund limits, identity checks and time windows are enforced in code, not in the prompt.</li>
            <li>• Conversation state is HMAC-signed, so a client can't fake verification.</li>
            <li>• Emails, phones and cards are masked in every trace.</li>
            <li>• Measured by a 116-case eval suite in four languages. <a href="/evals" className="text-ice hover:underline">See evals →</a></li>
          </ul>
        </div>
      </aside>

      {/* Chat */}
      <section className="panel flex min-h-[640px] min-w-0 flex-col overflow-hidden" aria-label="Customer chat">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-ice to-ok font-semibold text-ink">N</span>
            <div className="leading-tight">
              <div className="text-[14.5px] font-medium">Nimbus Home Support</div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
                <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-ok" : live === false ? "bg-amber" : "bg-dim"}`} />
                {live ? "Relay agent online" : live === false ? "live agent offline (no API key on this deployment)" : "checking…"}
              </div>
            </div>
          </div>
          <button type="button" onClick={reset} className="rounded-lg border border-line-2 px-3 py-1.5 text-[12.5px] text-muted hover:text-fg">New chat</button>
        </div>

        <div ref={log} className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-[size:18px_18px] px-4 py-5" aria-live="polite">
          {history.length === 0 && (
            <div className="m-auto max-w-[380px] text-center">
              <p className="text-[15px]">Pick a customer on the left, or write your own message.</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">Use any order from the scenarios with its email. Try English, Arabic, Urdu or Roman Urdu, and try to break the rules.</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {history.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                dir="auto"
                className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-relaxed ${scriptClass(t.content)} ${
                  t.role === "user" ? "self-end rounded-br-md bg-ice text-ink" : "self-start rounded-bl-md border border-line bg-panel-2"
                }`}>
                {t.content}
              </motion.div>
            ))}
          </AnimatePresence>
          {busy && <div className="self-start rounded-2xl rounded-bl-md border border-line bg-panel-2 px-4 py-3 font-mono text-[12px] text-muted">Relay is checking your order…</div>}
        </div>

        {error && <p role="alert" className="border-t border-line px-4 py-2 text-[13px] text-rose">{error}</p>}
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t border-line p-3">
          <label htmlFor="msg" className="sr-only">Message</label>
          <textarea id="msg" dir="auto" rows={2} value={input} maxLength={1000} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Write as the customer…"
            className={`min-w-0 flex-1 resize-none rounded-xl border border-line-2 bg-ink px-3.5 py-2.5 text-[14.5px] outline-none placeholder:text-dim focus:border-ice ${scriptClass(input)}`} />
          <button type="submit" disabled={busy || !input.trim()} className="rounded-xl bg-ice px-4 text-[14px] font-semibold text-ink disabled:opacity-40">Send</button>
        </form>
      </section>

      {/* Ops console */}
      <aside className="flex min-w-0 flex-col gap-4" aria-label="Ops console">
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between"><p className="eyebrow">Actions taken</p><span className="font-mono text-[11px] text-dim">{actions.length}</span></div>
          {actions.length === 0 ? <p className="text-[13px] text-dim">Nothing yet. Every refund, return, change or handoff appears here.</p> : (
            <ul className="flex flex-col gap-2">
              {actions.map((a) => {
                const st = ACTION_STYLE[a.type] ?? ACTION_STYLE.return;
                return (
                  <li key={a.id} className={`rounded-xl border px-3 py-2 ${st.tone}`}>
                    <div className="flex items-center justify-between gap-2 text-[13px] font-medium">
                      <span>{st.label}{a.amount ? ` · ${a.amount} USD` : ""}</span>
                      <span className="font-mono text-[10.5px] opacity-80">{a.status === "pending_approval" ? "AWAITING APPROVAL" : "DONE"}</span>
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-muted">{a.id}{a.orderId ? ` · ${a.orderId}` : ""}{a.reason ? ` · ${a.reason}` : ""}</div>
                    {a.detail && <div className="mt-1 text-[12px] text-muted">{a.detail}</div>}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 font-mono text-[11px] text-dim">Verified: {verified.length ? verified.join(", ") : "none"}</p>
        </div>

        <div className="panel flex min-h-0 flex-1 flex-col p-4">
          <div className="mb-3 flex items-center justify-between"><p className="eyebrow">Agent trace · last turn</p>{lastMeta && <span className="font-mono text-[11px] text-dim">{lastMeta.model}</span>}</div>
          {!lastMeta ? <p className="text-[13px] text-dim">Tool calls, inputs and results show up here as the agent works.</p> : (
            <>
              <div className="mb-3 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line text-center">
                <Stat label="latency" value={`${(lastMeta.latencyMs / 1000).toFixed(1)}s`} />
                <Stat label="cost" value={`$${lastMeta.costUsd.toFixed(4)}`} />
                <Stat label="tokens" value={`${lastMeta.usage.input + lastMeta.usage.output + lastMeta.usage.cacheRead}`} />
              </div>
              <ol className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-1">
                {lastMeta.trace.map((e, i) => e.kind === "model" ? (
                  <li key={i} className="font-mono text-[11px] text-dim">model step {e.step} · {(e.ms / 1000).toFixed(1)}s · {e.stop}</li>
                ) : (
                  <li key={i}>
                    <details className={`rounded-lg border px-2.5 py-1.5 ${e.isError ? "border-amber/30 bg-amber/5" : "border-line bg-panel-2/60"}`}>
                      <summary className="flex cursor-pointer items-center justify-between gap-2 font-mono text-[12px]">
                        <span className={e.isError ? "text-amber" : "text-ice"}>{e.name}</span>
                        <span className="text-dim">{e.isError ? "blocked by rule" : "ok"}</span>
                      </summary>
                      <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[10.5px] leading-relaxed text-muted">in  {JSON.stringify(e.input)}{"\n"}out {JSON.stringify(e.output)}</pre>
                    </details>
                  </li>
                ))}
              </ol>
            </>
          )}
          {metas.length > 1 && <p className="mt-3 font-mono text-[11px] text-dim">Conversation cost so far: ${totalCost.toFixed(4)}</p>}
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-panel px-2 py-2">
      <div className="font-mono text-[14px] tabular-nums">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-dim">{label}</div>
    </div>
  );
}
