"use client"

import { LockKeyholeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { setRole } from "@/lib/demo/ops"
import type { Role } from "@/lib/demo/types"

/** Shown when the current demo role can't use a page; one click switches role. */
export function RoleGate({ role, title, body, cta }: { role: Role; title: string; body: string; cta: string }) {
  return (
    <section className="mx-auto mt-4 flex w-full max-w-xl flex-col items-start gap-3 rounded-md border-2 border-dashed border-foreground/40 bg-card p-6">
      <LockKeyholeIcon className="size-6 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-muted-foreground">{body}</p>
      <Button onClick={() => setRole(role)}>{cta}</Button>
    </section>
  )
}
