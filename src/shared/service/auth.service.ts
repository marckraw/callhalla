import { createSupabaseServerClient } from "./supabase-server.service";

export const getServerUser = async () => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};

export const getAuthenticatedServerClient = async () => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      supabase: null,
      user: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabase,
    user,
  };
};
