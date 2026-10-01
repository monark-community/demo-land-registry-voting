/**
 * The Belrive cadastral plan: districts, blocks and lots, generated
 * deterministically so the server (hero, OG image) and the browser (demo)
 * draw exactly the same town. Coordinates are plan units in a 1100 x 800
 * viewBox; 1 unit = 0.5 m on the ground.
 *
 * A real deployment would replace this module with GeoJSON parcels read
 * from the municipal cadastre; the rest of the app only uses `LOTS`,
 * `lotById` and the label/feature lists.
 */

export type District = "tanneries" | "nord" | "vieux" | "saules" | "herons"
export type LandUse = "residential" | "mixed" | "commercial" | "industrial" | "institutional"
export type Point = readonly [number, number]

export interface Lot {
  /** Cadastral number without spaces, e.g. "4512087". */
  id: string
  district: District
  points: Point[]
  centroid: Point
  /** Area in m². */
  area: number
  street: string
  civic: number
  use: LandUse
  owner: string
  tenant: string | null
  /** ISO date of the registry attestation. */
  attestedAt: string
}

export const PLAN_W = 1100
export const PLAN_H = 800
const M2_PER_UNIT2 = 0.25

/** The visitor's demo wallet. */
export const USER_ADDRESS = "0x7a3f0c2e41b0d85e6a1f3c07d9b2e4a61c5e91af"
/** Lots the registry attests to the demo wallet. */
export const USER_HOLDINGS: { lotId: string; role: "owner" | "tenant" }[] = [
  { lotId: "4512087", role: "owner" },
  { lotId: "4498129", role: "owner" },
  { lotId: "4541305", role: "tenant" },
]

/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260414)

function hexAddress(): string {
  let s = "0x"
  for (let i = 0; i < 40; i++) s += Math.floor(rand() * 16).toString(16)
  return s
}

const lerp = (p: Point, q: Point, f: number): Point => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]

function polygonArea(pts: Point[]): number {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]!
    const [x2, y2] = pts[(i + 1) % pts.length]!
    s += x1 * y2 - x2 * y1
  }
  return Math.abs(s) / 2
}

function centroidOf(pts: Point[]): Point {
  const x = pts.reduce((a, p) => a + p[0], 0) / pts.length
  const y = pts.reduce((a, p) => a + p[1], 0) / pts.length
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10]
}

interface BlockSpec {
  district: District
  street: string
  /** a, b = street frontage; d, c = the back line (a-d and b-c are the side lines). */
  corners: [Point, Point, Point, Point]
  lots: number
  firstNumber: number
  firstCivic: number
  civicStep: number
  uses: LandUse[]
  /** Indexes (within the block) of lots with a registered tenant. */
  tenants?: number[]
}

