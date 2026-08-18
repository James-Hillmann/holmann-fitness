import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries";
import { JoinForm } from "./join-form";

export default async function JoinPage() {
  // Same existence check as the login page: a stale cookie for a deleted
  // account must not bounce people away from joining.
  const user = await getCurrentUser();
  if (user) redirect("/");
  return <JoinForm />;
}
