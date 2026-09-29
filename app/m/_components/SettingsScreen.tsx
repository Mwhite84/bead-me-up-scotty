"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";
import { toastError } from "@/components/error-toast";
import { useUsageStatistics } from "@/components/usage-statistics";
import { useBoardPrefs } from "@/hooks/use-board-prefs";
import { useDefaultFocus } from "@/hooks/use-default-view";
import { useUpdateCheck } from "@/hooks/use-update-check";
import { useViewerMode } from "@/hooks/use-viewer-mode";
import { api, type DoctorResponse } from "@/lib/api-client";
import { APP_VERSION } from "@/lib/build-info";
import { THEMES } from "@/lib/themes";
import { BottomSheet } from "./BottomSheet";
import { Group, Row, SectionLabel, Segmented, Toggle } from "./FormParts";
import { ListPicker } from "./ListPicker";
import { useAppearance, type Appearance } from "./useAppearance";
import { useMobileProject } from "./useMobileProject";

// The config API accepts 1s-300s, so the fifth segment is 5m rather than "Off".
const POLL = [
  { value: 5000, label: "5s" }, { value: 15000, label: "15s" }, { value: 30000, label: "30s" },
  { value: 60000, label: "60s" }, { value: 300000, label: "5m" },
];
const APPEARANCE: { value: Appearance; label: string }[] = [
  { value: "system", label: "System" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" },
];
const CHANNELS = [
  { value: "stable", label: "Stable releases" }, { value: "development", label: "Development" },
];

const pollLabel = (ms: number) => (ms > 60000 ? `${ms / 60000}m` : `${ms / 1000}s`);
const shortPath = (p: string) => (p.split("/").filter(Boolean).length > 2 ? `…/${p.split("/").filter(Boolean).slice(-2).join("/")}` : p);

type Editing = "actor" | "allowlist" | null;
type Picking = "theme" | "channel" | null;

function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <>
      <div className="flex min-h-8 items-center px-1 pb-0.5 pt-1.5"><SectionLabel>{title}</SectionLabel></div>
      {children}
      {note && <p className="-mt-1 px-1.5 text-xs leading-normal text-text-3">{note}</p>}
    </>
  );
}

