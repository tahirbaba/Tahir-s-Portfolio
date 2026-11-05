import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-bricolage", display: "swap" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["400", "600"], variable: "--font-naskh-ar", display: "swap" });
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: ["400", "600"], variable: "--font-nastaliq-ur", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Leadline · Answer every lead in under a minute", template: "%s · Leadline" },
  description: "Leadline replies to inbound leads in seconds, scores them against your ideal customer profile, books meetings across time zones and logs everything to your CRM.",
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#f3f5f7", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${mono.variable} ${bricolage.variable} ${naskh.variable} ${nastaliq.variable}`}>
      <body>{children}</body>
    </html>
  );
}
