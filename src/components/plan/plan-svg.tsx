import type { KeyboardEvent, ReactNode } from "react"

import { cn } from "@/lib/utils"
import {
  BANK_PATH,
  FULL_BOX,
  LABELS,
  LOTS,
  RIVER_PATH,
  SQUARE,
  hullOf,
  lotPath,
  pointsPath,
  type BBox,
  type Lot,
} from "@/lib/demo/geo"
import type { Choice } from "@/lib/demo/types"

/**
 * The Belrive cadastral plan as pure SVG. No hooks, so the server can render
 * it (home hero, how-it-works) and the demo can wrap it with interactivity.
 */

export interface SealMark {
  lotId: string
  choice: Choice
  fresh?: boolean
}

export interface PlanSvgProps {
  labels: Record<string, string>
  title: string
  box?: BBox
  /** Lots in the proposal area (outlined together) or in a draft selection. */
  area?: string[]
  /** The visitor's lots (ochre highlighter). */
  mine?: string[]
  /** Displayed choice per lot. */
  votes?: Record<string, Choice>
  seals?: SealMark[]
  selected?: string | null
  dimOutside?: boolean
  numbers?: boolean
  /** Unique prefix for pattern ids when several plans share a page. */
  idPrefix?: string
  /** Lots that get a button role and keyboard focus. */
  focusable?: (lot: Lot) => boolean
  lotLabel?: (lot: Lot) => string
  onLot?: (id: string) => void
  /** Extra SVG drawn above the lots (hero animation layers). */
  children?: ReactNode
  className?: string
}

