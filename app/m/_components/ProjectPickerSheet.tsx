"use client";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";
import { toastError } from "@/components/error-toast";
import { beadsKey } from "@/hooks/use-beads";
import { useProjects } from "@/hooks/use-projects";
import { api, type BeadsResponse } from "@/lib/api-client";
import { colOf } from "@/lib/board-columns";
import { ARCHIVED_LABEL } from "@/lib/filters";
import { BottomSheet } from "./BottomSheet";
import { Svg } from "./Svg";
import { useMobileProject } from "./useMobileProject";

const FOLDER = <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />;

/** "N beads · N in flight · N blocked", derived from the project's own bead list (same lanes as the Board). */
function statLine(res: BeadsResponse | undefined, failed: boolean): string {
  if (failed) return "Unavailable";
  if (!res) return "…";
  const index = new Map(res.beads.map((b) => [b.id, b]));
  const live = res.beads.filter((b) => !(b.labels ?? []).includes(ARCHIVED_LABEL));
  const lanes = live.map((b) => colOf(b, index));
  return `${live.length} beads · ${lanes.filter((c) => c === "in_progress").length} in flight · ${lanes.filter((c) => c === "blocked").length} blocked`;
}

/** Project switcher bottom sheet. `onClose(id)` closes and, with an id, switches to that project. */
export function ProjectPickerSheet({ onClose }: { onClose: (projectId?: string) => void }) {
  const qc = useQueryClient();
  const { data } = useProjects();
  const { projectId } = useMobileProject();
  const [browsing, setBrowsing] = React.useState(false);
  const projects = data?.projects ?? [];
  // Same query key as the Board's list, so an already-open project costs no extra request.
  const stats = useQueries({
    queries: projects.map((p) => ({
      queryKey: beadsKey(p.id), queryFn: () => api.list(p.id), enabled: p.hasBeads || p.id === "demo",
      staleTime: 10_000, retry: false,
    })),
  });

  const add = useMutation({
    mutationFn: (path: string) => api.projects.add(path),
    onSuccess: (entry) => {
      void qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success(`Added ${entry.name}`);
      onClose(entry.id);
    },
    onError: toastError,
  });

  return (
    <>
      <BottomSheet title="Projects" count={projects.length} top={220} onClose={() => onClose()}>
        <div className="flex flex-col gap-3">
          <div className="divide-y divide-border overflow-hidden rounded-[14px] border border-border bg-surface">
            {projects.map((p, i) => {
              const on = p.id === projectId;
              const demo = p.id === "demo";
              return (
                <button
                  key={p.id} type="button" aria-current={on ? "true" : undefined} onClick={() => onClose(p.id)}
                  className={`flex min-h-16 w-full items-center gap-3 px-3.5 py-2.5 text-left ${on ? "bg-brand-weak" : ""}`}
                >
                  <span
                    className={`inline-flex size-[38px] shrink-0 items-center justify-center rounded-[11px] border ${
                      on ? "border-brand bg-[rgba(109,94,240,.25)]" : "border-border bg-surface-2"
                    }`}
                  >
                    <Svg size={20} color={on ? "var(--brand-2)" : "var(--text-2)"}>{FOLDER}</Svg>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-semibold text-text">{p.name}</span>
                      <span
                        className="rounded-full px-2 py-[5px] font-mono text-[11px] font-medium leading-none"
                        style={demo
                          ? { background: "rgba(217,119,6,.14)", color: "var(--st-progress)" }
                          : { background: "rgba(22,163,74,.14)", color: "var(--st-done)" }}
                      >
                        {demo ? "demo" : "live"}
                      </span>
                    </span>
                    <span className="truncate font-mono text-[11px] text-text-3">{p.path ?? "in-memory sample data"}</span>
                    <span className="text-xs text-text-2">{statLine(stats[i]?.data, !!stats[i]?.isError || !(p.hasBeads || demo))}</span>
                  </span>
                  {on && <Svg size={20} stroke={2.25} color="var(--brand)"><path d="M5 12l5 5 9-10" /></Svg>}
                </button>
              );
            })}
          </div>
          <button
            type="button" disabled={add.isPending} onClick={() => setBrowsing(true)}
            className="flex min-h-[50px] items-center gap-2.5 rounded-[14px] border border-dashed border-border-strong px-3.5 text-sm text-text-2 disabled:opacity-50"
          >
            <Svg size={18}><path d="M12 5v14M5 12h14" /></Svg>
            Add a folder with a .beads repo
          </button>
          <p className="px-1 text-xs leading-normal text-text-3">Each project is its own Dolt database. Switching never mixes beads.</p>
        </div>
      </BottomSheet>
      {browsing && (
        <FolderBrowser
          pending={add.isPending} onClose={() => setBrowsing(false)}
          onPick={(path) => add.mutate(path)}
        />
      )}
    </>
  );
}

/** Full-screen folder navigator over api.fs.browse; a folder with a .beads directory can be added. */
function FolderBrowser({ pending, onPick, onClose }: { pending: boolean; onPick: (path: string) => void; onClose: () => void }) {
  const [path, setPath] = React.useState<string | undefined>(undefined); // undefined = server default (home)
  const { data, isLoading, error } = useQuery({ queryKey: ["fs", path ?? "~home"], queryFn: () => api.fs.browse(path) });
  const row = "flex min-h-[50px] w-full items-center gap-2.5 border-b border-border px-4 text-left text-[15px] disabled:opacity-50";
  return (
    <div role="dialog" aria-label="Add a project" className="fixed inset-0 z-[60] flex flex-col bg-background" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="flex min-h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <span className="text-[15px] font-semibold">Add a project</span>
        <span className="flex-1" />
        <button type="button" onClick={onClose} className="min-h-11 px-2 text-[15px] font-medium text-brand">Cancel</button>
      </div>
      <p className="shrink-0 truncate border-b border-border px-4 py-2 font-mono text-xs text-text-3">{data?.path ?? "…"}</p>
      <div className="min-h-0 flex-1 overflow-y-auto bg-surface pb-8">
        {data?.hasBeads && (
          <button type="button" disabled={pending} className={`${row} font-semibold text-brand`} onClick={() => onPick(data.path)}>
            Add this folder
          </button>
        )}
        {data?.parent && (
          <button type="button" className={`${row} text-text-2`} onClick={() => setPath(data.parent ?? undefined)}>
            <Svg size={18}><path d="M15 6l-6 6 6 6" /></Svg>.. (up one level)
          </button>
        )}
        {isLoading && <p className="py-10 text-center text-sm text-text-3">Loading…</p>}
        {error && <p role="alert" className="px-4 py-10 text-center text-sm text-text-2">{(error as Error).message}</p>}
        {data?.entries.map((e) => (
          <button key={e.path} type="button" className={row} onClick={() => setPath(e.path)}>
            <Svg size={20} color={e.hasBeads ? "var(--brand)" : "var(--text-3)"}>{FOLDER}</Svg>
            <span className="min-w-0 flex-1 truncate">{e.name}</span>
            {e.hasBeads && <span className="shrink-0 font-mono text-[11px] text-brand">.beads</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
