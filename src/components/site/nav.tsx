"use client"

import { MenuIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { locales, switchLocalePath, type Locale } from "@/i18n/config"
import { cn } from "@/lib/utils"

import { ThemeToggle } from "./theme"

export interface NavItem {
  href: string
  label: string
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function NavLinks({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname() ?? ""
  return (
    <ul className={cn("flex items-center gap-1", className)}>
      {items.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-10 items-center px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                active && "text-foreground after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:bg-primary"
              )}
            >
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function LocaleSwitch({ locale, label, names }: { locale: Locale; label: string; names: Record<Locale, string> }) {
  const pathname = usePathname() ?? `/${locale}`
  return (
    <nav aria-label={label} className="flex items-center rounded-md border p-0.5">
      {locales.map((l) => (
        <Link
          key={l}
          href={switchLocalePath(pathname, l)}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
          title={names[l]}
          className={cn(
            "annot inline-flex h-8 min-w-9 items-center justify-center rounded-sm px-2 text-[0.7rem] text-muted-foreground transition-colors hover:text-foreground",
            l === locale && "bg-foreground text-background hover:text-background"
          )}
        >
          <span className="sr-only">{names[l]}</span>
          <span aria-hidden="true">{l.toUpperCase()}</span>
        </Link>
      ))}
    </nav>
  )
}

/** Right-hand header action: the demo link on marketing pages; inside the app the wallet lives in the app bar. */
export function HeaderAction({ demoHref, demoLabel }: { demoHref: string; demoLabel: string }) {
  const pathname = usePathname() ?? ""
  if (isActive(pathname, demoHref)) return null
  return (
    <Button asChild size="sm" className="hidden sm:inline-flex">
      <Link href={demoHref}>{demoLabel}</Link>
    </Button>
  )
}

export function MobileMenu({
  items,
  locale,
  labels,
  demoHref,
}: {
  items: NavItem[]
  locale: Locale
  demoHref: string
  labels: { open: string; close: string; title: string; language: string; theme: string; demo: string; names: Record<Locale, string>; badge: string }
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname() ?? ""
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={labels.open}>
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[min(22rem,100vw)] flex-col gap-0 p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-left">{labels.title}</SheetTitle>
          <SheetDescription className="sr-only">{labels.badge}</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col px-3 py-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className="flex h-12 items-center rounded-md px-3 text-base font-medium hover:bg-muted aria-[current=page]:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-4 border-t px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{labels.language}</span>
            <LocaleSwitch locale={locale} label={labels.language} names={labels.names} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{labels.theme}</span>
            <ThemeToggle label={labels.theme} />
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href={demoHref} onClick={() => setOpen(false)}>
              {labels.demo}
            </Link>
          </Button>
          <p className="annot text-center text-[0.65rem] text-muted-foreground">{labels.badge}</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
