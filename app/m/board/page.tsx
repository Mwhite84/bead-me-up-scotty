import { Suspense } from "react";
import { BoardScreen } from "../_components/BoardScreen";

// useSearchParams (project selection) needs a Suspense boundary at build time.
export default function BoardPage() {
  return <Suspense><BoardScreen /></Suspense>;
}
