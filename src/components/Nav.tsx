"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { profile } from "@/content/profile";

const links = [
  { href: "#deployments", label: "Deployments" },
  { href: "#lab", label: "Live Lab" },
  { href: "#playbook", label: "Playbook" },
  { href: "#stack", label: "Stack" },
  { href: "#twin", label: "AI Twin" },
];

type Cmd = { label: string; hint: string; run: () => void };

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [toast, setToast] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const go = useCallback((hash: string) => {
    setOpen(false);
    document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const commands: Cmd[] = useMemo(
    () => [
      { label: "Go to deployments", hint: "Section", run: () => go("#deployments") },
      { label: "Run the Live Lab", hint: "Section", run: () => go("#lab") },
      { label: "Ask my AI twin", hint: "Section", run: () => go("#twin") },
      { label: "See the forward deployment playbook", hint: "Section", run: () => go("#playbook") },
      { label: "Browse the tech stack", hint: "Section", run: () => go("#stack") },
      { label: "Experience and certifications", hint: "Section", run: () => go("#experience") },
      { label: "Contact", hint: "Section", run: () => go("#contact") },
      {
        label: "Copy email address",
        hint: profile.email,
        run: () => {
          navigator.clipboard?.writeText(profile.email).then(() => setToast("Email copied"), () => setToast(profile.email));
          setOpen(false);
        },
      },
      { label: "Open GitHub", hint: "github.com", run: () => { window.open(profile.github, "_blank", "noopener"); setOpen(false); } },
      { label: "Open LinkedIn", hint: "linkedin.com", run: () => { window.open(profile.linkedin, "_blank", "noopener"); setOpen(false); } },
    ],
    [go],
  );
  const filtered = commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { if (open) { setQ(""); setActive(0); setTimeout(() => input.current?.focus(), 30); } }, [open]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 1800); return () => clearTimeout(t); }, [toast]);

  return (
    <>
      <header className="fixed inset-x-0 z-50 gutter" style={{ top: "calc(env(safe-area-inset-top, 0px) + 14px)" }}>
        <nav
          aria-label="Primary"
          className={`mx-auto flex max-w-[1180px] items-center justify-between gap-4 rounded-2xl border px-3 py-2.5 transition-all duration-500 ${
            scrolled ? "border-line bg-panel/75 shadow-[0_20px_60px_-30px_#000] backdrop-blur-xl" : "border-transparent bg-transparent"
          }`}
        >
          <a href="#top" className="flex items-center gap-2.5 pl-1 text-[15px] font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-line-2 bg-panel-2 font-mono text-[11px] text-ice">MTH</span>
            <span className="hidden sm:inline">{profile.shortName}</span>
          </a>
          <div className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-[14px] text-muted transition-colors hover:bg-panel-2 hover:text-fg">
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-line-2 px-3 py-2 text-[13px] text-muted transition-colors hover:text-fg sm:flex"
              aria-label="Open command menu"
            >
              Search <kbd className="rounded border border-line-2 px-1.5 font-mono text-[11px]">⌘K</kbd>
            </button>
            <a href="#contact" className="rounded-lg bg-fg px-4 py-2 text-[14px] font-medium text-ink transition-transform hover:-translate-y-px">
              Hire me
            </a>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/70 px-4 pt-[14vh] backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog" aria-modal="true" aria-label="Command menu"
              className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-line-2 bg-panel shadow-[0_40px_120px_-30px_#000]"
              initial={{ y: 12, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 8, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
            >
              <label htmlFor="cmd-input" className="sr-only">Type a command</label>
              <input
                id="cmd-input" ref={input} value={q}
                onChange={(e) => { setQ(e.target.value); setActive(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                  if (e.key === "Enter") filtered[active]?.run();
                }}
                placeholder="Where to? Try “lab” or “email”"
                className="w-full border-b border-line bg-transparent px-5 py-4 text-[15px] outline-none placeholder:text-dim"
              />
              <ul className="max-h-[50vh] overflow-y-auto p-2">
                {filtered.map((c, i) => (
                  <li key={c.label}>
                    <button
                      type="button" onMouseEnter={() => setActive(i)} onClick={c.run}
                      className={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left text-[14px] ${i === active ? "bg-panel-2 text-fg" : "text-muted"}`}
                    >
                      <span>{c.label}</span>
                      <span className="truncate font-mono text-[11px] text-dim">{c.hint}</span>
                    </button>
                  </li>
                ))}
                {!filtered.length && <li className="px-3 py-6 text-center text-[14px] text-dim">No match. Try “deployments”.</li>}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center">
        {toast && <div className="rounded-full border border-line-2 bg-panel px-4 py-2 text-[13px]">{toast}</div>}
      </div>
    </>
  );
}
