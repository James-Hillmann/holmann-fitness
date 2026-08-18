import { todayInputValue } from "@/lib/format";
import { getMyStepsForDay, requireUser } from "@/lib/queries";
import { LogForm } from "./log-form";
import { StepsForm } from "./steps-form";

export default async function LogPage() {
  const user = await requireUser();
  const today = todayInputValue();
  const todaySteps = await getMyStepsForDay(user.id, today);

  return (
    <main>
      <h1 className="mb-6 text-xl font-bold tracking-tight">Log a workout</h1>
      <LogForm today={today} />
      <StepsForm today={today} initialCount={todaySteps} />
    </main>
  );
}
