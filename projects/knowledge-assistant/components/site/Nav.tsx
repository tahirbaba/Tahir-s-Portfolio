import Link from "next/link";
import Logo from "./Logo";

const LINKS = [
  { href: "/demo", label: "Live demo" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/case-study", label: "Case study" },
  { href: "/evals", label: "Evals" },
];

export default function Nav({ active }: { active?: string }) {
  return (
    <header className="gutter sticky z-50 border-b border-line bg-ink/85 backdrop-blur-xl" style={{ top: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 py-3">
        <Link href="/" aria-label="Compass home" className="text-fg"><Logo /></Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`rounded-lg px-3 py-2 text-[14px] transition-colors ${active === l.href ? "bg-panel text-fg shadow-sm" : "text-muted hover:text-fg"}`}>{l.label}</Link>
          ))}
        </nav>
        <Link href="/demo" className="btn btn-primary !px-4 !py-2 text-[14px]">Watch it work</Link>
      </div>
      <nav aria-label="Primary mobile" className="-mx-1 flex gap-1 overflow-x-auto pb-2 md:hidden">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] ${active === l.href ? "bg-panel text-fg" : "text-muted"}`}>{l.label}</Link>
        ))}
      </nav>
    </header>
  );
}
