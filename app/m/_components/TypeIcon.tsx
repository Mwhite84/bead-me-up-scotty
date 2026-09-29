import { Svg } from "./Svg";

const LABELS: Record<string, string> = {
  task: "Task", bug: "Bug", feature: "Feature", chore: "Chore", epic: "Epic", decision: "Decision",
};

/** Paths copied from the mockups' type-chip markup. Unknown types render as Task. */
export function TypeIcon({ type, size = 14, color }: { type: string; size?: number; color?: string }) {
  const c = color ?? (type === "bug" ? "var(--st-blocked)" : "currentColor");
  switch (type) {
    case "bug":
      return (<Svg size={size} color={c}><rect x="7" y="8" width="10" height="12" rx="5" /><path d="M9 5l1.5 3M15 5l-1.5 3M3 13h4M17 13h4M4 19l3.5-2M20 19l-3.5-2M12 8v12" /></Svg>);
    case "feature":
      return (<Svg size={size} color={c}><path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" /></Svg>);
    case "chore":
      return (<Svg size={size} color={c}><path d="M14.5 6.5a4 4 0 0 0 5 5L9 22l-3-3z" /><path d="M3 3l6 6" /></Svg>);
    case "epic":
      return (<Svg size={size} color={c}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></Svg>);
    case "decision":
      return (<Svg size={size} color={c}><path d="M12 3v18M6 7l6-2 6 2M3 14l3-7 3 7a3 3 0 0 1-6 0M15 14l3-7 3 7a3 3 0 0 1-6 0" /></Svg>);
    default:
      return (<Svg size={size} color={c}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 12l3 3 5-6" /></Svg>);
  }
}

export function typeLabel(type: string): string {
  return LABELS[type] ?? "Task";
}
