import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-bricolage", display: "swap" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["400", "600"], variable: "--font-naskh-ar", display: "swap" });
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: ["400", "600"], variable: "--font-nastaliq-ur", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Relay · AI support agent for multilingual stores", template: "%s · Relay" },
  description: "Relay answers customers in English, Arabic and Urdu, refunds within policy, routes big refunds for approval and hands hard cases to your team. Measured by a 116-case eval suite.",
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
