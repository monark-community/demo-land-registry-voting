"use client"

import { CheckIcon, VoteIcon } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { FULL_BOX, bboxOf, lotById } from "@/lib/demo/geo"
import { useDemo } from "@/lib/demo/store"
import { myBallots, tally } from "@/lib/demo/tally"
import type { DemoState, Proposal } from "@/lib/demo/types"
import { formatDate, formatNumber, relativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"

import { StatusChip, TallyStrip } from "./bits"
import { proposalText, useApp } from "./context"
import { InteractivePlan, LotFinder } from "./interactive-plan"
import { LandStrip } from "./land-strip"
import { ParcelSheet } from "./parcel-sheet"

type Tab = "open" | "review" | "closed"

export function myStatus(demo: DemoState, p: Proposal): "can" | "voted" | null {
  if (demo.wallet.status !== "connected" || demo.wallet.lookup !== "done" || p.status !== "open") return null
  const mine = myBallots(p, demo.wallet.holdings).filter((b) => b.ballot)
  if (!mine.length) return null
  const votes = demo.votes[p.id] ?? {}
  return mine.every((b) => votes[b.ballot!.key]) ? "voted" : "can"
}

function ProposalCard({ p, demo, onHover }: { p: Proposal; demo: DemoState; onHover: (id: string | null) => void }) {
  const ctx = useApp()
  const { app, domain, locale } = ctx
  const c = app.proposals
  const text = proposalText(ctx, p)
  const tl = tally(p, demo.votes[p.id])
  const status = myStatus(demo, p)
  const when =
    p.status === "open" && p.closesAt
      ? t(c.closesIn, { rel: relativeTime(locale, p.closesAt) })
      : p.closedAt
        ? t(c.closedOn, { date: formatDate(locale, p.closedAt) })
        : t(c.submittedOn, { date: formatDate(locale, p.submittedAt) })
  return (
    <li onMouseEnter={() => onHover(p.id)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(p.id)} onBlur={() => onHover(null)}>
      <Link
        href={href(locale, `/app/proposals/${p.id}`)}
        className="group block rounded-md border border-foreground/25 bg-card p-4 transition-colors hover:border-foreground/60"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="annot text-[0.6rem] text-muted-foreground">
            {p.id} · {domain.categories[p.category]}
          </span>
          <StatusChip status={p.status} outcome={p.outcome} />
        </div>
        <h3 className="mt-2 font-bold leading-snug group-hover:underline group-hover:underline-offset-4">{text.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {domain.districts[demoDistrict(p)]} · {t(c.lots, { n: p.lots.length })} · {when}
        </p>
        {(p.status === "open" || p.status === "closed" || p.status === "certified") && (
          <div className="mt-3">
            <TallyStrip p={p} tally={tl} size="sm" />
            <p className="mt-1.5 font-mono text-[0.68rem] text-muted-foreground">
              {t(c.turnout, { p: formatNumber(locale, tl.turnout, 0) })} · {t(c.quorum, { q: p.quorum })}
            </p>
          </div>
        )}
        {p.status === "returned" && <p className="mt-2 text-xs font-medium text-destructive">{c.returned}</p>}
        {status && (
          <p className={cn("mt-3 inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-semibold", status === "can" ? "bg-accent text-accent-foreground ring-1 ring-mine" : "bg-muted text-muted-foreground")}>
            {status === "can" ? <VoteIcon className="size-3.5" /> : <CheckIcon className="size-3.5" />}
            {status === "can" ? c.canVote : c.voted}
          </p>
        )}
      </Link>
    </li>
  )
}

/** Proposals in the demo mostly cover one district; name it after the first lot's. */
export function demoDistrict(p: Proposal) {
  return lotById(p.lots[0] ?? "")?.district ?? "tanneries"
}

export function PlanView() {
  const { app } = useApp()
  const demo = useDemo()
  const [tab, setTab] = useState<Tab>("open")
  const [hover, setHover] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [focus, setFocus] = useState<string[] | "all" | null>(null)

  const groups = useMemo(() => {
    const ps = demo?.proposals ?? []
    return {
      open: ps.filter((p) => p.status === "open"),
      review: ps.filter((p) => p.status === "review" || p.status === "returned"),
      closed: ps.filter((p) => p.status === "closed" || p.status === "certified"),
    }
  }, [demo?.proposals])

  if (!demo) {
    return (
      <p role="status" className="mx-auto w-full max-w-7xl px-4 py-16 text-muted-foreground sm:px-6">
        {app.loading}
      </p>
    )
  }

  const mine = demo.wallet.status === "connected" ? demo.wallet.holdings.map((h) => h.lotId) : []
  const highlighted = demo.proposals.find((p) => p.id === hover) ?? groups[tab][0]
  const box = focus === "all" ? FULL_BOX : focus ? bboxOf(focus, 70) : highlighted ? bboxOf(highlighted.lots, 60) : FULL_BOX

  const showLot = (id: string) => {
    setFocus([id])
    setSelected(id)
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-[auto_1fr] lg:py-6">
      <h1 className="sr-only">{app.nav.plan}</h1>
      <div className="order-2 flex flex-col gap-3 lg:sticky lg:top-[8.5rem] lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
        <InteractivePlan
          box={box}
          area={highlighted?.lots}
          mine={mine}
          selected={selected}
          onLot={(id) => setSelected(id)}
          focusable={(lot) => mine.includes(lot.id) || !!highlighted?.lots.includes(lot.id)}
          legend={{ yours: true, area: true }}
          onWholeTown={() => {
            setFocus("all")
            setHover(null)
          }}
        />
        <LotFinder onPick={showLot} />
      </div>
      <div className="order-1 lg:order-none lg:col-start-2 lg:row-start-1">
        <LandStrip onShow={showLot} />
      </div>
      <div className="order-3 flex flex-col gap-5 lg:order-none lg:col-start-2 lg:row-start-2">
        <section aria-labelledby="proposals-title">
          <h2 id="proposals-title" className="text-xl font-extrabold tracking-display">
            {app.proposals.title}
          </h2>
          <Tabs value={tab} onValueChange={(v) => { setTab(v as Tab); setFocus(null) }} className="mt-3">
            <TabsList className="w-full">
              {(["open", "review", "closed"] as const).map((k) => (
                <TabsTrigger key={k} value={k} className="gap-1.5">
                  {app.proposals.tabs[k]}
                  <span className="font-mono text-[0.7rem] text-muted-foreground">{groups[k].length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {(["open", "review", "closed"] as const).map((k) => (
              <TabsContent key={k} value={k} className="mt-2">
                {groups[k].length === 0 ? (
                  <p className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">{app.proposals.empty[k]}</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {groups[k].map((p) => (
                      <ProposalCard key={p.id} p={p} demo={demo} onHover={(id) => { setHover(id); if (id) setFocus(null) }} />
                    ))}
                  </ul>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </div>
      <ParcelSheet lotId={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
