import { requireUser } from "@/lib/queries";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <main>
      <h1 className="mb-6 text-xl font-bold tracking-tight">Your profile</h1>
      <SettingsForm
        userId={user.id}
        name={user.name}
        unitPreference={user.unitPreference}
        color={user.color}
        avatarVersion={user.avatarVersion}
      />
    </main>
  );
}
