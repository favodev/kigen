export function getSmokeTrendingAnime(limit: number) {
  return [
    {
      id: 1,
      title: "Smoke Anime One",
      subtitle: "TV - releasing - 2026",
      imageUrl: null,
      score: 8.4,
      source: "AniList" as const,
    },
    {
      id: 2,
      title: "Smoke Anime Two",
      subtitle: "TV - finished - 2025",
      imageUrl: null,
      score: 7.8,
      source: "AniList" as const,
    },
  ].slice(0, limit);
}

export function getSmokeAnimeDetail(id: number) {
  if (id !== 1) {
    return null;
  }

  return {
    id: 1,
    title: "Smoke Anime One",
    description: "Detalle mock para smoke tests.",
    imageUrl: null,
    bannerUrl: null,
    score: 8.4,
    episodes: 12,
    duration: 24,
    format: "TV",
    status: "releasing",
    seasonYear: 2026,
    genres: ["Action", "Sci-Fi"],
    characters: [],
    staff: [],
    related: [
      {
        id: 101,
        title: "Smoke Anime Sequel",
        relationType: "sequel",
        imageUrl: null,
        format: "TV",
        status: "finished",
        seasonYear: 2027,
      },
    ],
    recommendations: [
      {
        id: 201,
        title: "Smoke Reco",
        imageUrl: null,
        score: 8.2,
        format: "TV",
        status: "releasing",
        seasonYear: 2025,
        rating: 89,
        genres: ["Action"],
      },
    ],
    source: "AniList" as const,
  };
}

export function getSmokeTrendingManga(limit: number) {
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

export function getSmokeMangaDetail(id: string) {
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
    source: "Kitsu" as const,
  };
}

export function getSmokeTodayReleases(limit: number) {
  return [
    {
      id: 1,
      title: "Smoke Release One",
      airingAt: "20:00 JST",
      imageUrl: null,
      score: 8.0,
      source: "Jikan" as const,
    },
    {
      id: 2,
      title: "Smoke Release Two",
      airingAt: "21:30 JST",
      imageUrl: null,
      score: 7.4,
      source: "Jikan" as const,
    },
  ].slice(0, limit);
}
