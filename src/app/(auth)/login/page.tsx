import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { getUsersForLogin } from "@/lib/queries";
import { LoginClient } from "./login-client";

export default async function LoginPage() {
  const userId = await getSessionUserId();
  if (userId) redirect("/");
  const members = await getUsersForLogin();
  return <LoginClient members={members} />;
}
