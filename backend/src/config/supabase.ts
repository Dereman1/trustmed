import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

export function createSupabaseAnonClient() {
  if (!env.supabaseAnonKey) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const supabaseService = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

export const supabaseAnon = env.supabaseAnonKey
  ? createSupabaseAnonClient()
  : null;
