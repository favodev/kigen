import { env } from "@/lib/env";

export type AnimeFeedItem = {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  score: number | null;
  source: "AniList";
};

type AniListResponse = {
  data?: {
    Page?: {
      media?: Array<{
        id: number;
        title?: {
          romaji?: string | null;
          english?: string | null;
        };
        coverImage?: {
          large?: string | null;
          medium?: string | null;
        };
        averageScore?: number | null;
        format?: string | null;
        status?: string | null;
        seasonYear?: number | null;
      }>;
    };
  };
  errors?: Array<{ message: string }>;
};

const TRENDING_ANIME_QUERY = `
  query TrendingAnime($page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
          medium
        }
        averageScore
        format
        status
        seasonYear
      }
    }
  }
`;

function normalizeStatus(value: string | null | undefined): string {
  if (!value) {
    return "Unknown";
  }

  return value.replaceAll("_", " ").toLowerCase();
}

export async function getTrendingAnime(limit = 6): Promise<AnimeFeedItem[]> {
  const response = await fetch(env.ANILIST_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: TRENDING_ANIME_QUERY,
      variables: {
        page: 1,
        perPage: limit,
      },
    }),
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    throw new Error(`AniList HTTP ${response.status}`);
  }

  const data = (await response.json()) as AniListResponse;

  if (data.errors?.length) {
    throw new Error(data.errors[0]?.message ?? "AniList returned errors");
  }

  const media = data.data?.Page?.media ?? [];

  return media.map((item) => {
    const title = item.title?.english || item.title?.romaji || "Untitled anime";
    const score =
      typeof item.averageScore === "number"
        ? Math.round((item.averageScore / 10) * 10) / 10
        : null;

    return {
      id: item.id,
      title,
      subtitle: `${item.format ?? "Unknown"} - ${normalizeStatus(item.status)}${
        item.seasonYear ? ` - ${item.seasonYear}` : ""
      }`,
      imageUrl: item.coverImage?.large || item.coverImage?.medium || null,
      score,
      source: "AniList" as const,
    };
  });
}
