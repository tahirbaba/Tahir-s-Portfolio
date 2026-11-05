"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
import { metrics, profile, sites } from "@/content/profile";
import Counter from "./Counter";

const Globe = dynamic(() => import("./Globe"), { ssr: false });

export default function Hero() {
  const reduce = useReducedMotion();
  const rise = (d: number) =>
    reduce ? {} : { initial: { y: 24, opacity: 0.2 }, animate: { y: 0, opacity: 1 }, transition: { duration: 1, delay: d, ease: [0.16, 1, 0.3, 1] as const } };

  return (
    <section id="top" className="relative overflow-hidden grain">
      {/* backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-[-10%] h-[720px] w-[720px] rounded-full bg-ice-deep/15 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_80%_70%_at_70%_30%,#000_20%,transparent_75%)]" />
      </div>

      <div className="gutter relative mx-auto grid max-w-[1180px] items-center gap-6 pb-14 pt-32 lg:grid-cols-[1.05fr_1fr] lg:pt-40">
        <div className="relative z-10 flex min-w-0 flex-col gap-7">
          <motion.p {...rise(0)} className="inline-flex items-center gap-2.5 self-start rounded-full border border-line-2 bg-panel/70 px-3.5 py-1.5 font-mono text-[12px] text-muted backdrop-blur">
            <span className="live-dot" /> Available · remote from {profile.location} · {profile.timezone}
          </motion.p>

          <motion.p {...rise(0.05)} className="eyebrow">{profile.role} · {profile.secondaryRole}</motion.p>

          <motion.h1 {...rise(0.1)} className="text-[clamp(44px,7.4vw,92px)] font-semibold leading-[0.95] tracking-[-0.045em]">
            I ship AI agents into the{" "}
            <span className="font-serif text-[1.08em] font-normal italic tracking-[-0.02em] text-ice">real world.</span>
          </motion.h1>

          <motion.p {...rise(0.18)} className="max-w-[54ch] text-[18px] leading-relaxed text-muted">
            <span className="text-fg">{profile.name}.</span> {profile.intro}
          </motion.p>

          <motion.div {...rise(0.26)} className="flex flex-wrap gap-3">
            <a href="#lab" className="group inline-flex items-center gap-2 rounded-xl bg-ice px-5 py-3.5 text-[15px] font-semibold text-ink transition-transform hover:-translate-y-0.5">
              Deploy an agent on your problem
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
            <a href="#deployments" className="inline-flex items-center gap-2 rounded-xl border border-line-2 px-5 py-3.5 text-[15px] font-medium transition-colors hover:border-ice hover:text-ice">
              View field deployments
            </a>
          </motion.div>
        </div>

        <div className="relative -mx-5 aspect-square max-h-[620px] min-w-0 sm:mx-0 lg:-mr-16">
          <Globe />
          <div className="pointer-events-none absolute bottom-[6%] left-[6%] rounded-xl border border-line bg-ink/70 px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-muted backdrop-blur">
            <span className="text-amber">●</span> HQ {profile.location.split(",")[0]} · {profile.coords}
            <br />
            <span className="text-ice">●</span> {sites.length} deployment routes · drag to rotate
          </div>
        </div>
      </div>

      <div className="gutter relative mx-auto max-w-[1180px] pb-20">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col-reverse gap-1 bg-ink px-6 py-6">
              <dt className="text-[13px] text-muted">{m.label}</dt>
              <dd className="text-[clamp(30px,3.6vw,44px)] font-semibold tracking-tight">
                <Counter value={m.value} decimals={m.decimals} suffix={m.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
