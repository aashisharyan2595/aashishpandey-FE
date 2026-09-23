import type { Metadata } from "next";
import { Big_Shoulders, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const THEME_INIT_SCRIPT = `
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
`;

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const bigShoulders = Big_Shoulders({
  variable: "--font-shoulders",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
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
      className={`${plexSans.variable} ${plexMono.variable} ${bigShoulders.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSON_LD) }}
        />
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        {/* Shared filter used by every .stamp element for an inked, slightly
            imperfect stamp edge instead of a clean vector circle. */}
        <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
          <filter id="stamp-roughen">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" />
          </filter>
        </svg>
        {children}
      </body>
    </html>
  );
}
