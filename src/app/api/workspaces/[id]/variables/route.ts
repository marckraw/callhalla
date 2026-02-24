import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertWorkspaceOwnedByUser,
  ensureWorkspaceContext,
  getAuthenticatedServerClient,
} from "@/shared/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const createVariableSchema = z.object({
  key: z.string().trim().regex(/^[a-z][a-z0-9_]*$/),
  description: z.string().trim().max(200),
  isSecret: z.boolean(),
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
    const payload = createVariableSchema.parse(await request.json());
    const workspaceId = parsedParams.data.id;

    await assertWorkspaceOwnedByUser(supabase, user.id, workspaceId);

    const { error } = await supabase.from("workspace_variable_definitions").insert({
      workspace_id: workspaceId,
      key: payload.key,
      description: payload.description,
      is_secret: payload.isSecret,
    });

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
      { error: error instanceof Error ? error.message : "Unable to create variable." },
      { status: 500 },
    );
  }
}
