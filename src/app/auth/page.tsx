import { redirect } from "next/navigation";
import { AuthScreenContainer } from "@/features/auth";
import { getServerUser } from "@/shared/server";

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const user = await getServerUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <AuthScreenContainer />
    </main>
  );
}
