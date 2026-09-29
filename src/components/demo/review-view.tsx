"use client"

import { AlertTriangleIcon, CheckIcon, FileCheck2Icon, Loader2Icon } from "lucide-react"
import Link from "next/link"
import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { applyApprove, applyCertify, applyClose, applyReturn, fileWithRegistry } from "@/lib/demo/ops"
import { useDemo } from "@/lib/demo/store"
import { eligibleBallots, tally } from "@/lib/demo/tally"
import type { Proposal } from "@/lib/demo/types"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

import { StatusChip, TallyStrip, TxFeedback } from "./bits"
import { proposalText, useApp } from "./context"
import { demoDistrict } from "./plan-view"
import { RoleGate } from "./role-gate"

function CardHead({ p }: { p: Proposal }) {
  const ctx = useApp()
  const { app, domain, locale } = ctx
  const text = proposalText(ctx, p)
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="annot text-[0.6rem] text-muted-foreground">
          {p.id} · {domain.categories[p.category]} · {domain.districts[demoDistrict(p)]}
        </span>
        <StatusChip status={p.status} outcome={p.outcome} />
      </div>
      <h3 className="mt-2 text-lg font-bold leading-snug">
        <Link href={href(locale, `/app/proposals/${p.id}`)} className="hover:underline underline-offset-4">
          {text.title}
        </Link>
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {t(app.proposal.proposedBy, { who: domain.proposers[p.proposer] })} · {formatDate(locale, p.submittedAt)}
      </p>
    </div>
  )
}

