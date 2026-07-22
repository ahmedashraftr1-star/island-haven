/**
 * Launch-readiness E2E — the three flows that MUST work on every deploy:
 *   1. Home        — the hero renders, one <h1>, the signed figures link to /verify,
 *                    and the page never scrolls horizontally.
 *   2. Apply       — the application form validates client-side and lands focus on
 *                    the first invalid field with the ARIA wiring screen readers need.
 *   3. Verify      — the crown jewel: the browser independently verifies the Ed25519
 *                    attestation of our public numbers (trustless, no server trust).
 *
 * Self-contained: no @playwright/test needed. Resolves the `playwright` library
 * from the workspace (falling back to a sibling repo's copy) and drives real Chrome.
 * Exits non-zero on the first failed assertion so it can gate CI.
 *
 *   node e2e/launch.e2e.mjs                 # against http://localhost:4000
 *   E2E_BASE_URL=https://… node e2e/launch.e2e.mjs
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
for (const p of [
  "playwright",
  "playwright-core",
  "/Users/ahmedashraf/Humanitarian-Connect/node_modules/playwright",
]) {
  try {
    ({ chromium } = require(p));
    break;
  } catch {
    /* try next */
  }
}
if (!chromium) {
  console.error("✗ Could not resolve the `playwright` library. `pnpm add -D playwright` or run from a workspace that has it.");
  process.exit(2);
}

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:4000";
let passed = 0;
let failed = 0;
const fail = (msg) => {
  failed++;
  console.error(`  ✗ ${msg}`);
};
const ok = (msg) => {
  passed++;
  console.log(`  ✓ ${msg}`);
};
const assert = (cond, msg) => (cond ? ok(msg) : fail(msg));

async function run() {
  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // ── Flow 1: Home ──────────────────────────────────────────────────────────
  console.log("\n▶ Flow 1 — Home");
  {
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
    await page.waitForSelector("h1", { timeout: 15000 });

    const h1s = await page.locator("h1:visible").count();
    assert(h1s === 1, `exactly one visible <h1> (got ${h1s})`);

    const title = await page.title();
    assert(/island\s*haven|آيلاند/i.test(title), `title names the brand ("${title.slice(0, 40)}…")`);

    assert(await page.locator('[data-testid="cta-apply"]').first().isVisible(), "primary CTA (cta-apply) is visible");

    const verify = page.locator('[data-testid="hero-verify"]').first();
    assert(await verify.isVisible(), "signed-figures verify chip is visible");
    const href = await verify.getAttribute("href");
    assert(href && href.replace(/\?.*/, "").endsWith("/verify"), `verify chip links to /verify (${href})`);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 1, `no horizontal scroll at 1280 (overflow ${overflow}px)`);

    // Real navigation from the chip → the /verify route mounts.
    await verify.click();
    await page.waitForURL(/\/verify$/, { timeout: 10000 }).catch(() => {});
    assert(/\/verify$/.test(new URL(page.url()).pathname), "clicking the chip navigates to /verify");

    // `/api/auth/me` returns 401 by design when logged out (the app probes session
    // state on load) — that expected 401 is not a defect, so it's filtered out.
    const severe = errors.filter(
      (e) => !/favicon|manifest|opengraph|ResizeObserver|auth\/me|401/i.test(e),
    );
    assert(severe.length === 0, `no severe console errors (${severe.length}${severe[0] ? ": " + severe[0].slice(0, 60) : ""})`);
    await page.close();
  }

  // ── Flow 2: Apply (client validation + focus + ARIA) ────────────────────────
  console.log("\n▶ Flow 2 — Apply");
  {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/apply`, { waitUntil: "load", timeout: 30000 });
    await page.waitForSelector("h1", { timeout: 15000 });

    const h1s = await page.locator("h1:visible").count();
    assert(h1s === 1, `exactly one visible <h1> (got ${h1s})`);

    // Submit the empty form → client validation must block it and flag fields.
    await page.locator('[data-testid="button-submit"]').first().click();
    await page.waitForTimeout(400);

    const invalidCount = await page.locator('[aria-invalid="true"]').count();
    assert(invalidCount > 0, `empty submit marks fields aria-invalid (${invalidCount})`);

    const focusedTestid = await page.evaluate(() => document.activeElement?.getAttribute("data-testid") || "");
    assert(/^input-/.test(focusedTestid), `focus lands on the first invalid field (${focusedTestid || "none"})`);

    const alerts = await page.locator('[role="alert"]:visible').count();
    assert(alerts > 0, `a validation message is announced (role=alert ×${alerts})`);

    // Still on /apply — the form did not submit.
    assert(/\/apply$/.test(new URL(page.url()).pathname), "invalid form does not navigate away");
    await page.close();
  }

  // ── Flow 3: Verify (trustless in-browser Ed25519 verification) ──────────────
  console.log("\n▶ Flow 3 — Verify");
  {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/verify`, { waitUntil: "load", timeout: 30000 });
    await page.waitForSelector("h1", { timeout: 15000 });

    const h1s = await page.locator("h1:visible").count();
    assert(h1s === 1, `exactly one visible <h1> (got ${h1s})`);

    // The verdict is computed IN THE BROWSER — wait for the success phrase (AR default or EN).
    const verdict = page.getByText(/موقّعٌ — والتوقيعُ صحيح|Signed — and the signature checks out/);
    let verified = true;
    await verdict.first().waitFor({ state: "visible", timeout: 20000 }).catch(() => (verified = false));
    assert(verified, "the browser independently verifies the signed numbers (verdict shown)");

    const failure = await page.getByText(/لم يجتَز التحقّق|didn't verify/).count();
    assert(failure === 0, "no verification-failure verdict is present");
    await page.close();
  }

  await browser.close();

  console.log(`\n${failed === 0 ? "✅ PASS" : "❌ FAIL"} — ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("E2E runner crashed:", e);
  process.exit(3);
});
