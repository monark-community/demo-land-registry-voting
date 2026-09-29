"use client"

import { ArrowRightIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react"
import Link from "next/link"
import { useId, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { DISTRICTS, FULL_BOX, bboxOf, formatLot, lotById, lotsIn, type District } from "@/lib/demo/geo"
import { applySubmit, nextProposalId, type Draft } from "@/lib/demo/ops"
import { useDemo } from "@/lib/demo/store"
import { AREA_CAP, eligibleBallots, quorumLots } from "@/lib/demo/tally"
import type { Category } from "@/lib/demo/types"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

import { Panel, TxFeedback } from "./bits"
import { useApp } from "./context"
import { InteractivePlan, LotFinder } from "./interactive-plan"
import { RoleGate } from "./role-gate"

const CATEGORIES: Category[] = ["zoning", "infrastructure", "greenspace", "budget", "services"]
const TEMPLATES = { bike: { category: "infrastructure", district: "tanneries" }, play: { category: "greenspace", district: "herons" }, heritage: { category: "zoning", district: "vieux" } } as const

const EMPTY: Draft = { title: "", summary: "", category: "zoning", lots: [], tenantsVote: false, rule: "lot", quorum: 30, durationDays: 14 }

function Choice<T extends string | boolean>({ name, value, options, onChange }: { name: string; value: T; options: { v: T; label: string; hint?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <label
          key={String(o.v)}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-sm border px-3 py-2.5 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40",
            value === o.v ? "border-foreground bg-muted" : "border-foreground/25 hover:border-foreground/50"
          )}
        >
          <input type="radio" name={name} checked={value === o.v} onChange={() => onChange(o.v)} className="sr-only" />
          <span className={cn("mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border-2", value === o.v ? "border-foreground" : "border-foreground/40")} aria-hidden="true">
            {value === o.v && <span className="size-2 rounded-full bg-foreground" />}
          </span>
          <span>
            <span className="block text-sm font-semibold">{o.label}</span>
            {o.hint && <span className="block text-xs text-muted-foreground">{o.hint}</span>}
          </span>
        </label>
      ))}
    </div>
  )
}

