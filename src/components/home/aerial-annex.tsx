import Image from "next/image"

import { PHOTOS } from "@/lib/photos"

/**
 * Annex C: the aerial photo with a few lot lines drawn over it, one lot
 * highlighted and sealed, so the plan's abstraction lands on real ground.
 * Coordinates are in the photo's pixel space (1800 x 1011).
 */
const LOT_LINES = [
  "M1035 478 L1212 428 L1302 598 L1118 690 Z",
  "M728 522 L905 466 L962 640 L786 700 Z",
  "M866 716 L1016 686 L1052 806 L904 842 Z",
  "M1250 262 L1418 196 L1470 334 L1302 404 Z",
  "M590 300 L770 250 L812 408 L632 452 Z",
]

export function AerialAnnex({ alt, caption }: { alt: string; caption: string }) {
  return (
    <figure className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-md border border-foreground/60 shadow-paper">
        <Image src={PHOTOS.aerial.src} alt={alt} sizes="(min-width: 1024px) 640px, 100vw" className="h-auto w-full" placeholder="blur" />
        <svg viewBox="0 0 1800 1011" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {LOT_LINES.map((d, i) => (
            <g key={d}>
              <path d={d} fill={i === 0 ? "#f1e3a6" : "none"} fillOpacity={i === 0 ? 0.45 : 0} stroke="#151b24" strokeWidth="9" strokeLinejoin="round" opacity="0.55" />
              <path d={d} fill="none" stroke={i === 0 ? "#f1e3a6" : "#fafaf7"} strokeWidth="4.5" strokeDasharray={i === 0 ? undefined : "18 12"} strokeLinejoin="round" />
            </g>
          ))}
          <g transform="translate(1168 560) rotate(-4)">
            <circle r="44" fill="#fafaf7" stroke="#151b24" strokeWidth="6" />
            <circle r="34" fill="none" stroke="#151b24" strokeWidth="2.5" strokeDasharray="5 4" />
            <path d="M-16 1 l12 12 l22 -26" fill="none" stroke="#1b4272" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g fontFamily="var(--font-mono)" fontSize="30" fontWeight="600" fill="#151b24">
            <rect x="1060" y="632" width="190" height="44" fill="#fafaf7" opacity="0.92" />
            <text x="1074" y="664">4 512 087</text>
          </g>
        </svg>
      </div>
      <figcaption className="annot text-[0.65rem] text-muted-foreground">{caption}</figcaption>
    </figure>
  )
}