export function PlanDefs({ p }: { p: string }) {
  return (
    <defs>
      <pattern id={`${p}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0H0V40" fill="none" stroke="var(--grid)" strokeWidth="1" />
      </pattern>
      <pattern id={`${p}-water`} width="16" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 5 q4 -3 8 0 t8 0" fill="none" stroke="var(--chart-5)" strokeWidth="0.9" opacity="0.7" />
      </pattern>
      <pattern id={`${p}-bank`} width="7" height="7" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.9" fill="var(--chart-1)" opacity="0.55" />
      </pattern>
      <pattern id={`${p}-square`} width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="0.8" fill="var(--lot-line)" opacity="0.45" />
      </pattern>
      <pattern id={`${p}-against`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill="var(--chart-2)" opacity="0.12" />
        <line x1="0" y1="0" x2="0" y2="6" stroke="var(--chart-2)" strokeWidth="2.2" />
      </pattern>
      <pattern id={`${p}-abstain`} width="5" height="5" patternUnits="userSpaceOnUse">
        <rect width="5" height="5" fill="var(--chart-3)" opacity="0.1" />
        <circle cx="2.5" cy="2.5" r="1.1" fill="var(--chart-3)" />
      </pattern>
    </defs>
  )
}

export function voteFill(p: string, choice: Choice): { fill: string; fillOpacity?: number } {
  if (choice === "for") return { fill: "var(--chart-1)", fillOpacity: 0.62 }
  if (choice === "against") return { fill: `url(#${p}-against)` }
  return { fill: `url(#${p}-abstain)` }
}

export function Seal({ x, y, choice, fresh, k = 1, className, style }: { x: number; y: number; choice: Choice; fresh?: boolean; k?: number; className?: string; style?: React.CSSProperties }) {
  const r = 11 * k
  return (
    <g aria-hidden="true" className={className} style={style}>
      {fresh && <circle cx={x} cy={y} r={r} fill="none" stroke="var(--foreground)" strokeWidth={2 * k} className="seal-ink" />}
      <g className={cn("seal", fresh && "seal-new")}>
        <circle cx={x} cy={y} r={r} fill="var(--card)" stroke="var(--foreground)" strokeWidth={1.6 * k} />
        <circle cx={x} cy={y} r={r - 2.6 * k} fill="none" stroke="var(--foreground)" strokeWidth={0.7 * k} strokeDasharray={`${1.4 * k} ${1.2 * k}`} />
        {choice === "for" && (
          <path d={`M${x - 4 * k} ${y + 0.2 * k} l${3 * k} ${3 * k} l${5.5 * k} ${-6.5 * k}`} fill="none" stroke="var(--chart-1)" strokeWidth={2.2 * k} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {choice === "against" && (
          <path d={`M${x - 3.6 * k} ${y - 3.6 * k} l${7.2 * k} ${7.2 * k} M${x + 3.6 * k} ${y - 3.6 * k} l${-7.2 * k} ${7.2 * k}`} stroke="var(--chart-2)" strokeWidth={2.2 * k} strokeLinecap="round" />
        )}
        {choice === "abstain" && <path d={`M${x - 4 * k} ${y} h${8 * k}`} stroke="var(--chart-3)" strokeWidth={2.4 * k} strokeLinecap="round" />}
      </g>
    </g>
  )
}

export function PlanSvg({
  labels,
  title,
  box = FULL_BOX,
  area,
  mine,
  votes,
  seals,
  selected,
  dimOutside,
  numbers,
  idPrefix = "plan",
  focusable,
  lotLabel,
  onLot,
  children,
  className,
}: PlanSvgProps) {
  const p = idPrefix
  const areaSet = new Set(area ?? [])
  const mineSet = new Set(mine ?? [])
  const k = Math.max(0.45, box.w / 1100)
  const hull = area && area.length ? pointsPath(hullOf(area, 9)) : ""
  const showNumbers = numbers ?? box.w < 760

  const handleKey = (id: string) => (e: KeyboardEvent<SVGPathElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onLot?.(id)
    }
  }

  return (
    <svg
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={title}
      className={cn("block h-full w-full select-none", className)}
    >
      <PlanDefs p={p} />
      <rect x={-200} y={-200} width={1500} height={1200} fill="var(--paper)" />
      <rect x={-200} y={-200} width={1500} height={1200} fill={`url(#${p}-grid)`} />

      {/* Water, public bank and the market square */}
      <path d={RIVER_PATH} fill="var(--paper)" />
      <path d={RIVER_PATH} fill={`url(#${p}-water)`} stroke="var(--chart-5)" strokeWidth="1.2" />
      <path d={BANK_PATH} fill={`url(#${p}-bank)`} />
      <rect x={SQUARE.x} y={SQUARE.y} width={SQUARE.w} height={SQUARE.h} fill={`url(#${p}-square)`} stroke="var(--lot-line)" strokeWidth="0.8" strokeDasharray="3 3" />

      {/* Proposal area underlay */}
      {hull && <path d={hull} fill="var(--chart-1)" fillOpacity="0.06" />}

      {/* Lots */}
      <g>
        {LOTS.map((lot) => {
          const d = lotPath(lot)
          const isMine = mineSet.has(lot.id)
          const inArea = areaSet.has(lot.id)
          const choice = votes?.[lot.id]
          const canFocus = !!onLot && (focusable ? focusable(lot) : false)
          const dim = dimOutside && areaSet.size > 0 && !inArea && !isMine
          return (
            <g key={lot.id} opacity={dim ? 0.5 : 1}>
              <path
                d={d}
                className={cn("lot", onLot && "lot-interactive")}
                fill={isMine ? "var(--accent)" : "var(--lot-fill)"}
                stroke={isMine ? "var(--chart-4)" : "var(--lot-line)"}
                strokeWidth={isMine ? 2.2 : 0.8}
                strokeLinejoin="round"
                role={canFocus ? "button" : undefined}
                tabIndex={canFocus ? 0 : undefined}
                aria-label={canFocus && lotLabel ? lotLabel(lot) : undefined}
                aria-pressed={canFocus ? selected === lot.id : undefined}
                onClick={onLot ? () => onLot(lot.id) : undefined}
                onKeyDown={canFocus ? handleKey(lot.id) : undefined}
              />
              {choice && <path d={d} {...voteFill(p, choice)} pointerEvents="none" className="lot" />}
              {selected === lot.id && <path d={d} fill="none" stroke="var(--foreground)" strokeWidth={2.6} pointerEvents="none" />}
            </g>
          )
        })}
      </g>

      {/* Area outline drawn over the lots */}
      {hull && <path d={hull} fill="none" stroke="var(--primary)" strokeWidth={1.8 * k} strokeDasharray={`${7 * k} ${4 * k}`} pointerEvents="none" />}

      {/* Lot numbers when zoomed in */}
      {showNumbers && (
        <g pointerEvents="none" fontFamily="var(--font-mono)" fontSize={7.2 * Math.max(0.8, k)} fill="var(--muted-foreground)" textAnchor="middle">
          {LOTS.filter((l) => !area || areaSet.has(l.id) || mineSet.has(l.id)).map((l) => (
            <text key={l.id} x={l.centroid[0]} y={l.centroid[1] + 2.5}>
              {l.id.slice(-3)}
            </text>
          ))}
        </g>
      )}

      {/* Labels */}
      <g pointerEvents="none" fontFamily="var(--font-mono)">
        {LABELS.map((lb) => {
          const text = labels[lb.key] ?? ""
          const base =
            lb.kind === "district"
              ? { fontSize: 12.5, fontWeight: 600, letterSpacing: 3, fill: "var(--foreground)", opacity: 0.8 }
              : lb.kind === "water"
                ? { fontSize: 13, fontStyle: "italic" as const, letterSpacing: 1.5, fill: "var(--chart-5)", fontFamily: "var(--font-sans)" }
                : lb.kind === "place"
                  ? { fontSize: 8.5, fontStyle: "italic" as const, letterSpacing: 0.4, fill: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }
                  : { fontSize: 7.6, letterSpacing: 1.6, fill: "var(--muted-foreground)" }
          return (
            <text
              key={lb.key}
              x={lb.x}
              y={lb.y}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={lb.rotate ? `rotate(${lb.rotate} ${lb.x} ${lb.y})` : undefined}
              {...base}
            >
              {text}
            </text>
          )
        })}
      </g>

      {/* Seals */}
      {seals?.map((s) => {
        const lot = LOTS.find((l) => l.id === s.lotId)
        if (!lot) return null
        return <Seal key={`${s.lotId}-${s.choice}`} x={lot.centroid[0]} y={lot.centroid[1]} choice={s.choice} fresh={s.fresh} k={Math.max(0.7, k)} />
      })}

      {children}

      {/* North arrow */}
      <g transform={`translate(${box.x + box.w - 34 * k} ${box.y + 34 * k}) scale(${k})`} pointerEvents="none" aria-hidden="true">
        <circle r="15" fill="var(--card)" stroke="var(--foreground)" strokeWidth="1" />
        <path d="M0 -11 L5 5 L0 1.5 L-5 5 Z" fill="var(--foreground)" />
        <text y="-19" textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fontWeight="600" fill="var(--foreground)">
          N
        </text>
      </g>
    </svg>
  )
}
