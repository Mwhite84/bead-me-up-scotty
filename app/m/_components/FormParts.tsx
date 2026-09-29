"use client";
import * as React from "react";
import type { ReactNode } from "react";
import { Svg } from "./Svg";

/** Grouped card of rows, hairline-divided (Settings, Create sheet). */
export function Group({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-border overflow-hidden rounded-[14px] border border-border bg-surface">{children}</div>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3">{children}</span>;
}

/** Label + value row; a button (with chevron) when `onClick` is given. */
export function Row({
  label, value, valueColor, sub, onClick,
}: { label: string; value?: string; valueColor?: string; sub?: string; onClick?: () => void }) {
  const body = (
    <>
      <span className="flex min-w-0 flex-col gap-0.5 text-left">
        <span className="text-[15px] text-text">{label}</span>
        {sub && <span className="text-xs text-text-3">{sub}</span>}
      </span>
      <span className="flex-1" />
      {value !== undefined && (
        <span className="min-w-0 max-w-[60%] truncate text-sm text-text-2" style={valueColor ? { color: valueColor } : undefined}>{value}</span>
      )}
      {onClick && <Svg size={18} color="var(--text-3)"><path d="M9 6l6 6-6 6" /></Svg>}
    </>
  );
  const cls = `flex min-h-[50px] w-full items-center gap-2.5 py-1.5 pl-3.5 ${onClick ? "pr-1" : "pr-3.5"}`;
  return onClick
    ? <button type="button" onClick={onClick} className={cls}>{body}</button>
    : <div className={cls}>{body}</div>;
}

export function Toggle({
  label, sub, checked, onChange, disabled,
}: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const id = React.useId();
  return (
    <div className="flex min-h-[50px] items-center gap-2.5 px-3.5 py-1.5">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span id={id} className="text-[15px] text-text">{label}</span>
        {sub && <span className="text-xs text-text-3">{sub}</span>}
      </span>
      <span className="flex-1" />
      <button
        type="button" role="switch" aria-checked={checked} aria-labelledby={id} disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-brand" : "bg-border-strong"}`}
      >
        <span className={`absolute top-[3px] size-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.5)] transition-all ${checked ? "left-[23px]" : "left-[3px]"}`} />
      </button>
    </div>
  );
}

/** Segmented control; the selected segment is raised, tinted with its optional `color`. */
export function Segmented<T extends string | number>({
  label, options, value, onChange, disabled,
}: {
  label: string; options: { value: T; label: string; color?: string }[]; value: T | null;
  onChange: (v: T) => void; disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-0.5 rounded-xl border border-border bg-surface-2 p-[3px]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value} type="button" role="radio" aria-checked={on} disabled={disabled} onClick={() => onChange(o.value)}
            className={`inline-flex h-9 flex-1 items-center justify-center rounded-[9px] text-xs disabled:opacity-60 ${
              on ? "border border-border bg-surface font-semibold shadow-[var(--shadow)]" : "font-medium text-text-3"
            }`}
            style={on ? { color: o.color ?? "var(--text)" } : undefined}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
