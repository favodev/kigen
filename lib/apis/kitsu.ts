import { env, isSmokeModeEnabled } from "@/lib/env";

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
  related: Array<{
    id: string;
    title: string;
    imageUrl: string | null;
    score: number | null;
    subtype: string | null;
    status: string | null;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    imageUrl: string | null;
    score: number | null;
    subtype: string | null;
    status: string | null;
  }>;
  source: "Kitsu";
};

type MangaSuggestion = {
  id: string;
  title: string;
  imageUrl: string | null;
  score: number | null;
  subtype: string | null;
  status: string | null;
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

function mapMangaSuggestion(item: {
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
}): MangaSuggestion {
  const attributes = item.attributes;
  const scoreRaw = Number(attributes?.averageRating ?? "");

  return {
    id: item.id,
    title: attributes?.canonicalTitle || "Untitled manga",
    imageUrl: attributes?.posterImage?.large || attributes?.posterImage?.medium || null,
    score: Number.isFinite(scoreRaw) ? Math.round(scoreRaw) / 10 : null,
    subtype: attributes?.subtype ? normalizeText(attributes.subtype) : null,
    status: attributes?.status ? normalizeText(attributes.status) : null,
  };
}

function smokeMangaDetail(id: string): MangaDetail | null {
  if (id !== "1") {
    return null;
  }

  return {
    id: "1",
    title: "Smoke Manga One",
    description: "Detalle mock para smoke tests.",
    imageUrl: null,
    bannerUrl: null,
    score: 8.1,
    chapterCount: 80,
    volumeCount: 10,
    subtype: "manga",
    status: "current",
    ageRating: null,
    startDate: "2020-01-01",
    related: [
      {
        id: "11",
        title: "Smoke Related Manga",
        imageUrl: null,
        score: 7.9,
        subtype: "manga",
        status: "finished",
      },
    ],
    recommendations: [
      {
        id: "21",
        title: "Smoke Manga Reco",
        imageUrl: null,
        score: 8.3,
        subtype: "manga",
        status: "current",
      },
    ],
    source: "Kitsu",
  };
}

async function getMangaCompanions(
  currentId: string,
  subtypeRaw: string | null | undefined,
  statusRaw: string | null | undefined,
): Promise<{ related: MangaSuggestion[]; recommendations: MangaSuggestion[] }> {
  const filterSubtype = subtypeRaw ? `&filter[subtype]=${encodeURIComponent(subtypeRaw)}` : "";
  const response = await fetch(
    `${env.KITSU_API_URL}/manga?page[limit]=20&sort=-averageRating${filterSubtype}`,
    {
      headers: {
        Accept: "application/vnd.api+json",
      },
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) {
    return {
      related: [],
      recommendations: [],
    };
  }

  const json = (await response.json()) as KitsuResponse;
  const normalizedStatus = statusRaw ? normalizeText(statusRaw) : null;
  const candidates = (json.data ?? [])
    .map(mapMangaSuggestion)
    .filter((item) => item.id !== currentId);

  const recommendations = candidates.slice(0, 6);
  const relatedByStatus = normalizedStatus
    ? candidates.filter((item) => item.status === normalizedStatus)
    : [];

  const relatedSeed = relatedByStatus.length > 0 ? relatedByStatus : candidates;
  const related = relatedSeed.slice(0, 6);

  return {
    related,
    recommendations,
  };
}

export async function getTrendingManga(limit = 6): Promise<MangaFeedItem[]> {
  if (isSmokeModeEnabled()) {
    return [
      {
        id: "1",
        title: "Smoke Manga One",
        subtitle: "manga - current",
        imageUrl: null,
        score: 8.1,
        source: "Kitsu" as const,
      },
      {
        id: "2",
        title: "Smoke Manga Two",
        subtitle: "manga - finished",
        imageUrl: null,
        score: 7.6,
        source: "Kitsu" as const,
      },
    ].slice(0, limit);
  }

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
  if (isSmokeModeEnabled()) {
    return smokeMangaDetail(id);
  }

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
  const companions = await getMangaCompanions(item.id, attributes?.subtype, attributes?.status);

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
    related: companions.related,
    recommendations: companions.recommendations,
    source: "Kitsu",
  };
}
