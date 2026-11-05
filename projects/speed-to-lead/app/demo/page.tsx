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
        <div className="flex flex-col gap-3">
          <p className="eyebrow">Live demo</p>
          <h1 className="max-w-[22ch] text-[clamp(32px,4.6vw,56px)] font-extrabold leading-[1]">Watch a lead go from hello to booked.</h1>
          <p className="max-w-[64ch] text-[16px] leading-relaxed text-muted">On the left, what the lead sees on email or WhatsApp. On the right, every score, rule and booking check Leadline runs. Seven leads, four languages, three channels.</p>
        </div>
        <DemoClient replays={replays as Replay[]} />
      </div></main>
      <Footer />
    </>
  );
}
