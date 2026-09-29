"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toastError } from "@/components/error-toast";
import { useBeads, beadsKey } from "@/hooks/use-beads";
import { api } from "@/lib/api-client";
import { makeIndex } from "@/lib/beads-view";
import type { DepType, UpdateInput } from "@/lib/schema";
import { useMobileProject } from "./useMobileProject";

const beadKey = (projectId: string, id: string) => ["bead", projectId, id] as const;

/**
 * Data + actions shared by the Detail and Comments screens: the bead from a real
 * `api.get`, the project list (for the dependency index and Meta), and
 * project-scoped mutations (the mobile shell has no AppProvider, so the
 * useApp-based hooks in hooks/use-beads.ts can't be used).
 */
export function useBeadScreen(id: string) {
  const { projectId = "" } = useMobileProject();
  const qc = useQueryClient();
  const list = useBeads(projectId);
  const detail = useQuery({
    queryKey: beadKey(projectId, id),
    queryFn: () => api.get(projectId, id),
    enabled: !!projectId,
    refetchInterval: list.data?.meta.pollIntervalMs ?? 5000,
  });
  const beads = React.useMemo(() => list.data?.beads ?? [], [list.data]);
  const index = React.useMemo(() => makeIndex(beads), [beads]);
  const meta = list.data?.meta;

  const opts = {
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: beadsKey(projectId) }),
      qc.invalidateQueries({ queryKey: ["bead", projectId] }),
    ]),
    onError: toastError,
  };
  const actions = {
    update: useMutation({ mutationFn: (patch: UpdateInput) => api.update(projectId, id, patch), ...opts }),
    setStatus: useMutation({ mutationFn: (status: string) => api.setStatus(projectId, id, status), ...opts }),
    addDep: useMutation({
      mutationFn: (v: { dependsOn: string; type: DepType }) => api.addDep(projectId, id, v.dependsOn, v.type),
      ...opts,
    }),
    archive: useMutation({ mutationFn: () => api.archive(projectId, id), ...opts }),
    // The bead is gone: drop its detail query (a refetch would 404 and retry ~7s, holding the
    // awaited onSuccess) and refresh the list without awaiting, so the caller navigates at once.
    remove: useMutation({
      mutationFn: () => api.remove(projectId, id),
      onSuccess: () => {
        qc.removeQueries({ queryKey: beadKey(projectId, id) });
        void qc.invalidateQueries({ queryKey: beadsKey(projectId) });
      },
      onError: toastError,
    }),
    addComment: useMutation({ mutationFn: (text: string) => api.addComment(projectId, id, text), ...opts }),
  };

  return {
    projectId,
    // The list copy renders immediately while the full `get` loads.
    bead: detail.data ?? index.get(id),
    loading: detail.isLoading && !index.has(id),
    notFound: detail.isError && !index.has(id),
    beads, index,
    actor: meta?.humanActor ?? "you",
    humanAllowlist: meta?.humanAllowlist ?? [],
    readOnly: meta?.readOnly ?? false,
    actions,
    /** Carry `?project=` across screens so they stay on the same project. */
    href: (path: string) => `${path}?project=${encodeURIComponent(projectId)}`,
  };
}
