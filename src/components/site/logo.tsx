import { cn } from "@/lib/utils"

/**
 * LandVote mark: a square lot split by one oblique boundary into two
 * parcels, one filled chancery green, with a seal on the boundary line.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7 shrink-0", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <rect x="2.5" y="2.5" width="27" height="27" rx="1.5" fill="var(--card)" stroke="currentColor" strokeWidth="2" />
      <path d="M2.5 29.5 L2.5 2.5 L19 2.5 L11 29.5 Z" fill="var(--primary)" />
      <path d="M19 2.5 L11 29.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="15" cy="16" r="5" fill="var(--card)" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12.8 16.1 l1.6 1.6 l3 -3.4" fill="none" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <LogoMark />
      <span className="text-[1.2rem] font-extrabold tracking-display">
        Land<span className="text-primary">Vote</span>
      </span>
    </span>
  )
}

/** Monark mark (mono), only used in the "Built with Monark" footer credit. */
export function MonarkMark({ className }: { className?: string }) {
  return (
    <svg viewBox="50 88 205 130" className={cn("h-3.5 w-auto", className)} aria-hidden="true">
      <path
        fill="currentColor"
        d="M193.494 111.998C168.369 133.089 152.29 161.711 152.29 161.711C152.29 161.711 136.21 133.089 111.085 111.998C85.9606 90.9074 54.3037 93.9204 54.3037 93.9204C54.3424 94.2577 54.3836 94.5922 54.4268 94.924C59.9934 137.569 102.543 135.097 102.543 135.097C61.3386 115.011 66.8662 103.461 66.8662 103.461C66.8662 103.461 115.105 104.968 122.14 141.625C131.509 190.446 86.9657 199.875 86.9657 199.875C90.4832 168.741 110.583 162.715 110.583 162.715C72.3933 159.201 75.9107 208.412 75.9107 208.412C75.9107 208.412 86.9657 213.433 108.573 197.866C137.753 176.844 133.195 148.153 133.195 148.153L152.29 170.174L171.384 148.153C171.384 148.153 166.826 176.844 196.006 197.866C217.614 213.433 228.669 208.412 228.669 208.412C228.669 208.412 232.186 159.201 193.997 162.715C193.997 162.715 214.096 168.741 217.614 199.875C217.614 199.875 173.07 190.446 182.439 141.625C189.474 104.968 237.714 103.461 237.714 103.461C237.714 103.461 243.241 115.011 202.036 135.097C202.036 135.097 244.586 137.569 250.153 94.924C250.196 94.5922 250.237 94.2577 250.276 93.9204C250.276 93.9204 248.711 93.7715 246.005 93.7715C236.529 93.7712 213.037 95.593 193.494 111.998Z"
      />
    </svg>
  )
}
