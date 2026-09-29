import { Suspense } from "react";
import { FocusScreen } from "../_components/FocusScreen";

// useSearchParams (project selection) needs a Suspense boundary at build time.
export default function FocusPage() {
  return <Suspense><FocusScreen /></Suspense>;
}
