import { Page, expect } from "@playwright/test";

const ROLE_NAMES = {
  manager: "Used-car manager",
  technician: "Service technician",
  sales: "Sales associate",
} as const;

export type Role = keyof typeof ROLE_NAMES;

/** Sign in through the current role picker and wait for the work queue. */
export async function signIn(page: Page, role: Role = "manager") {
  await page.goto("/login");
  await page
    .getByRole("button", { name: new RegExp(ROLE_NAMES[role]) })
    .click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
}
