"use client";

import { useState } from "react";

function Field({ id, label, hint, value, onChange, min, max, step, suffix }: { id: string; label: string; hint?: string; value: number; onChange: (n: number) => void; min: number; max: number; step: number; suffix?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[14px] font-medium">{label}</label>
        <span className="font-mono text-[14px] tabular-nums">{value.toLocaleString()}{suffix}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="accent-[var(--color-ice)]" />
      {hint && <span className="text-[12px] text-dim">{hint}</span>}
    </div>
  );
}

export default function RoiCalculator() {
  const [tickets, setTickets] = useState(3000);
  const [share, setShare] = useState(40);
  const [minutes, setMinutes] = useState(6);
  const [hourly, setHourly] = useState(12);
  const [aiCost, setAiCost] = useState(0.08);

  const handled = Math.round((tickets * share) / 100);
  const hours = Math.round((handled * minutes) / 60);
  const labour = hours * hourly;
  const ai = handled * aiCost;
  const net = labour - ai;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="panel flex flex-col gap-6 p-6 sm:p-8">
        <Field id="roi-tickets" label="Support conversations per month" value={tickets} onChange={setTickets} min={200} max={30000} step={100} />
        <Field id="roi-share" label="Share Relay resolves end to end" hint="Start conservative and replace with the rate measured in your pilot." value={share} onChange={setShare} min={10} max={80} step={5} suffix="%" />
        <Field id="roi-min" label="Agent minutes per conversation today" value={minutes} onChange={setMinutes} min={2} max={20} step={1} suffix=" min" />
        <Field id="roi-hourly" label="Loaded cost per support hour" value={hourly} onChange={setHourly} min={4} max={60} step={1} suffix=" USD" />
        <Field id="roi-ai" label="AI cost per conversation" hint="An assumption until measured by the eval run." value={aiCost} onChange={setAiCost} min={0.01} max={0.5} step={0.01} suffix=" USD" />
      </div>
      <div className="dark-zone flex flex-col justify-between gap-6 rounded-[20px] border border-line bg-ink p-6 sm:p-8">
        <div>
          <p className="eyebrow">Your estimate per month</p>
          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {[["Conversations handled", handled.toLocaleString()], ["Team hours freed", hours.toLocaleString()], ["Labour cost saved", `$${labour.toLocaleString()}`], ["AI cost", `$${Math.round(ai).toLocaleString()}`]].map(([k, v]) => (
              <div key={k} className="bg-panel p-4"><div className="font-display text-[26px] font-bold tabular-nums">{v}</div><div className="text-[12px] text-muted">{k}</div></div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[13px] text-muted">Net saving per month</div>
          <div className={`font-display text-[clamp(40px,6vw,60px)] font-extrabold tabular-nums tracking-tight ${net >= 0 ? "text-ice" : "text-rose"}`}>${Math.round(net).toLocaleString()}</div>
          <p className="mt-2 text-[12px] leading-relaxed text-dim">Calculated only from the numbers you set. It is not a quote or a guarantee.</p>
        </div>
      </div>
    </div>
  );
}
