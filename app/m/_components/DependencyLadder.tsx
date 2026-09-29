"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import * as React from "react";
import { parentOf } from "@/lib/beads-view";
import { dependencyLadder, type LadderRung } from "@/lib/dep-ladder";
import { Avatar } from "./Avatar";
import { DepPicker } from "./DepPicker";
import { LadderConnector } from "./LadderConnector";
import { PriorityBadge } from "./PriorityBadge";
import { ProjectPill } from "./ProjectPill";
import { Segment, SegmentGroup } from "./Segment";
import { StatusDot, statusKey } from "./StatusChip";
import { Svg } from "./Svg";
import { TypeIcon, typeLabel } from "./TypeIcon";
import { useBeadScreen } from "./useBeadScreen";
import { useMobileProject } from "./useMobileProject";

// Keeps @xyflow/react and its stylesheet out of the ladder's bundle until the
// Map toggle is actually used.
const MapPane = dynamic(() => import("./MapPane"), {
  ssr: false,
  loading: () => <p className="p-8 text-center text-sm text-text-3">Loading map…</p>,
});

const EPIC_ICON = (
  <>
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </>
);

function SectionHead({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <div className="flex min-h-8 items-center gap-2 px-1 pb-0.5 pt-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.06em]" style={{ color }}>{title}</span>
      <span className="font-mono text-xs text-text-3">{count}</span>
    </div>
  );
}

/** A non-focused rung. Tapping it re-centers the ladder on that bead. */
function RungCard({ rung, onOpen }: { rung: LadderRung; onOpen: (id: string) => void }) {
  const b = rung.bead;
  return (
    <button
      type="button" onClick={() => onOpen(rung.id)} data-rung={rung.id}
      className="flex w-full flex-col gap-1.5 rounded-[14px] border-[1.5px] border-border bg-surface px-3 py-2.5 text-left"
    >
      <span className="flex items-center gap-2">
        <StatusDot status={b ? statusKey(b) : "ready"} />
        <span className="whitespace-nowrap font-mono text-xs text-text-2">{rung.id}</span>
        <span className="flex-1" />
        {b && <PriorityBadge priority={b.priority} />}
      </span>
      <span className="text-sm font-semibold leading-[1.3] text-text [text-wrap:pretty]">{b?.title ?? rung.id}</span>
    </button>
  );
}

