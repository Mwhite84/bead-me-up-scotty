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
    const [readiness, preview, run] = await Promise.all([
      mcFetch(`/api/queue/${eid}/build-readiness?${q}&scope=${scope}`),
      mcFetch(`/api/queue/${eid}/krewe-preview?${q}`).then(
        () => ({ eligible: true, reason: null as string | null }),
        (e) => {
          if (e instanceof McError && e.status === 404) return { eligible: false, reason: e.message };
          throw e;
        },
      ),
      mcFetch<Run>(runPath),
    ]);
    return ok({
      configured: true,
      mcProject,
      isEpic,
      omgBuild: { command, readiness },
      krewe: { ...preview, run: run.run, runUrl: run.runUrl ?? null },
    });
  } catch (e) {
    return failDispatch(e);
  }
}

export async function POST(req: Request, { params }: Ctx) {
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
