import type { Metadata } from "next"

import { RecordView } from "@/components/demo/record-view"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/app/record">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.record
  return pageMetadata(locale, "/app/record", m.title, m.description)
}

export default function RecordPage() {
  return <RecordView />
}
