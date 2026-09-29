import { randomUUID } from "node:crypto";
// Shared fixture for the dispatch route/UI tests: a built app (`npm run build` first) started on a
// free port with an isolated config, a fake `bd` (one bead) and a fake Mission Control.
import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Random per run: only its presence in the Authorization header and absence from responses is tested.
export const TOKEN = `fixture-${randomUUID()}`;
export const BEAD_ID = "fx-1";

const FAKE_BD = `#!/usr/bin/env node
const bead = { id: "${BEAD_ID}", title: "Fixture bead", status: "open", priority: 2, issue_type: "task", labels: [], dependencies: [] };
const a = process.argv.slice(2);
if (a[0] === "--version") console.log("bd fixture");
else if (a[0] === "export") console.log(JSON.stringify(bead));
else if (a[0] === "show") console.log(JSON.stringify({ schema_version: 1, data: [bead] }));
else { console.error("fake bd: unsupported " + a.join(" ")); process.exit(1); }
`;

const freePort = () => new Promise((res) => {
  const s = net.createServer().listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); });
});

export async function startFixture() {
  const dir = mkdtempSync(join(tmpdir(), "scotty-dispatch-"));
  const repo = join(dir, "repo");
  mkdirSync(join(repo, ".beads"), { recursive: true });
  writeFileSync(join(repo, ".beads", "metadata.json"), JSON.stringify({ dolt_database: "fixture_db" }));
  const bd = join(dir, "bd");
  writeFileSync(bd, FAKE_BD);
  chmodSync(bd, 0o755);
  const cfgDir = join(dir, "xdg", "bead-me-up-scotty");
  mkdirSync(cfgDir, { recursive: true });
  const projectId = "fixture";
  const now = new Date().toISOString();
  writeFileSync(join(cfgDir, "config.json"), JSON.stringify({ projects: [{ id: projectId, name: "Fixture", path: repo, addedAt: now, lastOpened: now }] }));
  const tokenFile = join(dir, "mc-token");
  writeFileSync(tokenFile, TOKEN);

  // Fake MC: `mc.respond` decides each reply; `mc.seen` records what the app sent.
  const mc = { seen: [], respond: (_req, res) => { res.end(JSON.stringify({ sessionName: "sess-1" })); } };
  const mcServer = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      mc.seen.push({ method: req.method, url: req.url, auth: req.headers.authorization, body: raw ? JSON.parse(raw) : null });
      res.setHeader("content-type", "application/json");
      mc.respond(req, res);
    });
  });
  await new Promise((r) => mcServer.listen(0, "127.0.0.1", r));

  const port = await freePort();
  const app = spawn("node_modules/.bin/next", ["start", "-p", String(port), "-H", "127.0.0.1"], {
    env: {
      ...process.env,
      XDG_CONFIG_HOME: join(dir, "xdg"),
      BD_BIN: bd,
      MC_BASE_URL: `http://127.0.0.1:${mcServer.address().port}`,
      MC_SERVICE_TOKEN: "",
      MC_SERVICE_TOKEN_FILE: tokenFile,
      SCOTTY_READ_ONLY: "",
      POSTHOG_KEY: "",
    },
    stdio: "ignore",
  });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; ; i++) {
    if (await fetch(`${base}/api/viewer-mode`).then((r) => r.ok, () => false)) break;
    if (i > 100) throw new Error("app did not start");
    await new Promise((r) => setTimeout(r, 200));
  }
  return {
    base, projectId, beadId: BEAD_ID, mc, tokenFile,
    async close() { app.kill(); mcServer.close(); rmSync(dir, { recursive: true, force: true }); },
  };
}
