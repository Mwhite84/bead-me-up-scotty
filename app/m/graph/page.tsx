import { Suspense } from "react";
import { GraphHome } from "../_components/GraphHome";

// useSearchParams (project selection) needs a Suspense boundary at build time.
export default function GraphPage() {
  return <Suspense><GraphHome /></Suspense>;
}
