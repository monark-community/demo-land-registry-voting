import { LOTS, USER_ADDRESS, lotById, type District } from "./geo"
import { randomHash, randomId } from "./ids"
import { ballotKey } from "./tally"
import type { Choice, DemoState, HolderRole, Proposal, RecordEvent, Vote } from "./types"

/**
 * The Belrive demo as it stands when a visitor arrives: two votes open,
 * one proposal waiting for the clerk, one closed vote waiting for
 * certification and two certified results. Times are relative to the
 * moment the demo is seeded, so it always looks current.
 */

export const PROPOSER_ADDRESS: Record<Proposal["proposer"], string> = {
  planning: "0x3c1e9b07a24d5f86c0e2b19d47a8f63015bc27d4",
  tanneries: "0x91d4a6e20c7b3f58d1e04a9c26b7f80e35d1c6a2",
  herons: "0x5e08c3b9d17a42f6e0c9b58a13d7e24f60a9b1c8",
  you: "0x2b7d91e4c0a36f58b1d20e9c47a3f685d0e1b7c9",
}
export const CLERK_ADDRESS = "0xc1e4b0a9d27f36e58c0d1b9a42e7f63085d2c4a1"

const DAY = 86400000
const HOUR = 3600000

const district = (d: District) => LOTS.filter((l) => l.district === d).map((l) => l.id)

export const SEED_PROPOSAL_IDS = ["P-2026-014", "P-2026-011", "P-2026-016", "P-2026-012", "P-2026-009", "P-2026-007"]

type SeedVote = [lotId: string, role: HolderRole, choice: Choice, hoursAgo: number]

