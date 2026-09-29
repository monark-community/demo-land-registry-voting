import { ArrowRightIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PlanSvg } from "@/components/plan/plan-svg"
import { Button } from "@/components/ui/button"
import { href, isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { lotsIn } from "@/lib/demo/geo"
import type { Choice } from "@/lib/demo/types"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/how-it-works">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.how
  return pageMetadata(locale, "/how-it-works", m.title, m.description)
}

const CODE = `struct Proposal {
  uint32[] lots;       // cadastral numbers in the affected area
  Rule     rule;       // PerLot | AreaWeighted (cap 2,000 m²)
  bool     tenantsVote;
  uint16   quorumBps;  // 4000 = 40 %
  uint64   opensAt;
  uint64   closesAt;
  Status   status;     // Review, Open, Closed, Certified
}

event BallotCast(bytes32 indexed proposal, uint32 indexed lot,
                 HolderRole role, Choice choice);
event ResultCertified(bytes32 indexed proposal, Outcome outcome,
                      string registryRef);`

function Lifecycle({ steps, returned }: { steps: { k: string; v: string }[]; returned: string }) {
  return (
    <div>
      <ol className="grid gap-0 border-t border-foreground/25 md:grid-cols-5 md:border-t-0">
        {steps.map((s, i) => (
          <li key={s.k} className="relative flex gap-4 border-b border-foreground/15 py-4 md:flex-col md:gap-3 md:border-b-0 md:py-0 md:pr-4">
            <div className="flex items-center md:w-full">
              <span className="z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-card font-mono text-sm font-semibold">{i + 1}</span>
              {i < steps.length - 1 && <span className="hidden h-0.5 flex-1 bg-foreground/60 md:block" aria-hidden="true" />}
            </div>
            <div>
              <h3 className="font-bold">{s.k}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.v}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 flex items-start gap-3 rounded-sm border border-dashed border-destructive/50 px-4 py-3 text-sm">
        <span className="annot mt-0.5 shrink-0 text-[0.62rem] text-destructive">↺ 2 → 1</span>
        {returned}
      </p>
    </div>
  )
}

export default async function HowItWorks({ params }: PageProps<"/[locale]/how-it-works">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const h = dict.how
  const tanneries = lotsIn("tanneries").map((l) => l.id)
  // Worked example: 5 for, 2 against, 1 abstain on rue des Tanneurs.
  const example: Record<string, Choice> = {
    "4512072": "for", "4512078": "for", "4512081": "for", "4512087": "for", "4512090": "for",
    "4512074": "against", "4512089": "against", "4512083": "abstain",
  }
  const heronsAndPark = [...lotsIn("herons"), ...lotsIn("nord")].map((l) => l.id)

  return (
    <article className="flex flex-col">
      <header className="survey-grid border-b border-foreground/15">
        <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
          <p className="annot text-primary">{h.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-display sm:text-5xl">{h.title}</h1>
          <p className="mt-5 max-w-3xl text-lg text-muted-foreground sm:text-xl">{h.lead}</p>
        </div>
      </header>

      <section aria-labelledby="life" className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
        <h2 id="life" className="text-2xl font-extrabold tracking-display sm:text-3xl">
          {h.lifecycle.title}
        </h2>
        <div className="mt-8">
          <Lifecycle steps={h.lifecycle.steps} returned={h.lifecycle.returned} />
        </div>
      </section>

      <section aria-labelledby="who" className="border-y border-foreground/15 bg-card">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-2">
          <div>
            <h2 id="who" className="text-2xl font-extrabold tracking-display sm:text-3xl">
              {h.who.title}
            </h2>
            <p className="mt-4 text-muted-foreground">{h.who.body}</p>
          </div>
          <ul className="flex flex-col self-center border-t border-foreground/20">
            {h.who.points.map((p, i) => (
              <li key={p} className="flex gap-4 border-b border-foreground/20 py-3.5">
                <span className="font-mono text-sm text-primary">{String.fromCharCode(97 + i)}.</span>
                <span className="font-medium">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="rules" className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
        <h2 id="rules" className="text-2xl font-extrabold tracking-display sm:text-3xl">
          {h.rules.title}
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {[
            { r: h.rules.lot, box: { x: 30, y: 30, w: 420, h: 290 }, area: tanneries },
            { r: h.rules.area, box: { x: 470, y: 30, w: 520, h: 360 }, area: heronsAndPark },
          ].map(({ r, box, area }, i) => (
            <figure key={r.title} className="flex flex-col overflow-hidden rounded-md border border-foreground/40 bg-card">
              <div className="aspect-[11/8] border-b border-foreground/20">
                <PlanSvg labels={dict.plan.labels} title={r.title} idPrefix={`rule${i}`} box={box} area={area} numbers={false} />
              </div>
              <figcaption className="p-4">
                <h3 className="font-bold">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-8 grid items-center gap-6 rounded-md border-2 border-foreground/70 bg-card p-5 md:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="annot text-[0.65rem] text-primary">{h.rules.exampleTitle}</p>
            <p className="mt-2">{h.rules.example}</p>
          </div>
          <div className="aspect-[430/290] overflow-hidden rounded-sm border border-foreground/20">
            <PlanSvg labels={dict.plan.labels} title={h.rules.example} idPrefix="ex" box={{ x: 24, y: 24, w: 430, h: 290 }} area={tanneries} votes={example} numbers={false} />
          </div>
        </div>
      </section>

      <section aria-labelledby="quorum" className="border-y border-foreground/15 bg-card">
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2">
          <div>
            <h2 id="quorum" className="text-2xl font-extrabold tracking-display sm:text-3xl">
              {h.quorum.title}
            </h2>
            <p className="mt-4 text-muted-foreground">{h.quorum.body}</p>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-display sm:text-3xl">{h.roles.title}</h2>
            <dl className="mt-4 border-t border-foreground/20">
              {h.roles.items.map((r) => (
                <div key={r.k} className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-foreground/20 py-3">
                  <dt className="annot pt-0.5 text-[0.66rem]">{r.k}</dt>
                  <dd className="text-sm text-muted-foreground">{r.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section aria-labelledby="record" className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
        <h2 id="record" className="text-2xl font-extrabold tracking-display sm:text-3xl">
          {h.record.title}
        </h2>
        <p className="mt-4 max-w-3xl text-muted-foreground">{h.record.body}</p>
        <h2 className="mt-12 text-2xl font-extrabold tracking-display sm:text-3xl">{h.dev.title}</h2>
        <p className="mt-4 max-w-3xl text-muted-foreground">{h.dev.body}</p>
        <figure className="mt-6 overflow-hidden rounded-md border border-foreground/40 bg-foreground text-background">
          <figcaption className="annot border-b border-background/20 px-4 py-2 text-[0.62rem] opacity-80">{h.dev.codeLabel}</figcaption>
          <pre className="overflow-x-auto p-4 font-mono text-[0.8rem] leading-relaxed" tabIndex={0}>
            <code>{CODE}</code>
          </pre>
        </figure>
      </section>

      <section aria-labelledby="cta" className="survey-grid border-t border-foreground/15">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-5 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="cta" className="text-2xl font-extrabold tracking-display sm:text-3xl">
              {h.cta.title}
            </h2>
            <p className="mt-2 text-muted-foreground">{h.cta.body}</p>
          </div>
          <Button asChild size="lg">
            <Link href={href(locale, "/app")}>
              {h.cta.button} <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </section>
    </article>
  )
}
