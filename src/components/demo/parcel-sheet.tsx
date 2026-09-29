"use client"

import { ArrowRightIcon, BadgeCheckIcon } from "lucide-react"
import Link from "next/link"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { WalletAddress, WalletAvatar } from "@/components/ui/wallet"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { formatLot, lotById, USER_ADDRESS } from "@/lib/demo/geo"
import { shortHash } from "@/lib/demo/ids"
import { useDemo } from "@/lib/demo/store"
import { formatDate, formatNumber } from "@/lib/format"

import { ChoiceSwatch } from "./bits"
import { lotAddress, proposalText, useApp } from "./context"

export function ParcelSheet({ lotId, onClose }: { lotId: string | null; onClose: () => void }) {
  const ctx = useApp()
  const { app, domain, locale } = ctx
  const c = app.parcel
  const demo = useDemo()
  const lot = lotId ? lotById(lotId) : undefined
  const mine = !!lot && demo?.wallet.status === "connected" && demo.wallet.holdings.some((h) => h.lotId === lot.id)

  const history = lot && demo
    ? demo.proposals.flatMap((p) =>
        Object.values(demo.votes[p.id] ?? {})
          .filter((v) => v.lotId === lot.id)
          .map((v) => ({ p, v }))
      ).sort((a, b) => b.v.at - a.v.at)
    : []
  const involved = lot && demo ? demo.proposals.filter((p) => p.lots.includes(lot.id)).length : 0

  return (
    <Sheet open={!!lot} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-[min(26rem,100vw)] flex-col gap-0 overflow-y-auto p-0">
        {lot && (
          <>
            <SheetHeader className="gap-1 border-b px-5 py-4">
              <p className="annot text-[0.62rem] text-muted-foreground">{domain.districts[lot.district]}</p>
              <SheetTitle className="flex items-center gap-2 font-mono text-xl">
                {t(c.title, { lot: formatLot(lot.id) })}
                {mine && <span className="annot rounded-sm bg-accent px-1.5 py-0.5 font-sans text-[0.6rem] text-accent-foreground ring-1 ring-mine">{c.yours}</span>}
              </SheetTitle>
              <SheetDescription>{lotAddress(ctx, lot)}</SheetDescription>
            </SheetHeader>
            <dl className="grid grid-cols-2 gap-x-4 border-b px-5 py-4 text-sm">
              <div className="py-1.5">
                <dt className="text-xs text-muted-foreground">{c.area}</dt>
                <dd className="font-mono">{t(domain.m2, { n: formatNumber(locale, lot.area) })}</dd>
              </div>
              <div className="py-1.5">
                <dt className="text-xs text-muted-foreground">{c.use}</dt>
                <dd>{domain.uses[lot.use]}</dd>
              </div>
              <div className="col-span-2 py-1.5">
                <dt className="text-xs text-muted-foreground">{c.owner}</dt>
                <dd className="flex items-center gap-2">
                  <WalletAvatar address={lot.owner} size={18} />
                  <WalletAddress address={lot.owner} className="text-xs" />
                  {lot.owner === USER_ADDRESS && mine && <span className="text-xs text-muted-foreground">({c.yours})</span>}
                </dd>
              </div>
              <div className="col-span-2 py-1.5">
                <dt className="text-xs text-muted-foreground">{c.tenant}</dt>
                <dd className="flex items-center gap-2">
                  {lot.tenant ? (
                    <>
                      <WalletAvatar address={lot.tenant} size={18} />
                      <WalletAddress address={lot.tenant} className="text-xs" />
                      {lot.tenant === USER_ADDRESS && mine && <span className="text-xs text-muted-foreground">({c.yours})</span>}
                    </>
                  ) : (
                    <span className="text-muted-foreground">{c.none}</span>
                  )}
                </dd>
              </div>
              <div className="col-span-2 py-1.5">
                <dt className="text-xs text-muted-foreground">{c.attestation}</dt>
                <dd className="flex items-center gap-1.5">
                  <BadgeCheckIcon className="size-4 text-success" aria-hidden="true" />
                  {t(c.attestedOn, { date: formatDate(locale, Date.parse(lot.attestedAt)) })}
                </dd>
              </div>
            </dl>
            <section className="px-5 py-4" aria-labelledby="lot-history">
              <div className="flex items-baseline justify-between gap-2">
                <h3 id="lot-history" className="annot text-[0.68rem]">
                  {c.history}
                </h3>
                <span className="text-xs text-muted-foreground">{t(c.inProposals, { n: involved })}</span>
              </div>
              {history.length === 0 ? (
                <p className="mt-3 rounded-sm border border-dashed px-3 py-4 text-sm text-muted-foreground">{c.historyEmpty}</p>
              ) : (
                <ol className="mt-3 flex flex-col">
                  {history.map(({ p, v }) => (
                    <li key={`${p.id}-${v.role}`} className="border-t border-dashed py-3 first:border-t-0">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <ChoiceSwatch choice={v.choice} />
                        {domain.choices[v.choice]}
                        <span className="font-normal text-muted-foreground">· {domain.holderRoles[v.role]}</span>
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm">{proposalText(ctx, p).title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-muted-foreground">
                        <span>{p.id}</span>
                        <span>{formatDate(locale, v.at)}</span>
                        <span title={v.hash}>{shortHash(v.hash)}</span>
                      </p>
                      <Link href={href(locale, `/app/proposals/${p.id}`)} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                        {c.openProposal}
                        <ArrowRightIcon className="size-3" />
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
