import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"

import { MonarkMark } from "@/components/site/logo"
import { isLocale, MONARK_URL } from "@/i18n/config"
import { getDictionary, t } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"
import { PHOTOS } from "@/lib/photos"

export async function generateMetadata({ params }: PageProps<"/[locale]/credits">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.credits
  return pageMetadata(locale, "/credits", m.title, m.description)
}

export default async function Credits({ params }: PageProps<"/[locale]/credits">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const c = getDictionary(locale).credits
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-extrabold tracking-display">{c.title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{c.lead}</p>

      <h2 className="mt-12 text-2xl font-bold">{c.photos}</h2>
      <ul className="mt-5 grid gap-6 sm:grid-cols-3">
        {Object.values(PHOTOS).map((p) => (
          <li key={p.page} className="flex flex-col gap-2">
            <div className="overflow-hidden rounded-md border border-foreground/40">
              <Image src={p.src} alt="" sizes="(min-width: 640px) 280px, 100vw" className="aspect-[4/3] h-auto w-full object-cover" placeholder="blur" />
            </div>
            <p className="text-sm">
              <a href={p.page} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4 hover:text-primary">
                {t(c.photoBy, { name: p.photographer })}
              </a>
            </p>
            <p className="text-xs text-muted-foreground">
              <a href={p.profile} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground">
                {p.profile.replace("https://", "")}
              </a>
            </p>
            <p className="text-xs text-muted-foreground">{t(c.usedOn, { where: p.usedOn[locale] })}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-12 grid gap-6 border-t border-foreground/20 pt-8 sm:grid-cols-2">
        <div>
          <dt className="font-bold">{c.type}</dt>
          <dd className="mt-1 text-sm text-muted-foreground">{c.typeBody}</dd>
        </div>
        <div>
          <dt className="font-bold">{c.icons}</dt>
          <dd className="mt-1 text-sm text-muted-foreground">{c.iconsBody}</dd>
        </div>
        <div>
          <dt className="font-bold">{c.plan}</dt>
          <dd className="mt-1 text-sm text-muted-foreground">{c.planBody}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 font-bold">
            <MonarkMark className="h-4" />
            <a href={MONARK_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {c.monark}
            </a>
          </dt>
          <dd className="mt-1 text-sm text-muted-foreground">{c.monarkBody}</dd>
        </div>
      </dl>
    </div>
  )
}
