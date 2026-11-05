"use client";

import { useState } from "react";

export default function CopyEmail({ email }: { email: string }) {
  const [label, setLabel] = useState("Copy");
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-line-2 bg-panel py-2 pl-5 pr-2">
      <span className="min-w-0 select-all break-all text-[clamp(16px,2vw,20px)] font-medium">{email}</span>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(email).then(() => { setLabel("Copied"); setTimeout(() => setLabel("Copy"), 1600); }, () => setLabel("Select it"))}
        className="shrink-0 rounded-xl bg-fg px-4 py-2.5 text-[14px] font-semibold text-ink"
      >
        {label}
      </button>
    </div>
  );
}
