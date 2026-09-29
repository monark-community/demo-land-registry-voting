/** Random hex helpers. Math.random only (crypto.randomUUID is unavailable on plain-http LAN origins). */
export function randomHex(len: number): string {
  let s = ""
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 16).toString(16)
  return s
}

export const randomHash = () => `0x${randomHex(64)}`
export const randomId = () => randomHex(12)

export function shortHash(hash: string, start = 6, end = 4): string {
  if (hash.length <= start + end + 1) return hash
  return `${hash.slice(0, start)}…${hash.slice(-end)}`
}

export const shortAddress = (a: string) => shortHash(a, 6, 4)
