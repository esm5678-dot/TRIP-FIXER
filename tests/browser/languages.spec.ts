import { expect, test } from "@playwright/test";

test("switch languages without losing draft choices, staff questions or the return deadline", async ({
  page,
}) => {
  await page.goto("/");
  const language = page.locator(".language select");
  await expect(language.locator("option")).toHaveText([
    "한국어",
    "English",
    "日本語",
    "简体中文",
    "Français",
  ]);
  await language.selectOption("fr");
  await page
    .getByText("Une vidéo sur une scène de K-pop", { exact: true })
    .click();
  await language.selectOption("ja");
  await expect(page.getByRole("radio", { name: /ステージ動画/ })).toBeChecked();
  await page.getByRole("button", { name: "14:50のデモを試す" }).click();
  await page.getByRole("button", { name: "待ち時間が長い" }).click();
  await page.getByRole("button", { name: "45分" }).click();
  await expect(
    page.getByRole("heading", { name: "HiKR Streetで記念撮影" }),
  ).toBeVisible();
  await language.selectOption("zh-Hans");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hans");
  await expect(
    page.getByText(/最早要到15:35才能开始，已超过15:30/),
  ).toBeVisible();
  await page.getByRole("button", { name: "询问工作人员" }).click();
  await expect(page.locator(".staff p[lang=ko]")).toContainText("버스 정류장");
  await language.selectOption("fr");
  await expect(page.getByText(/Peut-on prendre des photos/)).toBeVisible();
  await page.reload();
  await expect(language).toHaveValue("fr");
  await expect(
    page.getByRole("heading", { name: "Prendre une photo à HiKR Street" }),
  ).toBeVisible();
  await expect(page.locator(".meeting")).toContainText("15:30");
  await language.selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(language).toHaveValue("en");
  await expect(
    page.getByRole("heading", { name: "Take a photo at HiKR Street" }),
  ).toBeVisible();
});

test("an unsupported saved language falls back to Korean", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("tripfixer-language", "unsupported");
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.locator(".language select")).toHaveValue("ko");
  await expect(page.getByRole("heading", { level: 2 })).toContainText(/[가-힣]/);
});
