/** Random hex helpers using Web Crypto CSPRNG (works without relying on crypto.randomUUID). */
export function randomHex(len: number): string {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  let s = ""
  for (let i = 0; i < len; i++) s += (bytes[i]! & 0x0f).toString(16)
  return s
}

export const randomHash = () => `0x${randomHex(64)}`
export const randomId = () => randomHex(12)

export function shortHash(hash: string, start = 6, end = 4): string {
  if (hash.length <= start + end + 1) return hash
  return `${hash.slice(0, start)}…${hash.slice(-end)}`
}

export const shortAddress = (a: string) => shortHash(a, 6, 4)
