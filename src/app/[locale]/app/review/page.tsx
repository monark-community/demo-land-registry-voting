import type { Metadata } from "next"

import { ReviewView } from "@/components/demo/review-view"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/app/review">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.review
  return { ...pageMetadata(locale, "/app/review", m.title, m.description), robots: { index: false, follow: true } }
}

export default function ReviewPage() {
  return <ReviewView />
}
