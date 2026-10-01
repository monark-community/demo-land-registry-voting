import Link from "next/link"
import { locale as rootLocale } from "next/root-params"

import { Button } from "@/components/ui/button"
import { PlanSvg } from "@/components/plan/plan-svg"
import { getDictionary } from "@/i18n"
import { href, isLocale, type Locale } from "@/i18n/config"

async function currentLocale(): Promise<Locale> {
  const value = await rootLocale()
  return value && isLocale(value) ? value : "en"
}

export default async function NotFound() {
  const locale = await currentLocale()
  const dict = getDictionary(locale)
  const n = dict.notFound
  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
      <div>
        <p className="annot text-muted-foreground">{n.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-display sm:text-5xl">{n.title}</h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">{n.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={href(locale)}>{n.home}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={href(locale, "/app")}>{n.demo}</Link>
          </Button>
        </div>
      </div>
      <div className="aspect-[4/3] overflow-hidden rounded-md border border-foreground/20" aria-hidden="true">
        <PlanSvg labels={dict.plan.labels} title="" idPrefix="nf" box={{ x: 760, y: 280, w: 340, h: 255 }} numbers={false} />
      </div>
    </div>
  )
}
