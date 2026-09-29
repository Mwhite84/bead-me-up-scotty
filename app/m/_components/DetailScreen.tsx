"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { DescriptionContent } from "@/components/description-content";
import { beadOrigin, originOf } from "@/lib/attribution";
import { colOf } from "@/lib/board-columns";
import { fmtDate, parentOf, relTime } from "@/lib/beads-view";
import { BLOCKING_DEP_TYPES } from "@/lib/schema";
import { Avatar } from "./Avatar";
import { CommentComposer } from "./CommentComposer";
import { DepPicker } from "./DepPicker";
import { DepRow } from "./DepRow";
import { DispatchSheet } from "./DispatchSheet";
import { OriginIcon } from "./OriginIcon";
import { PriorityBadge } from "./PriorityBadge";
import { headerBtn, ScreenHeader } from "./ScreenHeader";
import { statusKey, type StatusKey } from "./StatusChip";
import { StatusPillRow } from "./StatusPillRow";
import { Svg } from "./Svg";
import { TypeIcon, typeLabel } from "./TypeIcon";
import { useBeadScreen } from "./useBeadScreen";

const RELATION: Record<string, string> = {
  blocks: "blocked by", "conditional-blocks": "conditionally blocked by", "waits-for": "waits for",
};
const isBlocking = (t: string) => (BLOCKING_DEP_TYPES as readonly string[]).includes(t);

function SectionHead({ title, count, children }: { title: string; count: number; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-8 items-center gap-2 px-1 pb-0.5 pt-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.06em] text-text-3">{title}</span>
      <span className="font-mono text-xs text-text-3">{count}</span>
      <span className="flex-1" />
      {children}
    </div>
  );
}

const Cell = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="box-border flex min-h-14 min-w-0 flex-col gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5">
    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3">{label}</span>
    <span className="flex min-h-5 flex-wrap items-center gap-[7px] text-sm text-text">{children}</span>
  </div>
);

const linkBtn = "inline-flex min-h-11 items-center gap-1 text-[13px] font-medium text-brand disabled:opacity-40";
const bigBtn = "inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[14px] border border-border-strong bg-surface-2 px-[18px] text-[15px] font-semibold disabled:opacity-40";

