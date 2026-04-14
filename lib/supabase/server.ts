import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env, isSmokeModeEnabled } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseServerClient = ReturnType<typeof createServerClient<Database>>;

type SmokeUser = {
  id: string;
  email: string;
  user_metadata: {
    name: string;
  };
};

type SmokeLibraryRow = {
  id: string;
  user_id: string;
  media_kind: "ANIME" | "MANGA";
  source: string;
  external_id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  score: number | null;
  status: string;
  progress: number;
  notes: string | null;
  created_at: string;
};

const smokeLibraryByUser = new Map<string, SmokeLibraryRow[]>();
let smokeEntryIdCounter = 1;

function ensureSmokeRows(userId: string): SmokeLibraryRow[] {
  const existing = smokeLibraryByUser.get(userId);

  if (existing) {
    return existing;
  }

  const initialRows: SmokeLibraryRow[] = [];
  smokeLibraryByUser.set(userId, initialRows);
  return initialRows;
}

function smokeUserFromCookie(value: string | undefined): SmokeUser | null {
  if (value !== "1") {
    return null;
  }

  return {
    id: "smoke-user",
    email: "smoke@kigen.local",
    user_metadata: {
      name: "Smoke User",
    },
  };
}

function getFieldValue(row: SmokeLibraryRow, field: string): unknown {
  return (row as Record<string, unknown>)[field];
}

class SmokeSelectQuery implements PromiseLike<{ data: SmokeLibraryRow[]; error: null }> {
  private eqFilters: Array<{ field: string; value: unknown }> = [];

  private inFilters: Array<{ field: string; values: unknown[] }> = [];

  private orderField: string | null = null;

  private orderAscending = true;

  private limitCount: number | null = null;

  constructor(private readonly userId: string) {}

  eq(field: string, value: unknown): this {
    this.eqFilters.push({ field, value });
    return this;
  }

  in(field: string, values: unknown[]): this {
    this.inFilters.push({ field, values });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }): this {
    this.orderField = field;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  async maybeSingle(): Promise<{ data: SmokeLibraryRow | null; error: null }> {
    const result = await this.execute();
    return {
      data: result.data[0] ?? null,
      error: null,
    };
  }

  private async execute(): Promise<{ data: SmokeLibraryRow[]; error: null }> {
    let rows = [...ensureSmokeRows(this.userId)];

    for (const filter of this.eqFilters) {
      rows = rows.filter((row) => getFieldValue(row, filter.field) === filter.value);
    }

    for (const filter of this.inFilters) {
      rows = rows.filter((row) => filter.values.includes(getFieldValue(row, filter.field)));
    }

    if (this.orderField) {
      rows.sort((a, b) => {
        const aValue = getFieldValue(a, this.orderField!);
        const bValue = getFieldValue(b, this.orderField!);

        if (aValue === bValue) {
          return 0;
        }

        if (aValue == null) {
          return this.orderAscending ? 1 : -1;
        }

        if (bValue == null) {
          return this.orderAscending ? -1 : 1;
        }

        return this.orderAscending
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }

    return {
      data: rows,
      error: null,
    };
  }

  then<TResult1 = { data: SmokeLibraryRow[]; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: SmokeLibraryRow[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

class SmokeMutationQuery implements PromiseLike<{ error: null }> {
  private eqFilters: Array<{ field: string; value: unknown }> = [];

  constructor(
    private readonly userId: string,
    private readonly action: "update" | "delete",
    private readonly updatePayload?: Partial<SmokeLibraryRow>,
  ) {}

  eq(field: string, value: unknown): this {
    this.eqFilters.push({ field, value });
    return this;
  }

  private matches(row: SmokeLibraryRow): boolean {
    return this.eqFilters.every((filter) => getFieldValue(row, filter.field) === filter.value);
  }

  private async execute(): Promise<{ error: null }> {
    const rows = ensureSmokeRows(this.userId);

    if (this.action === "update") {
      for (let i = 0; i < rows.length; i += 1) {
        if (this.matches(rows[i])) {
          rows[i] = {
            ...rows[i],
            ...(this.updatePayload ?? {}),
          };
        }
      }
    } else {
      const remaining = rows.filter((row) => !this.matches(row));
      smokeLibraryByUser.set(this.userId, remaining);
    }

    return { error: null };
  }

  then<TResult1 = { error: null }, TResult2 = never>(
    onfulfilled?: ((value: { error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

function createSmokeSupabaseClient(user: SmokeUser | null): SupabaseServerClient {
  const activeUserId = user?.id ?? "smoke-anonymous";

  return {
    auth: {
      async getUser() {
        return {
          data: { user },
          error: null,
        };
      },
      async signInWithOAuth() {
        return {
          data: { url: "/login" },
          error: null,
        };
      },
      async signOut() {
        return { error: null };
      },
    },
    from(table: string) {
      if (table !== "user_media_list") {
        return {
          select() {
            return new SmokeSelectQuery(activeUserId);
          },
          upsert: async () => ({ error: null }),
          update: () => new SmokeMutationQuery(activeUserId, "update", {}),
          delete: () => new SmokeMutationQuery(activeUserId, "delete"),
        };
      }

      return {
        select() {
          return new SmokeSelectQuery(activeUserId);
        },
        async upsert(payload: Partial<SmokeLibraryRow>) {
          const targetUserId = String(payload.user_id ?? activeUserId);
          const rows = ensureSmokeRows(targetUserId);
          const existingIndex = rows.findIndex(
            (row) =>
              row.user_id === targetUserId &&
              row.source === String(payload.source ?? "") &&
              row.external_id === String(payload.external_id ?? ""),
          );

          if (existingIndex >= 0) {
            rows[existingIndex] = {
              ...rows[existingIndex],
              ...payload,
              user_id: targetUserId,
            } as SmokeLibraryRow;
          } else {
            rows.unshift({
              id: `smoke-entry-${smokeEntryIdCounter++}`,
              user_id: targetUserId,
              media_kind: (payload.media_kind as "ANIME" | "MANGA") ?? "ANIME",
              source: String(payload.source ?? "Unknown"),
              external_id: String(payload.external_id ?? ""),
              title: String(payload.title ?? "Untitled"),
              subtitle: (payload.subtitle as string | null | undefined) ?? null,
              image_url: (payload.image_url as string | null | undefined) ?? null,
              score: (payload.score as number | null | undefined) ?? null,
              status: String(payload.status ?? "PLAN"),
              progress: Number(payload.progress ?? 0),
              notes: (payload.notes as string | null | undefined) ?? null,
              created_at: new Date().toISOString(),
            });
          }

          return { error: null };
        },
        update(payload: Partial<SmokeLibraryRow>) {
          return new SmokeMutationQuery(activeUserId, "update", payload);
        },
        delete() {
          return new SmokeMutationQuery(activeUserId, "delete");
        },
      };
    },
  } as unknown as SupabaseServerClient;
}

export async function createSupabaseServerClient(): Promise<SupabaseServerClient> {
  if (isSmokeModeEnabled()) {
    const cookieStore = await cookies();
    const smokeUser = smokeUserFromCookie(cookieStore.get("kigen_smoke_auth")?.value);
    return createSmokeSupabaseClient(smokeUser);
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignored in Server Components where cookies are read-only.
          }
        },
      },
    },
  );
}
