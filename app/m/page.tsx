import { redirect } from "next/navigation";

// /m is the PWA start_url; Focus is the tab-bar home ("checking on agents").
export default function MobileHome() {
  redirect("/m/focus");
}
