import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import ClickBurst from "@/components/ClickBurst";
import Cursor from "@/components/Cursor";
import DevConsoleGreeting from "@/components/DevConsoleGreeting";
import KonamiEgg from "@/components/KonamiEgg";
import "./globals.css";

const THEME_INIT_SCRIPT = `
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aashish Pandey — Project Manager & Technical Delivery Lead",
  description:
    "Project manager and technical delivery lead for global brands — Unilever, Wipro, Reliance, ITC — with hands-on CMS and dev experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <div className="vignette-layer" aria-hidden />
        <div className="grain-layer" aria-hidden />
        <Cursor />
        <ClickBurst />
        <KonamiEgg />
        <DevConsoleGreeting />
        {children}
      </body>
    </html>
  );
}
