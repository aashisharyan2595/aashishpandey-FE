import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import ClickBurst from "@/components/ClickBurst";
import Cursor from "@/components/Cursor";
import DevConsoleGreeting from "@/components/DevConsoleGreeting";
import InteractiveBackground from "@/components/InteractiveBackground";
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

const SITE_URL = "https://aashishpandey.com";
const SITE_NAME = "Aashish Pandey";
const SITE_DESCRIPTION =
  "Project manager and technical delivery lead for global brands — Unilever, Wipro, Reliance, ITC — with hands-on CMS and dev experience.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Project Manager & Technical Delivery Lead`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Aashish Pandey",
    "Project Manager",
    "Technical Delivery Lead",
    "Business Analyst",
    "Agile delivery",
    "CMS architecture",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Project Manager & Technical Delivery Lead`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Project Manager & Technical Delivery Lead`,
    description: SITE_DESCRIPTION,
  },
};

const PERSON_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE_NAME,
  url: SITE_URL,
  jobTitle: "Project Manager & Technical Delivery Lead",
  description: SITE_DESCRIPTION,
  sameAs: [
    "https://linkedin.com/in/aashish-kumar-pandey",
    "https://github.com/aashisharyan2595",
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSON_LD) }}
        />
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <div className="vignette-layer" aria-hidden />
        <div className="grain-layer" aria-hidden />
        <InteractiveBackground />
        <Cursor />
        <ClickBurst />
        <KonamiEgg />
        <DevConsoleGreeting />
        {children}
      </body>
    </html>
  );
}
