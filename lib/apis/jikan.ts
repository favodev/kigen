import { env, isSmokeModeEnabled } from "@/lib/env";
import { getSmokeTodayReleases } from "@/lib/smoke/fixtures";

export type ReleaseFeedItem = {
  id: number;
  title: string;
  airingAt: string;
  imageUrl: string | null;
  score: number | null;
  source: "Jikan";
};

type JikanResponse = {
  data?: Array<{
    mal_id: number;
    title?: string | null;
    score?: number | null;
    images?: {
      jpg?: {
        large_image_url?: string | null;
        image_url?: string | null;
      };
    };
    broadcast?: {
      time?: string | null;
      timezone?: string | null;
      string?: string | null;
    };
  }>;
};

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function currentDayFilter(): string {
  return DAYS[new Date().getDay()];
}

function toAiringLabel(
  time: string | null | undefined,
  timezone: string | null | undefined,
): string {
  if (!time) {
    return "time tbd";
  }

  if (!timezone) {
    return time;
  }

  return `${time} ${timezone}`;
}

export async function getTodayReleases(limit = 8): Promise<ReleaseFeedItem[]> {
  if (isSmokeModeEnabled()) {
    return getSmokeTodayReleases(limit);
  }

  const day = currentDayFilter();
  const response = await fetch(`${env.JIKAN_API_URL}/schedules?filter=${day}&limit=${limit}`, {
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    throw new Error(`Jikan HTTP ${response.status}`);
  }

  const json = (await response.json()) as JikanResponse;
  const items = json.data ?? [];

  return items.map((item) => ({
    id: item.mal_id,
    title: item.title || "Untitled release",
    airingAt: toAiringLabel(item.broadcast?.time, item.broadcast?.timezone),
    imageUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || null,
    score: typeof item.score === "number" ? item.score : null,
    source: "Jikan",
  }));
}
