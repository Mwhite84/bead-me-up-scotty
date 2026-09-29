"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";
import { toastError } from "@/components/error-toast";
import { beadsKey, useBeads } from "@/hooks/use-beads";
import { api } from "@/lib/api-client";
import type { BeadType, CreateInput } from "@/lib/schema";
import { BottomSheet } from "./BottomSheet";
import { Group, Row, SectionLabel, Segmented, Toggle } from "./FormParts";
import { ListPicker, type PickerOption } from "./ListPicker";
import { Svg } from "./Svg";
import { TypeIcon, typeLabel } from "./TypeIcon";
import { useMobileProject } from "./useMobileProject";

const TYPES: BeadType[] = ["task", "bug", "feature", "chore", "epic", "decision"];
const PRIORITIES = [
  { value: 0, label: "Critical", color: "var(--pri-critical)" },
  { value: 1, label: "High", color: "var(--pri-high)" },
  { value: 2, label: "Medium", color: "var(--pri-medium)" },
  { value: 3, label: "Low", color: "var(--text-2)" },
  { value: 4, label: "Backlog", color: "var(--text-2)" },
];
const field = "rounded-xl border border-border bg-surface-2 px-3.5 text-sm outline-none focus:border-brand";

type Picking = "assignee" | "labels" | "parent" | null;

/** New-bead bottom sheet. Submits through api.create, then refetches the project's bead list. */
export function CreateSheet({ onClose }: { onClose: () => void }) {
  const { projectId = "" } = useMobileProject();
  const qc = useQueryClient();
  const { data } = useBeads(projectId);
  const beads = React.useMemo(() => data?.beads ?? [], [data]);
  const actor = data?.meta.humanActor ?? "you";

  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<BeadType>("task");
  const [priority, setPriority] = React.useState(2);
  const [description, setDescription] = React.useState("");
  const [assignee, setAssignee] = React.useState("");
  const [labels, setLabels] = React.useState<string[]>([]);
  const [parent, setParent] = React.useState("");
  const [backlog, setBacklog] = React.useState(false);
  const [picking, setPicking] = React.useState<Picking>(null);

  const create = useMutation({
    mutationFn: (input: CreateInput) => api.create(projectId, input),
    onSuccess: (bead) => {
      toast.success(`Created ${bead.id}`);
      void qc.invalidateQueries({ queryKey: beadsKey(projectId) });
      onClose();
    },
    onError: toastError,
  });
  const canSubmit = !!projectId && title.trim().length > 0 && !create.isPending;
  const submit = () => canSubmit && create.mutate({
    title: title.trim(), issue_type: type, priority, description, assignee, labels, parent, backlog,
  });

  const assignees: PickerOption[] = [...new Set([data?.meta.humanActor, ...beads.map((b) => b.assignee)]
    .map((n) => n?.trim()).filter((n): n is string => !!n))].sort().map((n) => ({ value: n, label: n }));
  const allLabels: PickerOption[] = [...new Set([...labels, ...beads.flatMap((b) => b.labels ?? [])])].sort()
    .map((l) => ({ value: l, label: l }));
  const epics: PickerOption[] = beads.filter((b) => b.issue_type === "epic" && b.status !== "closed")
    .map((b) => ({ value: b.id, label: b.title, hint: b.id }));
  const parentTitle = epics.find((e) => e.value === parent)?.label ?? parent;

  return (
    <>
      <BottomSheet
        title="New bead" top={92} onClose={onClose}
        footer={
          <div className="flex shrink-0 items-center gap-2.5 px-5 pt-3" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>
            <span className="inline-flex items-center gap-1.5 text-xs text-text-3">
              <Svg size={14} color="var(--text-3)"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></Svg>
              as {actor}
            </span>
            <span className="flex-1" />
            <button
              type="button" disabled={!canSubmit} onClick={submit}
              className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[14px] bg-brand px-[18px] text-[15px] font-semibold text-white disabled:opacity-50"
            >
              <Svg size={18} stroke={2} color="#ffffff"><path d="M12 5v14M5 12h14" /></Svg>
              {create.isPending ? "Creating…" : "Create bead"}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-[18px]">
          <textarea
            autoFocus rows={2} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={500}
            aria-label="Title" placeholder="What needs doing?"
            className="min-h-[52px] w-full resize-none bg-transparent py-0.5 text-xl font-semibold leading-[1.3] text-text caret-brand outline-none placeholder:text-text-3"
          />
          <div className="flex flex-col gap-2">
            <SectionLabel>Type</SectionLabel>
            <div role="radiogroup" aria-label="Type" className="-mx-5 flex gap-2 overflow-x-auto px-5">
              {TYPES.map((t) => {
                const on = t === type;
                return (
                  <button
                    key={t} type="button" role="radio" aria-checked={on} onClick={() => setType(t)}
                    className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[13px] ${
                      on ? "border-text bg-text font-semibold text-background" : "border-border bg-surface-2 font-medium text-text-2"
                    }`}
                  >
                    <TypeIcon type={t} size={15} color="currentColor" />{typeLabel(t)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <SectionLabel>Priority</SectionLabel>
            <Segmented label="Priority" options={PRIORITIES} value={priority} onChange={setPriority} />
          </div>
          <div className="flex flex-col gap-2">
            <SectionLabel>Description</SectionLabel>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={3} aria-label="Description"
              placeholder="Optional · markdown ok" className={`${field} min-h-[72px] resize-none py-3`}
            />
          </div>
          <Group>
            <Row label="Assignee" value={assignee || "Unassigned"} onClick={() => setPicking("assignee")} />
            <Row label="Labels" value={labels.length ? labels.join(", ") : "Add"} onClick={() => setPicking("labels")} />
            <Row label="Parent epic" value={parent ? parentTitle : "None"} onClick={() => setPicking("parent")} />
          </Group>
          <Group>
            <Toggle label="Start in Backlog" sub="Creates as deferred instead of open" checked={backlog} onChange={setBacklog} />
          </Group>
        </div>
      </BottomSheet>
      {picking === "assignee" && (
        <ListPicker
          title="Assignee" options={assignees} selected={assignee ? [assignee] : []} allowCustom noneLabel="Unassigned"
          onChange={([v]) => setAssignee(v ?? "")} onClose={() => setPicking(null)}
        />
      )}
      {picking === "labels" && (
        <ListPicker
          title="Labels" options={allLabels} selected={labels} multi allowCustom
          onChange={setLabels} onClose={() => setPicking(null)}
        />
      )}
      {picking === "parent" && (
        <ListPicker
          title="Parent epic" options={epics} selected={parent ? [parent] : []} noneLabel="None"
          onChange={([v]) => setParent(v ?? "")} onClose={() => setPicking(null)}
        />
      )}
    </>
  );
}
