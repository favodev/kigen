import { expect, test, type Page } from "@playwright/test";

type BannerCase = {
  name: string;
  path: string;
  text: string;
  requiresSmokeAuth?: boolean;
};

async function enableSmokeAuth(page: Page) {
  await page.context().addCookies([
    {
      name: "kigen_smoke_auth",
      value: "1",
      domain: "localhost",
      path: "/",
    },
  ]);
}

function sectionByHeading(page: Page, heading: string) {
  return page.locator("article").filter({
    has: page.getByRole("heading", { name: heading }),
  });
}

async function assertBannerCase(page: Page, bannerCase: BannerCase) {
  if (bannerCase.requiresSmokeAuth) {
    await enableSmokeAuth(page);
  }

  await page.goto(bannerCase.path);
  await expect(page.getByText(bannerCase.text)).toBeVisible();
}

async function assertDetailActionFlow(page: Page, detailPath: string) {
  await enableSmokeAuth(page);
  await page.goto(detailPath);

  await page.getByRole("button", { name: "guardar en biblioteca" }).click();
  await expect(page).toHaveURL(/library=saved/);
  await expect(page.getByText("Saved")).toBeVisible();

  await page.getByRole("button", { name: "guardar cambios" }).click();
  await expect(page).toHaveURL(/library=updated/);
  await expect(page.getByText("Updated")).toBeVisible();

  await page.getByRole("button", { name: "quitar de biblioteca" }).click();
  await expect(page).toHaveURL(/library=removed/);
  await expect(page.getByText("Removed")).toBeVisible();
}

const homeLibraryBannerCases: BannerCase[] = [
  { name: "saved", path: "/?library=saved", text: "Library Saved" },
  { name: "updated", path: "/?library=updated", text: "Library Updated" },
  { name: "removed", path: "/?library=removed", text: "Library Removed" },
  { name: "save-failed", path: "/?library=save-failed", text: "Library Save Failed" },
  { name: "update-failed", path: "/?library=update-failed", text: "Library Update Failed" },
  { name: "remove-failed", path: "/?library=remove-failed", text: "Library Remove Failed" },
  {
    name: "setup-required",
    path: "/?library=setup-required",
    text: "Library Setup Required",
  },
];

const mediaDetailBannerCases: BannerCase[] = [
  { name: "anime saved", path: "/media/anime/1?library=saved", text: "Saved" },
  {
    name: "anime update-failed",
    path: "/media/anime/1?library=update-failed",
    text: "Update failed",
  },
  { name: "manga removed", path: "/media/manga/1?library=removed", text: "Removed" },
  {
    name: "manga save-failed",
    path: "/media/manga/1?library=save-failed",
    text: "Save failed",
  },
];

const libraryAuthenticatedBannerCases: BannerCase[] = [
  {
    name: "saved",
    path: "/library?library=saved",
    text: "Item guardado correctamente en biblioteca.",
    requiresSmokeAuth: true,
  },
  {
    name: "updated",
    path: "/library?library=updated",
    text: "Tracking actualizado correctamente.",
    requiresSmokeAuth: true,
  },
  {
    name: "removed",
    path: "/library?library=removed",
    text: "Item quitado correctamente de biblioteca.",
    requiresSmokeAuth: true,
  },
  {
    name: "update-failed",
    path: "/library?library=update-failed",
    text: "No se pudo actualizar el item ahora. Reintenta en unos segundos.",
    requiresSmokeAuth: true,
  },
  {
    name: "remove-failed",
    path: "/library?library=remove-failed",
    text: "No se pudo quitar el item ahora. Reintenta en unos segundos.",
    requiresSmokeAuth: true,
  },
  {
    name: "setup-required",
    path: "/library?setup=required",
    text: "Database setup required",
    requiresSmokeAuth: true,
  },
];

test("home route renders dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard de Inicio" })).toBeVisible();
});

test("home today releases shows live status and countdown metadata", async ({ page }) => {
  await page.goto("/");
  const releasesSection = sectionByHeading(page, "Today Releases");

  await expect(releasesSection.getByText("live anilist")).toBeVisible();

  const firstCard = releasesSection.locator("ul > li").first();
  await expect(firstCard).toContainText(/(calculando countdown\.\.\.|\d+d \d+h \d+m \d+s)/i);
  await expect(firstCard).toContainText("local:");
  await expect(firstCard).toContainText(/(validacion jikan \d+%|sin validacion jikan)/i);
});

for (const bannerCase of homeLibraryBannerCases) {
  test(`home shows library ${bannerCase.name} banner`, async ({ page }) => {
    await assertBannerCase(page, bannerCase);
  });
}

for (const bannerCase of mediaDetailBannerCases) {
  test(`media detail shows ${bannerCase.name} banner`, async ({ page }) => {
    await assertBannerCase(page, bannerCase);
  });
}

test("library route renders authenticated state in smoke auth", async ({ page }) => {
  await enableSmokeAuth(page);
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Bienvenido, smoke@kigen.local" })).toBeVisible();
});

for (const bannerCase of libraryAuthenticatedBannerCases) {
  test(`library authenticated shows ${bannerCase.name} banner`, async ({ page }) => {
    await assertBannerCase(page, bannerCase);
  });
}

test("login redirects authenticated user to next path", async ({ page }) => {
  await enableSmokeAuth(page);
  await page.goto("/login?next=/library");
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByRole("heading", { name: "Bienvenido, smoke@kigen.local" })).toBeVisible();
});

test("anime detail actions redirect with success states", async ({ page }) => {
  await assertDetailActionFlow(page, "/media/anime/1");
});

test("manga detail actions redirect with success states", async ({ page }) => {
  await assertDetailActionFlow(page, "/media/manga/1");
});

test("dashboard quick actions redirect with success states", async ({ page }) => {
  await enableSmokeAuth(page);
  await page.goto("/");

  const animeSection = sectionByHeading(page, "Trending Anime");
  const firstAnimeCard = animeSection.locator("ul > li").first();

  await firstAnimeCard.getByRole("button", { name: "guardar" }).click();
  await expect(page).toHaveURL(/library=saved/);
  await expect(page.getByText("Library Saved")).toBeVisible();

  await firstAnimeCard.getByRole("button", { name: "guardar" }).click();
  await expect(page).toHaveURL(/library=updated/);
  await expect(page.getByText("Library Updated")).toBeVisible();

  await firstAnimeCard.getByRole("button", { name: "quitar" }).click();
  await expect(page).toHaveURL(/library=removed/);
  await expect(page.getByText("Library Removed")).toBeVisible();
});

test("login route renders auth page", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Iniciar sesion" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar con email" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Crear cuenta" })).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

test("library route handles unauthenticated state", async ({ page }) => {
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Inicia sesion para ver tu biblioteca" })).toBeVisible();
});

test("profile route renders authenticated state in smoke auth", async ({ page }) => {
  await enableSmokeAuth(page);
  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: "Perfil de usuario" })).toBeVisible();
  await expect(page.getByText("persistencia rank: recalculo db (trigger + job horario)")).toBeVisible();
  await expect(page.getByText("(snapshot pendiente)")).toBeVisible();
  await expect(page.getByText("Logros Base (0/5)")).toBeVisible();
});

test("profile route handles unauthenticated state", async ({ page }) => {
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Inicia sesion para ver tu Watcher Rank" })).toBeVisible();
});

test("invalid anime detail returns not-found status", async ({ request }) => {
  const response = await request.get("/media/anime/not-a-number");
  expect(response.status()).toBe(404);
  await expect(response.text()).resolves.toContain("No encontramos esa ficha");
});
