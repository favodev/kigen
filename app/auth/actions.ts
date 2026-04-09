"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type OAuthProvider = "google" | "discord";

function sanitizeNextPath(nextPath: string): string {
  if (!nextPath.startsWith("/")) {
    return "/";
  }

  return nextPath;
}

async function getBaseUrl(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto =
    headerStore.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https");

  if (!host) {
    return "http://localhost:3000";
  }

  return `${proto}://${host}`;
}

async function signInWithProvider(provider: OAuthProvider, nextPath: string) {
  const supabase = await createSupabaseServerClient();
  const baseUrl = await getBaseUrl();
  const safeNextPath = sanitizeNextPath(nextPath);
  const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(safeNextPath)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  if (error || !data.url) {
    redirect(`/?authError=${encodeURIComponent(error?.message ?? "oauth_start_failed")}`);
  }

  redirect(data.url);
}

export async function signInWithGoogle() {
  await signInWithProvider("google", "/");
}

export async function signInWithDiscord() {
  await signInWithProvider("discord", "/");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
