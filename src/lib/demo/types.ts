/**
 * Domain types for the LandVote demo. They mirror what a contract + registry
 * integration would expose (proposal struct, ballot events, attestations),
 * so the data layer can later be swapped for wagmi/viem calls.
 */

export type Role = "resident" | "proposer" | "clerk"
export type HolderRole = "owner" | "tenant"
export type Choice = "for" | "against" | "abstain"
export type VotingRule = "lot" | "area"
export type Category = "zoning" | "infrastructure" | "greenspace" | "budget" | "services"
export type ProposalStatus = "review" | "returned" | "open" | "closed" | "certified"
export type Outcome = "passed" | "rejected" | "no_quorum"

export interface Holding {
  lotId: string
  role: HolderRole
}

export interface WalletState {
  status: "disconnected" | "connecting" | "connected"
  address: string
  /** Registry lookup after sign-in. */
  lookup: "idle" | "pending" | "done" | "failed"
  holdings: Holding[]
}

export interface Proposal {
  id: string
  /** Seeded proposals take their text from the dictionary (so switching language works). */
  seedKey?: string
  title?: string
  summary?: string
  category: Category
  proposer: "planning" | "tanneries" | "herons" | "you"
  lots: string[]
  tenantsVote: boolean
  rule: VotingRule
  /** Percent of eligible weight that must take part. */
  quorum: number
  status: ProposalStatus
  outcome?: Outcome
  submittedAt: number
  opensAt?: number
  closesAt?: number
  /** Voting period in days (used when the clerk opens voting). */
  durationDays: number
  closedAt?: number
  certifiedAt?: number
  registryRef?: string
  registry?: "pending" | "filed" | "failed"
  returnReason?: string
  hashes: Partial<Record<"submitted" | "opened" | "closed" | "certified", string>>
}

export interface Vote {
  lotId: string
  role: HolderRole
  choice: Choice
  voter: string
  hash: string
  block: number
  at: number
}

export type RecordEventType =
  | "submitted"
  | "approved"
  | "returned"
  | "vote"
  | "closed"
  | "certified"
  | "filed"
  | "filing_failed"

export interface RecordEvent {
  id: string
  type: RecordEventType
  proposalId: string
  at: number
  hash?: string
  block?: number
  actor: string
  lotId?: string
  role?: HolderRole
  choice?: Choice
  outcome?: Outcome
  ref?: string
}

export interface DemoSettings {
  failNext: boolean
  slow: boolean
  registryOffline: boolean
  noLand: boolean
}

export interface DemoState {
  version: 1
  seededAt: number
  block: number
  wallet: WalletState
  role: Role
  proposals: Proposal[]
  /** proposalId -> ballot key (`lotId:role`) -> vote */
  votes: Record<string, Record<string, Vote>>
  events: RecordEvent[]
  settings: DemoSettings
}

/** What the wallet prompt shows before signing. */
export interface TxSummary {
  kind: "signin" | "vote" | "submit" | "approve" | "return" | "close" | "certify"
  title: string
  lines: { label: string; value: string; mono?: boolean }[]
  /** Sign-in is a message signature: no network fee. */
  message?: boolean
}

export type TxPhase = "idle" | "signing" | "pending" | "confirmed" | "failed"
export interface TxState {
  phase: TxPhase
  hash?: string
  block?: number
  error?: "rejected" | "reverted"
}
