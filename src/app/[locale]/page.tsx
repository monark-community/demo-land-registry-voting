import { ArrowRightIcon, PlusIcon } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { AerialAnnex } from "@/components/home/aerial-annex"
import { HeroPlan } from "@/components/home/hero-plan"
import { Button } from "@/components/ui/button"
import { href, isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"
import { PHOTOS } from "@/lib/photos"

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta
  return { ...pageMetadata(locale, "/", m.title, m.description), title: { absolute: m.title } }
}

function SectionTitle({ n, children, id }: { n: string; children: React.ReactNode; id: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="annot shrink-0 text-muted-foreground" aria-hidden="true">
        {n}
      </span>
      <h2 id={id} className="text-3xl font-extrabold tracking-display sm:text-4xl">
        {children}
      </h2>
    </div>
  )
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const h = dict.home

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title" className="survey-grid border-b border-foreground/15">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pt-10 pb-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-16 lg:pb-20">
          <div>
            <p className="annot inline-flex border-b-2 border-primary pb-1 text-primary">{h.eyebrow}</p>
            <h1 id="hero-title" className="mt-5 text-[2.6rem] leading-[1.04] font-extrabold tracking-display sm:text-6xl">
              {h.title}
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg text-muted-foreground sm:text-xl">{h.lead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={href(locale, "/app")}>
                  {h.primary}
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={href(locale, "/how-it-works")}>{h.secondary}</Link>
              </Button>
            </div>
            <p className="annot mt-6 text-[0.65rem] text-muted-foreground">{dict.common.demoBadge}</p>
          </div>
          <HeroPlan d={h} labels={dict.plan.labels} />
        </div>
      </section>

      {/* The hearing problem */}
      <section aria-labelledby="problem-title" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <figure className="order-2 flex flex-col gap-2 lg:order-1">
            <div className="overflow-hidden rounded-md border border-foreground/60 shadow-paper">
              <Image src={PHOTOS.hearing.src} alt={h.problem.photoAlt} sizes="(min-width: 1024px) 600px, 100vw" className="h-auto w-full grayscale-[35%]" placeholder="blur" />
            </div>
            <figcaption className="annot text-[0.65rem] text-muted-foreground">{h.problem.caption}</figcaption>
          </figure>
          <div className="order-1 lg:order-2">
            <SectionTitle n="01" id="problem-title">
              {h.problem.title}
            </SectionTitle>
            <p className="mt-5 text-lg text-muted-foreground">{h.problem.body}</p>
            <ol className="mt-8 flex flex-col border-t border-foreground/20">
              {h.problem.facts.map((f, i) => (
                <li key={f} className="flex items-baseline gap-4 border-b border-foreground/20 py-3.5">
                  <span className="font-mono text-sm text-vote-against tabular">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-medium">{f}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* How a vote works */}
      <section aria-labelledby="steps-title" className="border-y border-foreground/15 bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle n="02" id="steps-title">
              {h.steps.title}
            </SectionTitle>
            <Link href={href(locale, "/how-it-works")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline">
              {h.steps.more}
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          <ol className="relative mt-12 grid gap-8 md:grid-cols-4 md:gap-6">
            <span className="absolute top-5 right-[12%] left-[12%] hidden border-t-2 border-dashed border-foreground/30 md:block" aria-hidden="true" />
            {h.steps.items.map((s, i) => (
              <li key={s.title} className="relative flex gap-4 md:flex-col">
                <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-card font-mono text-sm font-semibold">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Three sides */}
      <section aria-labelledby="sides-title" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <SectionTitle n="03" id="sides-title">
          {h.sides.title}
        </SectionTitle>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="flex flex-col">
            {h.sides.items.map((s, i) => (
              <div key={s.title} className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-foreground/20 py-6 last:border-b">
                <span className="font-mono text-sm text-primary">{["A", "B", "C"][i]}</span>
                <div>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-muted-foreground">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <figure className="flex flex-col gap-2">
            <div className="overflow-hidden rounded-md border border-foreground/60 shadow-paper">
              <Image src={PHOTOS.neighbours.src} alt={h.sides.photoAlt} sizes="(min-width: 1024px) 620px, 100vw" className="aspect-[4/3] h-auto w-full object-cover" placeholder="blur" />
            </div>
            <figcaption className="annot text-[0.65rem] text-muted-foreground">{h.sides.caption}</figcaption>
          </figure>
        </div>
      </section>

      {/* From the plan to the street */}
      <section aria-labelledby="street-title" className="border-y border-foreground/15 bg-card">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:py-20">
          <AerialAnnex alt={h.street.photoAlt} caption={h.street.caption} />
          <div>
            <SectionTitle n="04" id="street-title">
              {h.street.title}
            </SectionTitle>
            <p className="mt-5 text-lg text-muted-foreground">{h.street.body}</p>
            <dl className="mt-8 grid gap-0 border-t border-foreground/20">
              {h.street.points.map((p) => (
                <div key={p.k} className="grid grid-cols-[7rem_1fr] gap-3 border-b border-foreground/20 py-3">
                  <dt className="annot pt-0.5 text-[0.68rem]">{p.k}</dt>
                  <dd className="text-muted-foreground">{p.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
        <SectionTitle n="05" id="faq-title">
          {h.faq.title}
        </SectionTitle>
        <div className="mt-10 border-t border-foreground/25">
          {h.faq.items.map((f) => (
            <details key={f.q} className="group border-b border-foreground/25">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                {f.q}
                <PlusIcon className="size-5 shrink-0 transition-transform group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p className="max-w-[62ch] pb-5 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section aria-labelledby="closing-title" className="survey-grid border-t border-foreground/15">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:py-20">
          <div>
            <h2 id="closing-title" className="text-3xl font-extrabold tracking-display sm:text-4xl">
              {h.closing.title}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">{h.closing.body}</p>
          </div>
          <Button asChild size="lg">
            <Link href={href(locale, "/app")}>
              {h.closing.cta}
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  )
}
