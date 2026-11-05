import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["400", "600"], variable: "--font-naskh-ar", display: "swap" });
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: ["400", "600"], variable: "--font-nastaliq-ur", display: "swap" });

export const metadata: Metadata = {
  title: "Relay · Multilingual Support Agent",
  description: "A customer support agent that speaks English, Arabic and Urdu, enforces refund and identity rules in code, hands off to humans, and is measured by a 116-case eval suite.",
};
export const viewport: Viewport = { themeColor: "#06080c", colorScheme: "dark", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${mono.variable} ${naskh.variable} ${nastaliq.variable}`}>
      <body>{children}</body>
    </html>
  );
}
