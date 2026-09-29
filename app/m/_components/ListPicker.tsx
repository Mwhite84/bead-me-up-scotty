"use client";
import * as React from "react";
import { Svg } from "./Svg";

export interface PickerOption { value: string; label: string; hint?: string }

/**
 * Full-screen filtered list: single-select (tap closes) or multi-select (tap
 * toggles, Done closes). `allowCustom` offers the typed text as a new value.
 * Deliberately plain: a search box and rows, no grouping.
 */
export function ListPicker({
  title, options, selected, multi = false, allowCustom = false, noneLabel, onChange, onClose,
}: {
  title: string; options: PickerOption[]; selected: string[]; multi?: boolean; allowCustom?: boolean;
  noneLabel?: string; onChange: (selected: string[]) => void; onClose: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const q = query.trim();
  const needle = q.toLowerCase();
  const shown = options.filter((o) => !needle || o.label.toLowerCase().includes(needle) || o.value.toLowerCase().includes(needle));
  const custom = allowCustom && q && !options.some((o) => o.value === q) ? q : null;

  const pick = (value: string) => {
    if (multi) onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
    else { onChange([value]); onClose(); }
  };
  const row = "flex min-h-[50px] w-full items-center gap-2.5 border-b border-border px-4 text-left text-[15px]";
  return (
    <div role="dialog" aria-label={title} className="fixed inset-0 z-[60] flex flex-col bg-background" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="flex min-h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <span className="text-[15px] font-semibold">{title}</span>
        <span className="flex-1" />
        <button type="button" onClick={onClose} className="min-h-11 px-2 text-[15px] font-medium text-brand">{multi ? "Done" : "Cancel"}</button>
      </div>
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3">
        <Svg size={18} color="var(--text-3)"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>
        <input
          type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={allowCustom ? "Search or type a new one" : "Search"}
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-surface pb-8">
        {noneLabel && !needle && (
          <button type="button" className={row} onClick={() => { onChange([]); onClose(); }}>
            <span className="flex-1 text-text-2">{noneLabel}</span>
            {selected.length === 0 && <Check />}
          </button>
        )}
        {custom && (
          <button type="button" className={row} onClick={() => pick(custom)}>
            <span className="flex-1 text-brand">Add “{custom}”</span>
          </button>
        )}
        {shown.map((o) => (
          <button key={o.value} type="button" className={row} onClick={() => pick(o.value)}>
            <span className="min-w-0 flex-1 truncate">{o.label}</span>
            {o.hint && <span className="shrink-0 font-mono text-[11px] text-text-3">{o.hint}</span>}
            {selected.includes(o.value) && <Check />}
          </button>
        ))}
        {shown.length === 0 && !custom && <p className="py-10 text-center text-sm text-text-3">Nothing matches.</p>}
      </div>
    </div>
  );
}

function Check() {
  return <Svg size={20} stroke={2.25} color="var(--brand)"><path d="M5 12l5 5 9-10" /></Svg>;
}
