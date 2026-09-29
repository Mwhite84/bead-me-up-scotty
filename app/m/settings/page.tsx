import { Suspense } from "react";
import { SettingsScreen } from "../_components/SettingsScreen";

// useSearchParams (project selection) needs a Suspense boundary at build time.
export default function SettingsPage() {
  return <Suspense><SettingsScreen /></Suspense>;
}
