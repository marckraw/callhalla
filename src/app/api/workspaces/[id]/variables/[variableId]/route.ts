import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertWorkspaceOwnedByUser,
  ensureWorkspaceContext,
  getAuthenticatedServerClient,
} from "@/shared/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
  variableId: z.string().uuid(),
});

const updateVariableSchema = z.object({
  key: z.string().trim().regex(/^[a-z][a-z0-9_]*$/).optional(),
  description: z.string().trim().max(200).optional(),
  isSecret: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string; variableId: string }>;
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
    return NextResponse.json({ error: "Invalid workspace or variable id." }, { status: 400 });
  }

  try {
    const payload = updateVariableSchema.parse(await request.json());

    await assertWorkspaceOwnedByUser(supabase, user.id, parsedParams.data.id);

    const patch: {
      key?: string;
      description?: string;
      is_secret?: boolean;
    } = {};

    if (payload.key !== undefined) {
      patch.key = payload.key;
    }

    if (payload.description !== undefined) {
      patch.description = payload.description;
    }

    if (payload.isSecret !== undefined) {
      patch.is_secret = payload.isSecret;
    }

    const { error } = await supabase
      .from("workspace_variable_definitions")
      .update(patch)
      .eq("id", parsedParams.data.variableId)
      .eq("workspace_id", parsedParams.data.id);

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
      { error: error instanceof Error ? error.message : "Unable to update variable." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{ id: string; variableId: string }>;
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
    return NextResponse.json({ error: "Invalid workspace or variable id." }, { status: 400 });
  }

  try {
    await assertWorkspaceOwnedByUser(supabase, user.id, parsedParams.data.id);

    const { error } = await supabase
      .from("workspace_variable_definitions")
      .delete()
      .eq("id", parsedParams.data.variableId)
      .eq("workspace_id", parsedParams.data.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const contextPayload = await ensureWorkspaceContext(supabase, user.id);
    return NextResponse.json({ context: contextPayload });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete variable." },
      { status: 500 },
    );
  }
}
