// Server-side client for Mission Control's service API (Bearer mcs_... token).
// Imports node: builtins only so scripts/test-mc-dispatch.mjs can load it natively.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type Env = NodeJS.ProcessEnv;

export function mcBaseUrl(env: Env = process.env): string {
  return env.MC_BASE_URL ?? "http://127.0.0.1:3000";
}

/** Token from MC_SERVICE_TOKEN, else the token file; null when neither yields one. Never logged. */
export function readMcToken(env: Env = process.env): string | null {
  if (env.MC_SERVICE_TOKEN) return env.MC_SERVICE_TOKEN;
  const file =
    env.MC_SERVICE_TOKEN_FILE ??
    path.join(os.homedir(), ".config", "bead-me-up-scotty", "mc-service-token");
  try {
    return fs.readFileSync(/*turbopackIgnore: true*/ file, "utf8").trim() || null;
  } catch {
    return null;
  }
}

/** MC keys projects by the Dolt database name recorded in .beads/metadata.json. */
export function readMcProject(repoPath: string): string | null {
  try {
    const meta = JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ path.join(repoPath, ".beads", "metadata.json"), "utf8"));
    return typeof meta?.dolt_database === "string" && meta.dolt_database ? meta.dolt_database : null;
  } catch {
    return null;
  }
}

export function omgBuildCommand(
  bead: { id: string; issue_type: string; parent?: string | null },
  parentIsEpic: boolean,
): string {
  if (bead.issue_type !== "epic" && parentIsEpic && bead.parent) {
    return `/omg-build ${bead.parent} ${bead.id}`;
  }
  return `/omg-build ${bead.id}`;
}

export class McError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code: string) {
    super(message);
    this.name = "McError";
    this.status = status;
    this.code = code;
  }
}

export async function mcFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
  deps: { env?: Env; fetch?: typeof fetch } = {},
): Promise<T> {
  const env = deps.env ?? process.env;
  const token = readMcToken(env);
  if (!token) throw new McError(503, "mc_not_configured", "mc_not_configured");
  let res: Response;
  try {
    res = await (deps.fetch ?? fetch)(mcBaseUrl(env) + path, {
      method: init.method ?? "GET",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new McError(502, "mc_unreachable", "mc_unreachable");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = typeof body?.error === "string" ? body.error : res.statusText;
    throw new McError(res.status, msg, typeof body?.code === "string" ? body.code : "mc_error");
  }
  return body as T;
}
