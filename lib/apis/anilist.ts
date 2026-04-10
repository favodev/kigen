import { env } from "@/lib/env";

export type AnimeFeedItem = {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  score: number | null;
  source: "AniList";
};

export type AnimeDetail = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  bannerUrl: string | null;
  score: number | null;
  episodes: number | null;
  duration: number | null;
  format: string | null;
  status: string | null;
  seasonYear: number | null;
  genres: string[];
  characters: Array<{
    id: number;
    name: string;
    role: string | null;
    imageUrl: string | null;
  }>;
  staff: Array<{
    id: number;
    name: string;
    role: string | null;
    imageUrl: string | null;
  }>;
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
    Media?: {
      id: number;
      title?: {
        romaji?: string | null;
        english?: string | null;
      };
      description?: string | null;
      coverImage?: {
        extraLarge?: string | null;
        large?: string | null;
        medium?: string | null;
      };
      bannerImage?: string | null;
      averageScore?: number | null;
      episodes?: number | null;
      duration?: number | null;
      format?: string | null;
      status?: string | null;
      seasonYear?: number | null;
      genres?: string[];
      characters?: {
        edges?: Array<{
          role?: string | null;
          node?: {
            id: number;
            name?: {
              full?: string | null;
            };
            image?: {
              medium?: string | null;
            };
          };
        }>;
      };
      staff?: {
        edges?: Array<{
          role?: string | null;
          node?: {
            id: number;
            name?: {
              full?: string | null;
            };
            image?: {
              medium?: string | null;
            };
          };
        }>;
      };
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

const ANIME_DETAIL_QUERY = `
  query AnimeDetail($id: Int!) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
      }
      description(asHtml: false)
      coverImage {
        extraLarge
        large
        medium
      }
      bannerImage
      averageScore
      episodes
      duration
      format
      status
      seasonYear
      genres
      characters(perPage: 8, sort: [ROLE, RELEVANCE, ID]) {
        edges {
          role
          node {
            id
            name {
              full
            }
            image {
              medium
            }
          }
        }
      }
      staff(perPage: 8, sort: [RELEVANCE, ID]) {
        edges {
          role
          node {
            id
            name {
              full
            }
            image {
              medium
            }
          }
        }
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

function normalizeDescription(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.replaceAll("<br>", "\n").trim();
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

export async function getAnimeById(id: number): Promise<AnimeDetail | null> {
  const response = await fetch(env.ANILIST_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: ANIME_DETAIL_QUERY,
      variables: {
        id,
      },
    }),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`AniList HTTP ${response.status}`);
  }

  const data = (await response.json()) as AniListResponse;

  if (data.errors?.length) {
    throw new Error(data.errors[0]?.message ?? "AniList returned errors");
  }

  const media = data.data?.Media;

  if (!media) {
    return null;
  }

  const score =
    typeof media.averageScore === "number"
      ? Math.round((media.averageScore / 10) * 10) / 10
      : null;

  return {
    id: media.id,
    title: media.title?.english || media.title?.romaji || "Untitled anime",
    description: normalizeDescription(media.description),
    imageUrl: media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium || null,
    bannerUrl: media.bannerImage || null,
    score,
    episodes: media.episodes ?? null,
    duration: media.duration ?? null,
    format: media.format ?? null,
    status: media.status ? normalizeStatus(media.status) : null,
    seasonYear: media.seasonYear ?? null,
    genres: media.genres ?? [],
    characters: (media.characters?.edges ?? [])
      .filter((edge) => edge.node?.id && edge.node.name?.full)
      .map((edge) => ({
        id: edge.node!.id,
        name: edge.node!.name!.full!,
        role: edge.role ?? null,
        imageUrl: edge.node?.image?.medium ?? null,
      })),
    staff: (media.staff?.edges ?? [])
      .filter((edge) => edge.node?.id && edge.node.name?.full)
      .map((edge) => ({
        id: edge.node!.id,
        name: edge.node!.name!.full!,
        role: edge.role ?? null,
        imageUrl: edge.node?.image?.medium ?? null,
      })),
    source: "AniList",
  };
}
