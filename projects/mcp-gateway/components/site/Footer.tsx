import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="gutter border-t border-line">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 py-8 text-[13px] text-muted" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}>
        <div className="flex items-center gap-3 text-fg"><Logo /><span className="text-muted">A portfolio project. Orbit Telecom, its agents and all data are fictional.</span></div>
        <div className="flex gap-4">
          <a className="hover:text-fg" href="https://github.com/tahirbaba/Tahir-s-Portfolio/tree/claude/quirky-volta-w80yvp/projects/mcp-gateway" target="_blank" rel="noopener">Source code ↗</a>
          <span>Built by Muhammad Tahir Hasni</span>
        </div>
      </div>
    </footer>
  );
}
