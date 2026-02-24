import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensureWorkspaceContext,
  getAuthenticatedServerClient,
  normalizeWorkspaceName,
  setActiveWorkspaceForUser,
} from "@/shared/server";

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const payload = createWorkspaceSchema.parse(await request.json());

    const { data, error } = await supabase
      .from("workspaces")
      .insert({
        user_id: user.id,
        name: normalizeWorkspaceName(payload.name),
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await setActiveWorkspaceForUser(supabase, user.id, (data as { id: string }).id);
    const context = await ensureWorkspaceContext(supabase, user.id);

    return NextResponse.json({ context });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create workspace." },
      { status: 500 },
    );
  }
}
