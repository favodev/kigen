import { env } from "@/lib/env";

export type MangaFeedItem = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  score: number | null;
  source: "Kitsu";
};

export type MangaDetail = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  bannerUrl: string | null;
  score: number | null;
  chapterCount: number | null;
  volumeCount: number | null;
  subtype: string | null;
  status: string | null;
  ageRating: string | null;
  startDate: string | null;
  source: "Kitsu";
};

type KitsuResponse = {
  data?: Array<{
    id: string;
    attributes?: {
      canonicalTitle?: string | null;
      averageRating?: string | null;
      subtype?: string | null;
      status?: string | null;
      posterImage?: {
        large?: string | null;
        medium?: string | null;
      };
    };
  }>;
  included?: unknown[];
};

type KitsuDetailResponse = {
  data?: {
    id: string;
    attributes?: {
      canonicalTitle?: string | null;
      synopsis?: string | null;
      averageRating?: string | null;
      subtype?: string | null;
      status?: string | null;
      ageRating?: string | null;
      chapterCount?: number | null;
      volumeCount?: number | null;
      startDate?: string | null;
      posterImage?: {
        original?: string | null;
        large?: string | null;
        medium?: string | null;
      };
      coverImage?: {
        original?: string | null;
        large?: string | null;
      };
    };
  };
};

function normalizeText(value: string | null | undefined): string {
  if (!value) {
    return "Unknown";
  }

  return value.replaceAll("_", " ").toLowerCase();
}

function normalizeDescription(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.trim();
}

export async function getTrendingManga(limit = 6): Promise<MangaFeedItem[]> {
  const response = await fetch(
    `${env.KITSU_API_URL}/manga?page[limit]=${limit}&sort=-averageRating`,
    {
      headers: {
        Accept: "application/vnd.api+json",
      },
      next: { revalidate: 1800 },
    },
  );

  if (!response.ok) {
    throw new Error(`Kitsu HTTP ${response.status}`);
  }

  const json = (await response.json()) as KitsuResponse;
  const items = json.data ?? [];

  return items.map((item) => {
    const attributes = item.attributes;
    const scoreRaw = Number(attributes?.averageRating ?? "");

    return {
      id: item.id,
      title: attributes?.canonicalTitle || "Untitled manga",
      subtitle: `${normalizeText(attributes?.subtype)} - ${normalizeText(attributes?.status)}`,
      imageUrl: attributes?.posterImage?.large || attributes?.posterImage?.medium || null,
      score: Number.isFinite(scoreRaw) ? Math.round(scoreRaw) / 10 : null,
      source: "Kitsu" as const,
    };
  });
}

export async function getMangaById(id: string): Promise<MangaDetail | null> {
  const response = await fetch(`${env.KITSU_API_URL}/manga/${encodeURIComponent(id)}`, {
    headers: {
      Accept: "application/vnd.api+json",
    },
    next: { revalidate: 3600 },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Kitsu HTTP ${response.status}`);
  }

  const json = (await response.json()) as KitsuDetailResponse;
  const item = json.data;

  if (!item) {
    return null;
  }

  const attributes = item.attributes;
  const scoreRaw = Number(attributes?.averageRating ?? "");

  return {
    id: item.id,
    title: attributes?.canonicalTitle || "Untitled manga",
    description: normalizeDescription(attributes?.synopsis),
    imageUrl:
      attributes?.posterImage?.original ||
      attributes?.posterImage?.large ||
      attributes?.posterImage?.medium ||
      null,
    bannerUrl: attributes?.coverImage?.original || attributes?.coverImage?.large || null,
    score: Number.isFinite(scoreRaw) ? Math.round(scoreRaw) / 10 : null,
    chapterCount: attributes?.chapterCount ?? null,
    volumeCount: attributes?.volumeCount ?? null,
    subtype: attributes?.subtype ? normalizeText(attributes.subtype) : null,
    status: attributes?.status ? normalizeText(attributes.status) : null,
    ageRating: attributes?.ageRating ?? null,
    startDate: attributes?.startDate ?? null,
    source: "Kitsu",
  };
}
