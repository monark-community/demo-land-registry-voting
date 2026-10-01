// Visual check of every page and key flow with Playwright.
// Usage: pnpm build && pnpm start -p 3147   (in another terminal)
//        pnpm screenshots                   (BASE_URL defaults to http://localhost:3147)
// Output: docs/screenshots/<locale>-<width>-<theme>-<name>.png
import { mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const BASE = process.env.BASE_URL ?? "http://localhost:3147"
const OUT = fileURLToPath(new URL("../docs/screenshots/", import.meta.url))
const ONLY = process.env.ONLY

const sizes = { 390: { width: 390, height: 844 }, 1440: { width: 1440, height: 900 } }
const variants = []
for (const w of [390, 1440]) for (const theme of ["light", "dark"]) variants.push({ locale: "en", w, theme })
for (const w of [390, 1440]) variants.push({ locale: "fr", w, theme: "light" })

const L = {
  en: { connect: "Connect demo wallet", sign: "Sign", reject: "Reject", found: /lots found/, forChoice: "I support this proposal.", signBallot: /Sign ballot/, recorded: /Vote recorded/ },
  fr: { connect: "Connecter le portefeuille de démo", sign: "Signer", reject: "Refuser", found: /terrains trouvés/, forChoice: "J'appuie cette proposition.", signBallot: /Signer le bulletin/, recorded: /Vote enregistré/ },
}

async function newPage(browser, { locale, w, theme }) {
  const context = await browser.newContext({ viewport: sizes[w], colorScheme: theme, locale: locale === "fr" ? "fr-CA" : "en-CA" })
  await context.addInitScript((t) => {
    try {
      window.localStorage.setItem("theme", t)
    } catch {}
  }, theme)
  const page = await context.newPage()
  page.on("pageerror", (e) => console.log("  pageerror:", e.message))
  return { context, page }
}

const shot = async (page, v, name, fullPage = false) => {
  if (fullPage) await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}${v.locale}-${v.w}-${v.theme}-${name}.png`, fullPage })
  console.log("  ✓", name)
}
const go = (page, v, path) => page.goto(`${BASE}/${v.locale}${path}`, { waitUntil: "networkidle" })
const signPrompt = async (page, v) => {
  await page.getByRole("dialog").waitFor()
  await page.getByRole("dialog").getByRole("button", { name: L[v.locale].sign, exact: true }).click()
}
const setRole = async (page, name) => {
  await page.getByRole("radio", { name, exact: true }).first().click()
  await page.waitForTimeout(200)
}
const toggleControl = async (page, label) => {
  await page.getByRole("button", { name: /Demo controls|Contrôles de démo/ }).click()
  await page.getByRole("dialog").getByLabel(label).click()
  await page.keyboard.press("Escape")
  await page.waitForTimeout(250)
}

async function connect(page, v, capture) {
  await go(page, v, "/app")
  const gate = page.getByRole("region", { name: /Find your land|Trouvez vos terrains/ })
  await gate.waitFor()
  if (capture) await shot(page, v, "flow1-01-gate", true)
  await gate.getByRole("button", { name: L[v.locale].connect }).click()
  await page.getByRole("dialog").waitFor()
  if (capture) await shot(page, v, "flow1-02-sign-in-prompt")
  await signPrompt(page, v)
  if (capture) {
    await page.getByText(/Looking up|Recherche de vos/).waitFor()
    await shot(page, v, "flow1-03-lookup-pending")
  }
  await page.getByText(L[v.locale].found).waitFor({ timeout: 10000 })
}

async function marketing(page, v) {
  for (const [name, path] of [
    ["home", ""],
    ["how-it-works", "/how-it-works"],
    ["credits", "/credits"],
    ["pricing", "/pricing"],
    ["404", "/this-lot-does-not-exist"],
  ]) {
    await go(page, v, path)
    await page.waitForTimeout(name === "home" ? 9000 : 400) // let the hero plan settle
    await shot(page, v, `page-${name}`, true)
  }
  if (v.w < 768) {
    await go(page, v, "")
    await page.getByRole("button", { name: "Open menu" }).click()
    await page.getByRole("dialog").waitFor()
    await shot(page, v, "page-mobile-menu")
  }
}

async function appFlows(page, v) {
  // Flow 1: rejected sign-in, then connect and find the lots.
  await go(page, v, "/app")
  const gate = page.getByRole("region", { name: "Find your land" })
  await gate.getByRole("button", { name: "Connect demo wallet" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Reject" }).click()
  await page.getByText("You declined the sign-in request.").waitFor()
  await shot(page, v, "flow1-04-rejected")
  await connect(page, v, true)
  await shot(page, v, "flow1-05-lots-found", true)

  // Flow 5 (part 1): a lot's record from the plan.
  await page.getByRole("region", { name: "Your land" }).getByRole("button").first().click()
  await page.getByRole("dialog").waitFor()
  await page.waitForTimeout(600)
  await shot(page, v, "flow5-01-parcel-sheet")
  await page.keyboard.press("Escape")

  // Flow 2: vote on the rue des Tanneurs rezoning; fail once, then succeed.
  await go(page, v, "/app/proposals/P-2026-014")
  await page.getByRole("heading", { level: 1 }).waitFor()
  await page.waitForTimeout(700)
  await shot(page, v, "flow2-01-proposal", true)
  await toggleControl(page, "Fail the next transaction")
  await page.locator("label", { hasText: L.en.forChoice }).click()
  await page.getByRole("button", { name: /Sign ballot/ }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "flow2-02-ballot-prompt")
  await signPrompt(page, v)
  await page.getByText("Recording your vote…").waitFor()
  await page.getByRole("region", { name: "Your ballot" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-03-pending")
  await page.getByText("The network rejected the vote. Nothing was recorded.").waitFor({ timeout: 10000 })
  await page.getByText("The network rejected the vote. Nothing was recorded.").scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-04-reverted")
  await page.getByRole("button", { name: "Try again" }).click()
  await signPrompt(page, v)
  await page.getByText(/Vote recorded/).waitFor({ timeout: 10000 })
  await page.waitForTimeout(900)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow2-05-recorded-seal", true)

  // Flow 3: draft a proposal as the Tanneries residents' association.
  await go(page, v, "/app/new")
  await shot(page, v, "flow3-01-role-gate", true)
  await setRole(page, "Proposer")
  await page.getByRole("button", { name: "Submit for review" }).click()
  await page.waitForTimeout(200)
  await shot(page, v, "flow3-02-errors", true)
  await page.getByRole("button", { name: "Playground" }).click()
  await page.waitForTimeout(700)
  await shot(page, v, "flow3-03-filled", true)
  await page.getByRole("button", { name: "Submit for review" }).click()
  await signPrompt(page, v)
  await page.getByText(/now waits for the clerk/).waitFor({ timeout: 10000 })
  await shot(page, v, "flow3-04-submitted", true)

  // Flow 4: clerk review, certification with a registry outage, then retry.
  await go(page, v, "/app/review")
  await setRole(page, "Clerk")
  await page.getByRole("heading", { name: "To review" }).waitFor()
  await shot(page, v, "flow4-01-desk", true)
  await page.getByRole("button", { name: "Approve and open voting" }).first().click()
  await signPrompt(page, v)
  await page.getByText(/Voting is open until/).waitFor({ timeout: 10000 })
  await toggleControl(page, "Land registry offline")
  await page.getByRole("button", { name: "Certify result" }).click()
  await signPrompt(page, v)
  await page.getByText(/registry filing didn't go through/).waitFor({ timeout: 15000 })
  await page.getByText(/registry filing didn't go through/).scrollIntoViewIfNeeded()
  await shot(page, v, "flow4-02-filing-failed")
  await toggleControl(page, "Land registry offline")
  await page.getByRole("button", { name: "Retry filing" }).click()
  await page.getByText(/Filed ·/).waitFor({ timeout: 15000 })
  await page.waitForTimeout(1000)
  await shot(page, v, "flow4-03-filed", true)
  await go(page, v, "/app/proposals/P-2026-012")
  await page.getByRole("heading", { level: 1 }).waitFor()
  await page.waitForTimeout(500)
  await shot(page, v, "flow4-04-certified-proposal", true)

  // Flow 5 (part 2): the public record, filtered to one lot.
  await go(page, v, "/app/record")
  await page.getByRole("heading", { level: 1 }).waitFor()
  await shot(page, v, "flow5-02-record")
  await page.getByLabel("Filter by lot").fill("4512087")
  await page.waitForTimeout(300)
  await shot(page, v, "flow5-03-record-lot")

  // Edge cases: wallet with no land, demo controls.
  await setRole(page, "Resident")
  await toggleControl(page, "Use a wallet with no land")
  await go(page, v, "/app")
  await page.getByRole("button", { name: "Demo controls" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Look up my lots again" }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "app-demo-controls")
  await page.keyboard.press("Escape")
  await page.getByText("No lots are linked to this wallet").waitFor({ timeout: 10000 })
  await shot(page, v, "flow1-06-no-land")
}

async function frenchFlow(page, v) {
  await go(page, v, "")
  await page.waitForTimeout(9000)
  await shot(page, v, "page-home", true)
  await connect(page, v, false)
  await shot(page, v, "flow1-05-lots-found", true)
  await go(page, v, "/app/proposals/P-2026-014")
  await page.getByRole("heading", { level: 1 }).waitFor()
  await page.locator("label", { hasText: L.fr.forChoice }).click()
  await page.getByRole("button", { name: L.fr.signBallot }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "flow2-02-ballot-prompt")
  await signPrompt(page, v)
  await page.getByText(L.fr.recorded).waitFor({ timeout: 10000 })
  await page.waitForTimeout(900)
  await shot(page, v, "flow2-05-recorded-seal", true)
}

const browser = await chromium.launch()
await mkdir(OUT, { recursive: true })
for (const v of variants) {
  const tag = `${v.locale}-${v.w}-${v.theme}`
  if (ONLY && !tag.includes(ONLY)) continue
  console.log(tag)
  const { context, page } = await newPage(browser, v)
  try {
    if (v.locale === "fr") await frenchFlow(page, v)
    else {
      await marketing(page, v)
      await appFlows(page, v)
    }
  } catch (e) {
    console.error("  ✗", tag, e.message)
    await page.screenshot({ path: `${OUT}_error-${tag}.png` }).catch(() => {})
    process.exitCode = 1
  }
  await context.close()
}
await browser.close()
