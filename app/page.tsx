import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const authenticated = await getSession();
  if (authenticated) {
    redirect("/dashboard/overview");
  }
  redirect("/login");
}
