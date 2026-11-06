"use client";

import { useState } from "react";
import { scriptClass, type Hit } from "./types";

/** Renders an answer with clickable citation chips that reveal the source section. */
export default function Answer({ text, sources }: { text: string; sources: Hit[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const parts = text.split(/(\[[A-Z0-9-]+#\d+\])/g);
  const src = sources.find((s) => s.id === open);
  return (
    <div className="flex flex-col gap-2">
      <p dir="auto" className={`text-[14.5px] leading-relaxed ${scriptClass(text)}`}>
        {parts.map((p, i) => {
          const m = p.match(/^\[([A-Z0-9-]+#\d+)\]$/);
          return m ? <button key={i} type="button" onClick={() => setOpen(open === m[1] ? null : m[1])} className="mx-0.5 rounded-md bg-ice/15 px-1.5 py-0.5 align-middle font-mono text-[11px] text-ice hover:bg-ice/25">{m[1]}</button> : <span key={i}>{p}</span>;
        })}
      </p>
      {src && <div className="rounded-xl border border-ice/30 bg-teal-soft/40 p-3 text-[12.5px]"><p className="font-mono text-[11px] text-ice">{src.title} · {src.heading} · updated {src.updated}</p><p className="mt-1 text-fg">{src.text}</p></div>}
    </div>
  );
}
