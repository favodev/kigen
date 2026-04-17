"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthErrorCode = "email_invalid" | "email_provider_not_enabled" | "email_signin_failed";

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

function mapEmailErrorCode(message: string): AuthErrorCode {
  const lowered = message.toLowerCase();

  if (lowered.includes("email") && lowered.includes("disabled")) {
    return "email_provider_not_enabled";
  }

  if (lowered.includes("invalid") && lowered.includes("email")) {
    return "email_invalid";
  }

  return "email_signin_failed";
}

function redirectToLoginWithState(nextPath: string, state: { authError?: AuthErrorCode; authStatus?: string; email?: string }) {
  const query = new URLSearchParams({ next: nextPath });

  if (state.authError) {
    query.set("authError", state.authError);
  }

  if (state.authStatus) {
    query.set("authStatus", state.authStatus);
  }

  if (state.email) {
    query.set("email", state.email);
  }

  redirect(`/login?${query.toString()}`);
}

async function signInWithEmail(email: string, nextPath: string) {
  const supabase = await createSupabaseServerClient();
  const baseUrl = await getBaseUrl();
  const safeNextPath = sanitizeNextPath(nextPath);
  const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(safeNextPath)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    redirectToLoginWithState(safeNextPath, {
      authError: mapEmailErrorCode(error.message ?? ""),
      email,
    });
  }

  redirectToLoginWithState(safeNextPath, {
    authStatus: "magic_link_sent",
    email,
  });
}

function nextFromFormData(formData: FormData, fallback = "/"): string {
  const candidate = formData.get("next");

  if (typeof candidate !== "string") {
    return fallback;
  }

  return sanitizeNextPath(candidate);
}

function emailFromFormData(formData: FormData): string {
  const candidate = formData.get("email");
  return typeof candidate === "string" ? candidate.trim().toLowerCase() : "";
}

function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function signInWithEmailWithNext(formData: FormData) {
  const nextPath = nextFromFormData(formData);
  const email = emailFromFormData(formData);

  if (!isLikelyEmail(email)) {
    redirectToLoginWithState(nextPath, {
      authError: "email_invalid",
      email,
    });
  }

  await signInWithEmail(email, nextPath);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
