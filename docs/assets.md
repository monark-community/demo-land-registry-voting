# Assets

All photographs are free to use under the [Unsplash License](https://unsplash.com/license) (none are Unsplash+). They were downloaded from `images.unsplash.com` at 1800 px on the long edge, JPEG quality 72, and are served with `next/image` from `public/images/`. Photographers are also credited on `/en/credits` and `/fr/credits`, linked from the footer.

| File | Unsplash page | Photographer | Used on |
|-|-|-|-|
| `public/images/aerial-lots.jpg` | https://unsplash.com/photos/EzmfUgcKrt4 | Florian Schmid, https://unsplash.com/@florianschmid | Home, "From the plan to the street" (lot lines and a seal drawn over it in SVG) |
| `public/images/hearing-room.jpg` | https://unsplash.com/photos/3aVlWP-7bg8 | Mikael Kristenson, https://unsplash.com/@mikael_k | Home, "The hearing problem" |
| `public/images/neighbours.jpg` | https://unsplash.com/photos/7qkTpESaZp4 | Beth Macdonald, https://unsplash.com/@elsbethcat | Home, "One vote, three people who trust it" |

## Built in code

| Asset | Where |
|-|-|
| Logo mark and wordmark | `src/components/site/logo.tsx` |
| Favicon | `src/app/icon.svg` |
| Open Graph image (EN/FR) | `src/app/[locale]/opengraph-image.tsx` |
| Belrive cadastral plan (66 lots, streets, river, bank, square) | `src/lib/demo/geo.ts`, drawn by `src/components/plan/plan-svg.tsx` |
| Vote patterns (for wash, against hatching, abstain dots), seal, north arrow | `src/components/plan/plan-svg.tsx` |
| Live consent plan (home hero, CSS animation) | `src/components/home/hero-plan.tsx` |
| Tally strip with quorum tick | `src/components/demo/bits.tsx` |
| Lifecycle diagram, rule illustrations | `src/app/[locale]/how-it-works/page.tsx` |
| "Built with Monark" mono mark (footer credit only) | `src/components/site/logo.tsx`, from Monark's brand kit |

## Type and icons

- Public Sans (U.S. Web Design System) and IBM Plex Mono (IBM), SIL Open Font License, via `next/font/google`.
- Lucide icons (`lucide-react`), ISC License.
