"use client"

import { FilePlus2Icon, LandmarkIcon, MapIcon, ScrollTextIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { toast } from "sonner"

import { ConnectWallet } from "@/components/ui/connect-wallet"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { disconnectWallet, setRole } from "@/lib/demo/ops"
import { useDemo, useStorageOk } from "@/lib/demo/store"
import type { Role } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

import { useConnect } from "./app-provider"
import { useApp } from "./context"
import { DemoControls } from "./demo-controls"

const ROLES: Role[] = ["resident", "proposer", "clerk"]

export function RoleSwitch({ className }: { className?: string }) {
  const { app, domain } = useApp()
  const demo = useDemo()
  const role = demo?.role ?? "resident"
  return (
    <div role="radiogroup" aria-label={app.actingAs} className={cn("flex items-center gap-2", className)}>
      <span className="annot hidden text-[0.62rem] text-muted-foreground xl:inline">{app.actingAs}</span>
      <div className="flex rounded-md border border-foreground/30 bg-card p-0.5">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={role === r}
            title={domain.roleHints[r]}
            disabled={!demo}
            onClick={() => {
              if (role === r) return
              setRole(r)
              toast(t(app.roleSwitched, { role: domain.roles[r] }), { description: domain.roleHints[r] })
            }}
            className={cn(
              "h-9 rounded-sm px-2.5 text-[0.82rem] font-semibold text-muted-foreground transition-colors hover:text-foreground sm:px-3",
              role === r && "bg-foreground text-background hover:text-background"
            )}
          >
            {domain.roles[r]}
          </button>
        ))}
      </div>
    </div>
  )
}

export function AppBar() {
  const { app, locale } = useApp()
  const demo = useDemo()
  const storageOk = useStorageOk()
  const { connect } = useConnect()
  const pathname = usePathname() ?? ""
  const base = href(locale, "/app")
  const tabs = [
    { href: base, label: app.nav.plan, icon: MapIcon, exact: true },
    { href: `${base}/review`, label: app.nav.review, icon: LandmarkIcon },
    { href: `${base}/new`, label: app.nav.new, icon: FilePlus2Icon },
    { href: `${base}/record`, label: app.nav.record, icon: ScrollTextIcon },
  ]
  const active = (tab: (typeof tabs)[number]) =>
    tab.exact ? pathname === tab.href || pathname.startsWith(`${base}/proposals`) : pathname.startsWith(tab.href)
  const w = demo?.wallet

  return (
    <div className="sticky top-16 z-30 border-b border-foreground/15 bg-background/95">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-2 sm:px-6 lg:flex-row lg:items-center lg:gap-4">
        <nav aria-label={app.nav.label} className="-mx-1 overflow-x-auto">
          <ul className="flex min-w-max items-center gap-0.5 px-1">
            {tabs.map((tab) => {
              const on = active(tab)
              const Icon = tab.icon
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      on && "bg-accent text-accent-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {tab.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <RoleSwitch />
          <div className="ml-auto flex items-center gap-2">
            <DemoControls />
            <ConnectWallet
              status={w?.status ?? "disconnected"}
              address={w?.address}
              name={app.wallet.name}
              connectLabel={app.wallet.connect}
              connectingLabel={app.wallet.connecting}
              disconnectLabel={app.wallet.disconnect}
              onConnect={() => void connect()}
              onDisconnect={disconnectWallet}
              className="max-sm:[&_[data-slot=wallet-address]]:hidden"
            />
          </div>
        </div>
      </div>
      {!storageOk && <p className="border-t bg-warning/10 px-4 py-1.5 text-center text-xs">{app.storageWarning}</p>}
    </div>
  )
}
