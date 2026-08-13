import { expect, test } from "@playwright/test";

const acceptanceFixtures = [
  {
    name: "翻页式验收样例",
    path: "/testexample/test1.html",
    title: "JVM GC 幻灯片演示课件",
    visibleHeading: "JVM 垃圾回收 GC 全套课件",
    shape: "paged",
  },
  {
    name: "长滚动验收样例",
    path: "/testexample/test2.html",
    title: "Apple风格演示页",
    visibleHeading: "iPhone",
    shape: "long-scroll",
  },
];

for (const fixture of acceptanceFixtures) {
  test(`loads the original ${fixture.name} in real Chromium`, async ({ page }) => {
    await page.goto(fixture.path);

    await expect(page).toHaveTitle(fixture.title);
    await expect(page.getByRole("heading", { name: fixture.visibleHeading, exact: true })).toBeVisible();

    if (fixture.shape === "paged") {
      await expect(page.locator(".slide-item.active")).toBeVisible();
      expect(await page.locator(".slide-item").count()).toBeGreaterThan(1);
    } else {
      const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      expect(documentHeight).toBeGreaterThan(900);
      await expect(page.locator("nav a").first()).toBeVisible();
    }
  });
}