export function DependencyLadder({ id }: { id: string }) {
  const router = useRouter();
  const { name } = useMobileProject();
  const s = useBeadScreen(id);
  const { bead, beads, index, actions, readOnly } = s;
  const [map, setMap] = React.useState(false);
  const [picking, setPicking] = React.useState(false);

  // Re-centering is a real navigation: the URL names the focused bead, so the
  // screen is shareable and the back button walks the ladder trail.
  const recenter = (beadId: string) => router.push(s.href(`/m/board/${encodeURIComponent(beadId)}/graph`));

  const ladder = React.useMemo(() => (bead ? dependencyLadder(bead, beads) : null), [bead, beads]);

  const header = (
    <div className="flex shrink-0 flex-col gap-0.5 pb-2.5 pl-5 pr-4">
      <div className="flex min-h-11 items-center gap-1.5">
        <ProjectPill name={name ?? "…"} />
        <span className="flex-1" />
        <SegmentGroup>
          <Segment on={!map} onClick={() => setMap(false)}>Ladder</Segment>
          <Segment on={map} onClick={() => setMap(true)}>Map</Segment>
        </SegmentGroup>
      </div>
      <div className="flex items-baseline gap-2.5">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.02em]">Graph</h1>
        <span className="text-[13px] text-text-3">
          {map ? <span className="font-mono">{id}</span> : "tap a node to re-center"}
        </span>
      </div>
    </div>
  );

  if (!bead || !ladder) {
    return (
      <div className="flex h-full flex-col">
        {header}
        <p className="p-8 text-center text-sm text-text-3">{s.notFound ? `${id} not found.` : "Loading…"}</p>
      </div>
    );
  }

  if (map) {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="min-h-0 flex-1">
          <MapPane projectId={s.projectId} beads={beads} readOnly={readOnly} focusBead={bead.id} href={s.href} />
        </div>
      </div>
    );
  }

  const parent = parentOf(bead, index);

  return (
    <div className="flex h-full flex-col">
      {header}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-2">
        <SectionHead title="Upstream · must close first" count={ladder.upstream.length} color="var(--st-blocked)" />
        {ladder.upstream.length === 0 && (
          <p className="px-1 py-2 text-[13px] text-text-3">Nothing blocks this bead.</p>
        )}
        {ladder.upstream.map((rung) => (
          <React.Fragment key={rung.key}>
            <RungCard rung={rung} onOpen={recenter} />
            <LadderConnector edge={rung.edge} />
          </React.Fragment>
        ))}

        <div
          className="flex flex-col gap-1.5 rounded-[14px] border-[1.5px] border-brand bg-brand-weak px-4 py-3.5 shadow-[0_0_0_4px_rgba(109,94,240,0.15)]"
          aria-current="true" data-rung={bead.id} data-rung-focus="true"
        >
          <span className="flex items-center gap-2">
            <StatusDot status={statusKey(bead)} />
            <span className="whitespace-nowrap font-mono text-xs text-brand-2">{bead.id}</span>
            <span className="flex-1" />
            <PriorityBadge priority={bead.priority} />
          </span>
          <span className="text-base font-semibold leading-[1.3] text-text [text-wrap:pretty]">{bead.title}</span>
          <span className="flex items-center gap-2.5">
            <span
              className="inline-flex items-center gap-[5px] text-xs"
              style={{ color: bead.issue_type === "bug" ? "var(--st-blocked)" : "var(--text-2)" }}
            >
              <TypeIcon type={bead.issue_type} color="currentColor" />{typeLabel(bead.issue_type)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-text-2">
              {bead.assignee ? <><Avatar name={bead.assignee} size={18} />{bead.assignee}</> : "Unassigned"}
            </span>
          </span>
        </div>

        <SectionHead title="Downstream · waiting on this" count={ladder.downstream.length} color="var(--pri-high)" />
        {ladder.downstream.length === 0 && (
          <p className="px-1 py-2 text-[13px] text-text-3">Nothing is waiting on this bead.</p>
        )}
        {ladder.downstream.map((rung) => (
          <React.Fragment key={rung.key}>
            <LadderConnector edge={rung.edge} />
            <RungCard rung={rung} onOpen={recenter} />
          </React.Fragment>
        ))}

        {parent && (
          <button
            type="button" onClick={() => recenter(parent.id)}
            className="flex min-h-11 items-center gap-2 px-1 pt-2 text-left text-xs text-text-3"
          >
            <Svg size={14} color="var(--text-3)">{EPIC_ICON}</Svg>
            parent epic
            <span className="whitespace-nowrap font-mono text-xs text-text-2">{parent.id}</span>
            <span className="min-w-0 truncate">{parent.title}</span>
            <span className="flex-1" />
            <Svg size={16} color="var(--text-3)"><path d="M9 6l6 6-6 6" /></Svg>
          </button>
        )}
      </div>

      {!readOnly && (
        <div className="flex shrink-0 gap-2.5 px-4 pb-3 pt-3">
          <button
            type="button" onClick={() => setPicking(true)} disabled={actions.addDep.isPending}
            className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-brand px-[18px] text-[15px] font-semibold text-white disabled:opacity-40"
          >
            <Svg size={18} stroke={2} color="#ffffff">
              <path d="M10 13.5a4.5 4.5 0 0 0 6.4 0l2.8-2.8a4.5 4.5 0 0 0-6.4-6.4L11.5 5.6" />
              <path d="M14 10.5a4.5 4.5 0 0 0-6.4 0l-2.8 2.8a4.5 4.5 0 0 0 6.4 6.4l1.3-1.3" />
            </Svg>
            Link a bead
          </button>
        </div>
      )}

      {picking && (
        <DepPicker
          beads={beads} currentId={bead.id} pending={actions.addDep.isPending}
          linkedIds={(bead.dependencies ?? []).map((d) => d.depends_on_id)}
          onClose={() => setPicking(false)}
          onPick={(dependsOn) => actions.addDep.mutate({ dependsOn, type: "blocks" }, { onSuccess: () => setPicking(false) })}
        />
      )}
    </div>
  );
}
