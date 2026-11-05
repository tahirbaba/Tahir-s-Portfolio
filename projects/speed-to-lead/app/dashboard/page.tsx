import type { Metadata } from "next";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import Dashboard from "@/components/dashboard/Dashboard";

export const metadata: Metadata = { title: "Sales dashboard" };
export default function DashboardPage() {
  return (
    <>
      <Nav active="/dashboard" />
      <main className="gutter"><div className="mx-auto flex max-w-[1240px] flex-col gap-8 py-10">
        <div className="flex flex-col gap-3">
          <p className="eyebrow">Sales dashboard</p>
          <h1 className="max-w-[24ch] text-[clamp(32px,4.6vw,56px)] font-extrabold leading-[1]">Every lead answered. Every rep focused.</h1>
          <p className="max-w-[64ch] text-[16px] leading-relaxed text-muted">The pipeline Leadline builds, where leads come from, which ones are hot right now and how the meetings are spread across your team.</p>
        </div>
        <Dashboard />
      </div></main>
      <Footer />
    </>
  );
}
