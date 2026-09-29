import Link from "next/link";
import { Svg } from "./Svg";

/**
 * Header project pill. Tapping sets `?picker=projects`; the Project picker
 * sheet (later bead) reads that param. `live` colors the dot (green = live).
 */
export function ProjectPill({ name, live = true }: { name: string; live?: boolean }) {
  return (
    <Link
      href="?picker=projects"
      scroll={false}
      className="inline-flex min-h-11 items-center"
      aria-label={`Project: ${name}. Change project`}
    >
      <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-surface py-2 pl-2.5 pr-3">
        <span
          className="inline-block size-2 shrink-0 rounded-full"
          style={{ background: live ? "var(--st-done)" : "var(--text-3)" }}
        />
        <span className="text-sm font-semibold text-text">{name}</span>
        <Svg size={16} color="var(--text-3)"><path d="M6 9l6 6 6-6" /></Svg>
      </span>
    </Link>
  );
}
