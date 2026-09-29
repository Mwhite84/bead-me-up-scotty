import { beadSchema } from "@/lib/schema";
import { Avatar } from "./_components/Avatar";
import { Card } from "./_components/Card";
import { ProjectPill } from "./_components/ProjectPill";
import { StatusChip, type StatusKey } from "./_components/StatusChip";
import { TypeIcon } from "./_components/TypeIcon";

// Smoke page: exercises every shell primitive against the real Bead type. The
// Board bead replaces this with real content; until then /m is the PWA start_url.
const SAMPLE = [
  { id: "bd-9f2a.5", title: "Serialize writes through a mutex queue", status: "open", priority: 1, issue_type: "task", assignee: "stevey", dependency_count: 1 },
  { id: "bd-8d3e", title: "Bug: ready queue shows deferred beads", status: "in_progress", priority: 0, issue_type: "bug", assignee: "stevey", dependency_count: 1, comment_count: 1 },
  { id: "bd-9f2a.4", title: "bd doctor / version preflight", status: "blocked", priority: 2, issue_type: "chore", assignee: "amp-bot" },
  { id: "bd-3c71.3", title: "Origin badge (human vs agent)", status: "deferred", priority: 3, issue_type: "feature", assignee: "dana" },
  { id: "bd-1a00", title: "Unassigned decision", status: "closed", priority: 4, issue_type: "decision" },
].map((b) => beadSchema.parse(b));

const STATUSES: StatusKey[] = ["backlog", "ready", "in_progress", "blocked", "done"];

export default function MobileHome() {
  return (
    <div className="flex flex-col gap-3 px-4 pb-6 pt-2">
      <ProjectPill name="Demo" />
      <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.02em]">Scotty Mobile</h1>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {STATUSES.map((s, i) => <StatusChip key={s} status={s} count={i + 1} active={s === "ready"} />)}
      </div>
      <div className="flex items-center gap-3 text-text-2">
        {["task", "bug", "feature", "chore", "epic", "decision"].map((t) => <TypeIcon key={t} type={t} size={20} />)}
        <Avatar name="stevey" size={30} />
        <Avatar size={30} />
      </div>
      {SAMPLE.map((b, i) => (
        <Card key={b.id} bead={b} epic={i === 0 ? "Adapter & schema" : undefined} origin={i === 2 ? "agent" : undefined} />
      ))}
    </div>
  );
}
