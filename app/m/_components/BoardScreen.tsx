"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useBeads, useSetStatusIn } from "@/hooks/use-beads";
import { COLUMN_ORDER, colOf, sortBoardCards } from "@/lib/board-columns";
import { parentOf } from "@/lib/beads-view";
import { beadOrigin } from "@/lib/attribution";
import { ARCHIVED_LABEL } from "@/lib/filters";
import type { Bead } from "@/lib/schema";
import { Card } from "./Card";
import { EmptyLaneState } from "./EmptyLaneState";
import { LaneChips } from "./LaneChips";
import { ProjectPill } from "./ProjectPill";
import { ReadOnlyBanner } from "./ReadOnlyBanner";
import { type StatusKey } from "./StatusChip";
import { SwipeCard } from "./SwipeCard";
import { Svg } from "./Svg";
import { useMobileProject } from "./useMobileProject";

const iconBtn = "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-text-2";

export function BoardScreen() {
  const router = useRouter();
  const { projectId, name } = useMobileProject();
  const { data } = useBeads(projectId ?? "");
  const setStatus = useSetStatusIn(projectId ?? "");
  const [lane, setLane] = React.useState<StatusKey>("ready");
  const [query, setQuery] = React.useState<string | null>(null); // null = search closed

  const readOnly = data?.meta.readOnly ?? false;
  const { byLane, counts, total, index } = React.useMemo(() => {
    const beads = (data?.beads ?? []).filter((b) => !(b.labels ?? []).includes(ARCHIVED_LABEL));
    const index = new Map((data?.beads ?? []).map((b) => [b.id, b]));
    const byLane = Object.fromEntries(COLUMN_ORDER.map((c) => [c, [] as Bead[]])) as Record<StatusKey, Bead[]>;
    for (const b of beads) {
      const c = colOf(b, index);
      if (c) byLane[c as StatusKey].push(b);
    }
    const counts = Object.fromEntries(COLUMN_ORDER.map((c) => [c, byLane[c as StatusKey].length])) as Record<StatusKey, number>;
    return { byLane, counts, total: beads.length, index };
  }, [data]);

  const q = (query ?? "").trim().toLowerCase();
  const cards = sortBoardCards(byLane[lane], "priority").filter(
    (b) => !q || b.id.toLowerCase().includes(q) || b.title.toLowerCase().includes(q),
  );
  const open = (id: string) => router.push(`/m/board/${encodeURIComponent(id)}?project=${encodeURIComponent(projectId ?? "")}`);

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-0.5 pb-2.5 pl-5 pr-4">
        <div className="flex min-h-11 items-center gap-1.5">
          <ProjectPill name={name ?? "…"} />
          <span className="flex-1" />
          <button type="button" aria-label="Search" className={iconBtn} onClick={() => setQuery(query === null ? "" : null)}>
            <Svg size={22}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>
          </button>
          <Link href="/m/settings" aria-label="Settings and export" className={iconBtn}>
            <Svg size={22}><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h9M17 18h3" /><circle cx="15" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="15" cy="18" r="2" /></Svg>
          </Link>
        </div>
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.02em]">Board</h1>
          <span className="text-[13px] text-text-3">{total} beads · {data?.meta.kind === "demo" ? "demo" : "live"}</span>
        </div>
        {query !== null && (
          <input
            autoFocus type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search id or title"
            className="mt-2 h-11 rounded-xl border border-border bg-surface px-3 text-[15px] outline-none focus:border-brand"
          />
        )}
      </div>

      {readOnly && <ReadOnlyBanner />}
      <LaneChips counts={counts} selected={lane} onSelect={setLane} />

      {cards.length === 0 && !q ? (
        <EmptyLaneState lane={lane} counts={counts} onSelect={setLane} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overflow-x-hidden px-4 pb-24">
          {cards.length === 0 && <p className="py-10 text-center text-sm text-text-3">No matches in {lane.replace("_", " ")}.</p>}
          {cards.map((b) => {
            const parent = parentOf(b, index);
            return (
              <SwipeCard key={b.id} id={b.id} lane={lane} disabled={readOnly} onOpen={() => open(b.id)}
                onCommit={(id, status) => setStatus.mutate({ id, status })}>
                <Card bead={b} status={lane} origin={beadOrigin(b, data?.meta.humanAllowlist ?? [])} epic={parent?.issue_type === "epic" ? parent.title : undefined} />
              </SwipeCard>
            );
          })}
        </div>
      )}

      {(readOnly || cards.length > 0) && <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-[rgba(235,235,239,.92)] px-3 py-1.5 text-[11px] text-text-2 backdrop-blur-md">
          {readOnly ? (
            <><Svg size={14} color="var(--text-3)"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>Swipe actions and the composer are off</>
          ) : (
            <><Svg size={14} color="var(--text-2)"><path d="M4 7h13l-3-3M20 17H7l3 3" /></Svg>swipe card: Backlog · Start · Done</>
          )}
        </span>
      </div>}
    </div>
  );
}
