import { expect, test } from "@playwright/test";

test("release scope, local-processing limits, and browser support are visible before import", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".compatibility-notice")).toBeHidden();
  await expect(page.getByText("发布验收仅覆盖 test1.html 与 test2.html，不代表支持所有 AI 生成的 HTML。", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "选择本地 HTML" }).click();
  const trust = page.getByRole("dialog", { name: "仅打开受信任的 HTML" });
  await expect(trust).toContainText("文件和修改只在浏览器本地处理");
  await expect(trust).toContainText("本地处理不等于完全离线");
  await expect(trust).toContainText("外部资源与脚本保留原链接");
  await expect(trust).toContainText("最新版桌面 Chrome 或 Edge");
});

test("unsupported mobile-sized environments keep the desktop Chrome and Edge boundary explicit", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 900 });
  await page.goto("/");
  const notice = page.locator(".compatibility-notice");
  await expect(notice).toBeVisible();
  await expect(notice).toContainText("最新版桌面 Chrome 或 Edge");
});
