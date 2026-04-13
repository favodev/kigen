import { expect, test } from "@playwright/test";

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
