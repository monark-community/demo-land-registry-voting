"use client"

import { FileCheck2Icon, FilePlus2Icon, GavelIcon, SearchIcon, VoteIcon } from "lucide-react"
import Link from "next/link"
import { useId, useMemo, useState } from "react"

import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { formatLot, USER_ADDRESS } from "@/lib/demo/geo"
import { shortAddress, shortHash } from "@/lib/demo/ids"
import { CLERK_ADDRESS } from "@/lib/demo/seed"
import { useDemo } from "@/lib/demo/store"
import type { RecordEvent } from "@/lib/demo/types"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

import { ChoiceSwatch } from "./bits"
import { useApp } from "./context"

type Filter = "all" | "proposals" | "votes" | "certifications"
const GROUP: Record<RecordEvent["type"], Exclude<Filter, "all">> = {
  submitted: "proposals",
  approved: "proposals",
  returned: "proposals",
  vote: "votes",
  closed: "certifications",
  certified: "certifications",
  filed: "certifications",
  filing_failed: "certifications",
}

/** Flow 5: the public record, filterable by kind and by lot. */
export function RecordView() {
  const { app, domain, locale } = useApp()
  const r = app.record
  const demo = useDemo()
  const uid = useId()
  const [filter, setFilter] = useState<Filter>("all")
  const [q, setQ] = useState("")
  const query = q.replace(/\s+/g, "")

  const list = useMemo(
    () => (demo?.events ?? []).filter((e) => (filter === "all" || GROUP[e.type] === filter) && (!query || (e.lotId ?? "").includes(query))),
    [demo?.events, filter, query]
  )

  if (!demo) return <p className="mx-auto w-full max-w-7xl px-4 py-16 text-muted-foreground sm:px-6">{app.loading}</p>

  const describe = (e: RecordEvent) =>
    t(r.events[e.type], {
      id: e.proposalId,
      lot: e.lotId ? formatLot(e.lotId) : "",
      role: e.role ? domain.holderRoles[e.role].toLowerCase() : "",
      choice: e.choice ? domain.choices[e.choice].toLowerCase() : "",
      outcome: e.outcome ? domain.outcomes[e.outcome].toLowerCase() : "",
      ref: e.ref ?? "",
    })
  const actor = (a: string) => (a === USER_ADDRESS ? r.you : a === CLERK_ADDRESS ? r.clerk : shortAddress(a))
  const Icon = (e: RecordEvent) => (e.type === "vote" ? VoteIcon : GROUP[e.type] === "proposals" ? FilePlus2Icon : e.type === "filed" ? FileCheck2Icon : GavelIcon)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <h1 className="text-3xl font-extrabold tracking-display">{r.title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{r.intro}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div role="radiogroup" aria-label={r.filterLabel} className="flex flex-wrap rounded-md border border-foreground/30 bg-card p-0.5">
          {(["all", "proposals", "votes", "certifications"] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={filter === f}
              onClick={() => setFilter(f)}
              className={cn("h-9 rounded-sm px-3 text-sm font-semibold text-muted-foreground hover:text-foreground", filter === f && "bg-foreground text-background hover:text-background")}
            >
              {r.filters[f]}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <label htmlFor={`${uid}-q`} className="annot mb-1 block text-[0.6rem] text-muted-foreground">
            {r.search}
          </label>
          <SearchIcon className="pointer-events-none absolute bottom-3 left-3 size-4 text-muted-foreground" aria-hidden="true" />
          <input
            id={`${uid}-q`}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={r.searchPlaceholder}
            inputMode="numeric"
            className="h-10 w-full rounded-md border border-input bg-card pr-3 pl-9 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          />
        </div>
      </div>

      <p className="annot mt-5 text-[0.6rem] text-muted-foreground" aria-live="polite">
        {t(r.count, { n: list.length })}
      </p>
      {list.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">{r.empty}</p>
      ) : (
        <ol className="mt-3 border-t border-foreground/25">
          {list.slice(0, 120).map((e) => {
            const I = Icon(e)
            return (
              <li key={e.id} className="grid grid-cols-[1.5rem_1fr] gap-x-3 border-b border-dashed border-foreground/20 py-3 sm:grid-cols-[1.5rem_1fr_auto]">
                <I className={cn("mt-0.5 size-4", e.type === "filing_failed" ? "text-destructive" : "text-muted-foreground")} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
                    {e.choice && <ChoiceSwatch choice={e.choice} />}
                    <Link href={href(locale, `/app/proposals/${e.proposalId}`)} className="hover:underline underline-offset-4">
                      {describe(e)}
                    </Link>
                  </p>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-[0.7rem] text-muted-foreground">
                    <span>{t(r.by, { actor: actor(e.actor) })}</span>
                    {e.hash ? <span title={e.hash}>{shortHash(e.hash, 10, 6)}</span> : <span>{r.offchain}</span>}
                    {e.block && <span>#{e.block}</span>}
                  </p>
                </div>
                <time dateTime={new Date(e.at).toISOString()} className="col-start-2 mt-1 font-mono text-[0.7rem] text-muted-foreground sm:col-start-3 sm:mt-0 sm:text-right">
                  {formatDate(locale, e.at, true)}
                </time>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
