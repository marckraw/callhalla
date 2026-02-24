import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensureWorkspaceContext,
  getAuthenticatedServerClient,
  setActiveWorkspaceForUser,
} from "@/shared/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(
  _request: Request,
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
    await setActiveWorkspaceForUser(supabase, user.id, parsedParams.data.id);
    const contextPayload = await ensureWorkspaceContext(supabase, user.id);
    return NextResponse.json({ context: contextPayload });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to activate workspace." },
      { status: 500 },
    );
  }
}
