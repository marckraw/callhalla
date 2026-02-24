import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertWorkspaceOwnedByUser,
  ensureWorkspaceContext,
  getAuthenticatedServerClient,
  normalizeWorkspaceName,
} from "@/shared/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const renameWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const { supabase, user } = await getAuthenticatedServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid workspace id." }, { status: 400 });
  }

  try {
    const payload = renameWorkspaceSchema.parse(await request.json());

    await assertWorkspaceOwnedByUser(supabase, user.id, parsedParams.data.id);

    const { error } = await supabase
      .from("workspaces")
      .update({ name: normalizeWorkspaceName(payload.name) })
      .eq("id", parsedParams.data.id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const contextPayload = await ensureWorkspaceContext(supabase, user.id);
    return NextResponse.json({ context: contextPayload });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to rename workspace." },
      { status: 500 },
    );
  }
}
