"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { Toaster } from "@/components/ui/sonner"
import type { Locale } from "@/i18n/config"
import { connectWallet } from "@/lib/demo/ops"
import { initDemo } from "@/lib/demo/store"

import { AppContext, type AppCopy } from "./context"
import { WalletPrompt } from "./wallet-prompt"

interface ConnectState {
  connect: () => Promise<void>
  rejected: boolean
}

const ConnectContext = createContext<ConnectState>({ connect: async () => {}, rejected: false })
export const useConnect = () => useContext(ConnectContext)

export function AppProvider({ copy, locale, children }: { copy: AppCopy; locale: Locale; children: ReactNode }) {
  useEffect(() => {
    initDemo()
  }, [])

  const value = useMemo(() => ({ ...copy, locale }), [copy, locale])
  const [rejected, setRejected] = useState(false)

  const connect = useCallback(async () => {
    setRejected(false)
    const p = copy.app.prompt
    const result = await connectWallet({
      kind: "signin",
      title: p.titles.signin,
      message: true,
      lines: [{ label: p.lines.message, value: p.lines.messageText }],
    })
    setRejected(result === "rejected")
  }, [copy])

  return (
    <AppContext.Provider value={value}>
      <ConnectContext.Provider value={{ connect, rejected }}>
        {children}
        <WalletPrompt />
        {/* Bottom-left: clear of the ballot/review column and of the demo-controls sheet. */}
        <Toaster position="bottom-left" offset={{ bottom: 20, left: 20 }} mobileOffset={{ bottom: 16 }} />
      </ConnectContext.Provider>
    </AppContext.Provider>
  )
}
