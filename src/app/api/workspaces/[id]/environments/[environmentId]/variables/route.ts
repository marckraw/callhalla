import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertEnvironmentInWorkspace,
  assertWorkspaceOwnedByUser,
  ensureWorkspaceContext,
  getAuthenticatedServerClient,
} from "@/shared/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
  environmentId: z.string().uuid(),
});

const valuesSchema = z.object({
  values: z
    .array(
      z.object({
        variableId: z.string().uuid(),
        value: z.string(),
        enabled: z.boolean(),
      }),
    )
    .max(200),
});

export async function PUT(
  request: Request,
  context: {
    params: Promise<{ id: string; environmentId: string }>;
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
    return NextResponse.json({ error: "Invalid workspace or environment id." }, { status: 400 });
  }

  try {
    const payload = valuesSchema.parse(await request.json());
    const workspaceId = parsedParams.data.id;
    const environmentId = parsedParams.data.environmentId;

    await assertWorkspaceOwnedByUser(supabase, user.id, workspaceId);
    await assertEnvironmentInWorkspace(supabase, workspaceId, environmentId);

    const { data: variables, error: variablesError } = await supabase
      .from("workspace_variable_definitions")
      .select("id")
      .eq("workspace_id", workspaceId);

    if (variablesError) {
      return NextResponse.json({ error: variablesError.message }, { status: 500 });
    }

    const allowedIds = new Set(((variables as { id: string }[]) ?? []).map((item) => item.id));
    const hasInvalidVariable = payload.values.some((item) => !allowedIds.has(item.variableId));

    if (hasInvalidVariable) {
      return NextResponse.json(
        { error: "Payload includes variables outside the selected workspace." },
        { status: 400 },
      );
    }

    if (payload.values.length > 0) {
      const { error } = await supabase.from("environment_variable_values").upsert(
        payload.values.map((item) => ({
          environment_id: environmentId,
          variable_definition_id: item.variableId,
          value: item.value,
          enabled: item.enabled,
        })),
        { onConflict: "environment_id,variable_definition_id" },
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const contextPayload = await ensureWorkspaceContext(supabase, user.id);
    return NextResponse.json({ context: contextPayload });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save environment values." },
      { status: 500 },
    );
  }
}