export function createSeed(now = Date.now()): DemoState {
  const block = 6184220
  const events: RecordEvent[] = []
  const votes: DemoState["votes"] = {}

  const ev = (e: Omit<RecordEvent, "id" | "hash" | "block"> & { tx?: boolean }) => {
    const { tx = true, ...rest } = e
    const evt: RecordEvent = { id: randomId(), ...rest }
    if (tx) {
      evt.hash = randomHash()
      evt.block = block - Math.round((now - e.at) / 12000)
    }
    events.push(evt)
    return evt
  }

  const castSeed = (p: Proposal, list: SeedVote[]) => {
    votes[p.id] = {}
    for (const [lotId, role, choice, hoursAgo] of list) {
      const lot = lotById(lotId)
      if (!lot) continue
      const voter = role === "owner" ? lot.owner : (lot.tenant ?? lot.owner)
      const at = now - hoursAgo * HOUR
      const e = ev({ type: "vote", proposalId: p.id, at, actor: voter, lotId, role, choice })
      const v: Vote = { lotId, role, choice, voter, hash: e.hash!, block: e.block!, at }
      votes[p.id]![ballotKey(lotId, role)] = v
    }
  }

  const lifecycle = (p: Proposal) => {
    const s = ev({ type: "submitted", proposalId: p.id, at: p.submittedAt, actor: PROPOSER_ADDRESS[p.proposer] })
    p.hashes.submitted = s.hash
    if (p.opensAt) {
      const a = ev({ type: "approved", proposalId: p.id, at: p.opensAt, actor: CLERK_ADDRESS })
      p.hashes.opened = a.hash
    }
  }

  const finish = (p: Proposal) => {
    if (p.closedAt) {
      const c = ev({ type: "closed", proposalId: p.id, at: p.closedAt, actor: CLERK_ADDRESS, outcome: p.outcome })
      p.hashes.closed = c.hash
    }
    if (p.certifiedAt) {
      const c = ev({ type: "certified", proposalId: p.id, at: p.certifiedAt, actor: CLERK_ADDRESS, outcome: p.outcome })
      p.hashes.certified = c.hash
      ev({ type: "filed", proposalId: p.id, at: p.certifiedAt + 40000, actor: CLERK_ADDRESS, ref: p.registryRef, tx: false })
    }
  }

  const tanneries = district("tanneries")
  const herons = district("herons")
  const saules = district("saules")
  const nord = district("nord")
  const vieux = district("vieux")

  const proposals: Proposal[] = []

  // 1. Open: rezoning rue des Tanneurs. 7 of 20 lots have voted; the visitor's vote brings quorum (40 %).
  const p14: Proposal = {
    id: "P-2026-014", seedKey: "tanneurs", category: "zoning", proposer: "planning", lots: tanneries,
    tenantsVote: false, rule: "lot", quorum: 40, status: "open", durationDays: 14,
    submittedAt: now - 13 * DAY, opensAt: now - 11 * DAY, closesAt: now + 3 * DAY + 5 * HOUR, hashes: {},
  }
  lifecycle(p14)
  castSeed(p14, [
    ["4512072", "owner", "for", 250], ["4512074", "owner", "against", 198], ["4512078", "owner", "for", 160],
    ["4512081", "owner", "for", 97], ["4512083", "owner", "abstain", 70], ["4512089", "owner", "against", 26], ["4512090", "owner", "for", 5],
  ])
  proposals.push(p14)

  // 2. Open: protect the Pointe-aux-Hérons riverbank. Area-weighted, tenants vote.
  const p11: Proposal = {
    id: "P-2026-011", seedKey: "berge", category: "greenspace", proposer: "herons", lots: herons,
    tenantsVote: true, rule: "area", quorum: 30, status: "open", durationDays: 21,
    submittedAt: now - 18 * DAY, opensAt: now - 15 * DAY, closesAt: now + 6 * DAY + 2 * HOUR, hashes: {},
  }
  lifecycle(p11)
  castSeed(p11, [
    ["4541301", "owner", "for", 300], ["4541301", "tenant", "for", 290], ["4541303", "tenant", "for", 180],
    ["4541307", "owner", "against", 120], ["4541309", "owner", "for", 44], ["4541312", "tenant", "abstain", 12],
  ])
  proposals.push(p11)

  // 3. In review: traffic calming on chemin des Saules (the clerk's queue).
  const p16: Proposal = {
    id: "P-2026-016", seedKey: "saules", category: "infrastructure", proposer: "planning", lots: saules,
    tenantsVote: true, rule: "lot", quorum: 25, status: "review", durationDays: 14,
    submittedAt: now - 1 * DAY - 3 * HOUR, hashes: {},
  }
  lifecycle(p16)
  proposals.push(p16)

  // 4. Closed yesterday, passed: waiting for the clerk's certification.
  const p12: Proposal = {
    id: "P-2026-012", seedKey: "neige", category: "services", proposer: "planning", lots: nord,
    tenantsVote: false, rule: "area", quorum: 50, status: "closed", outcome: "passed", durationDays: 14,
    submittedAt: now - 30 * DAY, opensAt: now - 28 * DAY, closesAt: now - 1 * DAY, closedAt: now - 1 * DAY + 20 * 60000, hashes: {},
  }
  lifecycle(p12)
  castSeed(p12, [
    ["4506401", "owner", "for", 600], ["4506402", "owner", "for", 420], ["4506403", "owner", "against", 300], ["4506405", "owner", "for", 90],
  ])
  finish(p12)
  proposals.push(p12)

  // 5. Certified and filed: participatory budget for Place du Marché. The visitor's shop voted for.
  const p09: Proposal = {
    id: "P-2026-009", seedKey: "marche", category: "budget", proposer: "planning", lots: vieux,
    tenantsVote: true, rule: "lot", quorum: 30, status: "certified", outcome: "passed", durationDays: 21,
    submittedAt: now - 70 * DAY, opensAt: now - 66 * DAY, closesAt: now - 45 * DAY, closedAt: now - 45 * DAY + 3600000,
    certifiedAt: now - 44 * DAY, registryRef: "BLR-2026-0398", registry: "filed", hashes: {},
  }
  lifecycle(p09)
  const d = (days: number) => days * 24
  castSeed(p09, [
    ["4498121", "owner", "for", d(64)], ["4498122", "owner", "for", d(63)], ["4498122", "tenant", "for", d(63)],
    ["4498124", "owner", "against", d(61)], ["4498126", "owner", "for", d(58)], ["4498127", "tenant", "abstain", d(57)],
    ["4498128", "owner", "for", d(55)], ["4498129", "owner", "for", d(52)], ["4498130", "tenant", "for", d(51)],
    ["4498133", "owner", "against", d(49)], ["4498135", "owner", "for", d(47)], ["4498136", "owner", "for", d(46)],
  ])
  // The visitor's own seeded vote is signed by the demo wallet.
  const mine = votes[p09.id]?.[ballotKey("4498129", "owner")]
  if (mine) mine.voter = USER_ADDRESS
  for (const e of events) if (e.proposalId === p09.id && e.lotId === "4498129") e.actor = USER_ADDRESS
  finish(p09)
  proposals.push(p09)

  // 6. Certified without quorum: antenna on the Parc Nord water tower.
  const p07: Proposal = {
    id: "P-2026-007", seedKey: "antenne", category: "services", proposer: "planning", lots: nord,
    tenantsVote: false, rule: "lot", quorum: 50, status: "certified", outcome: "no_quorum", durationDays: 14,
    submittedAt: now - 110 * DAY, opensAt: now - 106 * DAY, closesAt: now - 92 * DAY, closedAt: now - 92 * DAY + 3600000,
    certifiedAt: now - 91 * DAY, registryRef: "BLR-2026-0311", registry: "filed", hashes: {},
  }
  lifecycle(p07)
  castSeed(p07, [["4506401", "owner", "against", d(100)], ["4506404", "owner", "for", d(98)]])
  finish(p07)
  proposals.push(p07)

  events.sort((a, b) => b.at - a.at)

  return {
    version: 1,
    seededAt: now,
    block,
    wallet: { status: "disconnected", address: USER_ADDRESS, lookup: "idle", holdings: [] },
    role: "resident",
    proposals,
    votes,
    events,
    settings: { failNext: false, slow: false, registryOffline: false, noLand: false },
  }
}
