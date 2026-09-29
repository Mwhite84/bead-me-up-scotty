"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Svg } from "./Svg";

const TABS = [
  {
    href: "/m/focus", label: "Focus", stroke: 1.75,
    icon: (<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></>),
  },
  {
    href: "/m/board", label: "Board", stroke: 2,
    icon: (<><rect x="3" y="4" width="5" height="16" rx="1.2" /><rect x="9.5" y="4" width="5" height="10" rx="1.2" /><rect x="16" y="4" width="5" height="13" rx="1.2" /></>),
  },
  { href: "", label: "New", stroke: 0, icon: null },
  {
    href: "/m/graph", label: "Graph", stroke: 1.75,
    icon: (<><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" /><path d="M7.5 8.2l3.2 7.3M16.5 8.2l-3.2 7.3" /></>),
  },
  {
    href: "/m/settings", label: "Settings", stroke: 1.75,
    icon: (<><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h9M17 18h3" /><circle cx="15" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="15" cy="18" r="2" /></>),
  },
];

export function TabBar() {
  const path = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="relative flex shrink-0 items-center border-t border-border bg-surface px-2 pt-1.5"
      style={{ paddingBottom: "calc(34px + env(safe-area-inset-bottom))" }}
    >
      {TABS.map((t) => {
        if (t.icon === null) {
          // Raised center action. The Create sheet lands in a later bead and
          // reads ?sheet=create; the tap target is wired now.
          return (
            <span key="new" className="flex flex-1 items-start justify-center">
              <Link
                href="?sheet=create"
                scroll={false}
                aria-label="New bead"
                className="-mt-[22px] inline-flex size-14 items-center justify-center rounded-full bg-brand shadow-[0_8px_20px_-6px_rgba(109,94,240,0.55)]"
              >
                <Svg size={26} stroke={2.25} color="#ffffff"><path d="M12 5v14M5 12h14" /></Svg>
              </Link>
            </span>
          );
        }
        const active = path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[50px] min-w-11 flex-1 flex-col items-center justify-center gap-1 ${
              active ? "text-brand" : "text-text-3"
            }`}
          >
            <Svg size={24} stroke={t.stroke}>{t.icon}</Svg>
            <span className={`text-[11px] ${active ? "font-semibold" : "font-medium"}`}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
