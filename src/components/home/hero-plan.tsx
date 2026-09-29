import type { CSSProperties } from "react"

import { PlanSvg, Seal, voteFill } from "@/components/plan/plan-svg"
import type { Dictionary } from "@/i18n"
import { lotById, lotPath, lotsIn } from "@/lib/demo/geo"
import type { Choice } from "@/lib/demo/types"

/**
 * The live consent plan (signature moment on the home page): rue des
 * Tanneurs, its 20 lots, holders voting one after another, a seal landing on
 * the visitor's lot and the count crossing quorum. CSS-only, loops every 12 s,
 * settles instantly under prefers-reduced-motion.
 */

const SEQUENCE: [lotId: string, choice: Choice, delay: number][] = [
  ["4512072", "for", 0.4],
  ["4512078", "for", 1.2],
  ["4512074", "against", 2.0],
  ["4512083", "abstain", 2.8],
  ["4512081", "for", 3.6],
  ["4512089", "against", 4.4],
  ["4512090", "for", 5.2],
  ["4512087", "for", 6.4],
]
const MINE = "4512087"

export function HeroPlan({ d, labels }: { d: Dictionary["home"]; labels: Record<string, string> }) {
  const area = lotsIn("tanneries").map((l) => l.id)
  const mine = lotById(MINE)!
  const tally = d.heroTally
  return (
    <figure className="relative flex flex-col overflow-hidden rounded-md border border-foreground/60 bg-card shadow-paper">
      <div className="flex items-center justify-between gap-3 border-b border-foreground/20 px-4 py-2.5">
        <span className="annot text-[0.65rem] text-muted-foreground">P-2026-014</span>
        <span className="annot text-[0.65rem] text-muted-foreground">1 : 2 500</span>
      </div>
      <div className="aspect-[430/290] w-full">
        <PlanSvg labels={labels} title={d.heroAria} idPrefix="hero" box={{ x: 24, y: 24, w: 430, h: 290 }} area={area} mine={[MINE]} numbers>
          <g pointerEvents="none">
            {SEQUENCE.map(([id, choice, delay]) => {
              const lot = lotById(id)
              if (!lot) return null
              return <path key={id} d={lotPath(lot)} {...voteFill("hero", choice)} className="hero-vote" style={{ "--d": `${delay}s` } as CSSProperties} />
            })}
          </g>
          <Seal x={mine.centroid[0]} y={mine.centroid[1]} choice="for" k={1.15} className="hero-seal" style={{ "--d": "6.4s" } as CSSProperties} />
        </PlanSvg>
      </div>
      <figcaption className="border-t border-foreground/20 px-4 pt-3 pb-4">
        <p className="text-sm font-semibold">{d.heroCaption}</p>
        {/* Tally strip: for 5, against 2, abstain 1 of 20 lots; quorum at 8 (40 %). */}
        <div className="relative mt-3 h-4 w-full overflow-visible rounded-sm border border-foreground/40 bg-muted" aria-hidden="true">
          <div className="hero-bar flex h-full w-[40%] overflow-hidden">
            <span className="h-full w-[62.5%] bg-vote-for" />
            <span className="h-full w-[25%] bg-[repeating-linear-gradient(45deg,var(--chart-2)_0_2px,transparent_2px_5px)]" />
            <span className="h-full w-[12.5%] bg-[radial-gradient(var(--chart-3)_1px,transparent_1.2px)] bg-[length:4px_4px]" />
          </div>
          <span className="absolute -top-1.5 -bottom-1.5 left-[40%] w-0.5 bg-foreground" />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
          <span className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px] bg-vote-for" />
              {tally.for} 5
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px] bg-[repeating-linear-gradient(45deg,var(--chart-2)_0_1.5px,transparent_1.5px_3.5px)] ring-1 ring-vote-against" />
              {tally.against} 2
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px] bg-[radial-gradient(var(--chart-3)_1px,transparent_1.2px)] bg-[length:3px_3px] ring-1 ring-vote-abstain" />
              {tally.abstain} 1
            </span>
          </span>
          <span className="relative font-mono text-[0.72rem]">
            <span className="text-muted-foreground">{tally.quorum}</span>
            <span className="hero-reached ml-2 inline-flex items-center gap-1 rounded-sm bg-primary px-1.5 py-0.5 font-semibold text-primary-foreground">
              ✓ {tally.reached} · {tally.lots}
            </span>
          </span>
        </div>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {d.heroNotes.map((n) => (
            <li key={n} className="annot rounded-sm border border-foreground/25 px-1.5 py-0.5 text-[0.62rem] text-muted-foreground">
              {n}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
