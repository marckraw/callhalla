import { NextResponse } from "next/server";
import { z } from "zod";
import type { BodyMode, HeaderRow, HttpMethod, SavedRequest } from "@/shared";
import { getAuthenticatedServerClient } from "@/shared/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const headerSchema = z.object({
  id: z.string().min(1),
  key: z.string(),
  value: z.string(),
  enabled: z.boolean(),
});

const draftSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]),
  url: z.string().url(),
  headers: z.array(headerSchema),
  bodyMode: z.enum(["none", "json", "text"]),
  bodyText: z.string(),
});

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  tags: z.array(z.string().trim().min(1).max(40)).max(40),
  draft: draftSchema,
});

type SavedRequestRow = {
  id: string;
  user_id: string;
  name: string;
  tags: string[];
  method: HttpMethod;
  url: string;
  headers: HeaderRow[];
  body_mode: BodyMode;
  body_text: string;
  created_at: string;
  updated_at: string;
};

const normalizeHeaders = (headers: unknown): HeaderRow[] => {
  if (!Array.isArray(headers)) {
    return [];
  }

  return headers
    .map((item, index) => {
      const parsed = headerSchema.safeParse(item);
      if (parsed.success) {
        return parsed.data;
      }

      return {
        id: `header-${index}`,
        key: "",
        value: "",
        enabled: false,
      };
    })
    .filter((item) => item.key.length > 0 || item.value.length > 0 || item.enabled);
};

const toSavedRequest = (row: SavedRequestRow): SavedRequest => ({
  id: row.id,
  name: row.name,
  tags: Array.isArray(row.tags) ? row.tags.filter((tag) => typeof tag === "string") : [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  draft: {
    method: row.method,
    url: row.url,
    headers: normalizeHeaders(row.headers),
    bodyMode: row.body_mode,
    bodyText: row.body_text,
  },
});

const projection = "id,user_id,name,tags,method,url,headers,body_mode,body_text,created_at,updated_at";

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

export async function PATCH(
  request: Request,
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

  try {
    const payload = updateSchema.parse(await request.json());
    const normalizedTags = [...new Set(payload.tags.map((tag) => tag.trim().toLowerCase()))];

    const { data, error } = await supabase
      .from("saved_requests")
      .update({
        name: payload.name,
        tags: normalizedTags,
        method: payload.draft.method,
        url: payload.draft.url,
        headers: payload.draft.headers,
        body_mode: payload.draft.bodyMode,
        body_text: payload.draft.bodyText,
      })
      .eq("id", parsedParams.data.id)
      .eq("user_id", user.id)
      .select(projection)
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ item: toSavedRequest(data as SavedRequestRow) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "Invalid payload.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update request.",
      },
      { status: 500 },
    );
  }
}
