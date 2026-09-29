"use client";
import { useViewerMode } from "@/hooks/use-viewer-mode";
import { Svg } from "./Svg";

/** Amber viewer-mode banner; "Change" turns read-only off (same call as the desktop banner). */
export function ReadOnlyBanner() {
  const { change } = useViewerMode();
  return (
    <div
      role="status"
      className="mx-4 mb-2.5 flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl border px-3 text-[#b45309]"
      style={{ background: "rgba(217,119,6,.12)", borderColor: "rgba(217,119,6,.4)" }}
    >
      <Svg size={18} color="#b45309"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Svg>
      <span className="text-[13px] font-semibold">Read-only mode</span>
      <span className="text-xs opacity-80">watching, not editing</span>
      <span className="flex-1" />
      <button
        type="button" disabled={change.isPending} onClick={() => change.mutate(false)}
        className="min-h-11 px-1 text-xs font-semibold underline disabled:opacity-50"
      >
        Change
      </button>
    </div>
  );
}
