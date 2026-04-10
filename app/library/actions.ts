"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type MediaKind = "ANIME" | "MANGA";
type LibraryStatus = "PLAN" | "WATCHING" | "READING" | "COMPLETED" | "PAUSED" | "DROPPED";

type ParsedLibraryInput = {
  externalId: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  source: string;
  mediaKind: MediaKind;
  score: number | null;
  nextPath: string;
};

function parseStatus(raw: string): LibraryStatus {
  if (
    raw === "WATCHING" ||
    raw === "READING" ||
    raw === "COMPLETED" ||
    raw === "PAUSED" ||
    raw === "DROPPED"
  ) {
    return raw;
  }

  return "PLAN";
}

function parseProgress(raw: string): number {
  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.floor(parsed));
}

function sanitizePath(path: string): string {
  if (!path.startsWith("/")) {
    return "/";
  }

  return path;
}

function parseMediaKind(raw: string): MediaKind {
  return raw === "MANGA" ? "MANGA" : "ANIME";
}

function parseScore(raw: string | null): number | null {
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, Math.min(10, parsed));
}

function parseLibraryInput(formData: FormData): ParsedLibraryInput {
  const externalId = String(formData.get("externalId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const imageUrlRaw = String(formData.get("imageUrl") ?? "").trim();
  const source = String(formData.get("source") ?? "Unknown").trim() || "Unknown";
  const mediaKind = parseMediaKind(String(formData.get("mediaKind") ?? "ANIME"));
  const nextPath = sanitizePath(String(formData.get("nextPath") ?? "/"));
  const score = parseScore(String(formData.get("score") ?? ""));

  return {
    externalId,
    title,
    subtitle,
    imageUrl: imageUrlRaw.length > 0 ? imageUrlRaw : null,
    source,
    mediaKind,
    score,
    nextPath,
  };
}

export async function addToLibrary(formData: FormData) {
  const input = parseLibraryInput(formData);

  if (!input.externalId || !input.title) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(input.nextPath)}`);
  }

  const { error } = await supabase
    .from("user_media_list")
    .upsert(
      {
        user_id: user.id,
        media_kind: input.mediaKind,
        source: input.source,
        external_id: input.externalId,
        title: input.title,
        subtitle: input.subtitle || null,
        image_url: input.imageUrl,
        score: input.score,
        status: "PLAN",
      },
      {
        onConflict: "user_id,source,external_id",
      },
    );

  if (error?.code === "42P01") {
    redirect(`${input.nextPath}?library=setup-required`);
  }

  if (error) {
    redirect(`${input.nextPath}?library=save-failed`);
  }

  revalidatePath("/");
  revalidatePath("/library");
}

export async function removeFromLibrary(formData: FormData) {
  const entryId = String(formData.get("entryId") ?? "").trim();

  if (!entryId) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/library");
  }

  const { error } = await supabase
    .from("user_media_list")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error?.code === "42P01") {
    redirect("/library?setup=required");
  }

  if (error) {
    redirect("/library?library=remove-failed");
  }

  revalidatePath("/");
  revalidatePath("/library");
}

export async function updateLibraryEntry(formData: FormData) {
  const entryId = String(formData.get("entryId") ?? "").trim();
  const status = parseStatus(String(formData.get("status") ?? "PLAN"));
  const progress = parseProgress(String(formData.get("progress") ?? "0"));
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw : null;

  if (!entryId) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/library");
  }

  const { error } = await supabase
    .from("user_media_list")
    .update({
      status,
      progress,
      notes,
    })
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error?.code === "42P01") {
    redirect("/library?setup=required");
  }

  if (error) {
    redirect("/library?library=update-failed");
  }

  revalidatePath("/library");
}
