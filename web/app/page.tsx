import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to calendar (will be caught by middleware if not authenticated)
  redirect("/calendar");
}
