import type { Metadata } from "next";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import Dashboard from "@/components/dashboard/Dashboard";

export const metadata: Metadata = { title: "Manager dashboard" };

export default function DashboardPage() {
  return (
    <>
      <Nav active="/dashboard" />
      <main className="gutter">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 py-10">
          <div className="flex flex-col gap-3">
            <p className="eyebrow">Manager dashboard</p>
            <h1 className="max-w-[24ch] text-[clamp(32px,4.6vw,56px)] font-extrabold leading-[1]">Stay in control of every conversation.</h1>
            <p className="max-w-[64ch] text-[16px] leading-relaxed text-muted">See what Relay resolved, what it handed to your team, and approve the refunds that need a person.</p>
          </div>
          <Dashboard />
        </div>
      </main>
      <Footer />
    </>
  );
}