function ReviewCard({ p }: { p: Proposal }) {
  const ctx = useApp()
  const { app, domain, locale } = ctx
  const r = app.review
  const tx = useTx()
  const uid = useId()
  const [returning, setReturning] = useState(false)
  const [reason, setReason] = useState("")
  const [reasonError, setReasonError] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const ballots = eligibleBallots(p)
  const text = proposalText(ctx, p)
  const checks = [
    { ok: p.lots.length >= 3, label: t(r.checks.area, { n: p.lots.length }) },
    { ok: ballots.length > 0, label: t(r.checks.holders, { n: ballots.length }) },
    { ok: p.quorum >= 10, label: t(r.checks.rule, { q: p.quorum }) },
    { ok: text.summary.length >= 20, label: r.checks.notice },
  ]
  const pr = app.prompt

  const approve = async () => {
    const ok = await tx.run(
      {
        kind: "approve",
        title: t(pr.titles.approve, { id: p.id }),
        lines: [
          { label: pr.lines.proposal, value: text.title },
          { label: pr.lines.duration, value: t(app.draft.duration.days, { n: p.durationDays }) },
        ],
      },
      (hash, block) => applyApprove(p.id, hash, block)
    )
    if (ok) setDone(t(r.approved, { date: formatDate(locale, Date.now() + p.durationDays * 86400000) }))
  }
  const sendBack = async () => {
    if (reason.trim().length < 5) return setReasonError(true)
    setReasonError(false)
    const ok = await tx.run(
      { kind: "return", title: t(pr.titles.return, { id: p.id }), lines: [{ label: pr.lines.reason, value: reason.trim() }] },
      (hash, block) => applyReturn(p.id, reason.trim(), hash, block)
    )
    if (ok) setDone(r.returnedDone)
  }

  return (
    <li className="rounded-md border border-foreground/40 bg-card p-4 shadow-paper">
      <CardHead p={p} />
      <p className="mt-3 text-sm">{text.summary}</p>
      <div className="mt-4">
        <p className="annot text-[0.6rem] text-muted-foreground">{r.checks.title}</p>
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2">
              {c.ok ? <CheckIcon className="size-4 text-success" aria-hidden="true" /> : <AlertTriangleIcon className="size-4 text-warning" aria-hidden="true" />}
              {c.label}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          {domain.rules[p.rule]} · {p.tenantsVote ? app.draft.who.ownersTenants : app.draft.who.owners}
        </p>
      </div>
      {!done && (
        <>
          {returning ? (
            <div className="mt-4 flex flex-col gap-2">
              <Label htmlFor={`${uid}-reason`}>{r.reasonLabel}</Label>
              <Textarea id={`${uid}-reason`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={r.reasonPlaceholder} aria-invalid={reasonError || undefined} aria-describedby={reasonError ? `${uid}-rerr` : undefined} disabled={tx.busy} />
              {reasonError && (
                <p id={`${uid}-rerr`} className="text-sm text-destructive">
                  {r.reasonRequired}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="destructive" onClick={() => void sendBack()} disabled={tx.busy}>
                  {r.sendReturn}
                </Button>
                <Button variant="ghost" onClick={() => setReturning(false)} disabled={tx.busy}>
                  {r.cancel}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => void approve()} disabled={tx.busy}>
                {tx.busy && <Loader2Icon className="animate-spin" />}
                {r.approve}
              </Button>
              <Button variant="outline" onClick={() => setReturning(true)} disabled={tx.busy}>
                {r.return}
              </Button>
            </div>
          )}
        </>
      )}
      <div className="mt-3">
        <TxFeedback state={tx.state} pending={r.pending} rejected={r.rejected} reverted={r.reverted} confirmed={done && <p className="text-sm font-semibold text-success">{done}</p>} />
      </div>
    </li>
  )
}

function CertifyCard({ p }: { p: Proposal }) {
  const ctx = useApp()
  const { app, domain } = ctx
  const r = app.review
  const demo = useDemo()
  const tx = useTx()
  const tl = tally(p, demo?.votes[p.id])
  const [retrying, setRetrying] = useState(false)
  const pr = app.prompt

  const certify = async () => {
    const ok = await tx.run(
      {
        kind: "certify",
        title: t(pr.titles.certify, { id: p.id }),
        lines: [
          { label: pr.lines.proposal, value: proposalText(ctx, p).title },
          { label: pr.lines.outcome, value: p.outcome ? domain.outcomes[p.outcome] : "" },
        ],
      },
      (hash, block) => applyCertify(p.id, hash, block)
    )
    if (ok) await fileWithRegistry(p.id)
  }
  const retry = async () => {
    setRetrying(true)
    await fileWithRegistry(p.id)
    setRetrying(false)
  }

  return (
    <li className="rounded-md border border-foreground/40 bg-card p-4 shadow-paper">
      <CardHead p={p} />
      <div className="mt-4">
        <TallyStrip p={p} tally={tl} />
      </div>
      {p.status === "closed" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={() => void certify()} disabled={tx.busy}>
            {tx.busy ? <Loader2Icon className="animate-spin" /> : <FileCheck2Icon />}
            {r.certify}
          </Button>
        </div>
      )}
      <div className="mt-3 flex flex-col gap-2">
        <TxFeedback state={tx.state} pending={r.pending} rejected={r.rejected} reverted={r.reverted} confirmed={<p className="text-sm font-semibold text-success">{r.certified}</p>} />
        {p.registry === "pending" && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            {r.filing}
          </p>
        )}
        {p.registry === "failed" && (
          <div role="alert" className="flex flex-col items-start gap-2 rounded-sm border border-warning/50 bg-warning/10 p-3">
            <p className="flex items-start gap-2 text-sm font-medium">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
              {r.filingFailed}
            </p>
            <Button size="sm" variant="outline" onClick={() => void retry()} disabled={retrying}>
              {retrying && <Loader2Icon className="animate-spin" />}
              {r.retryFiling}
            </Button>
          </div>
        )}
        {p.registry === "filed" && p.registryRef && (
          <p role="status" className="print-in inline-flex items-center gap-2 self-start rounded-sm border border-foreground bg-foreground px-2 py-1 font-mono text-xs text-background">
            <FileCheck2Icon className="size-3.5" />
            {t(r.filed, { ref: p.registryRef })}
          </p>
        )}
      </div>
    </li>
  )
}

function OpenCard({ p }: { p: Proposal }) {
  const ctx = useApp()
  const { app, domain } = ctx
  const r = app.review
  const demo = useDemo()
  const tx = useTx()
  const tl = tally(p, demo?.votes[p.id])
  const [done, setDone] = useState<string | null>(null)
  const pr = app.prompt
  const close = async () => {
    const ok = await tx.run(
      { kind: "close", title: t(pr.titles.close, { id: p.id }), lines: [{ label: pr.lines.proposal, value: proposalText(ctx, p).title }, { label: pr.lines.outcome, value: domain.outcomes[tl.leading] }] },
      (hash, block) => applyClose(p.id, hash, block)
    )
    if (ok) setDone(t(r.closedDone, { outcome: domain.outcomes[tl.leading] }))
  }
  return (
    <li className="rounded-md border border-foreground/25 bg-card p-4">
      <CardHead p={p} />
      <div className="mt-3">
        <TallyStrip p={p} tally={tl} size="sm" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button variant="outline" size="sm" onClick={() => void close()} disabled={tx.busy} title={r.closeNowHint}>
          {tx.busy && <Loader2Icon className="animate-spin" />}
          {r.closeNow}
        </Button>
      </div>
      <div className="mt-3">
        <TxFeedback state={tx.state} pending={r.pending} rejected={r.rejected} reverted={r.reverted} confirmed={done && <p className="text-sm font-semibold text-success">{done}</p>} />
      </div>
    </li>
  )
}

