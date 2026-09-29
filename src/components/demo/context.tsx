"use client"

import { createContext, useContext } from "react"

import type { Dictionary } from "@/i18n"
import type { Locale } from "@/i18n/config"
import { formatLot, lotById, type Lot } from "@/lib/demo/geo"
import type { Proposal } from "@/lib/demo/types"

export interface AppCopy {
  app: Dictionary["app"]
  plan: Dictionary["plan"]
  domain: Dictionary["domain"]
  seed: Dictionary["seed"]
  demoBadge: string
}

export interface AppContextValue extends AppCopy {
  locale: Locale
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp outside AppProvider")
  return ctx
}

/** Title and summary of a proposal in the current language. */
export function proposalText(ctx: AppCopy, p: Proposal): { title: string; summary: string } {
  if (p.seedKey && p.seedKey in ctx.seed) {
    const s = ctx.seed[p.seedKey as keyof AppCopy["seed"]]
    return { title: s.title, summary: s.summary }
  }
  return { title: p.title ?? p.id, summary: p.summary ?? "" }
}

export function lotAddress(ctx: AppCopy, lot: Lot): string {
  return ctx.domain.address.replace("{civic}", String(lot.civic)).replace("{street}", lot.street)
}

export function lotLabel(ctx: AppCopy, id: string): string {
  const lot = lotById(id)
  const n = formatLot(id)
  return lot ? `${n} · ${lotAddress(ctx, lot)}` : n
}
