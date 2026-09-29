import { lotById } from "./geo"
import type { Choice, Holding, HolderRole, Outcome, Proposal, Vote } from "./types"

/** Area-weighted votes count a lot's area up to this cap (m²). */
export const AREA_CAP = 2000

export interface Ballot {
  key: string
  lotId: string
  role: HolderRole
  holder: string
  weight: number
}

export const ballotKey = (lotId: string, role: HolderRole) => `${lotId}:${role}`

export function lotWeight(p: Pick<Proposal, "rule">, lotId: string): number {
  if (p.rule === "lot") return 1
  const area = lotById(lotId)?.area ?? 0
  return Math.min(area, AREA_CAP)
}

/**
 * Every ballot the proposal allows. With tenants voting, a rented lot's
 * weight is shared equally between its owner and its registered tenant.
 */
export function eligibleBallots(p: Pick<Proposal, "lots" | "tenantsVote" | "rule">): Ballot[] {
  const out: Ballot[] = []
  for (const id of p.lots) {
    const lot = lotById(id)
    if (!lot) continue
    const w = lotWeight(p, id)
    const shared = p.tenantsVote && lot.tenant
    out.push({ key: ballotKey(id, "owner"), lotId: id, role: "owner", holder: lot.owner, weight: shared ? w / 2 : w })
    if (shared && lot.tenant) out.push({ key: ballotKey(id, "tenant"), lotId: id, role: "tenant", holder: lot.tenant, weight: w / 2 })
  }
  return out
}

export interface Tally {
  eligibleWeight: number
  eligibleBallots: number
  weight: Record<Choice, number>
  count: Record<Choice, number>
  castWeight: number
  castBallots: number
  /** 0..100 */
  turnout: number
  quorumMet: boolean
  /** Share of for among for + against, 0..100 (abstentions count for quorum only). */
  forShare: number
  leading: Outcome
}

export function tally(p: Proposal, votes: Record<string, Vote> | undefined): Tally {
  const ballots = eligibleBallots(p)
  const byKey = new Map(ballots.map((b) => [b.key, b]))
  const weight: Record<Choice, number> = { for: 0, against: 0, abstain: 0 }
  const count: Record<Choice, number> = { for: 0, against: 0, abstain: 0 }
  for (const [key, v] of Object.entries(votes ?? {})) {
    const b = byKey.get(key)
    if (!b) continue
    weight[v.choice] += b.weight
    count[v.choice] += 1
  }
  const eligibleWeight = ballots.reduce((s, b) => s + b.weight, 0)
  const castWeight = weight.for + weight.against + weight.abstain
  const turnout = eligibleWeight ? (castWeight / eligibleWeight) * 100 : 0
  const decisive = weight.for + weight.against
  const forShare = decisive ? (weight.for / decisive) * 100 : 0
  const quorumMet = turnout + 1e-9 >= p.quorum
  const leading: Outcome = !quorumMet ? "no_quorum" : weight.for > weight.against ? "passed" : "rejected"
  return {
    eligibleWeight,
    eligibleBallots: ballots.length,
    weight,
    count,
    castWeight,
    castBallots: count.for + count.against + count.abstain,
    turnout,
    quorumMet,
    forShare,
    leading,
  }
}

export type Ineligibility = "outside" | "tenant" | null

/** The visitor's ballots on a proposal, with a reason for each lot they can't vote with. */
export function myBallots(p: Proposal, holdings: Holding[]) {
  const ballots = eligibleBallots(p)
  return holdings.map((h) => {
    const ballot = ballots.find((b) => b.lotId === h.lotId && b.role === h.role) ?? null
    let reason: Ineligibility = null
    if (!ballot) reason = p.lots.includes(h.lotId) ? "tenant" : "outside"
    return { holding: h, ballot, reason }
  })
}

/** Minimum number of lots needed for quorum with one lot, one vote (preview in the draft form). */
export function quorumLots(lots: number, quorum: number): number {
  return Math.ceil((lots * quorum) / 100 - 1e-9)
}
