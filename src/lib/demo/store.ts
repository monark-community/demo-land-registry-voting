"use client"

import { useSyncExternalStore } from "react"

import { CLERK_ADDRESS, createSeed } from "./seed"
import { tally } from "./tally"
import type { DemoSettings, DemoState, Proposal, TxSummary, WalletState } from "./types"

/**
 * The demo's single source of truth: a tiny external store persisted to
 * localStorage (every access in try/catch). Swapping to a real chain means
 * replacing this module, chain.ts and registry.ts; the UI only uses the
 * hooks and the actions in ops.ts.
 */

const STORAGE_KEY = "landvote-demo-v1"

let state: DemoState | null = null
let storageOk = true
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function persist() {
  if (!state) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    storageOk = true
  } catch {
    storageOk = false
  }
}

/** Votes whose deadline passed while the tab was closed are closed on load. */
function closeExpired(s: DemoState): DemoState {
  const now = Date.now()
  let changed = false
  const proposals = s.proposals.map((p): Proposal => {
    if (p.status !== "open" || !p.closesAt || p.closesAt > now) return p
    changed = true
    return { ...p, status: "closed", closedAt: p.closesAt, outcome: tally(p, s.votes[p.id]).leading }
  })
  if (!changed) return s
  const events = [...s.events]
  for (const p of proposals) {
    const before = s.proposals.find((x) => x.id === p.id)
    if (before?.status === "open" && p.status === "closed") {
      events.unshift({ id: `auto-${p.id}`, type: "closed", proposalId: p.id, at: p.closedAt!, actor: CLERK_ADDRESS, outcome: p.outcome })
    }
  }
  return { ...s, proposals, events }
}

function load(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoState
    if (parsed?.version !== 1 || !Array.isArray(parsed.proposals)) return null
    // A reload never resumes a half-finished connection or lookup.
    if (parsed.wallet.status === "connecting") parsed.wallet.status = "disconnected"
    if (parsed.wallet.lookup === "pending") parsed.wallet.lookup = parsed.wallet.status === "connected" ? "failed" : "idle"
    for (const p of parsed.proposals) if (p.registry === "pending") p.registry = "failed"
    return closeExpired(parsed)
  } catch {
    storageOk = false
    return null
  }
}

/** Load saved state, or seed the demo. Idempotent. */
export function initDemo() {
  if (state) return
  state = load() ?? createSeed()
  persist()
  emit()
}

export function resetDemo() {
  const wallet = state?.wallet
  const role = state?.role
  state = createSeed()
  // Keep the visitor signed in (and their role) so the reset is not disorienting.
  if (wallet?.status === "connected") state.wallet = { ...wallet, lookup: "done" }
  if (role) state.role = role
  persist()
  emit()
}

export function update(fn: (s: DemoState) => DemoState) {
  if (!state) return
  state = fn(state)
  persist()
  emit()
}

export function updateProposal(id: string, fn: (p: Proposal) => Proposal) {
  update((s) => ({ ...s, proposals: s.proposals.map((p) => (p.id === id ? fn(p) : p)) }))
}

export function setWallet(patch: Partial<WalletState>) {
  update((s) => ({ ...s, wallet: { ...s.wallet, ...patch } }))
}

export function setSettings(patch: Partial<DemoSettings>) {
  update((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
}

export function nextBlock(): number {
  let b = 0
  update((s) => {
    b = s.block + 1 + Math.floor(Math.random() * 3)
    return { ...s, block: b }
  })
  return b
}

export function getDemo() {
  return state
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Current demo state, or null until it has loaded on the client. */
export function useDemo(): DemoState | null {
  return useSyncExternalStore(subscribe, () => state, () => null)
}

export function useStorageOk(): boolean {
  return useSyncExternalStore(subscribe, () => storageOk, () => true)
}

/* ---------------------------------------------------------------------------
 * Simulated wallet prompt: a promise resolved by the WalletPrompt dialog.
 * ------------------------------------------------------------------------ */

export interface PromptRequest {
  summary: TxSummary
  resolve: (approved: boolean) => void
}

let prompt: PromptRequest | null = null
const promptListeners = new Set<() => void>()

export function requestSignature(summary: TxSummary): Promise<boolean> {
  return new Promise((resolve) => {
    prompt?.resolve(false)
    prompt = {
      summary,
      resolve: (ok) => {
        prompt = null
        for (const l of promptListeners) l()
        resolve(ok)
      },
    }
    for (const l of promptListeners) l()
  })
}

export function usePrompt(): PromptRequest | null {
  return useSyncExternalStore(
    (l) => {
      promptListeners.add(l)
      return () => promptListeners.delete(l)
    },
    () => prompt,
    () => null
  )
}
