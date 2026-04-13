function getEnv(name: string): string {
  const value = process.env[name];
  return value?.trim() ?? "";
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: getEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ),
  KIGEN_SHOW_DIAGNOSTICS: getEnv("KIGEN_SHOW_DIAGNOSTICS"),
  ANILIST_API_URL: getEnv("ANILIST_API_URL") || "https://graphql.anilist.co",
  JIKAN_API_URL: getEnv("JIKAN_API_URL") || "https://api.jikan.moe/v4",
  KITSU_API_URL: getEnv("KITSU_API_URL") || "https://kitsu.io/api/edge",
  MANGADEX_API_URL: getEnv("MANGADEX_API_URL") || "https://api.mangadex.org",
};

export function hasSupabaseConfig(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function isDiagnosticsEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || env.KIGEN_SHOW_DIAGNOSTICS === "true";
}

export function isSmokeModeEnabled(): boolean {
  return process.env.KIGEN_SMOKE_MODE === "true";
}
