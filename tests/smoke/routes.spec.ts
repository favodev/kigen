import { expect, test, type Page } from "@playwright/test";

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

test("home route renders dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard de Inicio" })).toBeVisible();
});

test("home shows library saved banner", async ({ page }) => {
  await page.goto("/?library=saved");
  await expect(page.getByText("Library Saved")).toBeVisible();
});

test("home shows library updated banner", async ({ page }) => {
  await page.goto("/?library=updated");
  await expect(page.getByText("Library Updated")).toBeVisible();
});

test("home shows library removed banner", async ({ page }) => {
  await page.goto("/?library=removed");
  await expect(page.getByText("Library Removed")).toBeVisible();
});

test("home shows library save-failed banner", async ({ page }) => {
  await page.goto("/?library=save-failed");
  await expect(page.getByText("Library Save Failed")).toBeVisible();
});

test("home shows library update-failed banner", async ({ page }) => {
  await page.goto("/?library=update-failed");
  await expect(page.getByText("Library Update Failed")).toBeVisible();
});

test("home shows library remove-failed banner", async ({ page }) => {
  await page.goto("/?library=remove-failed");
  await expect(page.getByText("Library Remove Failed")).toBeVisible();
});

test("home shows library setup-required banner", async ({ page }) => {
  await page.goto("/?library=setup-required");
  await expect(page.getByText("Library Setup Required")).toBeVisible();
});

test("anime detail shows saved banner", async ({ page }) => {
  await page.goto("/media/anime/1?library=saved");
  await expect(page.getByText("Saved")).toBeVisible();
});

test("anime detail shows update-failed banner", async ({ page }) => {
  await page.goto("/media/anime/1?library=update-failed");
  await expect(page.getByText("Update failed")).toBeVisible();
});

test("manga detail shows removed banner", async ({ page }) => {
  await page.goto("/media/manga/1?library=removed");
  await expect(page.getByText("Removed")).toBeVisible();
});

test("manga detail shows save-failed banner", async ({ page }) => {
  await page.goto("/media/manga/1?library=save-failed");
  await expect(page.getByText("Save failed")).toBeVisible();
});

test("library route renders authenticated state in smoke auth", async ({ page }) => {
  await enableSmokeAuth(page);
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Bienvenido, smoke@kigen.local" })).toBeVisible();
});

test("anime detail actions redirect with success states", async ({ page }) => {
  await enableSmokeAuth(page);
  await page.goto("/media/anime/1");

  await page.getByRole("button", { name: "guardar en biblioteca" }).click();
  await expect(page).toHaveURL(/library=saved/);
  await expect(page.getByText("Saved")).toBeVisible();

  await page.getByRole("button", { name: "guardar cambios" }).click();
  await expect(page).toHaveURL(/library=updated/);
  await expect(page.getByText("Updated")).toBeVisible();

  await page.getByRole("button", { name: "quitar de biblioteca" }).click();
  await expect(page).toHaveURL(/library=removed/);
  await expect(page.getByText("Removed")).toBeVisible();
});

test("manga detail actions redirect with success states", async ({ page }) => {
  await enableSmokeAuth(page);
  await page.goto("/media/manga/1");

  await page.getByRole("button", { name: "guardar en biblioteca" }).click();
  await expect(page).toHaveURL(/library=saved/);
  await expect(page.getByText("Saved")).toBeVisible();

  await page.getByRole("button", { name: "guardar cambios" }).click();
  await expect(page).toHaveURL(/library=updated/);
  await expect(page.getByText("Updated")).toBeVisible();

  await page.getByRole("button", { name: "quitar de biblioteca" }).click();
  await expect(page).toHaveURL(/library=removed/);
  await expect(page.getByText("Removed")).toBeVisible();
});

test("dashboard quick actions redirect with success states", async ({ page }) => {
  await enableSmokeAuth(page);
  await page.goto("/");

  const animeSection = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Trending Anime" }),
  });
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
});

test("library route handles unauthenticated state", async ({ page }) => {
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Inicia sesion para ver tu biblioteca" })).toBeVisible();
});

test("invalid anime detail returns not-found status", async ({ request }) => {
  const response = await request.get("/media/anime/not-a-number");
  expect(response.status()).toBe(404);
  await expect(response.text()).resolves.toContain("No encontramos esa ficha");
});
