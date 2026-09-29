"use client";
import * as React from "react";
import { useBeads } from "@/hooks/use-beads";
import { makeIndex } from "@/lib/beads-view";
import { focusBuckets } from "@/lib/focus";
import { DependencyLadder } from "./DependencyLadder";
import { useMobileProject } from "./useMobileProject";

/** The Graph tab: the ladder centered on whatever the operator most likely cares about. */
export function GraphHome() {
  const { projectId } = useMobileProject();
  const { data, isLoading } = useBeads(projectId ?? "");
  const pick = React.useMemo(() => {
    const beads = data?.beads ?? [];
    const f = focusBuckets(beads, makeIndex(beads));
    return (f.inFlight[0] ?? f.blocked[0] ?? f.nextUp[0] ?? beads[0])?.id;
  }, [data]);
  // ponytail: pick is recomputed on each poll; pin it if the ladder jumping under the user becomes a complaint.
  if (pick) return <DependencyLadder id={pick} />;
  return (
    <p className="p-8 text-center text-sm text-text-3">
      {isLoading || !data ? "Loading…" : "No beads in this project yet."}
    </p>
  );
}
