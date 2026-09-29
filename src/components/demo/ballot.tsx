"use client"

import { InfoIcon, Loader2Icon, WalletIcon } from "lucide-react"
import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { formatLot, lotById } from "@/lib/demo/geo"
import { applyVote, refreshHoldings, setRole } from "@/lib/demo/ops"
import { useDemo } from "@/lib/demo/store"
import { myBallots, type Ballot as BallotT } from "@/lib/demo/tally"
import type { Choice, Proposal } from "@/lib/demo/types"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useConnect } from "./app-provider"
import { ChoiceSwatch, Panel, TxFeedback } from "./bits"
import { lotAddress, proposalText, useApp } from "./context"

const CHOICES: Choice[] = ["for", "against", "abstain"]

/** Flow 2: the visitor's ballot on one proposal. */
export function Ballot({ p, onVoted }: { p: Proposal; onVoted: (lots: string[]) => void }) {
  const ctx = useApp()
  const { app, domain, locale } = ctx
  const b = app.ballot
  const demo = useDemo()
  const { connect } = useConnect()
  const tx = useTx()
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [choice, setChoice] = useState<Choice | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastCount, setLastCount] = useState(0)
  const groupId = useId()

  if (!demo) return null
  const w = demo.wallet
  const votes = demo.votes[p.id] ?? {}

  const body = (() => {
    if (p.status === "review" || p.status === "returned") return <p className="text-sm text-muted-foreground">{b.notOpen}</p>
    if (demo.role !== "resident" && p.status === "open")
      return (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">{t(b.roleNote, { role: domain.roles[demo.role] })}</p>
          <Button variant="outline" onClick={() => setRole("resident")}>
            {b.switchToResident}
          </Button>
        </div>
      )
    if (w.status !== "connected")
      return (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">{b.connect}</p>
          <Button onClick={() => void connect()} disabled={w.status === "connecting"}>
            {w.status === "connecting" ? <Loader2Icon className="animate-spin" /> : <WalletIcon />}
            {w.status === "connecting" ? app.wallet.connecting : app.wallet.connect}
          </Button>
        </div>
      )
    if (w.lookup === "pending")
      return (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          {b.lookup}
        </p>
      )
    if (w.lookup === "failed")
      return (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="text-sm font-medium text-destructive">{b.lookupFailed}</p>
          <Button size="sm" variant="outline" onClick={() => void refreshHoldings()}>
            {b.retry}
          </Button>
        </div>
      )
    if (w.holdings.length === 0) return <p className="text-sm text-muted-foreground">{b.noLand}</p>

    const mine = myBallots(p, w.holdings)
    const eligible = mine.filter((m) => m.ballot)
    const open = p.status === "open"
    const pending = eligible.filter((m) => !votes[m.ballot!.key])
    const selected: BallotT[] = pending.filter((m) => picked[m.ballot!.key] ?? true).map((m) => m.ballot!)

    const sign = async () => {
      if (!selected.length) return setError(b.pickLots)
      if (!choice) return setError(b.pickChoice)
      setError(null)
      const lots = selected.map((s) => s.lotId)
      const pr = app.prompt
      setLastCount(selected.length)
      const ok = await tx.run(
        {
          kind: "vote",
          title: t(pr.titles.vote, { id: p.id }),
          lines: [
            { label: pr.lines.proposal, value: proposalText(ctx, p).title },
            { label: pr.lines.lots, value: lots.map(formatLot).join(", "), mono: true },
            { label: pr.lines.choice, value: domain.choices[choice] },
          ],
        },
        (hash, block) => applyVote(p.id, selected, choice, hash, block)
      )
      if (ok) {
        onVoted(lots)
        setChoice(null)
      }
    }

    return (
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2">
          {mine.map((m) => {
            const lot = lotById(m.holding.lotId)
            if (!lot) return null
            const key = m.ballot?.key
            const vote = key ? votes[key] : undefined
            const cbId = `${groupId}-${m.holding.lotId}-${m.holding.role}`
            return (
              <li key={cbId} className={cn("rounded-sm border px-3 py-2.5", m.ballot ? "border-mine/60 bg-accent/50" : "border-dashed border-foreground/25")}>
                <div className="flex items-start gap-3">
                  {m.ballot && !vote && open ? (
                    <Checkbox
                      id={cbId}
                      checked={picked[key!] ?? true}
                      onCheckedChange={(v) => setPicked((x) => ({ ...x, [key!]: v === true }))}
                      disabled={tx.busy}
                      className="mt-0.5"
                    />
                  ) : (
                    <span className="mt-1 size-4 shrink-0" aria-hidden="true" />
                  )}
                  <label htmlFor={m.ballot && !vote && open ? cbId : undefined} className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <span className="font-mono text-sm font-semibold">{formatLot(lot.id)}</span>
                      <span className="annot text-[0.58rem] text-muted-foreground">{domain.holderRoles[m.holding.role]}</span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {lotAddress(ctx, lot)}
                      {m.ballot && p.rule === "area" && ` · ${t(domain.m2, { n: formatNumber(locale, m.ballot.weight) })}`}
                    </span>
                    {m.reason && <span className="mt-1 block text-xs text-muted-foreground">{b.reasons[m.reason]}</span>}
                    {vote && (
                      <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
                        <ChoiceSwatch choice={vote.choice} />
                        {t(b.voted, { choice: domain.choices[vote.choice].toLowerCase() })}
                      </span>
                    )}
                  </label>
                </div>
              </li>
            )
          })}
        </ul>

        {!open && <p className="text-sm text-muted-foreground">{b.closed}</p>}
        {open && eligible.length === 0 && <p className="text-sm text-muted-foreground">{b.noneEligible}</p>}
        {open && eligible.length > 0 && pending.length === 0 && tx.state.phase !== "confirmed" && <p className="text-sm font-medium">{b.allVoted}</p>}

        {open && pending.length > 0 && (
          <>
            <fieldset disabled={tx.busy}>
              <legend className="annot mb-2 text-[0.65rem]">{b.choose}</legend>
              <div className="grid gap-2">
                {CHOICES.map((c) => (
                  <label
                    key={c}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-sm border px-3 py-2.5 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40",
                      choice === c ? "border-foreground bg-muted" : "border-foreground/25 hover:border-foreground/50"
                    )}
                  >
                    <input type="radio" name={`${groupId}-choice`} value={c} checked={choice === c} onChange={() => setChoice(c)} className="sr-only" />
                    <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-full border-2", choice === c ? "border-foreground" : "border-foreground/40")} aria-hidden="true">
                      {choice === c && <span className="size-2 rounded-full bg-foreground" />}
                    </span>
                    <ChoiceSwatch choice={c} className="size-4" />
                    <span className="flex-1">
                      <span className="block font-semibold">{domain.choices[c]}</span>
                      <span className="block text-xs text-muted-foreground">{b.choices[c]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            <Button size="lg" onClick={() => void sign()} disabled={tx.busy} className="w-full">
              {tx.busy && <Loader2Icon className="animate-spin" />}
              {selected.length > 1 ? t(b.signMany, { n: selected.length }) : selected.length === 1 ? b.signOne : b.sign}
            </Button>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <InfoIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {b.final} {b.fee}
            </p>
          </>
        )}

        <TxFeedback
          state={tx.state}
          pending={b.pending}
          rejected={b.rejected}
          reverted={b.reverted}
          confirmed={
            <p className="text-sm font-semibold text-success">
              {t(lastCount === 1 ? b.confirmed : b.confirmedPlural, { n: lastCount })}
              {tx.state.block && <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">{t(b.block, { n: formatNumber(locale, tx.state.block) })}</span>}
            </p>
          }
          action={
            <Button size="sm" variant="outline" className="self-start" onClick={() => void sign()}>
              {b.retry}
            </Button>
          }
        />
      </div>
    )
  })()

  return (
    <Panel title={b.title} id="ballot-title" className={cn(p.status === "open" && "border-foreground/60 shadow-paper")}>
      {body}
    </Panel>
  )
}
