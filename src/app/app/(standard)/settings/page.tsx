import { redirect } from "next/navigation";

/** Settings hub redirects to the high-conversion billing page. */
export default function SettingsPage() {
  redirect("/app/settings/billing");
}
