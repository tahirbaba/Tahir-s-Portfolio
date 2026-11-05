"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Frame } from "./usePlayback";
import { scriptClass, type Replay } from "./types";

const pop = { initial: { opacity: 0, y: 10, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.3 } };

function Typing() {
  return <div className="typing flex gap-1 self-start rounded-2xl bg-white px-3 py-3 text-[#667781]" aria-label="typing"><span /><span /><span /></div>;
}

export function PhoneView({ r, frames }: { r: Replay; frames: Frame[] }) {
  const missed = r.source === "missed_call";
  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[44px] bg-[#0c1a21] p-[10px] shadow-[0_40px_80px_-30px_#0c1a2199]">
      <div className="overflow-hidden rounded-[36px] bg-[#efeae2]">
        <div className="flex items-center gap-3 bg-[#1e3a8a] px-4 pb-3 pt-5 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#93c5fd] font-bold text-[#0c1a21]">N</span>
          <div className="leading-tight"><div className="text-[14px] font-semibold">Northstar Analytics</div><div className="text-[11px] opacity-80">Business account</div></div>
        </div>
        <div className="flex h-[460px] flex-col justify-end gap-2 overflow-hidden px-3 py-4">
          <AnimatePresence mode="popLayout">
            <div key={r.id} className="flex flex-col gap-2">
              {frames.map((f) => {
                const t = r.turns[f.turn];
                return (
                  <div key={f.turn} className="flex flex-col gap-2">
                    {missed && f.turn === 0 ? (
                      <motion.div {...pop} className="mx-auto rounded-lg bg-white/90 px-3 py-1.5 text-[11.5px] text-[#54656f]">📞 Missed call from {r.lead.name} · {r.lead.company}</motion.div>
                    ) : (
                      <motion.div {...pop} dir="auto" className={`max-w-[86%] self-end whitespace-pre-wrap rounded-[14px] rounded-tr-[4px] bg-[#d9fdd3] px-3 py-2 text-[13px] leading-relaxed text-[#111b21] ${scriptClass(t.lead)}`}>{t.lead}</motion.div>
                    )}
                    {f.typing && <Typing />}
                    {f.replyShown && t.reply && (
                      <motion.div {...pop} dir="auto" className={`max-w-[88%] self-start whitespace-pre-wrap rounded-[14px] rounded-tl-[4px] bg-white px-3 py-2 text-[13px] leading-relaxed text-[#111b21] ${scriptClass(t.reply)}`}>{t.reply}</motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function EmailView({ r, frames }: { r: Replay; frames: Frame[] }) {
  return (
    <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-line-2 bg-white text-[#0c1a21] shadow-[0_40px_80px_-35px_#0c1a2166]">
      <div className="flex items-center justify-between border-b border-[#e3e8ee] bg-[#f6f8fa] px-4 py-2.5">
        <span className="font-mono text-[11px] text-[#85949f]">Inbox · {r.lead.email.replace(/^(.).*@/, "$1***@")}</span>
        <span className="font-mono text-[11px] text-[#85949f]">{r.source === "web_form" ? "via website form" : r.source}</span>
      </div>
      <div className="flex h-[520px] flex-col gap-3 overflow-hidden p-4">
        {frames.map((f) => {
          const t = r.turns[f.turn];
          return (
            <div key={f.turn} className="flex flex-col gap-3">
              <motion.div {...pop} className="rounded-xl border border-[#e3e8ee] p-3">
                <div className="text-[11.5px] text-[#85949f]">{f.turn === 0 ? "Form submitted" : "You replied"} · {r.lead.name}, {r.lead.role}</div>
                <p dir="auto" className={`mt-1 text-[13.5px] leading-relaxed ${scriptClass(t.lead)}`}>{t.lead}</p>
              </motion.div>
              {f.typing && <div className="flex items-center gap-2 text-[12px] text-[#85949f]"><span className="typing flex gap-1"><span /><span /><span /></span> Northstar is replying…</div>}
              {f.replyShown && t.reply && (
                <motion.div {...pop} className="rounded-xl border border-[#c7d7fe] bg-[#f5f8ff] p-3">
                  <div className="text-[11.5px] text-[#1d4ed8]">Re: your enquiry · from Northstar Analytics</div>
                  <p dir="auto" className={`mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed ${scriptClass(t.reply)}`}>{t.reply}</p>
                </motion.div>
              )}
              {f.replyShown && !t.reply && (
                <motion.div {...pop} className="rounded-xl border border-dashed border-[#fda4af] bg-[#fff1f2] p-3 text-[13px] text-[#be123c]">No reply sent. Leadline classified this as spam and logged nothing to the CRM.</motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
