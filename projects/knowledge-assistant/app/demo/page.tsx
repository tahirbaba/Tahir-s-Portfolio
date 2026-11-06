import type { Metadata } from "next";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import DemoClient from "@/components/demo/DemoClient";
import type { Replay } from "@/components/demo/types";
import replays from "@/data/replays.json";

export const metadata: Metadata = { title: "Live demo" };
export default function DemoPage() {
  return (
    <>
      <Nav active="/demo" />
      <main className="gutter"><div className="mx-auto flex max-w-[1240px] flex-col gap-8 py-10">
        <div className="flex flex-col gap-3"><p className="eyebrow">Live demo</p><h1 className="max-w-[22ch] text-[clamp(32px,4.6vw,56px)] font-extrabold leading-[1]">Same question, different person, different answer.</h1>
          <p className="max-w-[64ch] text-[16px] leading-relaxed text-muted">Watch Compass answer as an employee, a manager and HR. Then ask a question once and see exactly what each role's search returns, live.</p></div>
        <DemoClient replays={replays as Replay[]} />
      </div></main>
      <Footer />
    </>
  );
}
