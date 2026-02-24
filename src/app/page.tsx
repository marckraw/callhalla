import { redirect } from "next/navigation";
import { getServerUser } from "@/shared/server";
import { RequestConsole } from "@/widgets/request-console";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth");
  }

  return <RequestConsole userEmail={user.email ?? user.id} />;
}
