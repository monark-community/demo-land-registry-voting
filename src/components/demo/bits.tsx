"use client"

import { AlertTriangleIcon, CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react"
import type { ReactNode } from "react"

import { TxStatus } from "@/components/ui/tx-status"
import { formatNumber } from "@/lib/format"
import type { Tally } from "@/lib/demo/tally"
import type { Choice, Outcome, Proposal, ProposalStatus, TxState } from "@/lib/demo/types"
import { cn } from "@/lib/utils"
import { t } from "@/i18n/t"

import { useApp } from "./context"

const STATUS_TONE: Record<ProposalStatus, string> = {
  review: "border-warning/60 text-warning",
  returned: "border-destructive/60 text-destructive",
  open: "border-primary bg-primary text-primary-foreground",
  closed: "border-foreground/50 text-foreground",
  certified: "border-foreground bg-foreground text-background",
}

export function StatusChip({ status, outcome, className }: { status: ProposalStatus; outcome?: Outcome; className?: string }) {
  const { domain } = useApp()
  return (
    <span className={cn("annot inline-flex h-6 items-center gap-1 rounded-sm border px-1.5 text-[0.62rem] whitespace-nowrap", STATUS_TONE[status], className)}>
      {domain.statuses[status]}
      {outcome && (status === "closed" || status === "certified") && <span className="opacity-80">· {domain.outcomes[outcome]}</span>}
    </span>
  )
}

export function ChoiceSwatch({ choice, className }: { choice: Choice; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-3 shrink-0 rounded-[2px] ring-1",
        choice === "for" && "bg-vote-for ring-vote-for",
        choice === "against" && "bg-[repeating-linear-gradient(45deg,var(--chart-2)_0_1.5px,transparent_1.5px_3.5px)] ring-vote-against",
        choice === "abstain" && "bg-[radial-gradient(var(--chart-3)_1px,transparent_1.2px)] bg-[length:3px_3px] ring-vote-abstain",
        className
      )}
    />
  )
}

/**
 * Signature moment 2: the tally strip. The track is the full eligible weight;
 * segments show for / against / abstain and ease to new widths; the tick
 * marks quorum and flips to "Quorum reached" when turnout crosses it.
 */
export function TallyStrip({ p, tally, size = "md" }: { p: Proposal; tally: Tally; size?: "sm" | "md" }) {
  const { app, domain, locale } = useApp()
  const w = tally.eligibleWeight || 1
  const pct = (x: number) => `${(x / w) * 100}%`
  const tt = app.proposal.tally
  const h = size === "sm" ? "h-2.5" : "h-5"
  const label = `${tt.turnout} ${formatNumber(locale, tally.turnout, 1)} %, ${t(tt.quorum, { q: p.quorum })}`
  return (
    <div className="flex flex-col gap-1.5">
      <div className={cn("relative w-full rounded-sm border border-foreground/40 bg-muted", h)} role="img" aria-label={label}>
        <div className="flex h-full overflow-hidden rounded-[1px]">
          <span className="tally-seg h-full bg-vote-for" style={{ width: pct(tally.weight.for) }} />
          <span className="tally-seg h-full bg-[repeating-linear-gradient(45deg,var(--chart-2)_0_2px,transparent_2px_5px)]" style={{ width: pct(tally.weight.against) }} />
          <span className="tally-seg h-full bg-[radial-gradient(var(--chart-3)_1px,transparent_1.2px)] bg-[length:4px_4px]" style={{ width: pct(tally.weight.abstain) }} />
        </div>
        <span className={cn("quorum-tick absolute -top-1 -bottom-1 w-0.5", tally.quorumMet ? "bg-primary" : "bg-foreground")} style={{ left: `${p.quorum}%` }} aria-hidden="true" />
      </div>
      {size === "md" && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            {(["for", "against", "abstain"] as const).map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5">
                <ChoiceSwatch choice={c} />
                {domain.choices[c]} <span className="font-mono tabular">{weightLabel(p, tally.weight[c], tally, locale)}</span>
              </span>
            ))}
          </span>
          {tally.quorumMet ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-primary px-1.5 py-0.5 font-mono text-[0.7rem] font-semibold text-primary-foreground">
              <CheckCircle2Icon className="size-3.5" aria-hidden="true" />
              {tt.reached}
            </span>
          ) : (
            <span className="font-mono text-[0.72rem] text-muted-foreground">{t(tt.quorum, { q: p.quorum })}</span>
          )}
        </div>
      )}
    </div>
  )
}

export function weightLabel(p: Proposal, weight: number, tally: Tally, locale: "en" | "fr"): string {
  if (p.rule === "area") return `${formatNumber(locale, (weight / (tally.eligibleWeight || 1)) * 100, 1)} %`
  return formatNumber(locale, weight, 1)
}

/** Inline feedback for a transaction: pending with hash, confirmed, or failed with a reason. */
export function TxFeedback({
  state,
  pending,
  confirmed,
  rejected,
  reverted,
  action,
}: {
  state: TxState
  pending: string
  confirmed?: ReactNode
  rejected: string
  reverted: string
  action?: ReactNode
}) {
  const { app } = useApp()
  if (state.phase === "idle") return null
  if (state.phase === "signing")
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
        {app.ballot.signing}
      </p>
    )
  if (state.phase === "pending")
    return (
      <div role="status" className="flex flex-col gap-2">
        <p className="text-sm font-medium">{pending}</p>
        {state.hash && <TxStatus status="pending" hash={state.hash} label={app.tx.pending} />}
      </div>
    )
  if (state.phase === "confirmed")
    return (
      <div role="status" className="flex flex-col gap-2">
        {confirmed}
        {state.hash && <TxStatus status="confirmed" hash={state.hash} label={app.tx.confirmed} />}
      </div>
    )
  return (
    <div role="alert" className="flex flex-col gap-2 rounded-sm border border-destructive/50 bg-destructive/5 p-3">
      <p className="flex items-start gap-2 text-sm font-medium text-destructive">
        {state.error === "rejected" ? <XCircleIcon className="mt-0.5 size-4 shrink-0" /> : <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />}
        {state.error === "rejected" ? rejected : reverted}
      </p>
      {state.hash && <TxStatus status="failed" hash={state.hash} label={app.tx.failed} />}
      {action}
    </div>
  )
}

export function Panel({ title, children, className, action, id }: { title?: ReactNode; children: ReactNode; className?: string; action?: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={title && id ? id : undefined} className={cn("rounded-md border border-foreground/25 bg-card", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-foreground/15 px-4 py-3">
          <h2 id={id} className="annot text-[0.7rem]">
            {title}
          </h2>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}