export function SettingsScreen() {
  const { projectId = "" } = useMobileProject();
  const qc = useQueryClient();
  const doctor = useQuery({ queryKey: ["doctor", projectId], queryFn: () => api.doctor(projectId), enabled: !!projectId });
  const viewer = useViewerMode();
  const defaultFocus = useDefaultFocus();
  const { prefs, setPrefs } = useBoardPrefs();
  const update = useUpdateCheck();
  const stats = useUsageStatistics();
  const { appearance, theme, setAppearance, setNamedTheme } = useAppearance();
  const [editing, setEditing] = React.useState<Editing>(null);
  const [picking, setPicking] = React.useState<Picking>(null);

  const config = doctor.data?.config;
  const save = useMutation({
    mutationFn: (patch: Record<string, unknown>) => api.saveConfig(patch),
    onSuccess: (next) => {
      qc.setQueryData<DoctorResponse>(["doctor", projectId], (d) => d && { ...d, config: next });
      // Meta (humanActor, allowlist, pollIntervalMs) rides on the bead list.
      void qc.invalidateQueries({ queryKey: ["beads"] });
      void qc.invalidateQueries({ queryKey: ["doctor"] });
    },
    onError: toastError,
  });

  const d = doctor.data;
  const bd = !d ? "…" : d.kind === "demo" ? "demo · in-memory" : d.ok ? `${d.version ?? "bd"} · doctor ok` : d.message;
  const readOnly = viewer.data?.readOnly ?? false;
  const updateNote = update.data
    ? update.data.updateAvailable ? `Update available: ${update.data.latestVersion ?? "new version"}` : `Up to date · ${update.data.currentVersion}`
    : undefined;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex shrink-0 flex-col gap-0.5 pb-2.5 pl-5 pr-4">
        <div className="min-h-11" />
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.02em]">Settings</h1>
          <span className="text-[13px] text-text-3">v{APP_VERSION}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 px-4 pb-8">
        <Section title="Project">
          <Group>
            <Row label="Repo path" value={d ? (d.kind === "demo" ? "built-in sample data" : shortPath(d.repoPath)) : "…"} />
            <Row label="bd binary" value={bd} valueColor={d ? (d.kind === "demo" || d.ok ? "var(--st-done)" : "var(--st-blocked)") : undefined} />
          </Group>
        </Section>

        <Section title="Attribution" note="Anyone on the allowlist renders as human, everyone else as agent.">
          <Group>
            <Row label="Human actor" value={config?.humanActor ?? "…"} onClick={config ? () => setEditing("actor") : undefined} />
            <Row label="Human allowlist" value={config?.humanAllowlist.join(", ") ?? "…"} onClick={config ? () => setEditing("allowlist") : undefined} />
          </Group>
        </Section>

        <Section title="Freshness">
          <Group>
            <div className="flex flex-col gap-2.5 px-3.5 py-3">
              <div className="flex items-center">
                <span className="text-[15px] text-text">Poll interval</span>
                <span className="flex-1" />
                <span className="font-mono text-[13px] text-text-2">{config ? pollLabel(config.pollIntervalMs) : "…"}</span>
              </div>
              <Segmented
                label="Poll interval" options={POLL} value={config?.pollIntervalMs ?? null} disabled={!config || save.isPending}
                onChange={(pollIntervalMs) => save.mutate({ pollIntervalMs })}
              />
            </div>
          </Group>
        </Section>

        <Section title="Appearance">
          <Group>
            <div className="px-3.5 py-3">
              <Segmented label="Appearance" options={APPEARANCE} value={appearance} onChange={setAppearance} />
            </div>
            <Row label="Named theme" value={theme.name} onClick={() => setPicking("theme")} />
          </Group>
        </Section>

        <Section title="Views">
          <Group>
            <Toggle
              label="Use Focus as default view" checked={defaultFocus.enabled}
              onChange={(on) => {
                try { defaultFocus.save(on); }
                catch { toast.error("Could not save the default view. Browser storage may be unavailable."); }
              }}
            />
            <Toggle
              label="Read-only mode" sub="Survives reload" checked={readOnly}
              disabled={!viewer.data || viewer.change.isPending} onChange={(on) => viewer.change.mutate(on)}
            />
          </Group>
        </Section>

        <Section title="Software updates">
          <Group>
            <Row
              label="Channel" sub={updateNote} onClick={() => setPicking("channel")}
              value={CHANNELS.find((c) => c.value === prefs.updateChannel)?.label}
            />
            <Toggle
              label="Share basic usage statistics" checked={stats.query.data?.enabled ?? false}
              disabled={!stats.query.data || stats.save.isPending} onChange={(on) => stats.save.mutate(on)}
            />
          </Group>
        </Section>
      </div>

      {editing && config && (
        <TextEditSheet
          key={editing}
          title={editing === "actor" ? "Human actor" : "Human allowlist"}
          hint={editing === "actor" ? "Stamped on beads you create here." : "Comma-separated names that count as human."}
          initial={editing === "actor" ? config.humanActor : config.humanAllowlist.join(", ")}
          pending={save.isPending}
          onClose={() => setEditing(null)}
          onSave={(text) => {
            const value = text.trim();
            if (editing === "actor") {
              if (!value) return toast.error("Human actor can't be empty");
              save.mutate({ humanActor: value }, { onSuccess: () => setEditing(null) });
            } else {
              const humanAllowlist = [...new Set(value.split(",").map((s) => s.trim()).filter(Boolean))];
              save.mutate({ humanAllowlist }, { onSuccess: () => setEditing(null) });
            }
          }}
        />
      )}
      {picking === "theme" && (
        <ListPicker
          title="Named theme" selected={[theme.id]} onClose={() => setPicking(null)}
          options={THEMES.map((t) => ({ value: t.id, label: t.name, hint: t.mode }))}
          onChange={([id]) => id && setNamedTheme(id)}
        />
      )}
      {picking === "channel" && (
        <ListPicker
          title="Update channel" options={CHANNELS} selected={[prefs.updateChannel]} onClose={() => setPicking(null)}
          onChange={([c]) => c && setPrefs({ ...prefs, updateChannel: c === "development" ? "development" : "stable" })}
        />
      )}
    </div>
  );
}

function TextEditSheet({
  title, hint, initial, pending, onSave, onClose,
}: { title: string; hint: string; initial: string; pending: boolean; onSave: (text: string) => void; onClose: () => void }) {
  const [text, setText] = React.useState(initial);
  return (
    <BottomSheet
      title={title} top={280} onClose={onClose}
      footer={
        <div className="flex shrink-0 justify-end px-5 pt-3" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>
          <button
            type="button" disabled={pending} onClick={() => onSave(text)}
            className="inline-flex min-h-[50px] items-center rounded-[14px] bg-brand px-[18px] text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        <input
          autoFocus value={text} onChange={(e) => setText(e.target.value)} aria-label={title} spellCheck={false} autoCapitalize="off"
          onKeyDown={(e) => { if (e.key === "Enter") onSave(text); }}
          className="h-12 rounded-xl border border-border bg-surface-2 px-3.5 text-[15px] outline-none focus:border-brand"
        />
        <p className="px-1 text-xs text-text-3">{hint}</p>
      </div>
    </BottomSheet>
  );
}
