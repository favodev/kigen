import { env, hasSupabaseConfig } from "@/lib/env";

type ConnectionStatus = "ok" | "error" | "missing-config";

export type ConnectionHealthItem = {
  name: "supabase" | "anilist" | "jikan" | "kitsu";
  status: ConnectionStatus;
  latencyMs: number | null;
  details: string;
};

export type ConnectionsHealth = {
  checkedAt: string;
  items: ConnectionHealthItem[];
};

async function timedRequest(
  url: string,
  options?: RequestInit,
): Promise<{ ok: boolean; status: number; latencyMs: number }> {
  const startedAt = Date.now();
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
  });

  return {
    ok: response.ok,
    status: response.status,
    latencyMs: Date.now() - startedAt,
  };
}

async function checkSupabase(): Promise<ConnectionHealthItem> {
  if (!hasSupabaseConfig()) {
    return {
      name: "supabase",
      status: "missing-config",
      latencyMs: null,
      details: "NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY faltante",
    };
  }

  try {
    const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`;
    const result = await timedRequest(url, {
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      },
    });

    return {
      name: "supabase",
      status: result.ok ? "ok" : "error",
      latencyMs: result.latencyMs,
      details: `HTTP ${result.status}`,
    };
  } catch (error) {
    return {
      name: "supabase",
      status: "error",
      latencyMs: null,
      details: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

async function checkAniList(): Promise<ConnectionHealthItem> {
  try {
    const result = await timedRequest(env.ANILIST_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "query { __typename }",
      }),
    });

    return {
      name: "anilist",
      status: result.ok ? "ok" : "error",
      latencyMs: result.latencyMs,
      details: `HTTP ${result.status}`,
    };
  } catch (error) {
    return {
      name: "anilist",
      status: "error",
      latencyMs: null,
      details: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

async function checkJikan(): Promise<ConnectionHealthItem> {
  try {
    const result = await timedRequest(`${env.JIKAN_API_URL}/genres/anime`);

    return {
      name: "jikan",
      status: result.ok ? "ok" : "error",
      latencyMs: result.latencyMs,
      details: `HTTP ${result.status}`,
    };
  } catch (error) {
    return {
      name: "jikan",
      status: "error",
      latencyMs: null,
      details: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

async function checkKitsu(): Promise<ConnectionHealthItem> {
  try {
    const result = await timedRequest(`${env.KITSU_API_URL}/manga?page[limit]=1`);

    return {
      name: "kitsu",
      status: result.ok ? "ok" : "error",
      latencyMs: result.latencyMs,
      details: `HTTP ${result.status}`,
    };
  } catch (error) {
    return {
      name: "kitsu",
      status: "error",
      latencyMs: null,
      details: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function getConnectionsHealth(): Promise<ConnectionsHealth> {
  const [supabase, anilist, jikan, kitsu] = await Promise.all([
    checkSupabase(),
    checkAniList(),
    checkJikan(),
    checkKitsu(),
  ]);

  return {
    checkedAt: new Date().toISOString(),
    items: [supabase, anilist, jikan, kitsu],
  };
}