export function DetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const s = useBeadScreen(id);
  const { bead, index, beads, actions, readOnly } = s;
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [picking, setPicking] = React.useState(false);
  const [dispatching, setDispatching] = React.useState(false);

  const board = s.href("/m/board");
  const open = (beadId: string) => router.push(s.href(`/m/board/${encodeURIComponent(beadId)}`));

  const deps = React.useMemo(() => {
    if (!bead) return [];
    const done = (other?: { status: string }) => bead.status === "closed" || other?.status === "closed";
    const outgoing = (bead.dependencies ?? [])
      .filter((d) => d.type !== "parent-child")
      .map((d) => {
        const target = index.get(d.depends_on_id);
        return { key: `out:${d.depends_on_id}:${d.type}`, target, targetId: d.depends_on_id,
          label: RELATION[d.type] ?? d.type, blocking: isBlocking(d.type), resolved: done(target) };
      });
    const incoming = beads.flatMap((o) =>
      (o.dependencies ?? [])
        .filter((d) => d.depends_on_id === bead.id && d.type !== "parent-child" && isBlocking(d.type))
        .map((d) => ({ key: `in:${o.id}:${d.type}`, target: o, targetId: o.id,
          label: "blocks", blocking: true, resolved: done(o) })),
    );
    return [...outgoing, ...incoming].sort((a, b) => Number(a.resolved) - Number(b.resolved));
  }, [bead, beads, index]);

  if (!bead) {
    return (
      <div className="flex h-full flex-col">
        <ScreenHeader backHref={board} backLabel="Board" title={id} mono />
        <p className="p-8 text-center text-sm text-text-3">{s.notFound ? `${id} not found.` : "Loading…"}</p>
      </div>
    );
  }

  const parent = parentOf(bead, index);
  const origin = beadOrigin(bead, s.humanAllowlist);
  const lane = (colOf(bead, index) as StatusKey | null) ?? statusKey(bead);
  const comments = bead.comments ?? [];
  const last = comments[comments.length - 1];
  const busy = actions.update.isPending || actions.setStatus.isPending;

  const startEdit = () => { setTitle(bead.title); setDesc(bead.description ?? ""); setEditing(true); };
  const save = () => {
    const t = title.trim();
    if (!t) return;
    actions.update.mutate({ title: t, description: desc }, { onSuccess: () => setEditing(false) });
  };
  const leave = { onSuccess: () => router.replace(board) };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        backHref={board} backLabel="Board" title={bead.id} mono
        right={!readOnly && (
          <button type="button" aria-label={editing ? "Cancel edit" : "Edit"} aria-pressed={editing} className={headerBtn}
            onClick={() => (editing ? setEditing(false) : startEdit())}>
            <Svg size={22}>{editing ? <path d="M6 6l12 12M18 6L6 18" /> : <><path d="M4 20l4.5-1L19 8.5l-3.5-3.5L5 15.5z" /><path d="M13.5 7l3.5 3.5" /></>}</Svg>
          </button>
        )}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-4 pb-6 pt-3.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-[5px] text-xs" style={{ color: bead.issue_type === "bug" ? "var(--st-blocked)" : "var(--text-2)" }}>
            <TypeIcon type={bead.issue_type} color="currentColor" />{typeLabel(bead.issue_type)}
          </span>
          <PriorityBadge priority={bead.priority} />
          <span className="flex-1" />
          <span className="inline-flex items-center gap-[5px] text-xs text-text-3">
            <OriginIcon origin={origin} />{bead.created_by || relTime(bead.created_at)}
          </span>
        </div>

        {editing ? (
          <div className="flex flex-col gap-2">
            <input
              value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title"
              className="min-h-11 rounded-xl border border-border bg-surface px-3 text-[22px] font-bold leading-[1.25] tracking-[-0.02em] outline-none focus:border-brand"
            />
            <textarea
              value={desc} onChange={(e) => setDesc(e.target.value)} aria-label="Description" rows={8}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 font-mono text-[13px] leading-[1.5] outline-none focus:border-brand"
            />
            <div className="flex gap-2">
              <button type="button" className={bigBtn} onClick={() => setEditing(false)}>Cancel</button>
              <button type="button" disabled={busy || !title.trim()} onClick={save}
                className="inline-flex min-h-[50px] w-full items-center justify-center rounded-[14px] bg-brand px-[18px] text-[15px] font-semibold text-white disabled:opacity-40">
                Save
              </button>
            </div>
          </div>
        ) : (
          <h1 className="text-[22px] font-bold leading-[1.25] tracking-[-0.02em] [text-wrap:pretty]">{bead.title}</h1>
        )}

        {!readOnly && s.projectId !== "demo" && (
          <button type="button" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-brand px-[18px] text-[15px] font-semibold text-white" onClick={() => setDispatching(true)}>
            <Svg size={18} stroke={2}><path d="M5 19c1-4 3-6 5-7M9 11l4 4M14 4c4 0 6 2 6 6-3 0-6 2-8 5l-3-3c3-2 5-5 5-8z" /></Svg>Dispatch
          </button>
        )}

        <StatusPillRow current={lane} disabled={readOnly || busy} onPick={(st) => actions.setStatus.mutate(st)} />

        <div className="grid grid-cols-2 gap-2">
          <Cell label="Assignee">
            {bead.assignee ? <><Avatar name={bead.assignee} size={20} />{bead.assignee}</> : <span className="text-text-3">Unassigned</span>}
          </Cell>
          <Cell label={parent && parent.issue_type !== "epic" ? "Parent" : "Epic"}>
            {parent ? (
              <button type="button" onClick={() => open(parent.id)} className="min-w-0 truncate text-left text-brand">{parent.title}</button>
            ) : <span className="text-text-3">None</span>}
          </Cell>
          <Cell label="Labels">
            {bead.labels.length ? bead.labels.map((l) => (
              <span key={l} className="whitespace-nowrap rounded-full bg-[rgba(98,98,109,.14)] px-2 py-[5px] font-mono text-[11px] font-medium leading-none text-text-2">{l}</span>
            )) : <span className="text-text-3">None</span>}
          </Cell>
          <Cell label="Updated">{fmtDate(bead.updated_at)} · {relTime(bead.updated_at)}</Cell>
        </div>

        {!editing && bead.description?.trim() && (
          <DescriptionContent text={bead.description} projectId={s.projectId} className="text-sm leading-[1.5] text-text-2 [overflow-wrap:anywhere]" />
        )}

        <SectionHead title="Dependencies" count={deps.length}>
          <Link href={s.href(`/m/board/${encodeURIComponent(bead.id)}/graph`)} className={linkBtn}>
            Ladder<Svg size={16} color="var(--brand)"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" /><path d="M7.5 8.2l3.2 7.3M16.5 8.2l-3.2 7.3" /></Svg>
          </Link>
          {!readOnly && (
            <button type="button" className={linkBtn} onClick={() => setPicking(true)}>
              <Svg size={16} stroke={2} color="var(--brand)"><path d="M12 5v14M5 12h14" /></Svg>Add
            </button>
          )}
        </SectionHead>
        {deps.map(({ key, ...row }) => <DepRow key={key} {...row} onOpen={open} />)}

        <SectionHead title="Comments" count={comments.length}>
          <Link href={s.href(`/m/board/${encodeURIComponent(bead.id)}/comments`)} className={linkBtn}>
            See all<Svg size={16} color="var(--brand)"><path d="M9 6l6 6-6 6" /></Svg>
          </Link>
        </SectionHead>
        {last && (
          <div className="flex gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5">
            <Avatar name={last.author} size={24} />
            <div className="flex min-w-0 flex-col gap-[3px]">
              <span className="flex items-center gap-1.5 text-xs text-text-2">
                <span className="font-semibold text-text">{last.author || "unknown"}</span>
                <OriginIcon origin={originOf(last.author, s.humanAllowlist)} size={13} />
                <span className="text-text-3">· {relTime(last.created_at)}</span>
              </span>
              <span className="truncate text-[13px] leading-[1.45] text-text-2">{last.text}</span>
            </div>
          </div>
        )}

        {!readOnly && (
          <div className="flex gap-2 pt-1">
            <button type="button" className={bigBtn} disabled={actions.archive.isPending}
              onClick={() => actions.archive.mutate(undefined, leave)}>
              <Svg size={18} stroke={2}><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v12h14V8M10 12h4" /></Svg>Archive
            </button>
            <button type="button" className={`${bigBtn} text-[var(--st-blocked)]`} disabled={actions.remove.isPending}
              onClick={() => { if (confirm(`Delete ${bead.id}? This calls bd delete.`)) actions.remove.mutate(undefined, leave); }}>
              <Svg size={18} stroke={2}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Svg>Delete
            </button>
          </div>
        )}
      </div>

      <CommentComposer
        actor={s.actor} disabled={readOnly} pending={actions.addComment.isPending}
        onSend={(text) => actions.addComment.mutateAsync(text)}
      />

      {dispatching && <DispatchSheet projectId={s.projectId} beadId={bead.id} onClose={() => setDispatching(false)} />}

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
