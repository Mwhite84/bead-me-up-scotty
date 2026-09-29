import { BLOCKING_DEP_TYPES, type Bead } from "./schema";

/**
 * A ladder connector, read top-to-bottom: "the bead above <label> the bead
 * below". Both directions share one vocabulary, so the same edge reads the
 * same way whether you are looking up at a blocker or down at a dependent.
 */
export type LadderEdge = {
  type: string;
  label: string;
  /** Solid colored line (the blocks family) vs dashed gray (every other DepType). */
  blocking: boolean;
  /** The upper (blocking) side is closed, so the edge no longer holds anything up. */
  resolved: boolean;
};

export type LadderRung = { key: string; id: string; bead?: Bead; edge: LadderEdge };

/**
 * Relation names from the UPPER bead's point of view. Types absent here
 * (related, relates-to, duplicates, supersedes, caused-by, validates, tracks,
 * discovered-from) render under their own DepType string, so the whole union
 * is covered without enumerating it twice — a new bd dep type gets a sane
 * dashed-gray "<type>" connector on day one instead of an empty label.
 */
const LABEL: Record<string, string> = {
  blocks: "blocks",
  "conditional-blocks": "conditionally blocks",
  "waits-for": "awaited by",
};

/**
 * parent-child is excluded from the ladder entirely — it is hierarchy, not a
 * dependency, and the screen shows it as the parent-epic footer row instead.
 */
const isBlocking = (type: string) =>
  type !== "parent-child" && (BLOCKING_DEP_TYPES as readonly string[]).includes(type);

/**
 * Split the focused bead's relations into the rungs above it (things it points
 * at — its own dependencies) and below it (beads that point at it). Direction,
 * not blocking-ness, decides the section: that is the only rule that gives
 * every DepType a home, including the non-blocking ones the mockup omits.
 */
export function dependencyLadder(
  focus: Bead,
  beads: readonly Bead[],
): { upstream: LadderRung[]; downstream: LadderRung[] } {
  const index = new Map(beads.map((b) => [b.id, b]));
  const closed = (b?: Bead) => b?.status === "closed";

  const rung = (id: string, type: string, upperClosed: boolean): LadderRung => {
    const blocking = isBlocking(type);
    const resolved = blocking && upperClosed;
    return {
      key: `${id}:${type}`,
      id,
      bead: index.get(id),
      edge: { type, label: (LABEL[type] ?? type) + (resolved ? " · closed" : ""), blocking, resolved },
    };
  };

  const upstream = (focus.dependencies ?? [])
    .filter((d) => d.type !== "parent-child")
    .map((d) => rung(d.depends_on_id, d.type, closed(index.get(d.depends_on_id))));

  // On every downstream edge the focused bead IS the upper side, so its own
  // status is what resolves the connector.
  const downstream = beads.flatMap((other) =>
    (other.dependencies ?? [])
      .filter((d) => d.depends_on_id === focus.id && d.type !== "parent-child")
      .map((d) => rung(other.id, d.type, closed(focus))),
  );

  return { upstream: order(upstream), downstream: order(downstream) };
}

/** Live edges first — a closed blocker is history, not something to act on. */
const order = (rungs: LadderRung[]) =>
  rungs.sort(
    (a, b) =>
      Number(a.edge.resolved) - Number(b.edge.resolved) ||
      a.id.localeCompare(b.id, "en", { numeric: true }),
  );
