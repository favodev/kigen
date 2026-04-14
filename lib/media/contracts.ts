export type MediaSource = "AniList" | "Kitsu" | "Jikan" | "Fallback";

export type UnifiedMediaCardBase = {
  title: string;
  subtitle: string;
  imageUrl: string | null;
  score: number | null;
};

export type UnifiedPersonBase = {
  name: string;
  role: string | null;
  imageUrl: string | null;
};

export type UnifiedReleaseBase = {
  title: string;
  airingAt: string;
  imageUrl: string | null;
  score: number | null;
};

export function normalizeStatusLabel(value: string | null | undefined, fallback = "Unknown"): string {
  if (!value) {
    return fallback;
  }

  return value.replaceAll("_", " ").toLowerCase();
}

export function normalizeTenScaleScore(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

export function normalizeHundredScaleScore(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return normalizeTenScaleScore(value / 10);
}

export function normalizeNumericStringScore(value: string | null | undefined): number | null {
  const parsed = Number(value ?? "");

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return normalizeTenScaleScore(parsed / 10);
}
