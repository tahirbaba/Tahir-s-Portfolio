"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { deployments } from "@/content/profile";

export default function Deployments() {
  const [idx, setIdx] = useState(0);
  const d = deployments[idx];

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div role="tablist" aria-label="Deployments" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {deployments.map((x, i) => {
          const on = i === idx;
          return (
            <button
              key={x.id} role="tab" aria-selected={on} aria-controls="deployment-panel" type="button"
              onClick={() => setIdx(i)}
              className={`group relative min-w-[230px] rounded-2xl border px-4 py-4 text-left transition-all lg:min-w-0 ${
                on ? "border-ice/50 bg-panel-2" : "border-line bg-panel/50 hover:border-line-2 hover:bg-panel"
              }`}
            >
              <span className="flex items-center justify-between gap-3 font-mono text-[11px] tracking-wider text-dim">
                <span className={on ? "text-ice" : ""}>{x.codename}</span>
                <span>{x.year}</span>
              </span>
              <span className="mt-2 block text-[16px] font-medium">{x.title}</span>
              <span className="mt-0.5 block text-[13px] text-muted">{x.sector} · {x.location}</span>
              {on && <motion.span layoutId="dep-bar" className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-ice" />}
            </button>
          );
        })}
      </div>

      <div id="deployment-panel" role="tabpanel" className="card glow-edge relative min-w-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.article
            key={d.id}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-7 p-6 sm:p-9"
          >
            <header className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11.5px] text-muted">
                <span className="rounded-md bg-amber/10 px-2 py-1 text-amber">DEPLOYMENT REPORT</span>
                <span className="rounded-md border border-line-2 px-2 py-1">{d.codename}</span>
                <span className="rounded-md border border-line-2 px-2 py-1">{d.location}</span>
                <span className="rounded-md border border-line-2 px-2 py-1">{d.duration}</span>
                <span className="rounded-md border border-line-2 px-2 py-1">{d.mode}</span>
              </div>
              <p className="text-[14px] text-muted">{d.sector} · {d.client}</p>
              <h3 className="-mt-2 text-[clamp(26px,3.2vw,38px)] font-semibold leading-tight tracking-tight">
                {d.title}
              </h3>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
              <section>
                <p className="eyebrow mb-2 !text-dim">The situation</p>
                <p className="text-[15.5px] leading-relaxed text-muted">{d.problem}</p>
              </section>
              <section>
                <p className="eyebrow mb-2 !text-dim">What I shipped</p>
                <ul className="flex flex-col gap-2">
                  {d.shipped.map((s) => (
                    <li key={s} className="flex gap-2.5 text-[15px] leading-snug">
                      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ice" />
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section>
              <p className="eyebrow mb-3 !text-dim">Agent graph</p>
              <ol className="flex flex-wrap items-center gap-y-3">
                {d.graph.map((g, i) => (
                  <li key={g} className="flex items-center">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.08 }}
                      className={`rounded-lg border px-3 py-2 font-mono text-[12.5px] ${i === d.graph.length - 1 ? "border-amber/50 text-amber" : "border-line-2 bg-panel-2"}`}
                    >
                      {g}
                    </motion.span>
                    {i < d.graph.length - 1 && (
                      <span aria-hidden className="relative mx-1.5 block h-px w-6 overflow-hidden bg-line-2 sm:w-9">
                        <span className="absolute inset-0 animate-scan bg-gradient-to-r from-transparent via-ice to-transparent" />
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </section>

            <section className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
              {d.impact.map((m) => (
                <div key={m.label} className="bg-panel px-5 py-5">
                  <div className="text-[34px] font-semibold tracking-tight tabular-nums">{m.value}</div>
                  <div className="text-[13px] text-muted">{m.label}</div>
                </div>
              ))}
            </section>

            <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
              <div className="flex flex-wrap gap-1.5">
                {d.stack.map((s) => <span key={s} className="chip chip-mono">{s}</span>)}
              </div>
              <div className="flex gap-4 text-[14px] font-medium">
                {d.links.map((l) => (
                  <a key={l.label} href={l.href} className="text-ice hover:underline hover:underline-offset-4">{l.label} →</a>
                ))}
              </div>
            </footer>
          </motion.article>
        </AnimatePresence>
      </div>
    </div>
  );
}
