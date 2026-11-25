import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { Page } from "@playwright/test";
const evidence = process.env.TRIP_FIXER_SCREENSHOTS;
async function shot(page: Page, name: string) {
  if (evidence) {
    await mkdir(evidence, { recursive: true });
    await page.screenshot({
      path: evidence + "/" + name + ".png",
      fullPage: true,
    });
  }
}
async function demo(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the 14:50 demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Make a K-pop stage video" }),
  ).toBeVisible();
}
async function wait45(page: Page) {
  await page.getByRole("button", { name: "Long wait" }).click();
  await page.getByRole("button", { name: "45 min" }).click();
}
test("desktop demo, two-tap wait, Korean help, reload, end", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "What do you want to keep?" }),
  ).toBeVisible();
  await shot(page, "01-desktop");
  await page.getByRole("button", { name: "Try the 14:50 demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Make a K-pop stage video" }),
  ).toBeVisible();
  await wait45(page);
  await expect(
    page.getByRole("heading", { name: "Take a photo at HiKR Street" }),
  ).toBeVisible();
  await expect(page.getByText(/15:35, past your 15:30 return/)).toBeVisible();
  await page.getByRole("button", { name: "Ask staff" }).click();
  await expect(page.locator("[lang=ko]")).toContainText("버스 정류장");
  await shot(page, "02-recovered");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Take a photo at HiKR Street" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "End trip" }).click();
  await expect(
    page.getByRole("heading", { name: "What do you want to keep?" }),
  ).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
});
test("strict goal, no match, undo restores original stage", async ({
  page,
}) => {
  await demo(page);
  await page.getByRole("button", { name: "Edit plan" }).click();
  await page.getByText("Film a performance on set").click();
  await page.getByRole("button", { name: "Find my next move" }).click();
  await expect(
    page.getByRole("heading", { name: "Make a K-pop stage video" }),
  ).toBeVisible();
  await wait45(page);
  await expect(
    page.getByRole("heading", { name: "No match for this goal" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Find the meeting place" }),
  ).toHaveAttribute("href", /google.com\/maps\/search/);
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(
    page.getByRole("heading", { name: "Make a K-pop stage video" }),
  ).toBeVisible();
});
test("checked estimates, origin edit clears route-specific evidence", async ({
  page,
}) => {
  await demo(page);
  await page.getByText("I checked the timing").click();
  for (const [label, value] of [
    ["Get there", "3"],
    ["Wait", "4"],
    ["Do the activity", "10"],
    ["Return to meeting point", "6"],
  ])
    await page
      .getByRole("spinbutton", { name: label, exact: true })
      .fill(value);
  await page.getByLabel("I checked that this activity is available.").check();
  await page.getByRole("button", { name: "Check my return time" }).click();
  await expect(page.getByText("Estimated return · 15:13")).toBeVisible();
  await page.getByRole("button", { name: "Edit plan" }).click();
  await page.getByLabel("Starting from").selectOption("bridge");
  await page.getByRole("button", { name: "Find my next move" }).click();
  await expect(page.getByText("Check on site", { exact: true })).toBeVisible();
});
test("mobile whole-venue closure, undo and activity skip", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await shot(page, "03-mobile");
  await page.getByRole("button", { name: "Try the 14:50 demo" }).click();
  await page.getByRole("button", { name: "Closed", exact: true }).click();
  await page.getByRole("button", { name: "All of HiKR Ground" }).click();
  await expect(
    page.getByRole("heading", { name: "No match for this goal" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo last change" }).click();
  await page.getByRole("button", { name: "Skip this activity" }).click();
  await expect(
    page.getByRole("heading", { name: "Take a photo at HiKR Street" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await shot(page, "04-mobile-result");
});
test("note needs confirmation and raw note never reaches session storage", async ({
  page,
}) => {
  await page.route("**/api/recover", async (route) => {
    if (route.request().postDataJSON().op === "interpret")
      return route.fulfill({
        json: {
          kind: "suggestion",
          suggestion: { goal: "walk", preferStage: false, stepFree: true },
        },
      });
    await route.continue();
  });
  await page.goto("/");
  await page.getByText("Describe it in your own words").click();
  await page
    .getByLabel("Your travel note")
    .fill("My private note, stream walk.");
  await page.getByRole("button", { name: "Read my note" }).click();
  await expect(
    page.getByText("Suggested goal · A walk by the stream"),
  ).toBeVisible();
  await expect(
    page.getByRole("radio", { name: /A photo together/ }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Use this suggestion" }).click();
  await expect(
    page.getByRole("radio", { name: /A walk by the stream/ }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Find my next move" }).click();
  await expect(
    page.getByRole("heading", { name: /No match|Time to head back/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => JSON.stringify(sessionStorage)),
  ).not.toContain("My private note");
});
test("HTTP errors and bounds", async ({ request }) => {
  expect((await request.post("/api/recover", { data: "bad" })).status()).toBe(
    415,
  );
  expect(
    (
      await request.post("/api/recover", {
        headers: { "content-type": "application/json" },
        data: "{",
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/recover", {
        data: { op: "interpret", text: "x".repeat(301) },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/recover", {
        data: { op: "interpret", text: "x".repeat(14500) },
      })
    ).status(),
  ).toBe(413);
  const response = await request.post("/api/recover", {
    data: {
      op: "evaluate",
      mode: "demo",
      observations: [],
      plan: {
        goal: "walk",
        preferStage: false,
        stepFree: true,
        origin: "entrance",
        meet: "entrance",
        timing: { kind: "clock", time: "15:30" },
      },
    },
  });
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect((await response.json()).pick).toBeNull();
});
test("a new staff report can restore a previously excluded strict activity", async ({
  page,
}) => {
  await demo(page);
  await page.getByRole("button", { name: "Edit plan" }).click();
  await page.getByText("Film a performance on set").click();
  await page.getByRole("button", { name: "Find my next move" }).click();
  await wait45(page);
  await expect(
    page.getByRole("heading", { name: "No match for this goal" }),
  ).toBeVisible();
  await page.getByText("My timing reports").click();
  await page.getByLabel("New wait for 2F K-pop stage").fill("5");
  await page.getByRole("button", { name: "Update wait" }).click();
  await expect(
    page.getByRole("heading", { name: "Make a K-pop stage video" }),
  ).toBeVisible();
  await expect(page.getByText("Check on site", { exact: true })).toBeVisible();
});
