import Console from "@/components/Console";
import Header from "@/components/Header";

export default function Page() {
  return (
    <>
      <Header active="demo" />
      <main className="gutter">
        <div className="mx-auto max-w-[1400px] pt-7">
          <h1 className="max-w-[24ch] text-[clamp(26px,3.4vw,40px)] font-semibold leading-tight tracking-tight">
            A support agent that follows the rules, in English, Arabic and Urdu.
          </h1>
          <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-muted">
            Relay verifies the customer, checks policy, refunds within limits, sends bigger refunds for approval and hands hard cases to a person. The right panel shows every tool call it makes.
          </p>
        </div>
        <Console />
      </main>
    </>
  );
}
