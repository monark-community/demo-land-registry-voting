# LandVote: site plan

Status: shipped on `develop`. This plan describes what the site does and is kept in sync with the code.

- Product: **LandVote**, an independent civic product incubated by Monark (not Monark-branded).
- Authoritative description: https://www.monark.io/en/project/land-registry-voting
- Branding: `monark-branded = false`. Own identity (section 8). From `monark-brand-guidelines.md` only §9 (EN/FR), §11 (disclaimers) and §12 ("Built with Monark" footer credit) apply.
- Stack: Next.js 16 (App Router, `src/`, TypeScript strict), pnpm, Tailwind CSS v4, shadcn/ui on the Monark UI registry (re-themed), `lucide-react`. No other runtime dependencies beyond what the registry components pull in (`radix-ui`, `sonner`, `next-themes`, `class-variance-authority`).

Decisions taken while working unattended are marked **Decision**.

---

## 1. Product brief

**Target users.**

- **Buyers: municipalities and neighbourhood associations** that must consult people about land use (zoning changes, road works, green space, small participatory budgets) and today do it with evening public hearings, paper registers and PDF forms.
- **Voters: landowners and registered tenants** inside the affected area. They want to know what is proposed next to their home, whether they are allowed to weigh in, and proof that their voice was counted.
- **Proposers** (a planning department, a residents' association) who draft proposals, and **validators** (the municipal clerk) who check a proposal before it opens and certify the result.
- Secondary: **students and developers** (Monark's programme) learning how land-linked governance works.

**Core job to be done.** *"When something is proposed for my part of town, let me see exactly what and where, tell me if my lot gives me a say, let me vote in two minutes, and prove afterwards that the count was fair."* For the municipality: *"Consult everyone the decision touches, with a result nobody can contest, and file it in our registry without re-typing it."*

**Domain concepts** (each one is explained in plain words where the site first uses it):

| Concept | Meaning in LandVote |
|-|-|
| Parcel (lot) | A registered piece of land with a cadastral number (Québec-style, e.g. `4 512 087`), an address, an area in m² and a land use. |
| Holder | The wallet linked to a parcel by a registry attestation, either as **owner** or as **registered tenant** (a lease on file). |
| Attestation | The registry's signed statement "wallet X holds lot Y as owner/tenant". It is what makes a wallet eligible. |
| Proposal | A land-use question tied to an **affected area** (a set of parcels), with a category, a rule, a quorum and a deadline. |
| Voting rule | **One lot, one vote**, or **area-weighted** (weight = lot area, capped at 2,000 m² so one large holder cannot outweigh a street). Each proposal also says whether **tenants** vote. |
| Quorum | The share of eligible voting weight that must take part for the result to count. |
| Lifecycle | Draft → In review (clerk) → Open → Closed → Certified (result filed in the registry). A proposal can also be **returned** to the proposer, or close **without quorum**. |
| Receipt | The signed vote's transaction hash and block, shown to the voter and in the public record. |
| Registry sync | After certification, the result is written to the (simulated) municipal registry with a reference number such as `BLR-2026-0412`. |
| Public record | Every proposal, vote and certification, readable by anyone, filterable per parcel. Votes are **open ballots** (Decision: land-use consents are public petitions in most municipal processes; secret ballots would need a ZK design, out of scope). |

**Demo world.** The fictional town of **Belrive** (a bilingual, Québec-flavoured riverside town, which suits an English/French site), drawn as a cadastral plan of 5 districts and ~70 lots: Les Tanneries, Vieux-Belrive, Côte-des-Saules, Pointe-aux-Hérons and Parc Nord, with the Rivière aux Saules along the east side. The visitor's demo wallet holds three parcels: a house they own in Les Tanneries, a small shop lot they own in Vieux-Belrive, and a flat they rent in Pointe-aux-Hérons (tenant).

**What the Lovable version got wrong or left out.**

- It was a generic landing page on a blue-to-green gradient with frosted glass and three icon cards. Nothing looked like land, maps or a municipality.
- The "map" was a CSS grid with three pins at computed positions and three dashed rectangles that did not match any parcel. You could not click a parcel, and proposals were not tied to places.
- Eligibility, the heart of the idea, was absent: everyone who connected was a "landowner", every proposal was votable, there were no parcels in the wallet, no tenants, no weights and no quorum.
- Voting was a toast and a random fake hash (`Math.random()`); no signing, pending, confirmed or failed state; nothing persisted; the tally never moved.
- "Create proposal" was disabled for the only role you could have, and validators did not exist, although roles (proposer, validator, voter) are a documented milestone.
- No voting history per parcel and no registry sync, both documented milestones. English only, no disclaimers, no dark mode.

## 2. Value proposition

**LandVote gives municipalities a map-based vote that every eligible owner and tenant in the affected area can cast from their phone, with each vote tied to a registered lot and the result filed straight into the land registry, instead of a Tuesday-night hearing that forty people attend and nobody can audit.**

Supporting benefits, as outcomes:

1. **You hear from the whole affected street, not only from whoever could make the hearing.**
2. **Nobody can dispute the count.** Every vote traces to one attested lot, and anyone can recount it.
3. **The decision is on file the day the vote closes**, not re-typed from paper weeks later.

## 3. Hero

- **Headline** (9 words): *Every lot gets a say in what's built next.*
  FR: *Chaque terrain a voix au chapitre sur ce qui s'y bâtit.*
- **Subheadline:** *LandVote lets owners and tenants vote on zoning, roads and green space from a map of their own lots. Every vote is signed, counted in the open and filed with the municipal registry.*
  FR: *LandVote permet aux propriétaires et aux locataires de voter sur le zonage, la voirie et les espaces verts à partir d'un plan de leurs propres terrains. Chaque vote est signé, compté au grand jour et versé au registre municipal.*
- **Primary CTA:** "Open the Belrive demo" / « Ouvrir la démo de Belrive » → `/{locale}/app`.
- **Secondary CTA:** "How a vote works" / « Le déroulement d'un vote » → `/{locale}/how-it-works`.
- **Visual:** the **live consent plan**, built in code (SVG, CSS-only animation, rendered on the server): a cropped cadastral plan of Les Tanneries with the proposal's affected area outlined. Lots fill in one by one with the voter's choice (green wash = for, rust hatching = against, dots = abstain), an ink seal lands on the visitor's own lot, and a tally strip beneath settles with its quorum tick passing the line ("Quorum reached · 41 %"). Product over photography because the plan *is* the product: the place, the rule and the count on one sheet. It loops calmly and stops under `prefers-reduced-motion`.

## 4. Page map

All routes live under `/{locale}` (`en`, `fr`). `/` and any locale-less path redirect to the visitor's preferred language (fallback English) in `src/proxy.ts`.

| Route | Purpose | Sections, in order |
|-|-|-|
| `/{locale}` | Home: explain the idea in 30 seconds, send people into the demo. | Hero with live consent plan · "The hearing problem" (photo of an auditorium + three facts) · How a vote works (4 steps on one ruled strip) · What LandVote gives each side (Residents / Clerks & councils / Proposers) · From the plan to the street (aerial photo with lot outlines drawn over it) · FAQ · Closing call to action |
| `/{locale}/app` | The demo: the Belrive plan. | App bar (role switch, demo badge, wallet) · Connect gate or "Your land" strip · Plan with district labels, your lots and proposal areas · Proposals panel (Open / In review / Closed tabs) · Parcel sheet (opens on any lot: record and history) · Demo controls |
| `/{locale}/app/proposals/[id]` | One proposal: what, where, the rule, the live tally and your ballot. | Header (number, category, status, deadline) · Affected-area plan · Tally with quorum tick · Your ballot (eligible lots, choice, sign) or why you cannot vote · Rule card · Timeline (lifecycle with hashes) · Votes cast (public list) |
| `/{locale}/app/new` | Draft a proposal (Proposer role). | Title, category, summary · Affected area (pick a district or tap lots on the plan) · Who votes (owners / owners and tenants) · Rule and quorum · Voting period · Live preview (lots, eligible holders, quorum in lots) · Submit for review |
| `/{locale}/app/review` | Clerk's desk (Validator role). | To review (approve and open / return with reason) · Ready to certify (certify, then registry sync) · Certified recently |
| `/{locale}/app/record` | Public record: the audit trail. | Filters (all / proposals / votes / certifications) · Search by lot number · Event list with hashes and registry references |
| `/{locale}/how-it-works` | The mechanics for careful buyers, clerks and students. Justified: the documentation frames LandVote as a governance + registry + mapping build; eligibility, weights, quorum and registry sync need a page of their own that the demo can link to. | Intro · Lifecycle diagram · Who can vote (attestations, owners, tenants) · The two rules with a worked example · Quorum and results · Roles · The public record and registry sync · Under the hood (contract and data-layer shape) · CTA |
| `/{locale}/credits` | Photo, font and icon credits (asset rules). | Photos · Type · Icons · Built with Monark |
| `/{locale}/pricing` | **Internal strategy review only.** Never linked, excluded from sitemap, `noindex, nofollow`. | Three plans · What is included everywhere · One-time registry connector · Reasoning |
| 404 | Friendly not-found: "This lot isn't on the plan." | Message · links home and to the demo |

**Header:** wordmark (left) · links: *Demo*, *How it works* · EN/FR switch · theme toggle · primary action "Open the demo" (marketing) or wallet (app). Mobile: wordmark + menu button opening a sheet with the same items.
**Footer:** one-line description · links (Demo, How it works, Public record, Credits, project documentation on monark.io, GitHub) · "Demo · simulated data" · "Built with Monark" credit (mono mark, 12–13px, `muted-foreground`, links to monark.io) · © line. Never `/pricing`.

## 5. Feature highlights

| Feature | User benefit | Where it appears | Proving flow |
|-|-|-|-|
| Land-verified eligibility | Only people who hold land in the affected area vote, and tenants can be included. | Home "each side", demo "Your land" strip, ballot eligibility notes, how-it-works | Flow 1, Flow 2 |
| Vote from the plan | You see exactly which lots are affected and which are yours before you vote. | Hero, demo plan, proposal page | Flow 2 |
| Rules per proposal | One lot one vote or area-weighted with a cap; tenants in or out; quorum set up front. | Proposal rule card, draft form, how-it-works | Flow 3 |
| Clerk validation and certification | Nothing opens or counts without the municipality's check. | Clerk's desk, proposal timeline | Flow 4 |
| Public record and registry sync | Anyone can recount; the result lands in the registry with a reference. | Public record, parcel sheet, certification | Flow 4, Flow 5 |

## 6. Key flows

All transactions go through the simulated wallet prompt (sign or reject) → pending (hash, 1.2–2.4 s, slower with "slow network") → confirmed, or failed. The demo controls can force the next transaction to fail, slow the network, take the registry offline, or switch to a wallet with no land.

1. **Connect and find your land.** Connect demo wallet → prompt "Sign in to LandVote" (message, no fee) → *Pending:* "Looking up your lots in the Belrive land registry…" → *Confirmed:* "3 lots found", the plan highlights them in ochre and the strip lists them (owner/tenant, area, district). *Failed:* rejecting the prompt shows "You declined the sign-in request"; registry offline shows "The land registry didn't answer" with *Try again*. *Empty:* with "wallet with no land", "No lots are linked to this wallet" with an explanation of attestations.
2. **Vote on a proposal from the plan.** Tap the Rue des Tanneurs area (or the proposal in the list) → proposal page: area plan, tally, rule → *Your ballot* lists your eligible lots (all ticked) → choose For / Against / Abstain → *Sign ballot* → prompt shows the ballot (proposal, lots, choice, "network fee sponsored by Belrive") → *Pending:* "Recording your vote…" with hash → *Confirmed:* an ink seal lands on your lot, the tally moves and a receipt appears (hash, block). *Failed:* rejected ("Nothing was sent") or reverted ("The network rejected the vote. Nothing was recorded.") with *Try again*. Lots outside the area, or tenant lots on an owners-only proposal, explain why they can't vote. Ballots are final.
3. **Draft a proposal** (switch role to *Proposer*). New proposal → pick a template or fill title, category, summary → choose the area (district chips or tap lots) → who votes, rule, quorum, period → live preview "18 lots · 16 holders eligible · quorum at 7 lots" → *Submit for review* → prompt → pending → *Confirmed:* "Submitted: waiting for the clerk" and the proposal appears under *In review*. *Errors:* inline messages (title missing, fewer than 3 lots, quorum outside 10–75 %). *Failed:* rejected or reverted, form kept.
4. **Clerk review and certification** (switch role to *Clerk*). Clerk's desk → *To review*: open the traffic-calming proposal, check the list (area, notice text, eligible holders) → *Approve and open voting* (tx) → it moves to Open; or *Return to proposer* with a reason. *Ready to certify*: the snow-storage proposal (closed, passed) → *Certify result* (tx) → *Registry sync* pending "Filing with the land registry…" → *Confirmed:* reference `BLR-2026-0415` on the proposal and in the public record. *Failed:* registry offline → "Certified on-chain; the registry filing will retry" with *Retry filing*. Demo shortcut: *Close voting now* on an open proposal.
5. **Audit a lot's history.** On the plan, tap any lot (or search its number) → parcel sheet: lot number, address, area, use, holder (short address, owner/tenant), attestation date, and every vote cast from this lot with proposal, choice and hash → *Public record* page lists everything with filters. *Empty:* "No votes from this lot yet."

## 7. Content (EN / FR)

Tone: a well-written municipal notice with a human voice. Plain words, concrete places and numbers, calm confidence, no crypto hype. Technical terms (on-chain, wallet/portefeuille, hash) appear where they help and are explained. French is written natively for Québec readers ("lot", "terrain", "greffe", "avis public").

### Home

| Section | EN | FR |
|-|-|-|
| Eyebrow | Land-use votes for towns and neighbourhoods | Votes d'aménagement pour les villes et les quartiers |
| H1 | Every lot gets a say in what's built next. | Chaque terrain a voix au chapitre sur ce qui s'y bâtit. |
| Sub | LandVote lets owners and tenants vote on zoning, roads and green space from a map of their own lots. Every vote is signed, counted in the open and filed with the municipal registry. | LandVote permet aux propriétaires et aux locataires de voter sur le zonage, la voirie et les espaces verts à partir d'un plan de leurs propres terrains. Chaque vote est signé, compté au grand jour et versé au registre municipal. |
| CTAs | Open the Belrive demo · How a vote works | Ouvrir la démo de Belrive · Le déroulement d'un vote |
| Hero caption | Proposal P-2026-014 · Rue des Tanneurs, four-storey mixed use | Proposition P-2026-014 · Rue des Tanneurs, mixte de quatre étages |
| Problem H2 | The hearing problem | Le problème de l'assemblée publique |
| Problem body | Land-use decisions are still made at 7 p.m. on a Tuesday, in a room that holds eighty. The people who come are rarely the people who live with the result, and the count ends up in a PDF nobody can check. | Les décisions d'aménagement se prennent encore un mardi à 19 h, dans une salle de quatre-vingts places. Ceux qui s'y présentent sont rarement ceux qui vivront avec le résultat, et le décompte finit dans un PDF que personne ne peut vérifier. |
| Facts | Only people in the room are heard. · Eligibility is checked by hand, if at all. · Results are re-typed into the registry weeks later. | Seules les personnes présentes sont entendues. · L'admissibilité se vérifie à la main, quand elle se vérifie. · Les résultats sont ressaisis au registre des semaines plus tard. |
| Steps H2 | How a vote works | Le déroulement d'un vote |
| Step 1 | **Proposed.** A planner or residents' association draws the affected area on the plan and sets the rule. | **Proposé.** Un service d'urbanisme ou une association de résidents trace la zone touchée sur le plan et fixe la règle. |
| Step 2 | **Checked.** The municipal clerk reviews it before anyone votes. | **Vérifié.** Le greffe municipal l'examine avant l'ouverture du vote. |
| Step 3 | **Voted.** Owners and tenants in the area sign a ballot for each lot they hold. | **Voté.** Propriétaires et locataires de la zone signent un bulletin pour chaque terrain qu'ils détiennent. |
| Step 4 | **Filed.** The clerk certifies the count and it lands in the land registry. | **Consigné.** Le greffe certifie le décompte, qui est versé au registre foncier. |
| Sides H2 | One vote, three people who trust it | Un vote, trois parties qui s'y fient |
| Residents | **For residents.** See what is planned next door, find out in one tap if your lot gives you a say, and keep a receipt of your vote. | **Pour les résidents.** Voyez ce qui se prépare à côté de chez vous, sachez d'un geste si votre terrain vous donne droit de vote et gardez le reçu de votre vote. |
| Clerks | **For clerks and councils.** Eligibility comes from the registry, not a sign-in sheet. Certify a result in one step and file it with a reference number. | **Pour les greffes et les conseils.** L'admissibilité vient du registre, pas d'une feuille de présence. Certifiez un résultat en une étape et versez-le au registre avec un numéro de référence. |
| Proposers | **For proposers.** Draw the area, choose who votes and how, and know the quorum before you publish. | **Pour les porteurs de projet.** Tracez la zone, choisissez qui vote et comment, et connaissez le quorum avant de publier. |
| Street H2 | From the plan to the street | Du plan à la rue |
| Street body | Each outline on the plan is a real lot with an owner, sometimes a tenant, and a vote. LandVote reads them from the registry, so nobody has to prove where they live. | Chaque contour du plan est un vrai terrain, avec un propriétaire, parfois un locataire, et un vote. LandVote les lit dans le registre : personne n'a à prouver où il habite. |
| FAQ H2 | Questions from councils and residents | Questions des conseils et des résidents |
| FAQ 1 | *Do residents need crypto?* No. LandVote creates a wallet at sign-in and the town sponsors the network fee. Voting costs nothing. | *Faut-il des cryptomonnaies ?* Non. LandVote crée un portefeuille à la connexion et la ville prend en charge les frais de réseau. Voter ne coûte rien. |
| FAQ 2 | *Can tenants vote?* When the proposal says so. Each proposal states whether registered tenants vote alongside owners. | *Les locataires peuvent-ils voter ?* Si la proposition le prévoit. Chaque proposition indique si les locataires inscrits votent avec les propriétaires. |
| FAQ 3 | *Can a large landowner outvote a street?* Not by accident. Area-weighted votes are capped at 2,000 m² per lot, and most proposals use one lot, one vote. | *Un grand propriétaire peut-il l'emporter sur toute une rue ?* Pas par accident. Le vote pondéré par la superficie est plafonné à 2 000 m² par terrain, et la plupart des propositions appliquent un terrain, un vote. |
| FAQ 4 | *Are votes public?* Yes: who voted from which lot, and how, is on the public record, as with a signed petition or register. | *Les votes sont-ils publics ?* Oui : quel terrain a voté, et comment, figure au registre public, comme pour une pétition ou un registre signé. |
| FAQ 5 | *Is the result legally binding?* That is up to your council's by-laws. LandVote gives you a clean, verifiable count and files it; the council decides what weight it carries. | *Le résultat a-t-il force de loi ?* Cela dépend des règlements de votre conseil. LandVote fournit un décompte net et vérifiable et le consigne ; le conseil décide de sa portée. |
| FAQ 6 | *Is this demo real?* It is a simulation: a made-up town, a simulated wallet and network. Nothing you do leaves your browser. | *Cette démo est-elle réelle ?* C'est une simulation : une ville fictive, un portefeuille et un réseau simulés. Rien de ce que vous faites ne quitte votre navigateur. |
| Closing | Walk through a vote in Belrive. Three lots, five proposals, one town clerk. It takes four minutes. | Faites voter Belrive. Trois terrains, cinq propositions, un greffe. Quatre minutes suffisent. |

### App (key strings)

| Key | EN | FR |
|-|-|-|
| Connect gate | **Find your land.** Connect the demo wallet and LandVote looks up the lots it holds in the Belrive registry. | **Trouvez vos terrains.** Connectez le portefeuille de démo et LandVote cherche les terrains qu'il détient au registre de Belrive. |
| Lookup pending | Looking up your lots in the Belrive land registry… | Recherche de vos terrains au registre foncier de Belrive… |
| Found | 3 lots found. They are highlighted on the plan. | 3 terrains trouvés. Ils sont surlignés sur le plan. |
| Rejected | You declined the sign-in request. | Vous avez refusé la demande de connexion. |
| Registry error | The land registry didn't answer. Your wallet is fine; try again in a moment. | Le registre foncier n'a pas répondu. Votre portefeuille n'est pas en cause ; réessayez dans un instant. |
| No land | No lots are linked to this wallet. You can still read every proposal and the public record; to vote, a lot must be attested to your wallet by the registry. | Aucun terrain n'est lié à ce portefeuille. Vous pouvez tout de même consulter les propositions et le registre public ; pour voter, un terrain doit être attesté à votre portefeuille par le registre. |
| Ineligible (outside) | Lot 4 512 087 is outside this proposal's area. | Le lot 4 512 087 est hors de la zone de cette proposition. |
| Ineligible (tenant) | Tenants don't vote on this proposal; only owners do. | Les locataires ne votent pas sur cette proposition, seuls les propriétaires. |
| Vote pending | Recording your vote… | Enregistrement de votre vote… |
| Vote confirmed | Vote recorded for 1 lot. Your receipt is below. | Vote enregistré pour 1 terrain. Votre reçu figure ci-dessous. |
| Vote reverted | The network rejected the vote. Nothing was recorded. | Le réseau a rejeté le vote. Rien n'a été enregistré. |
| Empty proposals | Nothing is open for a vote right now. New proposals appear here after the clerk's review. | Aucun vote n'est ouvert pour le moment. Les nouvelles propositions apparaissent ici après l'examen du greffe. |
| Empty review | Your desk is clear. Nothing waits for review or certification. | Votre bureau est dégagé. Rien n'attend d'examen ni de certification. |
| Empty record for lot | No votes from this lot yet. | Aucun vote de ce terrain pour l'instant. |
| Sync failed | Certified on-chain. The registry filing didn't go through and will retry. | Certifié sur la chaîne. Le dépôt au registre n'a pas abouti et sera relancé. |
| Reset | Reset demo | Réinitialiser la démo |

The full copy lives in `src/i18n/dictionaries/en.ts` and `fr.ts`.

## 8. Aesthetics

**Concept: _Survey plan, civic ink._** LandVote should feel like a well-kept cadastral plan and a stamped municipal notice: paper, precise linework, hatching, lot numbers in a drafting mono, a seal when something becomes official. Its users are clerks, planners and residents who distrust anything that looks like a crypto product or an ad; they trust documents that look careful. The map is not decoration, it is the ballot, so the whole identity is built from the plan's own vocabulary.

**Palette** (shadcn roles; ratios computed with the WCAG formula):

| Role | Light | Dark |
|-|-|-|
| background | `#F3F1EA` drafting paper | `#121815` night plan |
| card / popover | `#FBFAF6` | `#1A211D` |
| foreground | `#17201C` ink | `#ECE9DF` |
| primary | `#1D5C45` chancery green | `#86C9A6` sage |
| primary-foreground | `#F7F5EE` | `#0E1A14` |
| secondary / muted | `#E7E4DA` | `#232B26` |
| muted-foreground | `#565D56` | `#A4ACA3` |
| accent (your lots, highlighter) | `#F1E3A6` / fg `#17201C` | `#3A3417` / fg `#F3E3A0` |
| border | `#CFCABB` | `#343D37` |
| input | `#8C8778` | `#6C756D` |
| ring | `#1D5C45` | `#86C9A6` |
| destructive | `#A3261B` | `#F0806F` |
| chart-1 (for) | `#1D5C45` | `#86C9A6` |
| chart-2 (against) | `#B5432A` rust | `#EE8A6A` |
| chart-3 (abstain) | `#7E7A6D` | `#A09E94` |
| chart-4 (your lots) | `#A87A12` ochre | `#E2BE5C` |
| chart-5 (water) | `#4F7482` | `#86AEBC` |

WCAG AA checks, light: foreground/background 14.75, foreground/card 15.96, muted-fg/background 6.00, muted-fg/muted 5.33, primary-fg/primary 7.21, primary/background 6.96, accent-fg/accent 12.92, destructive/background 6.52, destructive/card 7.05, input/background 3.18 (non-text ≥ 3), chart-1/card 7.53, chart-2/card 5.29, chart-3/card 4.11, chart-4/card 3.68 (graphics only), chart-5/card 4.84.
Dark: foreground/background 14.81, foreground/card 13.51, muted-fg/background 7.72, muted-fg/muted 6.23, primary-fg/primary 9.28, primary/background 9.35, accent-fg/accent 9.69, destructive/background 6.87, input/background 3.77, chart-1..5 on card 8.54 / 6.63 / 6.11 / 9.19 / 6.87.
Vote choices are never colour-only: *for* is a solid wash, *against* is diagonal hatching, *abstain* is a dot screen, and every tally carries text labels.

**Type** (two families, `next/font/google`):

- **Public Sans** (the typeface designed for government services): UI, body and headings. Weights 400, 500, 700, 800. Scale: 14 / 16 (body) / 18 / 22 / 28 / 36 / 48 / 60 px; display at 800 with −0.025em tracking; body line height 1.6.
- **IBM Plex Mono**: lot numbers, hashes, coordinates, map annotations and small uppercase labels (400, 500, 600), letter-spaced like drafting annotations.

**Logo.** A wordmark "LandVote" in Public Sans 800 preceded by a mark: a square lot split by one oblique boundary line into two parcels, one filled chancery green, with a small circular seal on the line. Favicon: the mark alone (`src/app/icon.svg`). Built in SVG (`src/components/site/logo.tsx`).

**Shape.** Radius 4 px (`--radius: 0.25rem`): drafted, not bubbly. 1 px ink borders and double hairline rules as section dividers; no soft drop shadows, only a 2 px offset "paper" shadow on floating sheets. Faint survey grid (40 px) only behind plans. Motion is short and purposeful: 180 ms UI transitions, a 420 ms seal stamp, tallies easing over 700 ms; everything respects `prefers-reduced-motion`.

**Imagery.** Photography is documentary, daylight, unstaged: real streets, real lots from above, real people in front of their homes; a slightly muted natural grade. Photos are shown flat with a thin ink frame and a mono caption like a plan annex. Illustration is exclusively plan linework drawn in code (parcels, hatching, seals, lifecycle diagram).

**Signature moments.**

1. **The seal.** When a vote confirms, an ink seal stamps onto the voter's lot on the plan (scale 1.15 → 1 with a brief ink-spread ring) and the lot takes its choice's pattern.
2. **The settling tally.** The tally strip is split into for / against / abstain segments, with a quorum tick; when a vote lands, segments ease to their new widths and, when quorum is crossed, the tick flips to "Quorum reached".
3. **Filed.** Certification prints a registry line (reference, date, result) into the proposal's timeline like a stamped ledger entry.

**What we deliberately avoid, and why.** Blue/purple "AI" gradients, frosted glass and neon (they read as speculative crypto and would erode a clerk's trust); glowing coins and 3D blobs (nothing in LandVote is a token); map-app blue pins and satellite tiles (generic, and they hide lot boundaries); default shadcn look (rounded cards with soft shadows); red/green-only vote colours (colour-blind unsafe); Monark orange (independent brand).

## 9. Assets

| Asset | Purpose | Placement |
|-|-|-|
| `public/images/aerial-lots.jpg` (Florian Schmid, Unsplash) | Aerial of a garden neighbourhood; lot outlines drawn over it in SVG. | Home, "From the plan to the street" |
| `public/images/hearing-room.jpg` (Mikael Kristenson, Unsplash) | An auditorium of seated people: the "hearing" LandVote replaces. | Home, "The hearing problem" |
| `public/images/neighbours.jpg` (Beth Macdonald, Unsplash) | Neighbours talking outside: the people who live with the decision. | Home, "One vote, three people" |

All credited in `docs/assets.md` and on `/credits`. Icons: `lucide-react`. Built in code: logo and favicon, the Belrive plan (procedurally generated blocks and lots), hatching patterns, seal, tally strip, lifecycle diagram, Open Graph image.

## 10. Pricing strategy

LandVote sells to municipalities and residents' associations; residents never pay. **Decision:** a free community tier plus annual municipal subscriptions priced by the number of lots in the registry area, because lot count tracks both the town's size and the value of each consultation, and municipal budgets buy annual licences.

| Plan | Price | For |
|-|-|-|
| Neighbourhood | Free | Residents' associations and co-op boards: up to 500 lots, 2 open votes at a time, owners-only one-lot-one-vote, public record. |
| Town | CA$ 690 / month, billed yearly | Up to 10,000 lots: all rules, tenants, unlimited votes, clerk desk, CSV export, registry sync. |
| City | from CA$ 2,400 / month | Up to 100,000 lots and beyond: several departments, SSO for staff, audit exports, service level. |

Included everywhere: network fees for residents' votes are sponsored (costed into the plan), open-source contracts, public record. One-time **registry connector** for Town and City: from CA$ 8,000 (mapping the town's cadastre and attestation flow). Rationale: comparable civic-participation platforms cost €10k–40k a year; LandVote undercuts them for small towns and adds land eligibility they lack.

`/pricing` exists for internal review only: never linked, excluded from `sitemap.xml`, `robots: { index: false, follow: false }`.

## 11. Out of scope

- Real wallet signatures, a real chain, real registry or cadastre integration, and identity verification (KYC). All simulated behind `src/lib/demo/`.
- Secret ballots (would need a zero-knowledge design); votes are open ballots.
- Changing a cast vote, delegation and proxy voting.
- Real map tiles (OpenStreetMap): the demo draws its own plan so it needs no network and shows lot lines clearly. The data layer keeps lots as polygons so real GeoJSON can replace them.
- Notifications (email/SMS to holders), public comment threads, document attachments.
- Legal validity: the council decides what weight a result carries.
