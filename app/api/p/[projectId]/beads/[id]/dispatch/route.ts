import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { getProject, DEMO_PROJECT } from "@/lib/config";
import { ok, fail } from "@/lib/api";
import {
  McError,
  mcFetch,
  omgBuildCommand,
  readMcProject,
  readMcToken,
} from "@/lib/mc-dispatch";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ projectId: string; id: string }> };

const bodySchema = z.object({ target: z.enum(["omg-build", "krewe"]) });

type Run = { run: unknown; runUrl?: string };

function failDispatch(e: unknown) {
  if (e instanceof McError) {
    return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
  }
  return fail(e);
}

function demo() {
  return NextResponse.json(
    { error: "Dispatch is unavailable in the demo project.", code: "demo_project" },
    { status: 400 },
  );
}

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { projectId, id } = await params;
    if (projectId === DEMO_PROJECT.id) return demo();
    const store = await getStore(projectId);
    const project = getProject(projectId);
    const bead = await store.get(id);
    if (!bead) return ok({ error: "not found" }, 404);
    const mcProject = project?.path ? readMcProject(project.path) : null;
    const isEpic = bead.issue_type === "epic";
    const parent = !isEpic && bead.parent ? await store.get(bead.parent) : null;
    const command = omgBuildCommand(bead, parent?.issue_type === "epic");
    if (!readMcToken() || !mcProject) {
      return ok({
        configured: false,
        mcProject,
        isEpic,
        omgBuild: { command, readiness: null },
        krewe: { eligible: null, reason: null, run: null, runUrl: null },
      });
    }
    const q = `project=${encodeURIComponent(mcProject)}`;
    const eid = encodeURIComponent(id);
    const scope = isEpic ? "epic" : "bead";
    const runPath = isEpic ? `/api/queue/${eid}/krewe-epic-run?${q}` : `/api/queue/${eid}/krewe-run?${q}`;
    // Each call settles independently: a failing advisory call must not take down the
    // omg-build option, which needs none of them.
    const results = await Promise.allSettled([
      mcFetch(`/api/queue/${eid}/build-readiness?${q}&scope=${scope}`),
      mcFetch(`/api/queue/${eid}/krewe-preview?${q}`),
      mcFetch<Run | null>(runPath),
    ]);
    const [readinessR, previewR, runR] = results;
    const rejected = results.flatMap((r) => (r.status === "rejected" ? [r.reason] : []));
    const fatal = rejected.find(
      (e) => e instanceof McError && (e.code === "mc_unreachable" || e.code === "mc_not_configured"),
    );
    // preview 404 means "ineligible", not a failure
    const previewIneligible =
      previewR.status === "rejected" && previewR.reason instanceof McError && previewR.reason.status === 404;
    const failures = rejected.length - (previewIneligible ? 1 : 0);
    if (fatal || failures === results.length) throw fatal ?? rejected[0];

    const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));
    const run = runR.status === "fulfilled" ? runR.value : null;
    return ok({
      configured: true,
      mcProject,
      isEpic,
      omgBuild: { command, readiness: readinessR.status === "fulfilled" ? (readinessR.value ?? null) : null },
      krewe: {
        eligible: previewR.status === "fulfilled" ? true : previewIneligible ? false : null,
        reason: previewR.status === "rejected" ? errMsg(previewR.reason) : null,
        run: run?.run ?? null,
        runUrl: run?.runUrl ?? null,
      },
    });
  } catch (e) {
    return failDispatch(e);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  // A non-JSON content-type is a CORS "simple request" (no preflight), so any
  // web page could launch an agent session here. Requiring JSON forces a preflight we never answer.
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return ok({ error: "Content-Type must be application/json", code: "unsupported_media_type" }, 415);
  }
  try {
    const { projectId, id } = await params;
    if (projectId === DEMO_PROJECT.id) return demo();
    const { target } = bodySchema.parse(await req.json());
    const store = await getStore(projectId);
    const project = getProject(projectId);
    const bead = await store.get(id);
    if (!bead) return ok({ error: "not found" }, 404);
    if (!project?.path) return ok({ error: `Unknown project: ${projectId}`, code: "unknown_project" }, 404);
    const mcProject = readMcProject(project.path);
    if (!mcProject) throw new McError(503, "mc_not_configured", "mc_not_configured");
    const eid = encodeURIComponent(id);
    const isEpic = bead.issue_type === "epic";

    if (target === "krewe") {
      const path = isEpic ? `/api/queue/${eid}/krewe-epic-run` : `/api/queue/${eid}/krewe-run`;
      return ok(await mcFetch(path, { method: "POST", body: { project: mcProject } }));
    }

    const parent = !isEpic && bead.parent ? await store.get(bead.parent) : null;
    const command = omgBuildCommand(bead, parent?.issue_type === "epic");
    const session = await mcFetch<{ sessionName: string; warning?: string }>("/api/agents/sessions", {
      method: "POST",
      body: { agentType: "claude", remoteControl: true, folder: project.path, initialCommand: command },
    });
    return ok({ sessionName: session.sessionName, warning: session.warning, command });
  } catch (e) {
    return failDispatch(e);
  }
}
