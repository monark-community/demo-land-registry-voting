import { intlLocale, type Locale } from "@/i18n/config"

export function formatDate(locale: Locale, ts: number, withTime = false): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(ts)
}

export function formatNumber(locale: Locale, n: number, digits = 0): string {
  return new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n)
}

/** "in 3 days", "2 hours ago", "dans 3 jours"… */
export function relativeTime(locale: Locale, ts: number, now = Date.now()): string {
  const diff = ts - now
  const abs = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat(intlLocale[locale], { numeric: "auto" })
  const MIN = 60000
  const HOUR = 60 * MIN
  const DAY = 24 * HOUR
  if (abs < HOUR) return rtf.format(Math.round(diff / MIN), "minute")
  if (abs < DAY) return rtf.format(Math.round(diff / HOUR), "hour")
  if (abs < 60 * DAY) return rtf.format(Math.round(diff / DAY), "day")
  return rtf.format(Math.round(diff / (30 * DAY)), "month")
}
