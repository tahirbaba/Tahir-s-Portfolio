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
        <div className="flex flex-col gap-3"><p className="eyebrow">Live demo</p><h1 className="max-w-[22ch] text-[clamp(32px,4.6vw,56px)] font-extrabold leading-[1]">Seven invoices. Seven different endings.</h1>
          <p className="max-w-[64ch] text-[16px] leading-relaxed text-muted">A clean invoice, a short delivery, price creep, a duplicate, a bank-detail change, one over the limit and one with the wrong VAT. Then change an invoice yourself and rerun the live controls.</p></div>
        <DemoClient replays={replays as Replay[]} />
      </div></main>
      <Footer />
    </>
  );
}
