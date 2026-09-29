"use client";
import { useDispatchFor, useDispatchStatusFor } from "@/hooks/use-beads";
import type { DispatchTarget } from "@/lib/api-client";
import { BottomSheet } from "./BottomSheet";

/** MC's violation shape isn't pinned down; accept a string or a {message|text|reason|rule} object. */
function violationText(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    for (const k of ["message", "text", "reason", "rule"]) if (typeof o[k] === "string") return o[k] as string;
  }
  return JSON.stringify(v);
}

const row = "flex min-h-14 w-full flex-col items-start justify-center gap-0.5 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-left disabled:opacity-40";

/** Mobile counterpart of the desktop DispatchMenu: hands a bead (or epic) to omg-build or Krewe via Mission Control. */
export function DispatchSheet({ projectId, beadId, onClose }: { projectId: string; beadId: string; onClose: () => void }) {
  // Mounted only while open, so the status query (and live-run polling) runs only then.
  const { data, isError } = useDispatchStatusFor(projectId, beadId, true);
  const dispatch = useDispatchFor(projectId);
  const go = (target: DispatchTarget) => dispatch.mutate({ id: beadId, target });
  // `dispatch.data` is the last result; only an omg-build result carries sessionName.
  const session = dispatch.data?.sessionName ? dispatch.data : null;
  const readiness = data?.omgBuild.readiness;
  const violation = readiness?.ok === false ? readiness.violations[0] : undefined;
  const run = data?.krewe.run;

  return (
    <BottomSheet title="Dispatch" top={260} onClose={onClose}>
      <div className="flex flex-col gap-2.5 pb-[env(safe-area-inset-bottom)]">
        {isError ? (
          <p className="py-4 text-center text-sm text-text-3">Couldn&apos;t load dispatch options.</p>
        ) : !data ? (
          <p className="py-4 text-center text-sm text-text-3">Loading…</p>
        ) : !data.configured ? (
          <p className="py-4 text-center text-sm text-text-3">Dispatch unavailable: MC token not configured</p>
        ) : (
          <>
            <button type="button" className={row} disabled={dispatch.isPending} onClick={() => go("omg-build")}>
              <span className="text-[15px] font-semibold">Build with omg-build</span>
              <span className="break-all font-mono text-[11px] text-text-3">{data.omgBuild.command}</span>
              {violation !== undefined && <span className="text-xs text-[#f59e0b]">{violationText(violation)}</span>}
            </button>
            <button type="button" className={row} disabled={!data.krewe.eligible || dispatch.isPending} onClick={() => go("krewe")}>
              <span className="text-[15px] font-semibold">{data.isEpic ? "Run epic on Krewe" : "Run on Krewe"}</span>
              {!data.krewe.eligible && data.krewe.reason && <span className="text-xs text-text-3">{data.krewe.reason}</span>}
            </button>
            {run && (
              <div className="flex min-h-11 items-center justify-between px-1 text-[13px] text-text-2">
                <span>Krewe: {run.status ?? "unknown"}</span>
                {data.krewe.runUrl && (
                  <a href={data.krewe.runUrl} target="_blank" rel="noreferrer"
                    className="inline-flex min-h-11 items-center font-medium text-brand">
                    Open run
                  </a>
                )}
              </div>
            )}
          </>
        )}
        {session && (
          <div className="rounded-xl border border-border px-3.5 py-2.5 text-[13px] text-text-2">
            <div>Session: <span className="font-mono">{session.sessionName}</span></div>
            {session.warning && <div className="text-[#f59e0b]">{session.warning}</div>}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
