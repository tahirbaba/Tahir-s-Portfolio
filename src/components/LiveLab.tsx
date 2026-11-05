"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import type { Architecture, Discovery, LabEvent, Rollout, StepName } from "@/lib/plan-types";

const STEPS: { key: StepName; agent: string; does: string }[] = [
  { key: "discovery", agent: "Discovery agent", does: "Finds the real problem and the metric to move" },
  { key: "architecture", agent: "Architect agent", does: "Designs the agent graph, tools and checkpoints" },
  { key: "rollout", agent: "Rollout planner", does: "Plans the deployment, impact and risks" },
];

const EXAMPLES = [
  { company: "Northwind Clinics", problem: "Front desk staff spend hours every day answering appointment, insurance and prescription refill calls and WhatsApp messages." },
  { company: "Atlas Freight", problem: "Our ops team manually reads shipping emails, updates tracking in the TMS and answers 'where is my container' requests from customers." },
  { company: "Brightside SaaS", problem: "Churn signals are scattered across support tickets, product usage and billing, so customer success finds out too late." },
];

type Status = "idle" | "running" | "done";

export default function LiveLab() {
  const [company, setCompany] = useState("");
  const [problem, setProblem] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [mode, setMode] = useState<"live" | "demo" | null>(null);
  const [current, setCurrent] = useState<StepName | null>(null);
  const [times, setTimes] = useState<Partial<Record<StepName, number>>>({});
  const [discovery, setDiscovery] = useState<Discovery | null>(null);
  const [arch, setArch] = useState<Architecture | null>(null);
  const [rollout, setRollout] = useState<Rollout | null>(null);
  const [error, setError] = useState("");
  const out = useRef<HTMLDivElement>(null);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (status === "running") return;
    if (problem.trim().length < 12) { setError("Describe the problem in a sentence or two."); return; }
    setError(""); setStatus("running"); setDiscovery(null); setArch(null); setRollout(null); setTimes({}); setCurrent(null);
    setTimeout(() => out.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, problem }),
      });
      if (!res.ok || !res.body) { setError((await res.text()) || "The lab is unavailable right now."); setStatus("idle"); return; }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const p of parts) {
          const line = p.trim();
          if (!line.startsWith("data:")) continue;
          const ev = JSON.parse(line.slice(5)) as LabEvent;
          if (ev.type === "mode") setMode(ev.mode);
          else if (ev.type === "step") setCurrent(ev.step);
          else if (ev.type === "result") {
            setTimes((t) => ({ ...t, [ev.step]: ev.ms }));
            if (ev.step === "discovery") setDiscovery(ev.data);
            if (ev.step === "architecture") setArch(ev.data);
            if (ev.step === "rollout") setRollout(ev.data);
          } else if (ev.type === "error") { setError(ev.message); }
          else if (ev.type === "done") setCurrent(null);
        }
      }
      setStatus("done");
    } catch {
      setError("Connection lost. Please try again.");
      setStatus("idle");
    }
  }

  const stepState = (k: StepName) => (times[k] !== undefined ? "done" : current === k ? "running" : "waiting");

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* input */}
      <form onSubmit={run} className="card glow-edge flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[12px] text-muted">deployment-request.json</p>
          <span className="flex items-center gap-2 font-mono text-[11px] text-dim">
            <span className={`h-1.5 w-1.5 rounded-full ${mode === "demo" ? "bg-amber" : "bg-ok"}`} />
            {mode === "demo" ? "demo mode" : "Claude · 3 agents"}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="lab-company" className="text-[13px] text-muted">Company <span className="text-dim">(optional)</span></label>
          <input
            id="lab-company" value={company} maxLength={80} onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Logistics"
            className="rounded-xl border border-line-2 bg-ink px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-dim focus:border-ice"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="lab-problem" className="text-[13px] text-muted">What workflow is costing you time?</label>
          <textarea
            id="lab-problem" value={problem} maxLength={700} rows={5} onChange={(e) => setProblem(e.target.value)}
            placeholder="Our support team answers the same order and refund questions all day across email and WhatsApp…"
            className="resize-none rounded-xl border border-line-2 bg-ink px-4 py-3 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-dim focus:border-ice"
          />
          <span className="self-end font-mono text-[11px] text-dim">{problem.length}/700</span>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[12px] text-dim">Or try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex.company} type="button" onClick={() => { setCompany(ex.company); setProblem(ex.problem); }}
                className="chip transition-colors hover:border-ice hover:text-ice">
                {ex.company}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={status === "running"}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-ice px-5 py-3.5 text-[15px] font-semibold text-ink transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60">
          {status === "running" ? "Agents are working…" : status === "done" ? "Run again" : "Deploy the agents"}
        </button>
        {error && <p role="alert" className="text-[14px] text-rose">{error}</p>}
        <p className="text-[12px] leading-relaxed text-dim">
          Three Claude agents run in sequence on the server, each passing structured output to the next. What you type is sent to the Claude API and is not stored.
        </p>
      </form>

      {/* output */}
      <div ref={out} className="card relative flex min-h-[560px] min-w-0 flex-col overflow-hidden">
        <ol className="grid grid-cols-3 border-b border-line">
          {STEPS.map((s, i) => {
            const st = stepState(s.key);
            return (
              <li key={s.key} className={`relative flex flex-col gap-1 px-4 py-4 ${i > 0 ? "border-l border-line" : ""}`}>
                <span className="flex items-center gap-2 font-mono text-[11px]">
                  <span className={`h-2 w-2 rounded-full ${st === "done" ? "bg-ok" : st === "running" ? "animate-pulse bg-amber" : "bg-line-2"}`} />
                  <span className={st === "waiting" ? "text-dim" : "text-muted"}>
                    {st === "done" ? `${((times[s.key] || 0) / 1000).toFixed(1)}s` : st === "running" ? "running" : "queued"}
                  </span>
                </span>
                <span className="text-[13.5px] font-medium">{s.agent}</span>
                <span className="hidden text-[12px] leading-snug text-dim sm:block">{s.does}</span>
                {st === "running" && <span className="absolute inset-x-0 bottom-0 h-px overflow-hidden"><span className="block h-full w-full animate-scan bg-gradient-to-r from-transparent via-amber to-transparent" /></span>}
              </li>
            );
          })}
        </ol>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 sm:p-7" data-lenis-prevent>
          {status === "idle" && !discovery && <EmptyState />}

          <AnimatePresence>
            {discovery && (
              <motion.section key="d" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                <h4 className="eyebrow">01 · Discovery</h4>
                <p className="text-[15.5px] leading-relaxed">{discovery.summary}</p>
                <p className="text-[13px] text-muted">North-star metric: <span className="text-amber">{discovery.north_star_metric}</span></p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {discovery.pain_points.map((p) => (
                    <div key={p.title} className="rounded-xl border border-line bg-panel-2 p-3">
                      <div className="text-[13.5px] font-medium">{p.title}</div>
                      <div className="mt-1 text-[12.5px] leading-snug text-muted">{p.detail}</div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {arch && (
              <motion.section key="a" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                <h4 className="eyebrow">02 · Architecture</h4>
                <AgentGraph arch={arch} />
                <div className="flex flex-wrap gap-1.5">
                  {arch.integrations.map((x) => <span key={x} className="chip chip-mono">{x}</span>)}
                </div>
                <ul className="flex flex-col gap-1">
                  {arch.human_checkpoints.map((h) => (
                    <li key={h} className="text-[13px] text-muted"><span className="text-amber">⏸ Human approves:</span> {h}</li>
                  ))}
                </ul>
              </motion.section>
            )}

            {rollout && (
              <motion.section key="r" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
                <h4 className="eyebrow">03 · Rollout</h4>
                <ol className="grid gap-2 sm:grid-cols-2">
                  {rollout.phases.map((p) => (
                    <li key={p.when + p.title} className="rounded-xl border border-line p-3">
                      <span className="font-mono text-[11px] text-ice">{p.when}</span>
                      <div className="text-[14px] font-medium">{p.title}</div>
                      <div className="text-[12.5px] leading-snug text-muted">{p.deliverable}</div>
                    </li>
                  ))}
                </ol>
                <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
                  {rollout.impact_estimates.map((m) => (
                    <div key={m.label} className="bg-panel p-3.5">
                      <div className="text-[22px] font-semibold tabular-nums">{m.value}</div>
                      <div className="text-[12px] text-muted">{m.label}</div>
                    </div>
                  ))}
                </div>
                <ul className="flex flex-col gap-1.5">
                  {rollout.risks.map((r) => (
                    <li key={r.risk} className="text-[13px] leading-snug text-muted"><span className="text-fg">Risk:</span> {r.risk} <span className="text-dim">→</span> {r.mitigation}</li>
                  ))}
                </ul>
                <p className="text-[12px] text-dim">Impact figures are AI estimates for discussion, not guarantees.</p>
                <a href="#contact" className="self-start rounded-xl border border-ice/40 px-4 py-2.5 text-[14px] font-medium text-ice transition-colors hover:bg-ice hover:text-ink">
                  Want this built for real? Talk to Tahir →
                </a>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="m-auto flex max-w-[360px] flex-col items-center gap-4 py-10 text-center">
      <div aria-hidden className="relative h-24 w-40">
        {[0, 1, 2].map((i) => (
          <span key={i} className="absolute top-1/2 h-9 w-9 -translate-y-1/2 rounded-lg border border-line-2 bg-panel-2" style={{ left: `${i * 56}px` }} />
        ))}
        <span className="absolute left-9 right-9 top-1/2 h-px bg-line-2" />
      </div>
      <p className="text-[15px]">Three agents are standing by.</p>
      <p className="text-[13.5px] leading-relaxed text-muted">Describe a workflow on the left. Discovery, Architect and Rollout agents will design a forward deployment for it, live.</p>
    </div>
  );
}

function AgentGraph({ arch }: { arch: Architecture }) {
  // Layer agents by longest path from a source, then lay out columns left to right.
  const ids = arch.agents.map((a) => a.id);
  const depth: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  for (let k = 0; k < ids.length; k++) {
    for (const e of arch.flow) if (depth[e.from] !== undefined && depth[e.to] !== undefined) depth[e.to] = Math.max(depth[e.to], depth[e.from] + 1);
  }
  const cols: string[][] = [];
  ids.forEach((id) => { (cols[depth[id]] ||= []).push(id); });
  const byId = Object.fromEntries(arch.agents.map((a) => [a.id, a]));

  return (
    <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
      {cols.filter(Boolean).map((col, ci) => (
        <div key={ci} className="flex items-center gap-2">
          {ci > 0 && <span aria-hidden className="font-mono text-dim">→</span>}
          <div className="flex flex-col gap-2">
            {col.map((id, ri) => {
              const a = byId[id];
              return (
                <motion.div key={id} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: ci * 0.15 + ri * 0.05 }}
                  className="w-[180px] rounded-xl border border-line-2 bg-panel-2 p-3">
                  <div className="text-[13.5px] font-medium">{a.name}</div>
                  <div className="mt-0.5 text-[12px] leading-snug text-muted">{a.role}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {a.tools.map((t) => <span key={t} className="rounded-md bg-ink px-1.5 py-0.5 font-mono text-[10.5px] text-ice">{t}</span>)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
