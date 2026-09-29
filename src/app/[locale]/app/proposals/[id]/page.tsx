import type { Metadata } from "next"

import { ProposalView } from "@/components/demo/proposal-view"
import { isLocale, locales } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { SEED_PROPOSAL_IDS } from "@/lib/demo/seed"
import { pageMetadata } from "@/lib/metadata"

// Seeded proposals are prerendered; proposals drafted in the browser render on
// demand (the page is a client shell that reads local demo state).
export function generateStaticParams() {
  return locales.flatMap((locale) => SEED_PROPOSAL_IDS.map((id) => ({ locale, id })))
}

export async function generateMetadata({ params }: PageProps<"/[locale]/app/proposals/[id]">): Promise<Metadata> {
  const { locale, id } = await params
  if (!isLocale(locale)) return {}
  const d = getDictionary(locale)
  const seedKey = { "P-2026-014": "tanneurs", "P-2026-011": "berge", "P-2026-016": "saules", "P-2026-012": "neige", "P-2026-009": "marche", "P-2026-007": "antenne" }[id] as keyof typeof d.seed | undefined
  const title = seedKey ? `${id} · ${d.seed[seedKey].title}` : `${d.meta.pages.proposal.title} ${id}`
  return { ...pageMetadata(locale, `/app/proposals/${id}`, title, seedKey ? d.seed[seedKey].summary : d.meta.pages.proposal.description), robots: { index: false, follow: true } }
}

export default async function ProposalPage({ params }: PageProps<"/[locale]/app/proposals/[id]">) {
  const { id } = await params
  return <ProposalView id={id} />
}