function Section({ title, count, children, empty }: { title: string; count: number; children: React.ReactNode; empty?: string }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="flex items-baseline gap-2 text-xl font-extrabold tracking-display">
        {title} <span className="font-mono text-sm font-normal text-muted-foreground">{count}</span>
      </h2>
      {count === 0 && empty ? <p className="rounded-md border border-dashed px-4 py-5 text-sm text-muted-foreground">{empty}</p> : <ul className="flex flex-col gap-3">{children}</ul>}
    </section>
  )
}

export function ReviewView() {
  const { app, locale } = useApp()
  const r = app.review
  const demo = useDemo()
  // Cards acted on during this visit stay in place so their result stays readable.
  const [mountedAt] = useState(() => Date.now())
  if (!demo) return <p className="mx-auto w-full max-w-7xl px-4 py-16 text-muted-foreground sm:px-6">{app.loading}</p>
  if (demo.role !== "clerk") {
    return (
      <div className="px-4 py-10 sm:px-6">
        <h1 className="sr-only">{r.title}</h1>
        <RoleGate role="clerk" title={r.gateTitle} body={r.gateBody} cta={r.gateCta} />
      </div>
    )
  }

  const ps = demo.proposals
  const actedNow = (id: string, types: string[]) => demo.events.some((e) => e.proposalId === id && types.includes(e.type) && e.at >= mountedAt)
  const toReview = ps.filter((p) => p.status === "review" || actedNow(p.id, ["approved", "returned"]))
  const toCertify = ps.filter((p) => p.status === "closed" || (p.status === "certified" && (p.registry !== "filed" || actedNow(p.id, ["certified"]))))
  const open = ps.filter((p) => p.status === "open" && !toReview.includes(p))
  const done = ps.filter((p) => p.status === "certified" && !toCertify.includes(p))
  const clear = toReview.length === 0 && toCertify.length === 0

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <h1 className="text-3xl font-extrabold tracking-display">{r.title}</h1>
      {clear && <p className="mt-6 rounded-md border border-dashed px-4 py-5 text-sm text-muted-foreground">{r.empty}</p>}
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-10">
          {toReview.length > 0 && (
            <Section title={r.sections.review} count={toReview.length}>
              {toReview.map((p) => (
                <ReviewCard key={p.id} p={p} />
              ))}
            </Section>
          )}
          <Section title={r.sections.open} count={open.length} empty={r.emptyOpen}>
            {open.map((p) => (
              <OpenCard key={p.id} p={p} />
            ))}
          </Section>
        </div>
        <div className="flex flex-col gap-10">
          {toCertify.length > 0 && (
            <Section title={r.sections.certify} count={toCertify.length}>
              {toCertify.map((p) => (
                <CertifyCard key={p.id} p={p} />
              ))}
            </Section>
          )}
          <Section title={r.sections.done} count={done.length}>
            {done.map((p) => (
              <li key={p.id} className={cn("flex flex-wrap items-center justify-between gap-2 border-b border-dashed pb-3")}>
                <Link href={href(locale, `/app/proposals/${p.id}`)} className="min-w-0 flex-1 text-sm font-semibold hover:underline">
                  <span className="annot mr-2 text-[0.6rem] text-muted-foreground">{p.id}</span>
                  <DoneTitle p={p} />
                </Link>
                <span className="font-mono text-xs text-muted-foreground">{p.registryRef}</span>
              </li>
            ))}
          </Section>
        </div>
      </div>
    </div>
  )
}

function DoneTitle({ p }: { p: Proposal }) {
  const ctx = useApp()
  return <>{proposalText(ctx, p).title}</>
}
