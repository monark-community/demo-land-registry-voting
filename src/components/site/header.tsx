import Link from "next/link"

import { href, type Locale } from "@/i18n/config"
import type { Dictionary } from "@/i18n"

import { Wordmark } from "./logo"
import { HeaderAction, LocaleSwitch, MobileMenu, NavLinks } from "./nav"
import { ThemeToggle } from "./theme"

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const c = dict.common
  const items = [
    { href: href(locale, "/app"), label: c.nav.demo },
    { href: href(locale, "/how-it-works"), label: c.nav.how },
  ]
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/15 bg-background">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href={href(locale)} className="-ml-1 rounded-sm px-1" aria-label={c.home}>
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="ml-4 hidden md:block">
          <NavLinks items={items} />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <LocaleSwitch locale={locale} label={c.language} names={c.languageNames} />
            <ThemeToggle label={c.theme.toggle} />
          </div>
          <HeaderAction demoHref={href(locale, "/app")} demoLabel={c.openDemo} badge={c.demoBadge} />
          <MobileMenu
            items={items}
            locale={locale}
            demoHref={href(locale, "/app")}
            labels={{
              open: c.menu,
              close: c.closeMenu,
              title: "LandVote",
              language: c.language,
              theme: c.theme.toggle,
              demo: c.openDemo,
              names: c.languageNames,
              badge: c.demoBadge,
            }}
          />
        </div>
      </div>
    </header>
  )
}
