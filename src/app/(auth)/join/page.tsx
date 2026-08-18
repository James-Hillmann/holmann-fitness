import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { JoinForm } from "./join-form";

export default async function JoinPage() {
  const userId = await getSessionUserId();
  if (userId) redirect("/");
  return <JoinForm />;
}
