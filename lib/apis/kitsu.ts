import { env } from "@/lib/env";

export type MangaFeedItem = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  score: number | null;
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
};

function normalizeText(value: string | null | undefined): string {
  if (!value) {
    return "Unknown";
  }

  return value.replaceAll("_", " ").toLowerCase();
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
