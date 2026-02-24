import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertWorkspaceOwnedByUser,
  ensureWorkspaceContext,
  getAuthenticatedServerClient,
  normalizeEnvironmentName,
  setActiveEnvironmentForUser,
} from "@/shared/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const createEnvironmentSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export async function POST(
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
    const payload = createEnvironmentSchema.parse(await request.json());
    const workspaceId = parsedParams.data.id;

    await assertWorkspaceOwnedByUser(supabase, user.id, workspaceId);

    const { data, error } = await supabase
      .from("environments")
      .insert({
        workspace_id: workspaceId,
        name: normalizeEnvironmentName(payload.name),
        is_default: false,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await setActiveEnvironmentForUser(
      supabase,
      user.id,
      workspaceId,
      (data as { id: string }).id,
    );

    const contextPayload = await ensureWorkspaceContext(supabase, user.id);
    return NextResponse.json({ context: contextPayload });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create environment." },
      { status: 500 },
    );
  }
}
