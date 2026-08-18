import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getCurrentUser } from "@/lib/queries";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-24 sm:pt-20 sm:pb-8">
        {children}
      </div>
    </div>
  );
}
