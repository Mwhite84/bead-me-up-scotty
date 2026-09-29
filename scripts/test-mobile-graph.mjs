// Mobile Graph (/m/board/<id>/graph): ladder sections, connector styling per
// DepType, tap-to-re-center, the Map toggle's reuse of the desktop React Flow
// canvas, and Link a bead.
// Uses only intercepted fixtures; no project data is read or written.
import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.SCOTTY_TEST_URL;
assert.ok(base, "Set SCOTTY_TEST_URL to an isolated server");

const bead = (id, title, extra = {}) => ({
  id, title, status: "open", issue_type: "task", priority: 2, labels: [], dependencies: [], comments: [],
  created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-02T00:00:00Z", ...extra,
});
const dep = (depends_on_id, type) => ({ depends_on_id, type });

const beads = [
  bead("f1", "Ready queue shows deferred beads", {
    assignee: "stevey", priority: 0, issue_type: "bug",
    dependencies: [dep("u-open", "blocks"), dep("u-done", "blocks"), dep("epic1", "parent-child")],
  }),
  bead("u-open", "bd adapter execFile envelope"),
  bead("u-done", "Schema normalization", { status: "closed" }),
  bead("d-blocks", "Drag-drop flickers on rollback", { dependencies: [dep("f1", "blocks")] }),
  bead("d-related", "Playwright e2e flows", { dependencies: [dep("f1", "related")] }),
  bead("epic1", "Board read", { issue_type: "epic" }),
  bead("spare", "Unlinked candidate"),
];
const writes = [];

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.route("**/api/projects", (r) => r.fulfill({ json: { projects: [{ id: "demo", name: "Demo", path: null, hasBeads: true }] } }));
  await page.route("**/api/viewer-mode", (r) => r.fulfill({ json: { readOnly: false } }));
  await page.route("**/api/p/demo/**", (r) => {
    const req = r.request();
    const path = new URL(req.url()).pathname;
    if (path.endsWith("/beads/stream")) return r.abort();
    if (path.endsWith("/deps")) {
      const id = path.split("/").at(-2);
      writes.push({ id, ...req.postDataJSON() });
      return r.fulfill({ json: beads.find((b) => b.id === id) ?? {} });
    }
    if (path.endsWith("/beads")) {
      return r.fulfill({ json: { beads, meta: { kind: "demo", humanActor: "t", humanAllowlist: ["t"], pollIntervalMs: 300000, readOnly: false } } });
    }
    const hit = beads.find((b) => path.endsWith(`/beads/${b.id}`));
    return r.fulfill({ json: hit ?? {} });
  });

  // Document order of the rendered ladder: cards and the connectors between them.
  const ladderOrder = () =>
    page.$$eval("[data-edge], [data-rung]", (els) =>
      els.map((el) =>
        el.hasAttribute("data-edge")
          ? `edge:${el.dataset.edge}:${el.textContent.trim()}`
          : `card:${el.dataset.rung}`,
      ),
    );

  await page.goto(`${base}/m/board/f1/graph?project=demo`);
  await page.getByRole("heading", { name: "Graph" }).waitFor();
  await page.getByText("Ready queue shows deferred beads").waitFor();

  // --- sections: upstream above the focused card, downstream below ---
  await page.getByText("Upstream · must close first").waitFor();
  await page.getByText("Downstream · waiting on this").waitFor();
  const order = await ladderOrder();
  const focusAt = order.indexOf("card:f1");
  assert.ok(focusAt > 0, `focused card present, got ${JSON.stringify(order)}`);
  const above = order.slice(0, focusAt), below = order.slice(focusAt + 1);
  assert.ok(above.includes("card:u-open") && above.includes("card:u-done"), `both upstream beads above: ${above}`);
  assert.ok(below.includes("card:d-blocks") && below.includes("card:d-related"), `both downstream beads below: ${below}`);
  assert.ok(!above.some((r) => r.startsWith("card:d-")), "no downstream bead leaks above the focus");
  // parent-child is hierarchy, not a rung: it shows as the footer instead.
  assert.ok(!order.includes("card:epic1"), "parent-child is excluded from the ladder rungs");
  await page.getByRole("button", { name: /parent epic.*epic1.*Board read/s }).waitFor();

  // --- connectors: solid colored for blocks, dashed gray for any other DepType ---
  const edges = await page.$$eval("[data-edge]", (els) =>
    els.map((el) => ({
      kind: el.dataset.edge, type: el.dataset.edgeType, label: el.textContent.trim(),
      dashed: getComputedStyle(el.querySelector("span")).borderLeftStyle === "dashed",
      color: getComputedStyle(el.querySelectorAll("span")[1]).color,
    })),
  );
  const byType = Object.fromEntries(edges.map((e) => [`${e.type}:${e.label}`, e]));
  const blocksOpen = edges.find((e) => e.label === "blocks");
  const blocksDone = edges.find((e) => e.label === "blocks · closed");
  const related = byType["related:related"];
  assert.ok(blocksOpen && blocksDone && related, `three connectors, got ${JSON.stringify(edges)}`);
  assert.equal(blocksOpen.kind, "blocking");
  assert.equal(blocksOpen.dashed, false, "a live blocks edge is a solid line");
  assert.equal(blocksDone.dashed, false, "a resolved blocks edge is still solid");
  assert.notEqual(blocksOpen.color, blocksDone.color, "resolved blocks edges are colored differently from live ones");
  assert.equal(related.kind, "related");
  assert.equal(related.dashed, true, "a non-blocking DepType is a dashed line");
  assert.notEqual(related.color, blocksOpen.color, "the related connector is not the blocking color");

  // --- tapping a rung re-centers the ladder on that bead ---
  await page.getByRole("button", { name: /u-open/ }).click();
  await page.waitForURL(/\/m\/board\/u-open\/graph/);
  await page.getByText("bd adapter execFile envelope").waitFor();
  const recentered = await ladderOrder();
  assert.ok(recentered.indexOf("card:u-open") >= 0, "the tapped bead becomes the focused card");
  assert.ok(recentered.includes("card:f1"), "the previously focused bead is now a rung");
  assert.ok(
    recentered.indexOf("card:f1") > recentered.indexOf("card:u-open"),
    "f1 depends on u-open, so it re-centers as downstream",
  );

  // --- Map toggle opens the existing desktop React Flow canvas on the same bead ---
  await page.goto(`${base}/m/board/f1/graph?project=demo`);
  await page.getByRole("button", { name: "Map" }).click();
  await page.locator(".react-flow").waitFor();
  await page.getByRole("heading", { name: "Dependency graph" }).waitFor();
  await page.locator('[data-keyboard-bead-id="f1"]').waitFor();
  assert.equal(
    await page.locator('[data-keyboard-bead-id="f1"]').getAttribute("aria-current"), "true",
    "the map lands selected on the same focused bead",
  );
  await page.getByRole("button", { name: "Ladder" }).click();
  await page.getByText("Upstream · must close first").waitFor();

  // --- Link a bead adds a real dependency ---
  await page.getByRole("button", { name: "Link a bead" }).click();
  await page.getByRole("dialog", { name: "Add dependency" }).waitFor();
  await page.getByRole("button", { name: /Unlinked candidate/ }).click();
  // The picker closes on the mutation's success, so its disappearance is the write landing.
  await page.getByRole("dialog", { name: "Add dependency" }).waitFor({ state: "detached" });
  assert.deepEqual(writes, [{ id: "f1", depends_on_id: "spare", type: "blocks" }]);

  assert.deepEqual(errors, []);
  console.log("mobile graph: ok");
} finally {
  await browser.close();
}