export function DraftView() {
  const { app, domain, locale } = useApp()
  const d = app.draft
  const demo = useDemo()
  const tx = useTx()
  const uid = useId()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [errors, setErrors] = useState<string[]>([])
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const set = (patch: Partial<Draft>) => setDraft((x) => ({ ...x, ...patch }))

  const preview = useMemo(() => {
    const ballots = eligibleBallots(draft)
    const areaSum = draft.lots.reduce((s, id) => s + Math.min(AREA_CAP, lotById(id)?.area ?? 0), 0)
    return {
      ballots: ballots.length,
      owners: ballots.filter((b) => b.role === "owner").length,
      tenants: ballots.filter((b) => b.role === "tenant").length,
      quorumLots: quorumLots(draft.lots.length, draft.quorum),
      quorumM2: Math.round((areaSum * draft.quorum) / 100),
    }
  }, [draft])

  if (!demo) return <p className="mx-auto w-full max-w-7xl px-4 py-16 text-muted-foreground sm:px-6">{app.loading}</p>

  if (demo.role !== "proposer") {
    return (
      <div className="px-4 py-10 sm:px-6">
        <h1 className="sr-only">{d.title}</h1>
        <RoleGate role="proposer" title={d.gateTitle} body={d.gateBody} cta={d.gateCta} />
      </div>
    )
  }

  const toggleLot = (id: string) => set({ lots: draft.lots.includes(id) ? draft.lots.filter((x) => x !== id) : [...draft.lots, id] })
  const toggleDistrict = (dist: District) => {
    const ids = lotsIn(dist).map((l) => l.id)
    const all = ids.every((id) => draft.lots.includes(id))
    set({ lots: all ? draft.lots.filter((x) => !ids.includes(x)) : Array.from(new Set([...draft.lots, ...ids])) })
  }

  const validate = () => {
    const e: string[] = []
    if (draft.title.trim().length < 8) e.push(d.errors.title)
    if (draft.summary.trim().length < 20) e.push(d.errors.summary)
    if (draft.lots.length < 3) e.push(d.errors.lots)
    if (draft.quorum < 10 || draft.quorum > 75) e.push(d.errors.quorum)
    return e
  }

  const submit = async () => {
    const e = validate()
    setErrors(e)
    if (e.length) {
      document.getElementById(`${uid}-errors`)?.focus()
      return
    }
    const id = nextProposalId()
    const pr = app.prompt
    const ok = await tx.run(
      {
        kind: "submit",
        title: t(pr.titles.submit, { id }),
        lines: [
          { label: pr.lines.proposal, value: draft.title.trim() },
          { label: pr.lines.lots, value: String(draft.lots.length), mono: true },
          { label: pr.lines.rule, value: `${domain.rules[draft.rule]}${draft.tenantsVote ? ` · ${d.who.ownersTenants}` : ""}` },
          { label: pr.lines.quorum, value: `${draft.quorum} %` },
          { label: pr.lines.duration, value: t(d.duration.days, { n: draft.durationDays }) },
        ],
      },
      (hash, block) => applySubmit(id, { ...draft, title: draft.title.trim(), summary: draft.summary.trim() }, hash, block)
    )
    if (ok) setSubmittedId(id)
  }

  if (submittedId && tx.state.phase === "confirmed") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="sr-only">{d.title}</h1>
        <Panel>
          <div role="status" className="flex flex-col items-start gap-4">
            <CheckCircle2Icon className="size-8 text-success" aria-hidden="true" />
            <p className="text-xl font-bold">{t(d.confirmed, { id: submittedId })}</p>
            <TxFeedback state={tx.state} pending="" rejected="" reverted="" />
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={href(locale, `/app/proposals/${submittedId}`)}>
                  {d.view} <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDraft(EMPTY)
                  setSubmittedId(null)
                  tx.reset()
                }}
              >
                {d.another}
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    )
  }

  const box = draft.lots.length ? bboxOf(draft.lots, 70) : FULL_BOX

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <h1 className="text-3xl font-extrabold tracking-display">{d.title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{d.intro}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="annot text-[0.62rem] text-muted-foreground">{d.templates}</span>
        {(Object.keys(TEMPLATES) as (keyof typeof TEMPLATES)[]).map((k) => (
          <Button
            key={k}
            variant="outline"
            size="sm"
            onClick={() => {
              const tpl = d.templateList[k]
              setDraft({
                ...draft,
                title: tpl.title,
                summary: tpl.summary,
                category: TEMPLATES[k].category,
                lots: lotsIn(TEMPLATES[k].district).map((l) => l.id),
              })
              setErrors([])
            }}
          >
            {d.templateList[k].label}
          </Button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
          className="flex flex-col gap-6"
        >
          {errors.length > 0 && (
            <div id={`${uid}-errors`} tabIndex={-1} role="alert" className="rounded-sm border border-destructive/60 bg-destructive/5 p-4 outline-none">
              <p className="font-semibold text-destructive">{d.errorsTitle}</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-destructive">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <fieldset disabled={tx.busy} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-title`}>{d.fields.title}</Label>
              <Input id={`${uid}-title`} value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder={d.fields.titlePlaceholder} aria-invalid={errors.includes(d.errors.title) || undefined} maxLength={120} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-cat`}>{d.fields.category}</Label>
              <select
                id={`${uid}-cat`}
                value={draft.category}
                onChange={(e) => set({ category: e.target.value as Category })}
                className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {domain.categories[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-sum`}>{d.fields.summary}</Label>
              <Textarea id={`${uid}-sum`} value={draft.summary} onChange={(e) => set({ summary: e.target.value })} placeholder={d.fields.summaryPlaceholder} aria-invalid={errors.includes(d.errors.summary) || undefined} maxLength={600} />
            </div>

            <section aria-labelledby={`${uid}-area`} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id={`${uid}-area`} className="font-semibold">
                  {d.area.title}
                </h2>
                <p className="flex items-center gap-2 text-sm">
                  <span className="font-mono" aria-live="polite">
                    {t(d.area.selected, { n: draft.lots.length })}
                  </span>
                  {draft.lots.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => set({ lots: [] })}>
                      {d.area.clear}
                    </Button>
                  )}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{d.area.hint}</p>
              <div className="flex flex-wrap gap-2">
                {DISTRICTS.map((dist) => {
                  const ids = lotsIn(dist).map((l) => l.id)
                  const on = ids.every((id) => draft.lots.includes(id))
                  return (
                    <button
                      key={dist}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleDistrict(dist)}
                      className={cn("h-9 rounded-sm border px-3 text-sm font-medium", on ? "border-primary bg-primary text-primary-foreground" : "border-foreground/30 bg-card hover:border-foreground/60")}
                    >
                      {domain.districts[dist]}
                    </button>
                  )
                })}
              </div>
              <InteractivePlan idPrefix="draft" box={box} area={draft.lots} onLot={toggleLot} legend={{ area: true }} votes={Object.fromEntries(draft.lots.map((id) => [id, "for" as const]))} />
              <LotFinder onPick={toggleLot} />
              {draft.lots.length > 0 && draft.lots.length <= 24 && (
                <p className="font-mono text-[0.7rem] leading-relaxed text-muted-foreground">{draft.lots.map(formatLot).join(" · ")}</p>
              )}
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-semibold">{d.who.title}</h2>
              <Choice name={`${uid}-who`} value={draft.tenantsVote} onChange={(v) => set({ tenantsVote: v })} options={[{ v: false, label: d.who.owners }, { v: true, label: d.who.ownersTenants }]} />
            </section>
            <section className="flex flex-col gap-2">
              <h2 className="font-semibold">{d.rule.title}</h2>
              <Choice name={`${uid}-rule`} value={draft.rule} onChange={(v) => set({ rule: v })} options={[{ v: "lot", label: d.rule.lot }, { v: "area", label: d.rule.area, hint: d.rule.areaHint }]} />
            </section>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${uid}-q`}>
                  {d.quorum.label} <span className="ml-auto font-mono">{draft.quorum} %</span>
                </Label>
                <input id={`${uid}-q`} type="range" min={10} max={75} step={5} value={draft.quorum} onChange={(e) => set({ quorum: Number(e.target.value) })} className="h-10 accent-[var(--primary)]" aria-describedby={`${uid}-qh`} />
                <p id={`${uid}-qh`} className="text-xs text-muted-foreground">
                  {d.quorum.hint}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${uid}-dur`}>{d.duration.label}</Label>
                <select
                  id={`${uid}-dur`}
                  value={draft.durationDays}
                  onChange={(e) => set({ durationDays: Number(e.target.value) })}
                  className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  {[7, 14, 21, 30].map((n) => (
                    <option key={n} value={n}>
                      {t(d.duration.days, { n })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>
        </form>

        <div className="flex flex-col gap-4 lg:sticky lg:top-[8.5rem] lg:self-start">
          <Panel title={d.preview.title} id={`${uid}-preview`}>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="font-semibold">{t(d.preview.lots, { n: draft.lots.length })}</li>
              <li>{t(d.preview.ballots, { n: preview.ballots, o: preview.owners, t: preview.tenants })}</li>
              <li>
                {draft.rule === "lot" && !draft.tenantsVote
                  ? t(d.preview.quorumLots, { n: preview.quorumLots })
                  : t(d.preview.quorumArea, { p: draft.quorum, m: formatNumber(locale, preview.quorumM2) })}
              </li>
              <li className="text-muted-foreground">{t(d.preview.closes, { n: draft.durationDays })}</li>
            </ul>
            <Button size="lg" className="mt-4 w-full" onClick={() => void submit()} disabled={tx.busy}>
              {tx.busy && <Loader2Icon className="animate-spin" />}
              {tx.busy ? d.pending : d.submit}
            </Button>
            <div className="mt-3">
              <TxFeedback
                state={tx.state}
                pending={d.pending}
                rejected={d.rejected}
                reverted={d.reverted}
                action={
                  <Button size="sm" variant="outline" className="self-start" onClick={() => void submit()}>
                    {app.ballot.retry}
                  </Button>
                }
              />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
