import type { MetadataRoute } from "next"

import { locales, SITE_URL } from "@/i18n/config"

// /pricing is deliberately absent: it exists for internal review only.
const PATHS = ["", "/how-it-works", "/app", "/app/record", "/credits"]

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.flatMap((path) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l === "en" ? "en-CA" : "fr-CA", `${SITE_URL}/${l}${path}`])),
      },
    }))
  )
}
