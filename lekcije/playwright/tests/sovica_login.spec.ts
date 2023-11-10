import { test, expect } from "@playwright/test";

test("test admin login", async ({ page }) => {
  await page.goto("http://192.168.31.122:3000/admin/login");
  await page.getByTestId("emailInput").fill("bojana.lazarevic91@gmail.com");
  await page.getByTestId("passwordInput").fill("jasambojana");
  await page.getByTestId("loginButton").click();
  await expect(page.getByTestId("userGreeting")).toContainText("Cao, Boka!");
});

test("blocking invalid logins", async ({ page }) => {
  await page.goto("http://192.168.31.122:3000/admin/login");
  await page.getByTestId("emailInput").fill("bojana.lazarevic91@gmail.com");
  await page.getByTestId("passwordInput").fill("pogresnaSifra");
  await page.getByTestId("loginButton").click();
  await expect(page.getByTestId("loginError")).toContainText("Pogresna sifra!");
});
