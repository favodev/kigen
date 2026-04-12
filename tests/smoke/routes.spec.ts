import { expect, test } from "@playwright/test";

test("home route renders dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard de Inicio" })).toBeVisible();
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
