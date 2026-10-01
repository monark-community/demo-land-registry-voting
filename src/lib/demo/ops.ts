"use client"

import { latency, sleep } from "./chain"
import { LOTS, USER_ADDRESS } from "./geo"
import { randomId } from "./ids"
import { CLERK_ADDRESS, PROPOSER_ADDRESS } from "./seed"
import { getDemo, requestSignature, setWallet, update, updateProposal } from "./store"
import { ballotKey, tally, type Ballot } from "./tally"
import type { Category, Choice, Holding, Proposal, RecordEvent, Role, TxSummary, VotingRule } from "./types"

/**
 * Demo actions. Each mirrors a contract call or a registry request; the UI
 * calls these and never touches the store's shape directly.
 */

const DAY = 86400000

function pushEvent(e: Omit<RecordEvent, "id">) {
  update((s) => ({ ...s, events: [{ id: randomId(), ...e }, ...s.events] }))
}

/* ----------------------------- Wallet + registry ----------------------------- */

/** Simulated registry lookup: which lots are attested to this wallet. */
async function lookupHoldings(address: string): Promise<Holding[]> {
  await sleep(latency([1100, 1800]))
  const settings = getDemo()?.settings
  if (settings?.registryOffline) throw new Error("registry-offline")
  if (settings?.noLand) return []
  const out: Holding[] = []
  for (const l of LOTS) {
    if (l.owner === address) out.push({ lotId: l.id, role: "owner" })
    if (l.tenant === address) out.push({ lotId: l.id, role: "tenant" })
  }
  return out
}

export async function refreshHoldings() {
  const demo = getDemo()
  if (!demo || demo.wallet.status !== "connected") return
  setWallet({ lookup: "pending" })
  try {
    const holdings = await lookupHoldings(demo.wallet.address)
    setWallet({ lookup: "done", holdings })
  } catch {
    setWallet({ lookup: "failed", holdings: [] })
  }
}

/** Sign in with a message signature (no fee), then look up the wallet's lots. */
export async function connectWallet(summary: TxSummary): Promise<"connected" | "rejected"> {
  setWallet({ status: "connecting" })
  const ok = await requestSignature(summary)
  if (!ok) {
    setWallet({ status: "disconnected", lookup: "idle", holdings: [] })
    return "rejected"
  }
  setWallet({ status: "connected", address: USER_ADDRESS, lookup: "pending" })
  await refreshHoldings()
  return "connected"
}

export function disconnectWallet() {
  setWallet({ status: "disconnected", lookup: "idle", holdings: [] })
}

export function setRole(role: Role) {
  update((s) => ({ ...s, role }))
}

/* ----------------------------------- Votes ----------------------------------- */

export function applyVote(proposalId: string, ballots: Ballot[], choice: Choice, hash: string, block: number) {
  const at = Date.now()
  const voter = getDemo()?.wallet.address ?? USER_ADDRESS
  update((s) => {
    const current = { ...(s.votes[proposalId] ?? {}) }
    const events = [...s.events]
    for (const b of ballots) {
      current[ballotKey(b.lotId, b.role)] = { lotId: b.lotId, role: b.role, choice, voter, hash, block, at }
      events.unshift({ id: randomId(), type: "vote", proposalId, at, hash, block, actor: voter, lotId: b.lotId, role: b.role, choice })
    }
    return { ...s, votes: { ...s.votes, [proposalId]: current }, events }
  })
}

/* --------------------------------- Proposals --------------------------------- */

export interface Draft {
  title: string
  summary: string
  category: Category
  lots: string[]
  tenantsVote: boolean
  rule: VotingRule
  quorum: number
  durationDays: number
}

export function nextProposalId(): string {
  const n = (getDemo()?.proposals ?? []).reduce((m, p) => Math.max(m, Number(p.id.split("-")[2]) || 0), 0) + 1
  return `P-2026-${String(n).padStart(3, "0")}`
}

export function applySubmit(id: string, draft: Draft, hash: string, block: number) {
  const at = Date.now()
  const p: Proposal = { id, ...draft, proposer: "you", status: "review", submittedAt: at, hashes: { submitted: hash } }
  update((s) => ({
    ...s,
    proposals: [p, ...s.proposals],
    events: [{ id: randomId(), type: "submitted", proposalId: id, at, hash, block, actor: PROPOSER_ADDRESS.you }, ...s.events],
  }))
}

export function applyApprove(id: string, hash: string, block: number) {
  const at = Date.now()
  updateProposal(id, (p) => ({
    ...p,
    status: "open",
    opensAt: at,
    closesAt: at + p.durationDays * DAY,
    returnReason: undefined,
    hashes: { ...p.hashes, opened: hash },
  }))
  pushEvent({ type: "approved", proposalId: id, at, hash, block, actor: CLERK_ADDRESS })
}

export function applyReturn(id: string, reason: string, hash: string, block: number) {
  const at = Date.now()
  updateProposal(id, (p) => ({ ...p, status: "returned", returnReason: reason }))
  pushEvent({ type: "returned", proposalId: id, at, hash, block, actor: CLERK_ADDRESS })
}

export function applyClose(id: string, hash: string, block: number) {
  const at = Date.now()
  const s = getDemo()
  const p = s?.proposals.find((x) => x.id === id)
  if (!s || !p) return
  const outcome = tally(p, s.votes[id]).leading
  updateProposal(id, (x) => ({ ...x, status: "closed", closedAt: at, closesAt: Math.min(x.closesAt ?? at, at), outcome, hashes: { ...x.hashes, closed: hash } }))
  pushEvent({ type: "closed", proposalId: id, at, hash, block, actor: CLERK_ADDRESS, outcome })
}

export function applyCertify(id: string, hash: string, block: number) {
  const at = Date.now()
  const p = getDemo()?.proposals.find((x) => x.id === id)
  updateProposal(id, (x) => ({ ...x, status: "certified", certifiedAt: at, registry: "pending", hashes: { ...x.hashes, certified: hash } }))
  pushEvent({ type: "certified", proposalId: id, at, hash, block, actor: CLERK_ADDRESS, outcome: p?.outcome })
}

/** Off-chain step: write the certified result to the municipal registry. */
export async function fileWithRegistry(id: string): Promise<boolean> {
  updateProposal(id, (p) => ({ ...p, registry: "pending" }))
  await sleep(latency([1400, 2200]))
  const at = Date.now()
  if (getDemo()?.settings.registryOffline) {
    updateProposal(id, (p) => ({ ...p, registry: "failed" }))
    pushEvent({ type: "filing_failed", proposalId: id, at, actor: CLERK_ADDRESS })
    return false
  }
  const count = (getDemo()?.proposals ?? []).filter((p) => p.registryRef).length
  const ref = `BLR-2026-${String(412 + count).padStart(4, "0")}`
  updateProposal(id, (p) => ({ ...p, registry: "filed", registryRef: ref }))
  pushEvent({ type: "filed", proposalId: id, at, actor: CLERK_ADDRESS, ref })
  return true
}
