"use client"

import { Maximize2Icon, SearchIcon } from "lucide-react"
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { PlanSvg, type SealMark } from "@/components/plan/plan-svg"
import { t } from "@/i18n/t"
import { FULL_BOX, LOTS, formatLot, type BBox, type Lot } from "@/lib/demo/geo"
import type { Choice } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

import { ChoiceSwatch } from "./bits"
import { lotAddress, useApp } from "./context"

/** Tween the viewBox so the plan glides to a proposal's area. */
function useTweenedBox(target: BBox): BBox {
  const [box, setBox] = useState(target)
  const current = useRef(target)
  const key = `${target.x},${target.y},${target.w},${target.h}`
  useEffect(() => {
    const from = current.current
    const to = target
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    if (reduce) {
      current.current = to
      raf = requestAnimationFrame(() => setBox(to))
      return () => cancelAnimationFrame(raf)
    }
    const start = performance.now()
    const dur = 520
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur)
      const e = 1 - Math.pow(1 - k, 3)
      const b = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e }
      current.current = b
      setBox(b)
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return box
}

/** Keep the plan's aspect ratio (11:8) so zooms don't distort. */
export function fitBox(b: BBox, aspect = 1100 / 800): BBox {
  let { x, y, w, h } = b
  if (w / h > aspect) {
    const nh = w / aspect
    y -= (nh - h) / 2
    h = nh
  } else {
    const nw = h * aspect
    x -= (nw - w) / 2
    w = nw
  }
  return { x, y, w, h }
}

export interface InteractivePlanProps {
  box?: BBox
  area?: string[]
  mine?: string[]
  votes?: Record<string, Choice>
  seals?: SealMark[]
  selected?: string | null
  dimOutside?: boolean
  onLot?: (id: string) => void
  focusable?: (lot: Lot) => boolean
  legend?: { yours?: boolean; area?: boolean; votes?: boolean }
  onWholeTown?: () => void
  toolbar?: ReactNode
  className?: string
  idPrefix?: string
}

export function InteractivePlan({
  box = FULL_BOX,
  area,
  mine,
  votes,
  seals,
  selected,
  dimOutside,
  onLot,
  focusable,
  legend = { yours: true },
  onWholeTown,
  toolbar,
  className,
  idPrefix = "app",
}: InteractivePlanProps) {
  const ctx = useApp()
  const { plan } = ctx
  const fitted = useMemo(() => fitBox(box), [box])
  const tweened = useTweenedBox(fitted)

  return (
    <div className={cn("relative overflow-hidden rounded-md border border-foreground/50 bg-paper", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-foreground/20 bg-card px-3 py-2">
        <span className="annot truncate text-[0.62rem] text-muted-foreground">{plan.title}</span>
        <div className="flex items-center gap-1.5">
          {toolbar}
          {onWholeTown && (
            <Button variant="ghost" size="sm" onClick={onWholeTown} className="h-8">
              <Maximize2Icon className="size-3.5" />
              <span className="hidden sm:inline">{plan.wholeTown}</span>
              <span className="sr-only sm:hidden">{plan.wholeTown}</span>
            </Button>
          )}
        </div>
      </div>
      <div className="aspect-[11/8] w-full">
        <PlanSvg
          labels={plan.labels}
          title={t(plan.ariaLabel, { n: LOTS.length })}
          box={tweened}
          area={area}
          mine={mine}
          votes={votes}
          seals={seals}
          selected={selected}
          dimOutside={dimOutside}
          onLot={onLot}
          focusable={focusable}
          lotLabel={(lot) => t(plan.lotAria, { lot: formatLot(lot.id), address: lotAddress(ctx, lot) })}
          idPrefix={idPrefix}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-foreground/20 bg-card px-3 py-2 text-xs text-muted-foreground">
        {legend.yours && (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-[2px] bg-accent ring-2 ring-mine" aria-hidden="true" />
            {plan.legend.yours}
          </span>
        )}
        {legend.area && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-4 rounded-[2px] border-2 border-dashed border-primary" aria-hidden="true" />
            {plan.legend.area}
          </span>
        )}
        {legend.votes &&
          (["for", "against", "abstain"] as const).map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <ChoiceSwatch choice={c} />
              {plan.legend[c]}
            </span>
          ))}
        <span className="annot ml-auto text-[0.58rem]">{plan.scale}</span>
      </div>
    </div>
  )
}

/** Keyboard- and screen-reader-friendly way to reach any lot. */
export function LotFinder({ onPick, className }: { onPick: (id: string) => void; className?: string }) {
  const ctx = useApp()
  const { plan } = ctx
  const id = useId()
  const [q, setQ] = useState("")
  const query = q.trim().toLowerCase().replace(/\s+/g, "")
  const results = query.length < 2 ? [] : LOTS.filter((l) => l.id.includes(query) || l.street.toLowerCase().replace(/\s+/g, "").includes(query) || lotAddress(ctx, l).toLowerCase().replace(/\s+/g, "").includes(query)).slice(0, 6)
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {plan.find}
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={plan.findPlaceholder}
        autoComplete="off"
        className="h-10 w-full rounded-md border border-input bg-card pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        aria-describedby={`${id}-status`}
      />
      <p id={`${id}-status`} className="sr-only" aria-live="polite">
        {query.length >= 2 ? (results.length ? t(plan.findResults, { n: results.length }) : t(plan.findNone, { q })) : ""}
      </p>
      {query.length >= 2 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-foreground/30 bg-popover shadow-paper">
          {results.length === 0 && <li className="px-3 py-2.5 text-sm text-muted-foreground">{t(plan.findNone, { q })}</li>}
          {results.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(l.id)
                  setQ("")
                }}
                className="flex w-full items-baseline gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <span className="font-mono text-xs">{formatLot(l.id)}</span>
                <span className="truncate text-muted-foreground">{lotAddress(ctx, l)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
