import type { Metadata } from "next";

const SITE_URL = "https://aashishpandey.com";

export function buildMetadata({
  title,
  description,
  path,
  image,
}: {
  /** Short page title, e.g. "About" — the root layout's title template adds the site name suffix. */
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  // openGraph/twitter titles aren't subject to the root layout's title template,
  // so the full "Page — Aashish Pandey" form has to be built here explicitly.
  const fullTitle = `${title} — Aashish Pandey`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url,
      title: fullTitle,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
