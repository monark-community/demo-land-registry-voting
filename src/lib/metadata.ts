import type { Metadata } from "next"

import { locales, type Locale } from "@/i18n/config"

/** Per-page metadata with canonical URL and hreflang alternates. */
export function pageMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  const suffix = path === "/" ? "" : path
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${suffix}`,
      languages: Object.fromEntries([...locales.map((l) => [l === "en" ? "en-CA" : "fr-CA", `/${l}${suffix}`]), ["x-default", `/en${suffix}`]]),
    },
    openGraph: { title, description, url: `/${locale}${suffix}` },
  }
}
