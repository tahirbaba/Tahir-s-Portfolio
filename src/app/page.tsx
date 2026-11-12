import Image from "next/image";
import CopyEmail from "@/components/CopyEmail";
import Deployments from "@/components/Deployments";
import Effects from "@/components/Effects";
import Hero from "@/components/Hero";
import LiveLab from "@/components/LiveLab";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import Twin from "@/components/Twin";
import { DownloadIcon, GitHubIcon, LinkedInIcon, MailIcon, WhatsAppIcon } from "@/components/Icons";
import { certifications, experience, pillars, playbook, profile, reviews, stack, training } from "@/content/profile";

function Socials({ size = "h-11 w-11", only }: { size?: string; only?: string[] }) {
  const all = [
    { href: profile.linkedin, label: "LinkedIn", Icon: LinkedInIcon },
    { href: profile.github, label: "GitHub", Icon: GitHubIcon },
    { href: profile.whatsapp, label: `WhatsApp ${profile.phone}`, Icon: WhatsAppIcon },
    { href: `mailto:${profile.email}`, label: `Email ${profile.email}`, Icon: MailIcon },
  ];
  const items = only ? all.filter((i) => only.some((o) => i.label.startsWith(o))) : all;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map(({ href, label, Icon }) => (
        <li key={label}>
          <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener" aria-label={label} title={label}
            className={`grid ${size} place-items-center rounded-xl border border-line-2 text-muted transition-colors hover:border-ice hover:text-ice`}>
            <Icon className="h-[18px] w-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}

function SectionHead({ eyebrow, title, accent, lead }: { eyebrow: string; title: string; accent?: string; lead?: string }) {
  return (
    <Reveal className="mb-12 flex max-w-[760px] flex-col gap-4">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="text-[clamp(34px,5vw,60px)] font-semibold leading-[1.02] tracking-[-0.035em]">
        {title} {accent && <span className="font-serif font-normal italic tracking-[-0.01em] text-ice">{accent}</span>}
      </h2>
      {lead && <p className="max-w-[60ch] text-[17px] leading-relaxed text-muted">{lead}</p>}
    </Reveal>
  );
}

const marquee = ["Claude Agent SDK", "OpenAI Agents SDK", "LangGraph", "Model Context Protocol", "CrewAI", "Temporal", "pgvector", "Langfuse", "FastAPI", "Next.js", "Kubernetes", "Twilio", "n8n", "A2A"];

export default function Page() {
  return (
    <>
      <Effects />
      <Nav />
      <main>
        <Hero />

        {/* marquee */}
        <div className="relative overflow-hidden border-y border-line bg-panel/40 py-5" aria-label="Tools I deploy with">
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
            {[0, 1].map((k) => (
              <ul key={k} aria-hidden={k === 1} className="flex shrink-0 items-center gap-12 px-6 font-mono text-[14px] text-muted">
                {marquee.map((m) => (
                  <li key={m} className="flex items-center gap-12 whitespace-nowrap">{m}<span className="text-line-2">✦</span></li>
                ))}
              </ul>
            ))}
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink to-transparent" />
        </div>

        {/* FDE pillars */}
        <section className="gutter mx-auto max-w-[1180px] py-28 sm:py-36">
          <SectionHead
            eyebrow="The forward deployed difference"
            title="Not a consultant. Not a contractor."
            accent="An engineer in the field."
            lead={profile.bio[0]}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {pillars.map((p, i) => (
              <Reveal key={p.k} delay={i * 0.08}>
                <article className="card glow-edge flex h-full flex-col gap-4 p-7">
                  <span className="font-serif text-[44px] italic leading-none text-ice">{p.k}</span>
                  <h3 className="text-[20px] font-semibold tracking-tight">{p.title}</h3>
                  <p className="text-[15px] leading-relaxed text-muted">{p.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-4">
            <p className="card p-7 text-[16px] leading-relaxed text-muted md:text-[17px]">{profile.bio[1]}</p>
          </Reveal>
        </section>

        {/* About */}
        <section id="about" className="gutter mx-auto max-w-[1180px] pb-28 sm:pb-36">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
            <Reveal>
              <figure className="card glow-edge relative overflow-hidden p-0">
                <Image src="/tahir.webp" alt="Muhammad Tahir Hasni working at his laptop" width={440} height={540} priority={false} className="h-auto w-full object-cover" sizes="(min-width: 1024px) 420px, 100vw" />
                <figcaption className="absolute bottom-3 left-3 rounded-lg border border-line bg-ink/75 px-3 py-1.5 font-mono text-[11px] text-muted backdrop-blur">
                  <span className="text-amber">●</span> {profile.location} · {profile.timezone}
                </figcaption>
              </figure>
            </Reveal>
            <div className="flex flex-col gap-6">
              <Reveal className="flex flex-col gap-4">
                <p className="eyebrow">About</p>
                <h2 className="text-[clamp(34px,5vw,60px)] font-semibold leading-[1.02] tracking-[-0.035em]">
                  Hi, I'm Tahir. <span className="font-serif font-normal italic tracking-[-0.01em] text-ice">I build agents that do real work.</span>
                </h2>
                <p className="max-w-[60ch] text-[17px] leading-relaxed text-muted">
                  I founded {profile.company} in {profile.since} to help businesses put AI agents into production, not just into slide decks. Since then I've worked with clients in the US, the UAE and other markets, remotely and across time zones.
                </p>
              </Reveal>
              <Reveal>
                <dl className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
                  {[
                    ["Company", `Founder, ${profile.company} · since ${profile.since}`],
                    ["Based in", `${profile.location} · works remotely`],
                    ["Languages", profile.languages.join(" · ")],
                    ["Training", training.map((t) => t.org).join(" · ") + " · Agentic AI"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-1 bg-ink px-5 py-4">
                      <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">{k}</dt>
                      <dd className="text-[15px] font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
              <Reveal className="flex flex-wrap items-center gap-3">
                <a href={profile.resume} download className="inline-flex items-center gap-2 rounded-xl bg-ice px-5 py-3 text-[15px] font-semibold text-ink transition-transform hover:-translate-y-0.5">
                  <DownloadIcon className="h-[18px] w-[18px]" /> Download résumé
                </a>
                <Socials />
              </Reveal>
            </div>
          </div>
        </section>

        {/* Deployments */}
        <section id="deployments" className="gutter mx-auto max-w-[1180px] pb-28 sm:pb-36">
          <SectionHead
            eyebrow="Live projects"
            title="Six agents."
            accent="All live."
            lead="Each one solves a problem companies are paying to fix in 2026, runs live with a demo you can try, and ships with its own tests and evals. The businesses and data in the demos are fictional; every number below is measured."
          />
          <Reveal><Deployments /></Reveal>
        </section>

        {/* Reviews */}
        <section id="reviews" className="gutter mx-auto max-w-[1180px] pb-28 sm:pb-36">
          <SectionHead
            eyebrow="Reviews"
            title="Checked by people"
            accent="who know the field."
            lead="Every review links to the reviewer's public profile and is labelled for what it is: a client, a pilot client or an expert who reviewed the work."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <Reveal key={r.name}>
                <article className="card glow-edge flex h-full flex-col gap-4 p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-ice/40 bg-ice/10 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-ice">{r.label}</span>
                    <a href={r.projectHref} target="_blank" rel="noopener" className="font-mono text-[12px] text-muted hover:text-ice">{r.project} ↗</a>
                  </div>
                  {r.quote && <blockquote className="font-serif text-[22px] italic leading-snug">“{r.quote}”</blockquote>}
                  <p className="text-[15.5px] leading-relaxed text-muted">{r.summary}</p>
                  <a href={r.href} target="_blank" rel="noopener" className="mt-auto flex items-center gap-3 border-t border-line pt-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-panel-2 font-semibold text-ice">{r.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-1.5 text-[15px] font-semibold">{r.name} <LinkedInIcon className="h-3.5 w-3.5 text-muted" /></span>
                      <span className="truncate text-[13px] text-muted">{r.title}</span>
                    </span>
                  </a>
                </article>
              </Reveal>
            ))}
            <Reveal>
              <div className="flex h-full flex-col justify-center gap-4 rounded-[20px] border border-dashed border-line-2 p-7">
                <h3 className="text-[20px] font-semibold tracking-tight">Tried one of the agents?</h3>
                <p className="text-[15px] leading-relaxed text-muted">I'd value your honest feedback, good or bad. Reviews only appear here with your permission and a link to your profile.</p>
                <div className="flex flex-wrap gap-2">
                  <a href={`mailto:${profile.email}?subject=${encodeURIComponent("Feedback on your AI agents")}`} className="inline-flex items-center gap-2 rounded-xl border border-line-2 px-4 py-2.5 text-[14px] font-medium transition-colors hover:border-ice hover:text-ice"><MailIcon className="h-4 w-4" /> Send feedback</a>
                  <a href={`${profile.whatsapp}?text=${encodeURIComponent("Hi Tahir, feedback on your AI agents: ")}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl border border-line-2 px-4 py-2.5 text-[14px] font-medium transition-colors hover:border-ice hover:text-ice"><WhatsAppIcon className="h-4 w-4" /> On WhatsApp</a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Live Lab */}
        <section id="lab" className="relative overflow-hidden border-y border-line bg-panel/30 py-28 sm:py-36">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[900px] -translate-x-1/2 rounded-full bg-ice-deep/10 blur-[120px]" />
          <div className="gutter relative mx-auto max-w-[1180px]">
            <SectionHead
              eyebrow="Live Lab · runs on Claude"
              title="Don't read about it."
              accent="Deploy it."
              lead="Describe a workflow that's costing your team time. Three agents I built will scope it, architect an agent system and plan the rollout, the same way I would in week one."
            />
            <Reveal><LiveLab /></Reveal>
          </div>
        </section>

        {/* Playbook */}
        <section id="playbook" className="gutter mx-auto max-w-[1180px] py-28 sm:py-36">
          <SectionHead eyebrow="Forward deployment playbook" title="From first meeting to" accent="production in six weeks." />
          <ol className="relative grid gap-4 md:grid-cols-5">
            <span aria-hidden className="absolute left-0 right-0 top-[22px] hidden h-px bg-gradient-to-r from-ice via-line-2 to-transparent md:block" />
            {playbook.map((p, i) => (
              <Reveal key={p.week} delay={i * 0.07}>
                <li className="relative flex flex-col gap-3">
                  <span className={`relative z-10 grid h-11 w-11 place-items-center rounded-full border font-mono text-[12px] ${i === 0 ? "border-ice bg-ice text-ink" : "border-line-2 bg-ink text-muted"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[12px] text-ice">{p.week}</span>
                  <h3 className="text-[19px] font-semibold tracking-tight">{p.title}</h3>
                  <p className="text-[14.5px] leading-relaxed text-muted">{p.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Stack */}
        <section id="stack" className="gutter mx-auto max-w-[1180px] pb-28 sm:pb-36">
          <SectionHead eyebrow="Tech stack" title="The toolkit I" accent="carry into the field." />
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {stack.map((g) => (
              <div key={g.group} className="flex flex-col gap-4 bg-ink p-6 transition-colors hover:bg-panel">
                <h3 className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-dim">{g.group}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((s) => <span key={s} className="chip text-[13px]">{s}</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Experience + certifications */}
        <section id="experience" className="gutter mx-auto grid max-w-[1180px] gap-14 pb-28 sm:pb-36 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <SectionHead eyebrow="Experience" title="Three years of" accent="shipping." lead={`Since ${profile.since}: running ${profile.company} and freelancing for clients in the US, the UAE and other markets.`} />
            <ol className="flex flex-col">
              {experience.map((e) => (
                <Reveal key={e.title}>
                  <li className="grid gap-2 border-t border-line py-7 sm:grid-cols-[130px_1fr] sm:gap-6">
                    <span className="font-mono text-[12.5px] text-dim">{e.period}</span>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-[19px] font-semibold tracking-tight">{e.title}</h3>
                      <p className="text-[14px] text-ice">{e.org}</p>
                      <p className="text-[15px] leading-relaxed text-muted">{e.body}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
          <div className="flex flex-col gap-12">
            <div>
              <SectionHead eyebrow="Training" title="Where I" accent="trained." />
              <ul className="flex flex-col gap-2.5">
                {training.map((t) => (
                  <li key={t.org} className="card glow-edge flex flex-col gap-2 px-5 py-4">
                    <span className="flex flex-col"><span className="text-[16px] font-semibold">{t.org}</span><span className="text-[12.5px] text-dim">{t.full}</span></span>
                    <span className="flex flex-wrap gap-1.5">{t.items.map((i) => <span key={i} className="chip text-[12.5px]">{i}</span>)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-mono text-[11.5px] uppercase tracking-[0.14em] text-dim">Certifications</h3>
              <ul className="flex flex-col gap-2.5">
                {certifications.map((c) => {
                  const inner = (
                    <>
                      <span className="flex min-w-0 flex-col">
                        <span className="font-mono text-[11px] text-dim">{c.issuer}</span>
                        <span className="text-[15px] font-medium">{c.name}</span>
                      </span>
                      {c.status === "earned" ? <span aria-hidden className="text-ice">↗</span> : <span className="shrink-0 rounded-full border border-amber/40 px-2.5 py-0.5 font-mono text-[11px] text-amber">In progress</span>}
                    </>
                  );
                  return (
                    <li key={c.name}>
                      {c.href ? <a href={c.href} target="_blank" rel="noopener" className="card glow-edge flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:border-line-2">{inner}</a>
                        : <div className="card flex items-center justify-between gap-4 px-5 py-4">{inner}</div>}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        {/* Twin */}
        <section id="twin" className="gutter mx-auto grid max-w-[1180px] items-center gap-12 pb-28 sm:pb-36 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHead
            eyebrow="AI twin"
            title="Interview my agent"
            accent="before you interview me."
            lead="It answers from this portfolio only: deployments, stack, playbook and availability. It's also a small demo of the grounding and guardrails I put on every customer-facing agent."
          />
          <Reveal><Twin /></Reveal>
        </section>

        {/* Contact */}
        <section id="contact" className="relative overflow-hidden border-t border-line grain">
          <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/2 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-ice-deep/15 blur-[140px]" />
          <div className="gutter relative mx-auto flex max-w-[1180px] flex-col gap-8 py-28 sm:py-40">
            <p className="eyebrow">Contact</p>
            <h2 className="max-w-[16ch] text-[clamp(44px,8vw,112px)] font-semibold leading-[0.92] tracking-[-0.05em]">
              Got a workflow that should <span className="font-serif font-normal italic text-ice">run itself?</span>
            </h2>
            <p className="max-w-[56ch] text-[18px] leading-relaxed text-muted">
              I'm open to remote Forward Deployed Engineer and AI engineering roles, and through {profile.company}, to new agent projects. I usually reply within a day, in English, Arabic or Urdu.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <CopyEmail email={profile.email} />
              <a href={profile.whatsapp} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl border border-line-2 px-5 py-3.5 text-[15px] font-medium transition-colors hover:border-ice hover:text-ice"><WhatsAppIcon className="h-[18px] w-[18px]" /> WhatsApp</a>
              <a href={profile.resume} download className="inline-flex items-center gap-2 rounded-xl border border-line-2 px-5 py-3.5 text-[15px] font-medium transition-colors hover:border-ice hover:text-ice"><DownloadIcon className="h-[18px] w-[18px]" /> Résumé (PDF)</a>
              <Socials size="h-[52px] w-[52px]" only={["LinkedIn", "GitHub"]} />
            </div>
          </div>
        </section>
      </main>

      <footer className="gutter border-t border-line">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 py-8 text-[13px] text-dim" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}>
          <span>© {new Date().getFullYear()} {profile.name} · {profile.location}</span>
          <span className="font-mono">Built with Next.js, Three.js and Claude · press ⌘K</span>
        </div>
      </footer>
    </>
  );
}
