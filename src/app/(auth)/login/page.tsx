import { redirect } from "next/navigation";
import { getCurrentUser, getUsersForLogin } from "@/lib/queries";
import { LoginClient } from "./login-client";

export default async function LoginPage() {
  // Checks the user still exists (not just that the token parses) so a stale
  // cookie for a deleted account can't redirect-loop against requireUser.
  const user = await getCurrentUser();
  if (user) redirect("/");
  const members = await getUsersForLogin();
  return <LoginClient members={members} />;
}
