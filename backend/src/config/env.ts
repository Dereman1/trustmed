const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];

function ensureEnv(name: RequiredEnvVar): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  supabaseUrl: ensureEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: ensureEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
};
