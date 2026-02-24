import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedServerClient } from "@/shared/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const { supabase, user } = await getAuthenticatedServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error: "Supabase is not configured.",
      },
      { status: 500 },
    );
  }

  if (!user) {
    return NextResponse.json(
      {
        error: "Authentication required.",
      },
      { status: 401 },
    );
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: "Invalid request id.",
      },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("saved_requests")
    .delete()
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
