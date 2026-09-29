// Isolated demo server (see scripts/test-read-only.mjs):
// XDG_CONFIG_HOME=/tmp/scotty-dispatch-test POSTHOG_KEY='' BEADS_DEMO=1 npm run start -- --port 3198
// SCOTTY_TEST_URL=http://localhost:3198 node scripts/test-dispatch-ui.mjs
import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = process.env.SCOTTY_TEST_URL;
assert.ok(base, "Set SCOTTY_TEST_URL to an isolated demo server");
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const drawer = page.getByRole("dialog");
  const openFirst = async () => {
    await page.goto(`${base}/p/demo`);
    await page.getByRole("button", { name: "Board", exact: true }).click();
    await page.locator("article").first().click();
    // The header is rendered once Copy link is there, so a missing Dispatch is real.
    await drawer.getByTitle("Copy link", { exact: true }).waitFor();
  };

  // Demo project, writable: no Dispatch button.
  assert.equal((await context.request.put(`${base}/api/viewer-mode`, { data: { readOnly: false } })).status(), 200);
  await openFirst();
  assert.equal(await drawer.getByTitle("Dispatch", { exact: true }).count(), 0, "hidden on the demo project");

  // Read-only on: still absent.
  assert.equal((await context.request.put(`${base}/api/viewer-mode`, { data: { readOnly: true } })).status(), 200);
  await openFirst();
  assert.equal(await drawer.getByTitle("Dispatch", { exact: true }).count(), 0, "hidden in read-only mode");
  assert.deepEqual(errors, []);
  console.log("PASS: Dispatch button absent on demo project and in read-only mode");
} finally { await browser.close(); }
