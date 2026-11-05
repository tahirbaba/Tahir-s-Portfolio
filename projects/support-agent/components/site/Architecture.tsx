/** Architecture diagram drawn with HTML boxes and SVG connectors so it stays sharp and themeable. */
const Box = ({ title, items, tone = "" }: { title: string; items: string[]; tone?: string }) => (
  <div className={`rounded-2xl border bg-panel p-4 ${tone || "border-line"}`}>
    <div className="text-[14px] font-bold">{title}</div>
    <ul className="mt-2 flex flex-col gap-1">{items.map((i) => <li key={i} className="font-mono text-[11.5px] text-muted">{i}</li>)}</ul>
  </div>
);
const Arrow = ({ label }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-1 lg:flex-col lg:py-0" aria-hidden>
    <span className="h-6 w-px bg-line-2 lg:h-px lg:w-8" />
    {label && <span className="font-mono text-[10px] text-dim">{label}</span>}
    <span className="text-[12px] text-ice lg:hidden">↓</span><span className="hidden text-[12px] text-ice lg:inline">→</span>
  </div>
);

export default function Architecture() {
  return (
    <div className="dark-zone rounded-3xl border border-line bg-ink p-5 sm:p-8" role="img" aria-label="Architecture: customer channels to a Next.js API, then the Claude agent loop with seven tools, a rules engine, store systems, human approval and observability.">
      <div className="grid items-center gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1.2fr_auto_1fr]">
        <Box title="Channels" items={["Chat app", "Website widget", "EN · AR · UR · Roman UR"]} />
        <Arrow label="HTTPS" />
        <Box title="API layer" items={["HMAC-signed state", "Rate limit", "Input limits"]} />
        <Arrow />
        <Box title="Agent loop · Claude" items={["Tool use, adaptive thinking", "Prompt caching", "Refusal fallback", "Max 8 steps / turn"]} tone="border-ice/50" />
        <Arrow label="7 tools" />
        <Box title="Rules engine" items={["Identity check", "30-day window", "100 USD limit", "Dedup, caps"]} tone="border-coral/50" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Box title="Store systems" items={["Orders · payments", "Policies (search)", "Carrier tracking"]} />
        <Box title="People" items={["Approval inbox (>100 USD)", "Escalation with summary"]} tone="border-amber/50" />
        <Box title="Observability" items={["Trace per turn", "PII masking", "Cost + latency", "116-case evals"]} />
      </div>
    </div>
  );
}
