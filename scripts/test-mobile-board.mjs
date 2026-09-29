// Mobile Board (/m/board): lane chips, swipe-to-change-status, empty lane, read-only.
// Uses only intercepted fixtures; no project data is read or written.
import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.SCOTTY_TEST_URL;
assert.ok(base, "Set SCOTTY_TEST_URL to an isolated server");

const bead = (id, status, extra = {}) => ({
  id, title: `Mobile ${id}`, status, issue_type: "task", priority: 2, labels: [], dependencies: [], comments: [],
  created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-02T00:00:00Z", ...extra,
});
const beads = [
  bead("r1", "open"), bead("r2", "open"),
  bead("p1", "in_progress"),
  bead("d1", "closed"),
  bead("b1", "open", { dependencies: [{ issue_id: "b1", depends_on_id: "r1", type: "blocks" }] }),
];
const writes = [];
let readOnly = false;

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.route("**/api/projects", (r) => r.fulfill({ json: { projects: [{ id: "demo", name: "Demo", path: null, hasBeads: true }] } }));
  await page.route("**/api/viewer-mode", (r) => {
    if (r.request().method() === "PUT") readOnly = r.request().postDataJSON().readOnly;
    return r.fulfill({ json: { readOnly } });
  });
  await page.route("**/api/p/demo/**", (r) => {
    const req = r.request();
    const path = new URL(req.url()).pathname;
    if (path.endsWith("/beads/stream")) return r.abort();
    if (path.endsWith("/beads")) return r.fulfill({ json: { beads, meta: { kind: "demo", humanActor: "t", humanAllowlist: ["t"], pollIntervalMs: 300000, readOnly } } });
    if (path.endsWith("/status")) {
      const body = req.postDataJSON();
      const id = path.split("/").at(-2);
      const target = beads.find((b) => b.id === id);
      if (target) target.status = body.status;
      writes.push({ id, status: body.status });
      return r.fulfill({ json: target ?? {} });
    }
    return r.fulfill({ json: {} });
  });

  const chip = (name) => page.getByRole("tab", { name: new RegExp(`^${name}`) });
  const card = (id) => page.locator(`[role=link]:has-text("Mobile ${id}")`);
  // Real pointer drag: dnd-kit's PointerSensor listens to pointer events.
  async function swipe(id, dx) {
    const box = await card(id).boundingBox();
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + 40, y);
    await page.mouse.down();
    await page.mouse.move(box.x + 40 + dx / 2, y, { steps: 6 });
    await page.mouse.move(box.x + 40 + dx, y, { steps: 6 });
    await page.mouse.up();
  }

  await page.goto(`${base}/m/board`);
  // Default lane is Ready; the blocked bead is not in it.
  await card("r1").waitFor();
  assert.equal(await card("r2").count(), 1);
  assert.equal(await card("b1").count(), 0);
  assert.equal(await chip("Ready").getAttribute("aria-selected"), "true");
  assert.match(await chip("Ready").innerText(), /2/);

  // Chips filter the list.
  for (const [lane, id] of [["In progress", "p1"], ["Blocked", "b1"], ["Done", "d1"]]) {
    await chip(lane).click();
    await card(id).waitFor();
    assert.equal(await chip(lane).getAttribute("aria-selected"), "true");
    assert.equal(await card("r1").count(), 0);
  }

  // Short swipe: no write. Long swipe: Ready -> in_progress, optimistically.
  await chip("Ready").click();
  await swipe("r1", 40);
  assert.equal(writes.length, 0);
  await swipe("r1", 150);
  await card("r1").waitFor({ state: "detached" });
  assert.equal(page.url(), `${base}/m/board`, "a swipe must not open the bead");
  assert.deepEqual(writes, [{ id: "r1", status: "in_progress" }]);

  // Left swipe defers.
  await swipe("r2", -150);
  await card("r2").waitFor({ state: "detached" });
  assert.deepEqual(writes.at(-1), { id: "r2", status: "deferred" });

  // Empty lane state, and its button switches the lane.
  await page.getByText("Nothing is ready").waitFor();
  await page.getByRole("button", { name: /Browse Backlog · 1/ }).click();
  await card("r2").waitFor();

  // Tapping a card navigates to the detail route.
  await card("r2").click();
  await page.waitForURL(/\/m\/board\/r2/);

  // Read-only: banner, no swipe, padlock instead of the New button.
  readOnly = true;
  await page.goto(`${base}/m/board`);
  await page.getByText("Read-only mode").waitFor();
  await page.getByText("Swipe actions and the composer are off").waitFor();
  const n = writes.length;
  await chip("In progress").click();
  await card("r1").waitFor();
  await swipe("r1", 150);
  assert.equal(writes.length, n);
  await page.getByRole("img", { name: /read-only/ }).waitFor();
  await page.getByRole("button", { name: "Change" }).dispatchEvent("click");
  await page.getByText("Read-only mode").waitFor({ state: "detached" });
  assert.equal(readOnly, false);

  assert.deepEqual(errors, []);
  console.log("mobile board: ok");
} finally {
  await browser.close();
}
