"use client"

import { ArrowLeftIcon, CheckIcon, CircleDashedIcon, FileCheck2Icon, InfoIcon, Loader2Icon, XIcon } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { bboxOf, formatLot, USER_ADDRESS } from "@/lib/demo/geo"
import { shortAddress, shortHash } from "@/lib/demo/ids"
import { useDemo } from "@/lib/demo/store"
import { eligibleBallots, quorumLots, tally } from "@/lib/demo/tally"
import type { Choice, Proposal, RecordEvent } from "@/lib/demo/types"
import { formatDate, formatNumber, relativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"

import { Ballot } from "./ballot"
import { ChoiceSwatch, Panel, StatusChip, TallyStrip } from "./bits"
import { proposalText, useApp } from "./context"
import { InteractivePlan } from "./interactive-plan"
import { ParcelSheet } from "./parcel-sheet"
import { demoDistrict } from "./plan-view"

function Timeline({ p, events }: { p: Proposal; events: RecordEvent[] }) {
  const { app, domain, locale } = useApp()
  const tl = app.proposal.timeline
  const mine = events.filter((e) => e.proposalId === p.id && e.type !== "vote").sort((a, b) => a.at - b.at)
  const label = (e: RecordEvent) => {
    switch (e.type) {
      case "submitted":
        return tl.submitted
      case "approved":
        return tl.approved
      case "returned":
        return tl.returned
      case "closed":
        return `${tl.closed} · ${e.outcome ? domain.outcomes[e.outcome] : ""}`
      case "certified":
        return `${tl.certified} · ${e.outcome ? domain.outcomes[e.outcome] : ""}`
      case "filed":
        return `${tl.filed} · ${e.ref ?? ""}`
      case "filing_failed":
        return tl.filingFailed
      default:
        return ""
    }
  }
  const [mountedAt] = useState(() => Date.now())
  // Signature moment 3: a filing made during this visit prints into the timeline.
  const recentFiling = p.registry === "filed" && !!p.certifiedAt && p.certifiedAt >= mountedAt - 20000
  return (
    <Panel title={tl.title} id="timeline-title">
      <ol className="relative flex flex-col gap-4 border-l border-foreground/25 pl-5">
        {mine.map((e) => (
          <li key={e.id} className={cn("relative", e.type === "filed" && recentFiling && "print-in")}>
            <span
              className={cn(
                "absolute top-1 -left-[1.66rem] flex size-4 items-center justify-center rounded-full border-2 bg-card",
                e.type === "filing_failed" || e.type === "returned" ? "border-destructive" : "border-foreground"
              )}
              aria-hidden="true"
            >
              {e.type === "filed" && <FileCheck2Icon className="size-2.5" />}
            </span>
            <p className={cn("text-sm font-semibold", e.type === "filing_failed" && "text-destructive")}>{label(e)}</p>
            <p className="flex flex-wrap gap-x-3 font-mono text-[0.7rem] text-muted-foreground">
              <span>{formatDate(locale, e.at, true)}</span>
              {e.hash && <span title={e.hash}>{shortHash(e.hash)}</span>}
              {!e.hash && e.type === "filed" && <span>{app.record.offchain}</span>}
            </p>
          </li>
        ))}
        {p.status === "returned" && p.returnReason && <li className="text-sm text-muted-foreground">“{p.returnReason}”</li>}
        {p.registry === "pending" && (
          <li role="status" className="relative text-sm text-muted-foreground">
            <Loader2Icon className="absolute top-0.5 -left-[1.62rem] size-3.5 animate-spin bg-card" aria-hidden="true" />
            {tl.filing}
          </li>
        )}
        {p.status === "open" && p.closesAt && (
          <li className="relative">
            <CircleDashedIcon className="absolute top-0.5 -left-[1.66rem] size-4 bg-card text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold text-muted-foreground">
              {tl.closes} · {relativeTime(locale, p.closesAt)}
            </p>
            <p className="font-mono text-[0.7rem] text-muted-foreground">{formatDate(locale, p.closesAt, true)}</p>
          </li>
        )}
      </ol>
    </Panel>
  )
}

function BallotsCast({ p }: { p: Proposal }) {
  const { app, domain, locale } = useApp()
  const demo = useDemo()
  const [all, setAll] = useState(false)
  const c = app.proposal.ballots
  const list = Object.values(demo?.votes[p.id] ?? {}).sort((a, b) => b.at - a.at)
  const shown = all ? list : list.slice(0, 8)
  return (
    <Panel title={c.title} id="ballots-title">
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">{c.empty}</p>
      ) : (
        <div className="-mx-4 -my-4 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-sm">
            <thead>
              <tr className="annot border-b text-left text-[0.6rem] text-muted-foreground">
                <th scope="col" className="px-4 py-2 font-medium">{c.lot}</th>
                <th scope="col" className="px-2 py-2 font-medium">{c.holder}</th>
                <th scope="col" className="px-2 py-2 font-medium">{c.choice}</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">{c.when}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((v) => (
                <tr key={`${v.lotId}-${v.role}`} className="border-b border-dashed last:border-b-0">
                  <td className="px-4 py-2 font-mono text-xs">
                    {formatLot(v.lotId)} <span className="font-sans text-muted-foreground">· {domain.holderRoles[v.role]}</span>
                  </td>
                  <td className="px-2 py-2 font-mono text-xs text-muted-foreground">
                    {v.voter === USER_ADDRESS ? <span className="font-sans font-semibold text-foreground">{c.you}</span> : shortAddress(v.voter)}
                  </td>
                  <td className="px-2 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      <ChoiceSwatch choice={v.choice} />
                      {domain.choices[v.choice]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted-foreground" title={v.hash}>
                    {formatDate(locale, v.at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length > shown.length && (
            <div className="border-t px-4 py-2">
              <Button variant="ghost" size="sm" onClick={() => setAll(true)}>
                {t(c.more, { n: list.length })}
              </Button>
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}

export function ProposalView({ id }: { id: string }) {
  const ctx = useApp()
  const { app, domain, locale } = ctx
  const demo = useDemo()
  const [fresh, setFresh] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const p = demo?.proposals.find((x) => x.id === id)
  const votes = demo && p ? demo.votes[p.id] : undefined
  const tl = useMemo(() => (p ? tally(p, votes) : null), [p, votes])

  if (!demo) {
    return (
      <p role="status" className="mx-auto w-full max-w-7xl px-4 py-16 text-muted-foreground sm:px-6">
        {app.loading}
      </p>
    )
  }
  if (!p || !tl) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-lg">{app.proposal.notFound}</p>
        <Button asChild className="mt-6" variant="outline">
          <Link href={href(locale, "/app")}>
            <ArrowLeftIcon /> {app.proposal.back}
          </Link>
        </Button>
      </div>
    )
  }

  const text = proposalText(ctx, p)
  const pt = app.proposal
  const connected = demo.wallet.status === "connected"
  const mine = connected ? demo.wallet.holdings.map((h) => h.lotId) : []

  // One displayed choice per lot: the owner's ballot wins over the tenant's.
  const lotVotes: Record<string, Choice> = {}
  for (const v of Object.values(votes ?? {})) if (!lotVotes[v.lotId] || v.role === "owner") lotVotes[v.lotId] = v.choice
  const seals = Object.values(votes ?? {})
    .filter((v) => v.voter === USER_ADDRESS && mine.includes(v.lotId))
    .map((v) => ({ lotId: v.lotId, choice: v.choice, fresh: fresh.includes(v.lotId) }))

  const ballots = eligibleBallots(p)
  const castLots = new Set(Object.values(votes ?? {}).map((v) => v.lotId)).size
  const missing = (() => {
    if (tl.quorumMet) return null
    if (p.rule === "lot" && !p.tenantsVote) {
      const need = quorumLots(p.lots.length, p.quorum) - tl.castBallots
      return need === 1 ? pt.tally.missingLot : t(pt.tally.missingLots, { n: need })
    }
    return t(pt.tally.missingPct, { p: formatNumber(locale, p.quorum - tl.turnout, 1) })
  })()
  const final = p.status === "closed" || p.status === "certified"

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
      <Link href={href(locale, "/app")} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" />
        {pt.back}
      </Link>

      <header className="mt-2 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="annot text-[0.65rem] text-muted-foreground">
            {p.id} · {domain.categories[p.category]}
          </span>
          <StatusChip status={p.status} outcome={p.outcome} />
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-display sm:text-4xl">{text.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{text.summary}</p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span>{t(pt.proposedBy, { who: domain.proposers[p.proposer] })}</span>
          <span className="font-medium">
            {p.status === "open" && p.closesAt
              ? `${t(pt.closesOn, { date: formatDate(locale, p.closesAt) })} (${relativeTime(locale, p.closesAt)})`
              : p.closedAt
                ? t(pt.closedOn, { date: formatDate(locale, p.closedAt) })
                : pt.notOpened}
          </span>
        </p>
        {p.status === "returned" && p.returnReason && (
          <p role="note" className="mt-3 rounded-sm border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {t(pt.returnedNote, { reason: p.returnReason })}
          </p>
        )}
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="flex flex-col gap-5">
          <InteractivePlan
            idPrefix="prop"
            box={bboxOf(p.lots, 50)}
            area={p.lots}
            mine={mine}
            votes={lotVotes}
            seals={seals}
            selected={selected}
            dimOutside
            onLot={setSelected}
            focusable={(lot) => p.lots.includes(lot.id) || mine.includes(lot.id)}
            legend={{ yours: connected, area: true, votes: true }}
          />
          <Panel title={final ? pt.tally.final : pt.tally.live} id="tally-title">
            <TallyStrip p={p} tally={tl} />
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">{pt.tally.turnout}</dt>
                <dd className="font-mono text-lg font-semibold tabular">{formatNumber(locale, tl.turnout, 1)} %</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t(pt.tally.quorum, { q: p.quorum })}</dt>
                <dd className={cn("text-sm font-semibold", tl.quorumMet ? "text-success" : "text-muted-foreground")}>
                  {tl.quorumMet ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckIcon className="size-4" /> {pt.tally.reached}
                    </span>
                  ) : (
                    missing
                  )}
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-xs text-muted-foreground">{final ? domain.outcomes[p.outcome ?? tl.leading] : pt.tally.ifNow}</dt>
                <dd className="text-sm font-semibold">
                  {final ? (
                    <span className="inline-flex items-center gap-1">
                      {p.outcome === "passed" ? <CheckIcon className="size-4 text-success" /> : <XIcon className="size-4 text-destructive" />}
                      {p.lots.length ? t(pt.tally.weightLots, { n: castLots, m: p.lots.length }) : ""}
                    </span>
                  ) : (
                    domain.outcomes[tl.leading]
                  )}
                </dd>
              </div>
            </dl>
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Ballot p={p} onVoted={(lots) => setFresh(lots)} />
          <Panel title={pt.rule.title} id="rule-title">
            <ul className="flex flex-col gap-2 text-sm">
              <li className="font-semibold">
                {domain.rules[p.rule]}
                {p.rule === "area" && <span className="font-normal text-muted-foreground"> ({domain.rules.areaCap})</span>}
              </li>
              <li className="text-muted-foreground">{p.tenantsVote ? pt.rule.tenantsYes : pt.rule.tenantsNo}</li>
              <li className="text-muted-foreground">{t(pt.rule.quorum, { q: p.quorum })}</li>
              <li>
                <Link href={href(locale, "/how-it-works")} className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline">
                  <InfoIcon className="size-3.5" aria-hidden="true" />
                  {pt.rule.how}
                </Link>
              </li>
              <li className="annot pt-1 text-[0.62rem] text-muted-foreground">
                {t(pt.rule.eligible, { b: ballots.length, l: p.lots.length })} · {domain.districts[demoDistrict(p)]}
              </li>
            </ul>
          </Panel>
          <Timeline p={p} events={demo.events} />
        </div>
      </div>

      <div className="mt-5">
        <BallotsCast p={p} />
      </div>
      <ParcelSheet lotId={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
