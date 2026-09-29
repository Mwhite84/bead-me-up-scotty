// Route-level matrix for POST/GET /api/p/<id>/beads/<bead>/dispatch. Needs a build:
// npm run build && node scripts/test-dispatch-route.mjs
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { startFixture, TOKEN } from "./dispatch-fixture.mjs";

const fx = await startFixture();
const bodies = [];
const call = async (method, project, body, headers = {}) => {
  const res = await fetch(`${fx.base}/api/p/${project}/beads/${fx.beadId}/dispatch`, {
    method,
    headers: method === "POST" ? { "content-type": "application/json", ...headers } : headers,
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  bodies.push(text);
  return { status: res.status, json: JSON.parse(text) };
};
const post = (project, body, headers) => call("POST", project, body, headers);

try {
  // demo: refused before anything else
  let r = await post("demo", { target: "omg-build" });
  assert.equal(r.status, 400);
  assert.equal(r.json.code, "demo_project");
  assert.equal((await call("GET", "demo")).status, 400);

  // bad input
  assert.equal((await post(fx.projectId, { target: "nope" })).status, 400, "bad target");
  const ct = await fetch(`${fx.base}/api/p/${fx.projectId}/beads/${fx.beadId}/dispatch`, { method: "POST", headers: { "content-type": "text/plain" }, body: "{}" });
  assert.equal(ct.status, 415, "non-JSON content-type");
  assert.equal(fx.mc.seen.length, 0, "nothing above may reach MC");

  // read-only (cookie form of viewer mode) is refused by proxy.ts, MC untouched
  r = await post(fx.projectId, { target: "omg-build" }, { cookie: "scotty-viewer-mode=read-only" });
  assert.equal(r.status, 403);
  assert.equal(r.json.code, "read_only");
  assert.equal(fx.mc.seen.length, 0, "read-only must not reach MC");

  // success: token goes to MC as Bearer, never back to the client
  r = await post(fx.projectId, { target: "omg-build" });
  assert.equal(r.status, 200);
  assert.equal(r.json.sessionName, "sess-1");
  assert.equal(r.json.command, `/omg-build ${fx.beadId}`);
  assert.equal(fx.mc.seen.length, 1);
  assert.equal(fx.mc.seen[0].auth, `Bearer ${TOKEN}`);
  assert.equal(fx.mc.seen[0].body.initialCommand, `/omg-build ${fx.beadId}`);

  // MC error passthrough (status + body.error)
  fx.mc.respond = (_q, res) => { res.statusCode = 409; res.end(JSON.stringify({ error: "run already live" })); };
  r = await post(fx.projectId, { target: "omg-build" });
  assert.equal(r.status, 409);
  assert.equal(r.json.error, "run already live");

  // MC unreachable -> 502
  fx.mc.respond = (q) => q.destroy();
  r = await post(fx.projectId, { target: "omg-build" });
  assert.equal(r.status, 502);
  assert.equal(r.json.code, "mc_unreachable");

  // no token -> 503, and MC is not contacted
  rmSync(fx.tokenFile);
  const before = fx.mc.seen.length;
  r = await post(fx.projectId, { target: "omg-build" });
  assert.equal(r.status, 503);
  assert.equal(r.json.code, "mc_not_configured");
  assert.equal(fx.mc.seen.length, before);
  r = await call("GET", fx.projectId);
  assert.equal(r.status, 200);
  assert.equal(r.json.configured, false);

  for (const b of bodies) assert.ok(!b.includes(TOKEN), "token leaked into a response");
  console.log("PASS: dispatch route matrix (demo 400, bad input, read-only 403, success, MC passthrough, 502, 503) and no token in responses");
} finally { await fx.close(); }
