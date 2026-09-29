// Dispatch button visibility, desktop drawer and mobile detail. Needs a build; starts its own app
// (fixture project with one bead + demo project):
// npm run build && node scripts/test-dispatch-ui.mjs
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { startFixture } from "./dispatch-fixture.mjs";

const fx = await startFixture();
const base = fx.base;
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const setReadOnly = async (readOnly) =>
    assert.equal((await context.request.put(`${base}/api/viewer-mode`, { data: { readOnly } })).status(), 200);

  // Desktop drawer
  const drawer = page.getByRole("dialog");
  const openDesktop = async (project) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${base}/p/${project}`);
    await page.getByRole("button", { name: "Board", exact: true }).click();
    await page.locator("article").first().click();
    // The header is rendered once Copy link is there, so a missing Dispatch is real.
    await drawer.getByTitle("Copy link", { exact: true }).waitFor();
    return drawer.getByTitle("Dispatch", { exact: true }).count();
  };
  await setReadOnly(false);
  assert.equal(await openDesktop("demo"), 0, "desktop: hidden on the demo project");
  assert.equal(await openDesktop(fx.projectId), 1, "desktop: shown on a writable real project");
  await setReadOnly(true);
  assert.equal(await openDesktop("demo"), 0, "desktop: hidden in read-only mode (demo)");
  assert.equal(await openDesktop(fx.projectId), 0, "desktop: hidden in read-only mode (real project)");

  // Mobile detail screen
  const demoId = (await (await context.request.get(`${base}/api/p/demo/beads`)).json()).beads[0]?.id;
  assert.ok(demoId, "need a demo bead id");
  const openMobile = async (project, id) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/m/board/${encodeURIComponent(id)}?project=${project}`);
    await page.locator("h1").first().waitFor();
    return page.getByRole("button", { name: "Dispatch", exact: true }).count();
  };
  await setReadOnly(false);
  assert.equal(await openMobile("demo", demoId), 0, "mobile: hidden on the demo project");
  assert.equal(await openMobile(fx.projectId, fx.beadId), 1, "mobile: shown on a writable real project");
  await setReadOnly(true);
  assert.equal(await openMobile("demo", demoId), 0, "mobile: hidden in read-only mode (demo)");
  assert.equal(await openMobile(fx.projectId, fx.beadId), 0, "mobile: hidden in read-only mode (real project)");

  assert.deepEqual(errors, []);
  console.log("PASS: Dispatch button hidden on demo and read-only, shown on writable real project (desktop and mobile)");
} finally { await browser.close(); await fx.close(); }
