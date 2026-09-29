import { notFound } from "next/navigation"

import { AppBar } from "@/components/demo/app-bar"
import { AppProvider } from "@/components/demo/app-provider"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"

export default async function AppLayout({ children, params }: LayoutProps<"/[locale]/app">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const d = getDictionary(locale)
  return (
    <AppProvider locale={locale} copy={{ app: d.app, plan: d.plan, domain: d.domain, seed: d.seed, demoBadge: d.common.demoBadge }}>
      <AppBar />
      <div className="flex flex-1 flex-col">{children}</div>
    </AppProvider>
  )
}
