"use client";
import { DndContext, PointerSensor, useDndMonitor, useDraggable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useRef, type ReactNode } from "react";
import { STATUS, type StatusKey } from "./StatusChip";
import { Svg } from "./Svg";

type Action = { label: string; status: string; color: string; icon: ReactNode };
const START: Action = { label: "Start", status: "in_progress", color: STATUS.in_progress.color, icon: <path d="M8 5l11 7-11 7z" fill="currentColor" stroke="none" /> };
const DONE: Action = { label: "Done", status: "closed", color: STATUS.done.color, icon: <path d="M5 12l5 5 9-10" /> };
const BACKLOG: Action = { label: "Backlog", status: "deferred", color: STATUS.backlog.color, icon: <path d="M21 13A8 8 0 1 1 11 3a6.5 6.5 0 0 0 10 10z" /> };

type Actions = { right?: Action; left?: Action };
// right = swipe the card rightward (zone revealed on its left), left = the reverse.
// Statuses match the desktop board's drop targets (lib/board-columns.ts).
const ACTIONS: Record<StatusKey, Actions> = {
  backlog: { right: START },
  ready: { right: START, left: BACKLOG },
  in_progress: { right: DONE, left: BACKLOG },
  blocked: { right: START, left: BACKLOG },
  done: {},
};

const REVEAL = 112; // width of the colored zone behind the card
const COMMIT = 96;  // drag distance past which release commits (the mockup's resting offset)

const open = (fn: () => void) => (e: React.KeyboardEvent) => { if (e.key === "Enter") fn(); };

function Draggable({ id, actions, onOpen, children }: { id: string; actions: Actions; onOpen: () => void; children: ReactNode }) {
  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({ id });
  // A drag ends in a click on the same element; swallow it so a swipe never opens the bead.
  const lastDrag = useRef(0); // Infinity while dragging, else the end timestamp
  const end = () => { lastDrag.current = performance.now(); };
  useDndMonitor({ onDragStart: () => { lastDrag.current = Infinity; }, onDragEnd: end, onDragCancel: end });
  const raw = transform?.x ?? 0;
  const action = raw > 0 ? actions.right : actions.left;
  // No action in that direction: the card doesn't move.
  const x = action ? Math.max(-REVEAL, Math.min(REVEAL, raw)) : 0;
  return (
    <div className="relative">
      {action && x !== 0 && (
        <div
          className={`absolute inset-y-0 flex w-28 flex-col items-center justify-center gap-1 rounded-[14px] text-white ${x > 0 ? "left-0 pr-4" : "right-0 pl-4"}`}
          style={{ background: action.color }}
        >
          <Svg size={22} stroke={2} color="#fff">{action.icon}</Svg>
          <span className="text-xs font-bold">{action.label}</span>
        </div>
      )}
      <div
        ref={setNodeRef} {...listeners} {...attributes}
        role="link" onClick={() => { if (performance.now() - lastDrag.current > 100) onOpen(); }} onKeyDown={open(onOpen)}
        className="relative touch-pan-y rounded-[14px] outline-none"
        style={{
          transform: `translateX(${x}px)`,
          transition: isDragging ? "none" : "transform .2s ease",
          boxShadow: x !== 0 ? "0 12px 32px -8px rgba(20,20,40,.18), 0 4px 12px -4px rgba(20,20,40,.1)" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Swipe-to-change-status wrapper. Releasing past COMMIT calls `onCommit(id, status)`;
 * `disabled` (read-only mode) renders the card with no gesture at all.
 */
export function SwipeCard({
  id, lane, disabled, onCommit, onOpen, children,
}: {
  id: string; lane: StatusKey; disabled?: boolean;
  onCommit: (id: string, status: string) => void; onOpen: () => void; children: ReactNode;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const actions = ACTIONS[lane];
  if (disabled || (!actions.right && !actions.left)) {
    return <div role="link" tabIndex={0} onClick={onOpen} onKeyDown={open(onOpen)}>{children}</div>;
  }
  function onDragEnd({ delta }: DragEndEvent) {
    const a = delta.x >= COMMIT ? actions.right : delta.x <= -COMMIT ? actions.left : undefined;
    if (a) onCommit(id, a.status);
  }
  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <Draggable id={id} actions={actions} onOpen={onOpen}>{children}</Draggable>
    </DndContext>
  );
}
