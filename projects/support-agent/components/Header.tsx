import Link from "next/link";

export default function Header({ active }: { active: "demo" | "evals" }) {
  const tab = (href: string, label: string, on: boolean) => (
    <Link href={href} className={`rounded-lg px-3 py-1.5 text-[13.5px] transition-colors ${on ? "bg-panel-2 text-fg" : "text-muted hover:text-fg"}`}>{label}</Link>
  );
  return (
    <header className="gutter border-b border-line">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 py-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ice font-mono text-[12px] font-bold text-ink">R</span>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold">Relay <span className="font-normal text-muted">· support agent</span></div>
            <div className="font-mono text-[11px] text-dim">for Nimbus Home, a fictional store · all data synthetic</div>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {tab("/", "Live demo", active === "demo")}
          {tab("/evals", "Evals", active === "evals")}
          <a href="https://github.com/tahirbaba/Tahir-s-Portfolio/tree/claude/quirky-volta-w80yvp/projects/support-agent" target="_blank" rel="noopener" className="rounded-lg px-3 py-1.5 text-[13.5px] text-muted hover:text-fg">Code ↗</a>
        </nav>
      </div>
    </header>
  );
}
