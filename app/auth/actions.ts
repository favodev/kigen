"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthErrorCode =
  | "email_invalid"
  | "password_too_short"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "email_signup_failed"
  | "email_signin_failed";

type AuthStatusCode = "signup_check_email";

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

function mapAuthErrorCode(message: string, flow: "signin" | "signup"): AuthErrorCode {
  const lowered = message.toLowerCase();

  if (lowered.includes("invalid") && lowered.includes("email")) {
    return "email_invalid";
  }

  if (lowered.includes("password") && lowered.includes("at least")) {
    return "password_too_short";
  }

  if (lowered.includes("invalid login credentials") || lowered.includes("invalid credentials")) {
    return "invalid_credentials";
  }

  if (lowered.includes("email not confirmed")) {
    return "email_not_confirmed";
  }

  if (flow === "signup") {
    return "email_signup_failed";
  }

  return "email_signin_failed";
}

function redirectToLoginWithState(nextPath: string, state: { authError?: AuthErrorCode; authStatus?: AuthStatusCode; email?: string }) {
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

async function signInWithPassword(email: string, password: string, nextPath: string) {
  const supabase = await createSupabaseServerClient();
  const safeNextPath = sanitizeNextPath(nextPath);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectToLoginWithState(safeNextPath, {
      authError: mapAuthErrorCode(error.message ?? "", "signin"),
      email,
    });
  }

  redirect(safeNextPath);
}

async function signUpWithPassword(email: string, password: string, nextPath: string) {
  const supabase = await createSupabaseServerClient();
  const baseUrl = await getBaseUrl();
  const safeNextPath = sanitizeNextPath(nextPath);
  const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(safeNextPath)}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    redirectToLoginWithState(safeNextPath, {
      authError: mapAuthErrorCode(error.message ?? "", "signup"),
      email,
    });
  }

  if (data.session) {
    redirect(safeNextPath);
  }

  redirectToLoginWithState(safeNextPath, {
    authStatus: "signup_check_email",
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

function passwordFromFormData(formData: FormData): string {
  const candidate = formData.get("password");
  return typeof candidate === "string" ? candidate : "";
}

function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isLikelyPassword(value: string): boolean {
  return value.length >= 6;
}

export async function signInWithPasswordWithNext(formData: FormData) {
  const nextPath = nextFromFormData(formData);
  const email = emailFromFormData(formData);
  const password = passwordFromFormData(formData);

  if (!isLikelyEmail(email)) {
    redirectToLoginWithState(nextPath, {
      authError: "email_invalid",
      email,
    });
  }

  if (!isLikelyPassword(password)) {
    redirectToLoginWithState(nextPath, {
      authError: "password_too_short",
      email,
    });
  }

  await signInWithPassword(email, password, nextPath);
}

export async function signUpWithPasswordWithNext(formData: FormData) {
  const nextPath = nextFromFormData(formData);
  const email = emailFromFormData(formData);
  const password = passwordFromFormData(formData);

  if (!isLikelyEmail(email)) {
    redirectToLoginWithState(nextPath, {
      authError: "email_invalid",
      email,
    });
  }

  if (!isLikelyPassword(password)) {
    redirectToLoginWithState(nextPath, {
      authError: "password_too_short",
      email,
    });
  }

  await signUpWithPassword(email, password, nextPath);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