const BLOCKS: BlockSpec[] = [
  // Les Tanneries: narrow, deep lots on both sides of rue des Tanneurs.
  { district: "tanneries", street: "rue des Tanneurs", corners: [[52, 160], [232, 152], [228, 64], [48, 72]], lots: 5, firstNumber: 4512071, firstCivic: 12, civicStep: 6, uses: ["residential", "residential", "mixed", "residential", "residential"], tenants: [2] },
  { district: "tanneries", street: "rue des Tanneurs", corners: [[252, 151], [432, 143], [428, 57], [248, 63]], lots: 5, firstNumber: 4512076, firstCivic: 42, civicStep: 6, uses: ["residential", "mixed", "residential", "residential", "residential"] },
  { district: "tanneries", street: "rue des Tanneurs", corners: [[54, 190], [234, 182], [238, 282], [58, 290]], lots: 5, firstNumber: 4512081, firstCivic: 13, civicStep: 6, uses: ["residential", "residential", "residential", "mixed", "residential"], tenants: [3] },
  { district: "tanneries", street: "rue des Tanneurs", corners: [[254, 181], [434, 173], [438, 272], [258, 280]], lots: 5, firstNumber: 4512086, firstCivic: 43, civicStep: 6, uses: ["residential", "residential", "residential", "residential", "mixed"] },
  // Parc Nord: a few large industrial lots on rue de l'Industrie.
  { district: "nord", street: "rue de l'Industrie", corners: [[486, 160], [706, 160], [706, 52], [486, 52]], lots: 3, firstNumber: 4506401, firstCivic: 100, civicStep: 40, uses: ["industrial", "industrial", "industrial"] },
  { district: "nord", street: "rue de l'Industrie", corners: [[726, 160], [930, 160], [924, 56], [726, 52]], lots: 2, firstNumber: 4506404, firstCivic: 220, civicStep: 60, uses: ["industrial", "institutional"] },
  // Vieux-Belrive: four blocks around Place du Marché.
  { district: "vieux", street: "rue Saint-Paul", corners: [[312, 402], [472, 402], [472, 334], [312, 334]], lots: 4, firstNumber: 4498121, firstCivic: 210, civicStep: 8, uses: ["commercial", "mixed", "mixed", "commercial"], tenants: [1, 2] },
  { district: "vieux", street: "rue Saint-Paul", corners: [[612, 402], [772, 402], [772, 334], [612, 334]], lots: 4, firstNumber: 4498125, firstCivic: 250, civicStep: 8, uses: ["mixed", "commercial", "mixed", "residential"], tenants: [0, 2] },
  { district: "vieux", street: "rue du Marché", corners: [[312, 480], [472, 480], [472, 552], [312, 552]], lots: 4, firstNumber: 4498129, firstCivic: 11, civicStep: 8, uses: ["commercial", "mixed", "commercial", "mixed"], tenants: [1, 3] },
  { district: "vieux", street: "rue du Marché", corners: [[612, 480], [772, 480], [772, 552], [612, 552]], lots: 4, firstNumber: 4498133, firstCivic: 51, civicStep: 8, uses: ["mixed", "residential", "commercial", "mixed"], tenants: [0] },
  // Côte-des-Saules: suburban lots along chemin des Saules, with the school.
  { district: "saules", street: "chemin des Saules", corners: [[52, 640], [252, 630], [257, 760], [57, 766]], lots: 4, firstNumber: 4530201, firstCivic: 1200, civicStep: 20, uses: ["residential", "residential", "residential", "residential"], tenants: [1] },
  { district: "saules", street: "chemin des Saules", corners: [[276, 628], [476, 618], [481, 752], [281, 758]], lots: 4, firstNumber: 4530205, firstCivic: 1280, civicStep: 20, uses: ["residential", "residential", "residential", "residential"] },
  { district: "saules", street: "chemin des Saules", corners: [[500, 616], [700, 606], [705, 745], [505, 750]], lots: 3, firstNumber: 4530209, firstCivic: 1360, civicStep: 30, uses: ["institutional", "residential", "residential"], tenants: [2] },
  // Pointe-aux-Hérons: riverside lots along quai des Hérons (frontage on the west side).
  { district: "herons", street: "quai des Hérons", corners: [[822, 330], [832, 470], [932, 462], [920, 322]], lots: 5, firstNumber: 4541301, firstCivic: 5, civicStep: 4, uses: ["residential", "residential", "residential", "residential", "residential"], tenants: [0, 2, 3] },
  { district: "herons", street: "quai des Hérons", corners: [[834, 494], [846, 660], [950, 652], [936, 486]], lots: 5, firstNumber: 4541306, firstCivic: 25, civicStep: 4, uses: ["residential", "residential", "mixed", "residential", "residential"], tenants: [1, 2, 4] },
  { district: "herons", street: "quai des Hérons", corners: [[848, 684], [854, 778], [958, 772], [952, 676]], lots: 3, firstNumber: 4541311, firstCivic: 45, civicStep: 6, uses: ["residential", "residential", "residential"], tenants: [1] },
]

