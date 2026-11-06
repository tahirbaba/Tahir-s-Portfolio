import CopyEmail from "@/components/CopyEmail";
import Deployments from "@/components/Deployments";
import Effects from "@/components/Effects";
import Hero from "@/components/Hero";
import LiveLab from "@/components/LiveLab";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import Twin from "@/components/Twin";
import { certifications, experience, pillars, playbook, profile, stack } from "@/content/profile";

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
          <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
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
            <SectionHead eyebrow="Experience" title="Where I've" accent="built." />
            <ol className="flex flex-col">
              {experience.map((e) => (
                <Reveal key={e.period}>
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
          <div>
            <SectionHead eyebrow="Certifications" title="Verified" accent="learning." />
            <ul className="flex flex-col gap-2.5">
              {certifications.map((c) => (
                <li key={c.name}>
                  <a href={c.href} className="card glow-edge flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:border-line-2">
                    <span className="flex min-w-0 flex-col">
                      <span className="font-mono text-[11px] text-dim">{c.issuer}</span>
                      <span className="text-[15px] font-medium">{c.name}</span>
                    </span>
                    <span aria-hidden className="text-ice">↗</span>
                  </a>
                </li>
              ))}
            </ul>
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
              I'm open to remote Forward Deployed Engineer and AI engineering roles, and to a small number of agent deployments. I usually reply within a day.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <CopyEmail email={profile.email} />
              <a href={profile.linkedin} target="_blank" rel="noopener" className="rounded-xl border border-line-2 px-5 py-3.5 text-[15px] font-medium transition-colors hover:border-ice hover:text-ice">LinkedIn ↗</a>
              <a href={profile.github} target="_blank" rel="noopener" className="rounded-xl border border-line-2 px-5 py-3.5 text-[15px] font-medium transition-colors hover:border-ice hover:text-ice">GitHub ↗</a>
              <a href={profile.resume} className="rounded-xl border border-line-2 px-5 py-3.5 text-[15px] font-medium transition-colors hover:border-ice hover:text-ice">Résumé (PDF)</a>
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
