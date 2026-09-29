"use client"

import { AlertTriangleIcon, Loader2Icon, MapPinIcon, WalletIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { t } from "@/i18n/t"
import { formatLot, lotById } from "@/lib/demo/geo"
import { refreshHoldings } from "@/lib/demo/ops"
import { useDemo } from "@/lib/demo/store"
import { formatNumber } from "@/lib/format"

import { useConnect } from "./app-provider"
import { lotAddress, useApp } from "./context"

/** Flow 1: connect, look up the wallet's lots in the registry, show them. */
export function LandStrip({ onShow }: { onShow: (lotId: string) => void }) {
  const ctx = useApp()
  const { app, domain, locale } = ctx
  const demo = useDemo()
  const { connect, rejected } = useConnect()
  if (!demo) return null
  const w = demo.wallet

  if (w.status !== "connected") {
    return (
      <section aria-labelledby="gate-title" className="rounded-md border-2 border-dashed border-foreground/40 bg-card p-4">
        <h2 id="gate-title" className="text-lg font-bold">
          {app.gate.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{app.gate.body}</p>
        <Button className="mt-3 w-full sm:w-auto" onClick={() => void connect()} disabled={w.status === "connecting"}>
          {w.status === "connecting" ? <Loader2Icon className="animate-spin" /> : <WalletIcon />}
          {w.status === "connecting" ? app.wallet.connecting : app.gate.cta}
        </Button>
        {rejected && (
          <p role="alert" className="mt-3 text-sm font-medium text-destructive">
            {app.gate.rejected}
          </p>
        )}
      </section>
    )
  }

  return (
    <section aria-labelledby="land-title" className="rounded-md border border-foreground/25 bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-foreground/15 px-4 py-3">
        <h2 id="land-title" className="annot text-[0.7rem]">
          {app.land.title}
        </h2>
      </div>
      <div className="p-4" aria-live="polite">
        {w.lookup === "pending" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
            {app.land.pending}
          </p>
        )}
        {w.lookup === "failed" && (
          <div role="alert" className="flex flex-col items-start gap-2">
            <p className="flex items-start gap-2 text-sm font-medium text-destructive">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
              {app.land.failed}
            </p>
            <Button size="sm" variant="outline" onClick={() => void refreshHoldings()}>
              {app.land.retry}
            </Button>
          </div>
        )}
        {w.lookup === "done" && w.holdings.length === 0 && (
          <div>
            <p className="font-semibold">{app.land.noneTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{app.land.noneBody}</p>
          </div>
        )}
        {w.lookup === "done" && w.holdings.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">{t(w.holdings.length === 1 ? app.land.found : app.land.foundPlural, { n: w.holdings.length })}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {w.holdings.map((h) => {
                const lot = lotById(h.lotId)
                if (!lot) return null
                return (
                  <li key={`${h.lotId}-${h.role}`}>
                    <button
                      type="button"
                      onClick={() => onShow(h.lotId)}
                      className="group flex w-full items-center gap-3 rounded-sm border border-mine/60 bg-accent/60 px-3 py-2 text-left transition-colors hover:bg-accent"
                    >
                      <MapPinIcon className="size-4 shrink-0 text-mine" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-mono text-sm font-semibold">{formatLot(lot.id)}</span>
                          <span className="annot text-[0.58rem] text-muted-foreground">{domain.holderRoles[h.role]}</span>
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {lotAddress(ctx, lot)} · {domain.districts[lot.district]} · {t(domain.m2, { n: formatNumber(locale, lot.area) })}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}
