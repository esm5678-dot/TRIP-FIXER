import { expect, test } from "@playwright/test";
import translations from "../../data/translations.json" with { type: "json" };

for (const [width, language] of [
  [320, "fr"],
  [360, "zh-Hans"],
  [390, "en"],
  [430, "ja"],
] as const) {
  test(`mobile setup and recovery at ${width}px in ${language}`, async ({
    page,
  }) => {
    const t = (key: keyof typeof translations) =>
      language === "en" ? key : translations[key][language];
    await page.setViewportSize({ width, height: 740 });
    await page.goto("/");
    await page.locator(".language select").selectOption(language);
    const next = page.getByRole("button", { name: t("Choose return details") });
    await expect(next).toBeInViewport();
    await expect(page.getByLabel(t("Starting from"))).toBeHidden();
    await page.getByText(t("A K-pop stage video"), { exact: true }).click();
    await next.click();
    await expect(page.getByText(t("Plan your return"))).toBeFocused();
    await page.getByLabel(t("Starting from")).selectOption("stage");
    await page.getByRole("button", { name: t("Back"), exact: true }).click();
    await expect(
      page.getByRole("radio", { name: new RegExp(t("A K-pop stage video")) }),
    ).toBeChecked();
    await next.click();
    await expect(page.getByLabel(t("Starting from"))).toHaveValue("stage");
    await page.getByRole("button", { name: t("Set a time") }).click();
    await page.getByRole("button", { name: t("Find my next move") }).click();
    await expect(page.locator(".result")).toBeVisible();
    await page.getByRole("button", { name: t("End trip") }).click();
    await page.getByRole("button", { name: t("Try the 14:50 demo") }).click();
    const wait = page.getByRole("button", { name: t("Long wait") });
    expect((await wait.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await wait.click();
    await page
      .getByRole("button", { name: t("{0} min").replace("{0}", "45") })
      .click();
    await page.getByRole("button", { name: t("Ask staff") }).click();
    await expect(page.locator("[lang=ko]")).toContainText("버스 정류장");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  });
}
