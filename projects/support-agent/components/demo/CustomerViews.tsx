"use client";

import { AnimatePresence, motion } from "motion/react";
import { scriptClass } from "./types";
import type { ReplayView } from "./useReplay";

function Bubble({ who, text, theme }: { who: "customer" | "agent"; text: string; theme: "chat" | "web" }) {
  const mine = who === "customer";
  const base = theme === "chat"
    ? mine ? "self-end bg-[#d9fdd3] text-[#111b21] rounded-[14px] rounded-tr-[4px]" : "self-start bg-white text-[#111b21] rounded-[14px] rounded-tl-[4px]"
    : mine ? "self-end bg-[#0c1a21] text-white rounded-2xl rounded-br-md" : "self-start bg-[#eef2f5] text-[#0c1a21] rounded-2xl rounded-bl-md";
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3 }}
      dir="auto" className={`max-w-[86%] whitespace-pre-wrap px-3 py-2 text-[13.5px] leading-relaxed shadow-[0_1px_0_#0000000f] ${base} ${scriptClass(text)}`}>
      {text}
    </motion.div>
  );
}

function Typing({ theme, side }: { theme: "chat" | "web"; side: "left" | "right" }) {
  return (
    <div className={`${side === "right" ? "self-end" : "self-start"} typing flex gap-1 rounded-2xl px-3 py-3 ${theme === "chat" ? "bg-white text-[#667781]" : "bg-[#eef2f5] text-[#52636e]"}`} aria-label="typing">
      <span /><span /><span />
    </div>
  );
}

function Messages({ v, theme }: { v: ReplayView; theme: "chat" | "web" }) {
  return (
    <AnimatePresence mode="popLayout">
      <div key={v.replay.id} className="flex flex-col gap-2">
        {v.customerTyping && <Typing theme={theme} side="right" />}
        {v.showCustomer && <Bubble who="customer" text={v.replay.customer} theme={theme} />}
        {v.agentTyping && <Typing theme={theme} side="left" />}
        {v.showReply && <Bubble who="agent" text={v.replay.reply} theme={theme} />}
      </div>
    </AnimatePresence>
  );
}

export function PhoneChat({ v }: { v: ReplayView }) {
  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[44px] bg-[#0c1a21] p-[10px] shadow-[0_40px_80px_-30px_#0c1a2199]">
      <div className="overflow-hidden rounded-[36px] bg-[#efeae2]">
        <div className="flex items-center justify-between bg-[#0b5c55] px-5 pb-3 pt-4 text-white">
          <span className="font-mono text-[11px]">9:41</span>
          <span className="h-5 w-24 rounded-full bg-[#0c1a21]" aria-hidden />
          <span className="font-mono text-[11px]">5G</span>
        </div>
        <div className="flex items-center gap-3 bg-[#0b5c55] px-4 pb-3 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#5eead4] font-bold text-[#0c1a21]">N</span>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold">Nimbus Home</div>
            <div className="text-[11px] opacity-80">{v.agentTyping ? "typing…" : "Business account · replies instantly"}</div>
          </div>
        </div>
        <div className="flex h-[440px] flex-col justify-end gap-2 overflow-hidden bg-[radial-gradient(#0000000a_1px,transparent_1px)] bg-[size:16px_16px] px-3 py-4">
          <div className="mx-auto mb-1 rounded-md bg-white/80 px-2 py-0.5 text-[10.5px] text-[#54656f]">Today</div>
          <Messages v={v} theme="chat" />
        </div>
        <div className="flex items-center gap-2 bg-[#f0f2f5] px-3 py-2.5">
          <div className="flex-1 rounded-full bg-white px-4 py-2 text-[12.5px] text-[#8696a0]">Message</div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0b5c55] text-white" aria-hidden>➤</span>
        </div>
      </div>
    </div>
  );
}

export function WebWidget({ v }: { v: ReplayView }) {
  return (
    <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-line-2 bg-white shadow-[0_40px_80px_-35px_#0c1a2166]">
      <div className="flex items-center gap-2 border-b border-[#e3e8ee] bg-[#f6f8fa] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b4a]" /><span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" /><span className="h-2.5 w-2.5 rounded-full bg-[#4ade80]" />
        <span className="ml-2 flex-1 truncate rounded-md bg-white px-3 py-1 font-mono text-[11px] text-[#85949f]">nimbushome.example/orders</span>
      </div>
      <div className="relative h-[520px] bg-[#faf9f7]">
        <div className="flex items-center justify-between border-b border-[#ece8e1] px-5 py-3">
          <span className="font-display text-[16px] font-bold text-[#0c1a21]">nimbus<span className="text-[#ff6b4a]">.</span>home</span>
          <span className="flex gap-4 text-[11.5px] text-[#52636e]"><span>Living</span><span>Bedroom</span><span>Lighting</span></span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-5 opacity-60" aria-hidden>
          {["#e8dccb", "#d8e3e0", "#efd9cf", "#dfe2ea", "#e9e4d6", "#d9e6dc"].map((c) => <div key={c} className="aspect-[4/3] rounded-xl" style={{ background: c }} />)}
        </div>
        <div className="absolute bottom-4 right-4 flex w-[300px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-[#e3e8ee] bg-white shadow-[0_24px_60px_-20px_#0c1a2166]">
          <div className="flex items-center gap-2.5 bg-[#0c1a21] px-4 py-3 text-white">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#5eead4] text-[12px] font-bold text-[#0c1a21]">R</span>
            <div className="leading-tight"><div className="text-[13px] font-semibold">Nimbus Home help</div><div className="text-[10.5px] opacity-70">AI assistant · a person is one tap away</div></div>
          </div>
          <div className="flex h-[300px] flex-col justify-end gap-2 overflow-hidden px-3 py-3"><Messages v={v} theme="web" /></div>
          <div className="border-t border-[#e3e8ee] px-3 py-2.5 text-[12px] text-[#85949f]">Ask about an order…</div>
        </div>
      </div>
    </div>
  );
}
