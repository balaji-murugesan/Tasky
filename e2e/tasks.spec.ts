import { test, expect } from "@playwright/test";

test.beforeEach(async ({ request, page }) => {
  await request.post("/api/__reset");
  await page.goto("/");
});

test("empty state", async ({ page }) => {
  await expect(page.getByText("No tasks yet")).toBeVisible();
  await expect(page.getByTestId("summary")).toHaveText("0 open · 0 done");
});

test("add, complete and delete a task", async ({ page }) => {
  await page.getByLabel("New task").fill("Write the spec");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Write the spec")).toBeVisible();

  await page.getByLabel("Complete Write the spec").check();
  await expect(page.getByTestId("summary")).toHaveText("0 open · 1 done");

  await page.getByLabel("Delete Write the spec").click();
  await expect(page.getByText("No tasks yet")).toBeVisible();
});

test("shows validation error for empty title", async ({ page }) => {
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("alert")).toHaveText("title is required");
});
