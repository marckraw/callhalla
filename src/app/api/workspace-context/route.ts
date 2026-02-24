import { NextResponse } from "next/server";
import { ensureWorkspaceContext, getAuthenticatedServerClient } from "@/shared/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, user } = await getAuthenticatedServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const context = await ensureWorkspaceContext(supabase, user.id);
    return NextResponse.json({ context });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load workspace context.",
      },
      { status: 500 },
    );
  }
}