function buildLots(): Lot[] {
  const out: Lot[] = []
  const base = Date.UTC(2023, 2, 6)
  for (const b of BLOCKS) {
    const [a, bb, c, d] = b.corners
    const widths = Array.from({ length: b.lots }, () => 0.8 + rand() * 0.45)
    const total = widths.reduce((s, w) => s + w, 0)
    const front = [0]
    let acc = 0
    for (const w of widths) {
      acc += w / total
      front.push(Math.min(1, acc))
    }
    front[front.length - 1] = 1
    // The back line splits a little off the front line, like real lot lines.
    const back = front.map((f, i) => (i === 0 || i === front.length - 1 ? f : Math.min(0.97, Math.max(0.03, f + (rand() - 0.5) * 0.06))))
    for (let i = 0; i < b.lots; i++) {
      const pts: Point[] = [lerp(a, bb, front[i]!), lerp(a, bb, front[i + 1]!), lerp(d, c, back[i + 1]!), lerp(d, c, back[i]!)].map(
        ([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as const
      )
      const id = String(b.firstNumber + i)
      const attested = new Date(base + Math.floor(rand() * 900) * 86400000).toISOString().slice(0, 10)
      out.push({
        id,
        district: b.district,
        points: pts,
        centroid: centroidOf(pts),
        area: Math.round((polygonArea(pts) * M2_PER_UNIT2) / 5) * 5,
        street: b.street,
        civic: b.firstCivic + i * b.civicStep,
        use: b.uses[i] ?? "residential",
        owner: hexAddress(),
        tenant: b.tenants?.includes(i) ? hexAddress() : null,
        attestedAt: attested,
      })
    }
  }
  // Attach the demo wallet's holdings.
  for (const h of USER_HOLDINGS) {
    const lot = out.find((l) => l.id === h.lotId)
    if (!lot) continue
    if (h.role === "owner") lot.owner = USER_ADDRESS
    else lot.tenant = USER_ADDRESS
  }
  return out
}

export const LOTS: Lot[] = buildLots()
const BY_ID = new Map(LOTS.map((l) => [l.id, l]))

export function lotById(id: string): Lot | undefined {
  return BY_ID.get(id)
}

export function lotsIn(district: District): Lot[] {
  return LOTS.filter((l) => l.district === district)
}

export const DISTRICTS: District[] = ["tanneries", "vieux", "herons", "saules", "nord"]

/** "4512087" -> "4 512 087" (Québec cadastre style). */
export function formatLot(id: string): string {
  return id.replace(/^(\d)(\d{3})(\d{3})$/, "$1 $2 $3")
}

export function lotPath(l: Pick<Lot, "points">): string {
  return `M${l.points.map((p) => `${p[0]} ${p[1]}`).join(" L")} Z`
}

/* ------------------------------------------------------------------ */
/* Map features that are not lots.                                     */

export const RIVER_PATH =
  "M1010 0 C 990 90, 975 180, 985 270 C 995 360, 1015 420, 1005 520 C 995 610, 985 700, 1000 800 L 1100 800 L 1100 0 Z"
/** Public riverbank strip between the Hérons lots and the water. */
export const BANK_PATH =
  "M 924 300 L 970 300 C 978 360, 996 420, 990 520 C 984 610, 972 700, 984 800 L 962 800 L 958 676 L 950 652 L 936 486 L 932 462 L 920 322 Z"
export const SQUARE = { x: 492, y: 402, w: 100, h: 78 }

export interface PlanLabel {
  key: string
  x: number
  y: number
  rotate?: number
  kind: "street" | "district" | "water" | "place"
}

/** Label positions; the text comes from the dictionary (keys under `plan.labels`). */
export const LABELS: PlanLabel[] = [
  { key: "tanneurs", x: 244, y: 171, rotate: -2.5, kind: "street" },
  { key: "moulin", x: 241, y: 108, rotate: -88, kind: "street" },
  { key: "industrie", x: 700, y: 180, kind: "street" },
  { key: "riviereBlvd", x: 540, y: 312, kind: "street" },
  { key: "saintPaul", x: 392, y: 418, kind: "street" },
  { key: "marcheSt", x: 392, y: 470, kind: "street" },
  { key: "saules", x: 380, y: 598, rotate: -2.8, kind: "street" },
  { key: "quai", x: 812, y: 540, rotate: -85, kind: "street" },
  { key: "square", x: 542, y: 445, kind: "place" },
  { key: "bank", x: 972, y: 590, rotate: -84, kind: "place" },
  { key: "river", x: 1050, y: 380, rotate: -86, kind: "water" },
  { key: "tanneries", x: 242, y: 40, kind: "district" },
  { key: "nord", x: 706, y: 38, kind: "district" },
  { key: "vieux", x: 542, y: 362, kind: "district" },
  { key: "saules_d", x: 378, y: 790, kind: "district" },
  { key: "herons", x: 890, y: 312, kind: "district" },
]

/* ------------------------------------------------------------------ */

export type BBox = { x: number; y: number; w: number; h: number }

export const FULL_BOX: BBox = { x: 0, y: 0, w: PLAN_W, h: PLAN_H }

export function bboxOf(ids: Iterable<string>, pad = 40): BBox {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const id of ids) {
    const l = BY_ID.get(id)
    if (!l) continue
    for (const [x, y] of l.points) {
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
  }
  if (!Number.isFinite(x0)) return FULL_BOX
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 }
}

/** Convex hull of the lots' corners (the proposal's affected-area outline). */
export function hullOf(ids: Iterable<string>, pad = 10): Point[] {
  const pts: Point[] = []
  for (const id of ids) {
    const l = BY_ID.get(id)
    if (!l) continue
    for (const [x, y] of l.points) {
      pts.push([x - pad, y - pad], [x + pad, y - pad], [x + pad, y + pad], [x - pad, y + pad])
    }
  }
  if (pts.length < 3) return pts
  const sorted = [...pts].sort((p, q) => p[0] - q[0] || p[1] - q[1])
  const cross = (o: Point, a: Point, b: Point) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: Point[] = []
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: Point[] = []
  for (const p of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop()
    upper.push(p)
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

export function pointsPath(pts: Point[]): string {
  if (!pts.length) return ""
  return `M${pts.map((p) => `${p[0]} ${p[1]}`).join(" L")} Z`
}
