import type { Metadata } from "next"

import { DraftView } from "@/components/demo/draft-view"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/app/new">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.new
  return { ...pageMetadata(locale, "/app/new", m.title, m.description), robots: { index: false, follow: true } }
}

export default function NewProposalPage() {
  return <DraftView />
}
