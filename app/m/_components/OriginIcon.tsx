import { Svg } from "./Svg";

/** Human (person outline) / agent (robot) glyph from the mockups' card and comment headers. */
export function OriginIcon({ origin, size = 14 }: { origin: "human" | "agent"; size?: number }) {
  return origin === "agent" ? (
    <Svg size={size} color="var(--brand)"><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 8V5" /><circle cx="12" cy="4" r="1.2" fill="currentColor" stroke="none" /><circle cx="9" cy="14" r="1.3" fill="currentColor" stroke="none" /><circle cx="15" cy="14" r="1.3" fill="currentColor" stroke="none" /></Svg>
  ) : (
    <Svg size={size} color="var(--text-3)"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></Svg>
  );
}
