import { ImageResponse } from "next/og"

import { isLocale, locales } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { lotPath, lotsIn } from "@/lib/demo/geo"

export const alt = "LandVote"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

const CHOICES: Record<string, "for" | "against" | "abstain"> = {
  "4512072": "for", "4512078": "for", "4512081": "for", "4512087": "for", "4512090": "for",
  "4512074": "against", "4512089": "against", "4512083": "abstain",
}

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const d = getDictionary(locale)
  const lots = lotsIn("tanneries")

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#F3F1EA", color: "#17201C", padding: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="56" height="56" viewBox="0 0 32 32">
              <rect x="2.5" y="2.5" width="27" height="27" rx="1.5" fill="#FBFAF6" stroke="#17201C" strokeWidth="2" />
              <path d="M2.5 29.5 L2.5 2.5 L19 2.5 L11 29.5 Z" fill="#1D5C45" />
              <path d="M19 2.5 L11 29.5" stroke="#17201C" strokeWidth="2" />
              <circle cx="15" cy="16" r="5" fill="#FBFAF6" stroke="#17201C" strokeWidth="1.8" />
            </svg>
            <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1 }}>LandVote</span>
          </div>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.06, letterSpacing: -2 }}>{d.meta.ogTagline}</div>
          <div style={{ fontSize: 22, color: "#565D56", letterSpacing: 2 }}>{d.common.demoBadge.toUpperCase()}</div>
        </div>
        <div style={{ display: "flex", marginLeft: 40, border: "3px solid #17201C", background: "#FBFAF6", boxShadow: "6px 6px 0 rgba(23,32,28,0.15)" }}>
          <svg width="470" height="500" viewBox="40 50 400 245">
            <defs>
              <pattern id="ag" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#B5432A" strokeWidth="2.2" />
              </pattern>
              <pattern id="ab" width="5" height="5" patternUnits="userSpaceOnUse">
                <circle cx="2.5" cy="2.5" r="1.1" fill="#7E7A6D" />
              </pattern>
            </defs>
            {lots.map((l) => {
              const c = CHOICES[l.id]
              const fill = c === "for" ? "#1D5C45" : c === "against" ? "url(#ag)" : c === "abstain" ? "url(#ab)" : "#FBFAF6"
              return <path key={l.id} d={lotPath(l)} fill={l.id === "4512087" ? "#F1E3A6" : fill} fillOpacity={c === "for" && l.id !== "4512087" ? 0.7 : 1} stroke="#3B4540" strokeWidth="1" />
            })}
            <circle cx="291" cy="228" r="13" fill="#FBFAF6" stroke="#17201C" strokeWidth="2" />
            <path d="M285 228 l4 4 l7 -8" fill="none" stroke="#1D5C45" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    ),
    size
  )
}
