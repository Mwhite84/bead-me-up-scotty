import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { AppearanceSync } from "./_components/useAppearance";
import { RegisterSW } from "./_components/RegisterSW";
import { Sheets } from "./_components/Sheets";
import { TabBar } from "./_components/TabBar";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Scotty", statusBarStyle: "default" },
};

// viewport-fit=cover lets the shell paint under the notch; the tab bar and
// headers pad with env(safe-area-inset-*).
export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  themeColor: "#6d5ef0",
};

/** Mobile shell: fixed-height column, content scrolls under a persistent tab bar. */
export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex h-dvh flex-col bg-background text-text">
      <RegisterSW />
      <AppearanceSync />
      <main
        className="min-h-0 flex-1 overflow-y-auto"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {children}
      </main>
      <TabBar />
      {/* useSearchParams needs a Suspense boundary at build time. */}
      <Suspense><Sheets /></Suspense>
    </div>
  );
}
