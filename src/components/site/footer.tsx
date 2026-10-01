import Link from "next/link"

import { href, MONARK_URL, PROJECT_DOC_URL, REPO_URL, type Locale } from "@/i18n/config"
import { t, type Dictionary } from "@/i18n"

import { MonarkMark, Wordmark } from "./logo"

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const c = dict.common
  const product = [
    { href: href(locale, "/app"), label: c.nav.demo },
    { href: href(locale, "/how-it-works"), label: c.nav.how },
    { href: href(locale, "/app/record"), label: c.nav.record },
    { href: href(locale, "/credits"), label: c.nav.credits },
  ]
  const project = [
    { href: PROJECT_DOC_URL, label: c.nav.docs },
    { href: REPO_URL, label: c.nav.github },
  ]
  return (
    <footer className="mt-auto border-t border-foreground/15 bg-background">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex max-w-sm flex-col gap-3">
          <Wordmark />
          <p className="text-sm text-muted-foreground">{c.footer.tagline}</p>
        </div>
        <nav aria-labelledby="footer-product">
          <h2 id="footer-product" className="annot mb-3 text-muted-foreground">
            {c.footer.product}
          </h2>
          <ul className="flex flex-col gap-1">
            {product.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-9 items-center text-sm hover:text-primary hover:underline underline-offset-4">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="footer-project">
          <h2 id="footer-project" className="annot mb-3 text-muted-foreground">
            {c.footer.project}
          </h2>
          <ul className="flex flex-col gap-1">
            {project.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center text-sm hover:text-primary hover:underline underline-offset-4">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-foreground/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-5 text-[0.8rem] text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{t(c.footer.rights, { year: new Date().getFullYear() })}</span>
            <span aria-hidden="true">·</span>
            <span className="annot text-[0.68rem]">{c.footer.demoNotice}</span>
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{c.footer.photos}</span>
            <a href={MONARK_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[0.78rem] text-muted-foreground hover:text-foreground">
              <MonarkMark className="h-3.5" />
              {c.footer.builtWith}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
