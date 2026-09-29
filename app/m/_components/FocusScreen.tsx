"use client";
import * as React from "react";
import { useBeads } from "@/hooks/use-beads";
import { makeIndex } from "@/lib/beads-view";
import { originOf } from "@/lib/attribution";
import { RECENT_LIMIT, assigneeGroups, focusBuckets, type FocusColumn } from "@/lib/focus";
import type { Bead } from "@/lib/schema";
import { AssigneeGroupHeader } from "./AssigneeGroupHeader";
import { FOCUS_COLOR, FocusRow, type FocusKind } from "./FocusRow";
import { ProjectPill } from "./ProjectPill";
import { ReadOnlyBanner } from "./ReadOnlyBanner";
import { Svg } from "./Svg";
import { useMobileProject } from "./useMobileProject";

const PULL_TRIGGER = 56;
const POLL_MS = 5000;
const KIND_OF: Record<string, FocusKind> = { flight: "flight", blocked: "blocked", next: "next" };

const Segment = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button" aria-pressed={on} onClick={onClick}
    className={`inline-flex h-[30px] items-center rounded-full px-3 text-xs ${on ? "bg-brand-weak font-semibold text-brand-2" : "font-medium text-text-2"}`}
  >
    {children}
  </button>
);

export function FocusScreen() {
  const { projectId, name } = useMobileProject();
  const { data, refetch } = useBeads(projectId ?? "");
  const [grouped, setGrouped] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);
  const [pull, setPull] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const startY = React.useRef<number | null>(null);

  const meta = data?.meta;
  const buckets = React.useMemo(() => {
    const beads = data?.beads ?? [];
    return focusBuckets(beads, makeIndex(beads));
  }, [data]);
  const { inFlight, blocked, nextUp, recentlyFinished } = buckets;
  const columns: FocusColumn[] = [
    { id: "flight", title: "In flight", hint: "", items: inFlight },
    { id: "blocked", title: "Blocked", hint: "", items: blocked },
    { id: "next", title: "Next up · P0/P1", hint: "", items: nextUp },
  ];
  const groups = assigneeGroups(columns);

  const projectQ = `?project=${encodeURIComponent(projectId ?? "")}`;
  const href = (b: Bead) => `/m/board/${encodeURIComponent(b.id)}${projectQ}`;
  const shown = showAll ? recentlyFinished : recentlyFinished.slice(0, RECENT_LIMIT);

  // Focus is the "checking on agents" screen: poll at 5s regardless of the server's slower default.
  React.useEffect(() => {
    if (!projectId) return;
    const t = setInterval(() => void refetch(), POLL_MS);
    return () => clearInterval(t);
  }, [projectId, refetch]);

  const doRefresh = async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  };
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    startY.current = e.currentTarget.scrollTop <= 0 ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (startY.current === null) return;
    setPull(Math.max(0, Math.min(PULL_TRIGGER * 1.5, (e.touches[0].clientY - startY.current) / 2)));
  };
  const onTouchEnd = () => {
    if (startY.current !== null && pull >= PULL_TRIGGER) void doRefresh();
    startY.current = null;
    setPull(0);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-0.5 pb-2.5 pl-5 pr-4">
        <div className="flex min-h-11 items-center gap-1.5">
          <ProjectPill name={name ?? "…"} />
          <span className="flex-1" />
          <span className="inline-flex rounded-full border border-border bg-surface p-[3px]">
            <Segment on={!grouped} onClick={() => setGrouped(false)}>All</Segment>
            <Segment on={grouped} onClick={() => setGrouped(true)}>By assignee</Segment>
          </span>
        </div>
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.02em]">Focus</h1>
          <span className="text-[13px] text-text-3">
            {grouped ? `${groups.length} assignee${groups.length === 1 ? "" : "s"}` : `pull to refresh · ${POLL_MS / 1000}s`}
          </span>
        </div>
      </div>
      {meta?.readOnly && <ReadOnlyBanner />}

      <div
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overflow-x-hidden px-4 pb-6"
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      >
        {(pull > 0 || refreshing) && (
          <div className="shrink-0 text-center text-xs text-text-3" style={{ height: refreshing ? 24 : pull / 2 }}>
            {refreshing ? "Refreshing…" : pull >= PULL_TRIGGER ? "Release to refresh" : "Pull to refresh"}
          </div>
        )}

        {!grouped && columns.map((c) => (
          <React.Fragment key={c.id}>
            <div className="flex min-h-8 items-center gap-2 px-1 pb-0.5 pt-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.06em]" style={{ color: FOCUS_COLOR[KIND_OF[c.id]] }}>{c.title}</span>
              <span className="font-mono text-xs text-text-3">{c.items.length}</span>
            </div>
            {c.items.map((b) => <FocusRow key={b.id} bead={b} kind={KIND_OF[c.id]} href={href(b)} />)}
          </React.Fragment>
        ))}

        {grouped && groups.map((g) => {
          const first = g.columns.flatMap((c) => c.items)[0];
          return (
            <React.Fragment key={g.key}>
              <AssigneeGroupHeader
                name={first.assignee?.trim() || undefined}
                origin={originOf(first.assignee?.trim(), meta?.humanAllowlist ?? [])}
                counts={[g.columns[0].items.length, g.columns[1].items.length, g.columns[2].items.length]}
              />
              {g.columns.flatMap((c) => c.items.map((b) => <FocusRow key={b.id} bead={b} kind={KIND_OF[c.id]} href={href(b)} />))}
            </React.Fragment>
          );
        })}
        {grouped && groups.length === 0 && <p className="py-10 text-center text-sm text-text-3">Nothing in flight, blocked or next up.</p>}

        {!grouped && (
          <>
            <button
              type="button" aria-expanded={showAll} disabled={recentlyFinished.length <= RECENT_LIMIT}
              onClick={() => setShowAll(!showAll)}
              className="mt-1 flex min-h-12 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-3 text-left"
            >
              <Svg size={16} stroke={2} color="var(--st-done)"><path d="M5 12l5 5 9-10" /></Svg>
              <span className="text-sm font-semibold text-text">Recently finished</span>
              <span className="font-mono text-xs text-text-3">{shown.length} of {recentlyFinished.length}</span>
              <span className="flex-1" />
              {recentlyFinished.length > RECENT_LIMIT && (showAll
                ? <span className="text-xs font-medium text-brand">Show latest {RECENT_LIMIT}</span>
                : <Svg size={18} color="var(--text-3)"><path d="M6 9l6 6 6-6" /></Svg>)}
            </button>
            {shown.map((b) => <FocusRow key={b.id} bead={b} kind="done" href={href(b)} />)}
          </>
        )}
      </div>
    </div>
  );
}
