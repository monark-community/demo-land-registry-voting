# LandVote

**Every lot gets a say in what's built next.**

LandVote lets owners and registered tenants vote on land-use proposals (zoning, streets, green space, small participatory budgets) from a cadastral plan of their own lots. Eligibility comes from the land registry, every ballot is signed and public, the municipal clerk certifies the result, and it is filed in the registry with a reference number.

This repository is the interactive demo: the fictional town of **Belrive**, its 66 lots and six proposals, with a simulated wallet, chain and land registry. LandVote is an independent product incubated by [Monark](https://www.monark.io). Project documentation: https://www.monark.io/en/project/land-registry-voting

> Demo · simulated data. Nothing you do leaves your browser; there is no real chain, wallet or registry.

## Run it locally

Requirements: Node.js 22 and pnpm 10.

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Other scripts:

| Command | What it does |
|-|-|
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` | ESLint (Next.js core web vitals + TypeScript rules) |
| `pnpm typecheck` | Generates route types, then `tsc --noEmit` |
| `pnpm screenshots` | Playwright screenshots of every page and flow into `docs/screenshots/` (needs a running server; `BASE_URL` defaults to `http://localhost:3147`, so start it with `pnpm start -p 3147`) |

No environment variables are needed. `NEXT_PUBLIC_SITE_URL` optionally overrides the canonical host (default `https://landvote.monark.io`).

## What you can do in the demo

1. **Find your land.** Connect the demo wallet, sign in with a message, and the registry lookup finds three lots: a house you own on rue des Tanneurs, a shop you own in Vieux-Belrive and a flat you rent in Pointe-aux-Hérons.
2. **Vote from the plan.** Open the rue des Tanneurs rezoning, see which of your lots are eligible and why the others aren't, sign a ballot, and watch the seal land on your lot and the count cross quorum.
3. **Draft a proposal** as the Tanneries residents' association: pick the area, who votes (owners, or owners and tenants), the rule (one lot one vote, or area-weighted capped at 2,000 m²), the quorum and the voting period.
4. **Act as the clerk:** approve or return proposals, close votes, certify results and file them with the land registry (including a registry outage and retry).
5. **Audit** any lot's voting record and the public record of every transaction.

The **Demo controls** panel forces a failed transaction, slows the network, takes the registry offline, switches to a wallet with no land, and resets the demo.

## How the simulation works

Everything lives in a small typed data layer in `src/lib/demo/`, shaped so it can later be swapped for wagmi/viem calls and a real registry API without touching the UI:

| File | Role |
|-|-|
| `geo.ts` | The Belrive plan: blocks subdivided into lots (polygons, cadastral numbers, areas, holders, attestations), generated deterministically so server and browser draw the same town. Replaceable by GeoJSON from a cadastre. |
| `types.ts` | Domain types: proposals, ballots, holdings, record events, transaction states. |
| `tally.ts` | Eligibility (owner/tenant ballots, shared weight for rented lots), weights, turnout, quorum and outcome. |
| `seed.ts` | The starting state: six proposals across every lifecycle stage, with seeded ballots, relative to the moment the demo loads. |
| `store.ts` | External store (`useSyncExternalStore`) persisted to `localStorage` (every access in try/catch), plus the wallet-prompt request channel. |
| `chain.ts` | `useTx()`: wallet prompt → pending with a hash for 1.2–2.4 s → confirmed or reverted. |
| `ops.ts` | Actions mirroring contract calls and registry requests: sign in and look up lots, vote, submit, approve, return, close, certify, file with the registry. |

Transaction states are shown inline where they happen, using the Monark UI registry's `tx-status` component.

## Project structure

```
src/
  app/
    [locale]/            en and fr routes (proxy.ts redirects / to the preferred language)
      page.tsx           home
      how-it-works/      mechanics for buyers, clerks and students
      app/               the demo: plan, proposals/[id], new, review, record
      credits/           photo, type and icon credits
      pricing/           internal only: unlinked, noindex, not in the sitemap
      opengraph-image.tsx
    sitemap.ts, robots.ts, icon.svg, globals.css (LandVote tokens)
  components/
    plan/                the cadastral plan SVG (server-safe)
    home/                hero consent plan, aerial annex
    demo/                app shell and flows (client components)
    site/                header, footer, logo, theme and language switches
    ui/                  shadcn/ui and Monark UI registry components, re-themed
  i18n/                  typed EN/FR dictionaries
  lib/demo/              simulated wallet, chain, registry and data
docs/
  site-plan.md           product, identity and content plan (kept in sync)
  assets.md              every image, its licence and credit
  screenshots/           Playwright captures at 390 and 1440 px, light and dark, EN and FR
```

Stack: Next.js 16 (App Router, TypeScript strict), Tailwind CSS 4, shadcn/ui on the [Monark UI registry](https://ui.monark.io) (`components.json` registers `@monark`), `lucide-react`. Type: Public Sans and IBM Plex Mono via `next/font`.

## Deploy to Vercel

Import the repository in Vercel and deploy with the framework defaults: no `vercel.json`, no environment variables. The Node version is pinned in `package.json` (`engines.node: 22.x`) and `pnpm-lock.yaml` is committed. Every page prerenders; proposals drafted in the browser render on demand.
