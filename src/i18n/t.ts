/** Replace {placeholders} in a dictionary string. Client-safe (no dictionaries imported). */
export function t(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match))
}

/** Pick "one" or "other" form: plural(n, "{n} lot", "{n} lots"). */
export function plural(n: number, one: string, other: string, vars: Record<string, string | number> = {}): string {
  return t(n === 1 ? one : other, { n, ...vars })
}
