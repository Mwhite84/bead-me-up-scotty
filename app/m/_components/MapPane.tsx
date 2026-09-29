"use client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { AppProvider } from "@/components/app-context";
import { GraphView } from "@/components/graph-view";
import { makeIndex } from "@/lib/beads-view";
import type { Bead } from "@/lib/schema";

/**
 * The Map half of the Graph screen: the EXISTING desktop React Flow canvas,
 * spotlighted on the same bead the ladder is centered on. The mobile shell has
 * no AppProvider (see useBeadScreen), so this supplies the minimum context
 * GraphView and useAddDep need and routes every "open a bead" back into the
 * mobile detail screen. Loaded via next/dynamic by the ladder so @xyflow/react
 * stays out of the ladder's bundle.
 */
export default function MapPane({
  projectId, beads, readOnly, focusBead, href,
}: {
  projectId: string; beads: Bead[]; readOnly: boolean; focusBead: string;
  href: (path: string) => string;
}) {
  const router = useRouter();
  const [selectedBeadId, selectBead] = React.useState<string | null>(focusBead);
  const open = React.useCallback(
    (id: string) => router.push(href(`/m/board/${encodeURIComponent(id)}`)),
    [router, href],
  );
  const value = React.useMemo(
    () => ({
      projectId,
      beads,
      index: makeIndex(beads),
      humanAllowlist: [],
      readOnly,
      loading: false,
      selectedBeadId,
      selectBead,
      openDetail: open,
      pushDetail: open,
      openCreate: () => router.push(href("/m/board")),
      openEpic: (id: string) => router.push(href(`/m/board/${encodeURIComponent(id)}/graph`)),
    }),
    [projectId, beads, readOnly, selectedBeadId, selectBead, open, router, href],
  );
  return (
    <AppProvider value={value}>
      <GraphView focusBead={focusBead} />
    </AppProvider>
  );
}
