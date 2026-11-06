"use client";

import { motion } from "motion/react";
import { REC, SEV, type Result } from "./types";

export function Rubric({ r }: { r: Result }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel">
      <table className="w-full min-w-[420px] text-left text-[12.5px]">
        <tbody>
          {r.score.rows.map((row, i) => (
            <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }} className="border-b border-line last:border-b-0 align-top">
              <td className="px-3 py-2"><span className={row.met ? "text-ok" : "text-coral"}>{row.met ? "✓" : "✗"}</span> {row.label}{row.must && <span className="ml-1 font-mono text-[10px] text-dim">must</span>}</td>
              <td className="px-2 py-2 text-muted">{row.evidence ? <q className="italic">{row.evidence}</q> : <span className="text-dim">no evidence in CV</span>}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">{row.points}/{row.weight}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Assessment({ r, delay = 0 }: { r: Result; delay?: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div><div className="mb-2 flex items-baseline justify-between"><p className="font-mono text-[10.5px] uppercase tracking-wider text-dim">Rubric · only verified quotes count</p><span className="font-display text-[22px] font-bold">{r.score.total}<span className="text-[14px] text-dim">/{r.score.max}</span></span></div><Rubric r={r} />
        {r.score.unverified_evidence.length > 0 && <p className="mt-2 text-[12px] text-amber">Rejected {r.score.unverified_evidence.length} quote(s) not found in the CV.</p>}</div>
      <div><p className="mb-2 font-mono text-[10.5px] uppercase tracking-wider text-dim">Consistency checks · CV vs form vs public profile</p>
        {r.flags.length === 0 ? <p className="rounded-xl border border-ok/30 px-3 py-2 text-[12.5px] text-ok">No inconsistencies found.</p> : (
          <ul className="flex flex-col gap-1.5">{r.flags.map((f, i) => <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: delay + i * 0.1 }} className={`rounded-xl border px-3 py-2 text-[12.5px] ${SEV[f.severity]}`}><span className="font-mono text-[10px] uppercase">{f.severity === "info" ? "note" : f.severity}</span> · {f.detail}</motion.li>)}</ul>)}
      </div>
      {r.checklist.length > 0 && <div><p className="mb-2 font-mono text-[10.5px] uppercase tracking-wider text-dim">Verification checklist for the recruiter</p><ul className="flex flex-col gap-1">{r.checklist.map((c, i) => <li key={i} className="flex gap-2 text-[12.5px]"><span className="text-ice">☐</span><span>{c.item}</span></li>)}</ul></div>}
      <div className={`rounded-xl border px-4 py-3 ${REC[r.recommendation].cls}`}><div className="font-mono text-[11.5px] font-semibold">{REC[r.recommendation].label}</div><div className="mt-0.5 text-[13px]">{r.why}</div><div className="mt-1 font-mono text-[10.5px] opacity-80">Decision made by {r.decided_by}</div></div>
    </div>
  );
}
