import { expect, test } from "@playwright/test";

test("opens the empty editor workspace in supported desktop Chromium", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("HTML Visual Editor");
  await expect(page.getByRole("banner", { name: "文件与编辑工具" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "HTML 层级" })).toBeVisible();
  await expect(page.getByRole("main", { name: "尚未载入" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "对象属性" })).toBeVisible();
  await expect(page.getByRole("contentinfo", { name: "编辑器状态" })).toBeVisible();

  await expect(page.getByRole("heading", { name: "把 HTML 放到工作台" })).toBeVisible();
  await expect(page.getByText("文件仅在浏览器本地处理", { exact: true })).toBeVisible();
  await expect(page.getByText("编辑器不会把文档上传到产品服务器。", { exact: true })).toBeVisible();
  await expect(page.getByText("选择本地 HTML", { exact: true })).toBeVisible();
  await expect(page.getByText("幻灯片缩略图", { exact: true })).toHaveCount(0);
  await expect(page.locator(".compatibility-notice")).toBeHidden();
});

test("shows a compatibility notice at a mobile-sized viewport", async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 820 });
  await page.goto("/");

  const notice = page.locator(".compatibility-notice");
  await expect(notice).toBeVisible();
  await expect(notice).toContainText("当前环境不在正式支持范围内");
  await expect(notice).toContainText("最新版桌面 Chrome 或 Edge");
});
