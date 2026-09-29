"use client"

import { useCallback, useRef, useState } from "react"

import { randomHash } from "./ids"
import { getDemo, nextBlock, requestSignature, setSettings } from "./store"
import type { TxState, TxSummary } from "./types"

/**
 * Simulated chain. A transaction is: wallet prompt (sign or reject) ->
 * pending with a hash for a realistic block time -> confirmed or reverted.
 * "Fail the next transaction" in the demo controls forces one revert.
 */

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function latency(fast: [number, number] = [1200, 2400]): number {
  const slow = getDemo()?.settings.slow
  const [min, max] = slow ? [fast[0] * 2.5, fast[1] * 2.5] : fast
  return Math.round(min + Math.random() * (max - min))
}

async function mine(): Promise<"confirmed" | "reverted"> {
  await sleep(latency())
  if (getDemo()?.settings.failNext) {
    setSettings({ failNext: false })
    return "reverted"
  }
  return "confirmed"
}

/**
 * One transaction's lifecycle for a component. `apply` runs only on
 * confirmation and receives the transaction hash and block.
 */
export function useTx() {
  const [state, setState] = useState<TxState>({ phase: "idle" })
  const busy = useRef(false)

  const run = useCallback(async (summary: TxSummary, apply: (hash: string, block: number) => void) => {
    if (busy.current) return false
    busy.current = true
    try {
      setState({ phase: "signing" })
      const ok = await requestSignature(summary)
      if (!ok) {
        setState({ phase: "failed", error: "rejected" })
        return false
      }
      const hash = randomHash()
      setState({ phase: "pending", hash })
      const outcome = await mine()
      if (outcome === "reverted") {
        setState({ phase: "failed", hash, error: "reverted" })
        return false
      }
      const block = nextBlock()
      apply(hash, block)
      setState({ phase: "confirmed", hash, block })
      return true
    } finally {
      busy.current = false
    }
  }, [])

  const reset = useCallback(() => setState({ phase: "idle" }), [])

  return { state, run, reset, busy: state.phase === "signing" || state.phase === "pending" }
}
