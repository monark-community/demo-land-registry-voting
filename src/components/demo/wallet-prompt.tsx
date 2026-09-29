"use client"

import { PenLineIcon, ShieldAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WalletAvatar, WalletAddress } from "@/components/ui/wallet"
import { USER_ADDRESS } from "@/lib/demo/geo"
import { CLERK_ADDRESS, PROPOSER_ADDRESS } from "@/lib/demo/seed"
import { useDemo, usePrompt } from "@/lib/demo/store"

import { useApp } from "./context"

/** The simulated wallet's signature request. Signing resolves the pending transaction. */
export function WalletPrompt() {
  const req = usePrompt()
  const demo = useDemo()
  const { app } = useApp()
  const p = app.prompt
  const role = demo?.role ?? "resident"
  const from = req?.summary.kind === "signin" || role === "resident" ? USER_ADDRESS : role === "clerk" ? CLERK_ADDRESS : PROPOSER_ADDRESS.you

  return (
    <Dialog open={!!req} onOpenChange={(open) => !open && req?.resolve(false)}>
      {req && (
        <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-md" aria-describedby="prompt-desc">
          <DialogHeader className="gap-1 border-b px-5 pt-5 pb-4">
            <p className="annot flex items-center gap-2 text-[0.65rem] text-muted-foreground">
              <PenLineIcon className="size-3.5" aria-hidden="true" />
              {p.title} · {p.wallet}
            </p>
            <DialogTitle>{req.summary.title}</DialogTitle>
            <DialogDescription id="prompt-desc" className="sr-only">
              {p.disclaimer}
            </DialogDescription>
          </DialogHeader>
          <dl className="flex flex-col gap-0 px-5 py-3 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-dashed py-2.5">
              <dt className="text-muted-foreground">{p.from}</dt>
              <dd className="flex items-center gap-2">
                <WalletAvatar address={from} size={18} />
                <WalletAddress address={from} className="text-xs" />
              </dd>
            </div>
            {req.summary.lines.map((l) => (
              <div key={l.label} className="flex items-start justify-between gap-4 border-b border-dashed py-2.5">
                <dt className="shrink-0 text-muted-foreground">{l.label}</dt>
                <dd className={l.mono ? "text-right font-mono text-xs leading-5" : "text-right font-medium"}>{l.value}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 border-b border-dashed py-2.5">
              <dt className="text-muted-foreground">{p.network}</dt>
              <dd className="text-right">{p.networkName}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">{p.fee}</dt>
              <dd className="text-right">{req.summary.message ? p.feeNone : p.feeSponsored}</dd>
            </div>
          </dl>
          <p className="mx-5 mb-4 flex items-center gap-2 rounded-sm border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
            <ShieldAlertIcon className="size-4 shrink-0 text-warning" aria-hidden="true" />
            {p.disclaimer}
          </p>
          <DialogFooter className="m-0 rounded-b-md">
            <Button variant="outline" onClick={() => req.resolve(false)}>
              {p.reject}
            </Button>
            <Button onClick={() => req.resolve(true)} autoFocus>
              {p.sign}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
