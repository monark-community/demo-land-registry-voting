import { CheckIcon } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { cn } from "@/lib/utils"

/**
 * INTERNAL STRATEGY REVIEW ONLY. This page is intentionally not linked from
 * anywhere, is excluded from sitemap.xml and is marked noindex/nofollow.
 */
export async function generateMetadata({ params }: PageProps<"/[locale]/pricing">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.pricing
  return { title: m.title, description: m.description, robots: { index: false, follow: false } }
}

export default async function PricingPage({ params }: PageProps<"/[locale]/pricing">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const p = getDictionary(locale).pricing

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <p className="annot inline-flex rounded-sm border border-dashed border-foreground/50 px-2 py-1 text-[0.62rem] text-muted-foreground">{p.eyebrow}</p>
      <h1 className="mt-5 text-4xl font-extrabold tracking-display sm:text-5xl">{p.title}</h1>
      <p className="mt-4 max-w-[60ch] text-lg text-muted-foreground">{p.intro}</p>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {p.plans.map((plan, i) => (
          <section key={plan.name} aria-labelledby={`plan-${i}`} className={cn("flex flex-col rounded-md border bg-card p-6", i === 1 ? "border-2 border-primary shadow-paper" : "border-foreground/30")}>
            <h2 id={`plan-${i}`} className="annot text-[0.7rem] text-primary">
              {plan.name}
            </h2>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
              <span className="text-4xl font-extrabold tracking-display">{plan.price}</span>
              {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
            </p>
            <p className="mt-2 text-sm font-medium">{plan.for}</p>
            <ul className="mt-5 flex flex-col gap-2.5 border-t border-foreground/15 pt-5">
              {plan.items.map((it) => (
                <li key={it} className="flex gap-2 text-sm">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {it}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold">{p.included.title}</h2>
          <ul className="mt-3 flex flex-col gap-2 text-muted-foreground">
            {p.included.items.map((it) => (
              <li key={it} className="flex gap-2">
                <CheckIcon className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                {it}
              </li>
            ))}
          </ul>
          <h2 className="mt-8 text-xl font-bold">{p.connector.title}</h2>
          <p className="mt-2 text-muted-foreground">{p.connector.body}</p>
        </section>
        <section>
          <h2 className="text-xl font-bold">{p.reasoning.title}</h2>
          <ol className="mt-3 flex flex-col border-t border-foreground/20">
            {p.reasoning.items.map((it, i) => (
              <li key={it} className="flex gap-3 border-b border-foreground/20 py-3 text-sm">
                <span className="font-mono text-primary">{String(i + 1).padStart(2, "0")}</span>
                {it}
              </li>
            ))}
          </ol>
        </section>
      </div>
      <p className="mt-10 text-sm text-muted-foreground">{p.note}</p>
    </div>
  )
}
