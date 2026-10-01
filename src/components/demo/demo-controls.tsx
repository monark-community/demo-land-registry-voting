"use client"

import { RotateCcwIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react"
import { useId, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { refreshHoldings } from "@/lib/demo/ops"
import { resetDemo, setSettings, useDemo } from "@/lib/demo/store"
import type { DemoSettings } from "@/lib/demo/types"

import { useApp } from "./context"

function Toggle({ k, label, hint }: { k: keyof DemoSettings; label: string; hint: string }) {
  const demo = useDemo()
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed py-3.5">
      <div>
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      </div>
      <Switch id={id} aria-describedby={`${id}-hint`} checked={!!demo?.settings[k]} onCheckedChange={(v) => setSettings({ [k]: v })} className="mt-1" />
    </div>
  )
}

export function DemoControls() {
  const { app } = useApp()
  const c = app.controls
  const demo = useDemo()
  const connected = demo?.wallet.status === "connected"
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="px-3" title={c.open}>
          <SlidersHorizontalIcon className="size-4" />
          <span className="sr-only 2xl:not-sr-only">{c.open}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[min(24rem,100vw)] flex-col gap-0 overflow-y-auto p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>{c.title}</SheetTitle>
          <SheetDescription>{c.intro}</SheetDescription>
        </SheetHeader>
        <div className="px-5">
          <Toggle k="failNext" label={c.failNext} hint={c.failNextHint} />
          <Toggle k="slow" label={c.slow} hint={c.slowHint} />
          <Toggle k="registryOffline" label={c.registryOffline} hint={c.registryOfflineHint} />
          <Toggle k="noLand" label={c.noLand} hint={c.noLandHint} />
        </div>
        <div className="mt-auto flex flex-col gap-2 border-t px-5 py-5">
          <Button variant="outline" disabled={!connected} onClick={() => void refreshHoldings()}>
            <SearchIcon data-icon="inline-start" />
            {c.relookup}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              resetDemo()
              setOpen(false)
              toast.success(c.resetDone)
            }}
          >
            <RotateCcwIcon data-icon="inline-start" />
            {c.reset}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
