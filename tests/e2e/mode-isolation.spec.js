import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

const fixturePath = (name) => fileURLToPath(
  new URL(`../../testexample/${name}`, import.meta.url),
);

async function importTrustedHtml(page, name) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "选择本地 HTML" }).click();
  const chooserPromise = page.waitForEvent("filechooser");
  await page
    .getByRole("dialog", { name: "仅打开受信任的 HTML" })
    .getByRole("button", { name: "我信任此文件，继续" })
    .click();
  await (await chooserPromise).setFiles(fixturePath(name));
  return page.frameLocator('iframe[title="HTML 工作副本"]');
}

test("paged document interactions and transitions are isolated while editing and restored in preview", async ({
  page,
}) => {
  const workingCopy = await importTrustedHtml(page, "test1.html");
  const currentPage = workingCopy.locator("#currentPage");
  const documentRoot = workingCopy.locator("html");
  const activeSlide = workingCopy.locator(".slide-item.active");

  await expect(currentPage).toHaveText("1");
  await expect(activeSlide).toHaveCSS("transition-duration", "0s");

  await workingCopy.getByRole("button", { name: "下一页" }).click();
  await expect(currentPage).toHaveText("1");
  await expect(page.getByLabel("当前选择")).toContainText("文字对象");

  await workingCopy.locator("body").press("PageDown");
  await expect(currentPage).toHaveText("1");
  await workingCopy.getByRole("button", { name: "切换主题" }).click();
  await expect(documentRoot).not.toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "预览" }).click();
  await expect(page.locator(".hierarchy-panel")).toBeHidden();
  await expect(page.locator(".properties-panel")).toBeHidden();
  await expect(page.getByLabel("当前选框")).toBeHidden();
  await expect(activeSlide).toHaveCSS("transition-duration", "0.5s");

  await workingCopy.getByRole("button", { name: "下一页" }).click();
  await expect(currentPage).toHaveText("2");
  await workingCopy.locator("body").press("PageDown");
  await expect(currentPage).toHaveText("3");
  await workingCopy.getByRole("button", { name: "切换主题" }).click();
  await expect(documentRoot).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "编辑" }).click();
  await expect(currentPage).toHaveText("3");
  await expect(page.locator(".hierarchy-panel")).toBeVisible();
  await activeSlide.getByRole("heading").first().click();
  await expect(page.getByLabel("当前选择")).toContainText("文字对象");
});

test("long document keeps edits and history while preview restores anchors, scrolling, and transitions", async ({
  page,
}) => {
  const workingCopy = await importTrustedHtml(page, "test2.html");
  const heading = workingCopy.getByRole("heading", { name: "iPhone", exact: true });
  const macAnchor = workingCopy.getByRole("link", { name: "Mac", exact: true });
  const macSection = workingCopy.locator("#mac");

  await expect(workingCopy.locator("#iphone")).toHaveCSS("transition-duration", "0s");
  await expect(macSection).toBeAttached();
  await heading.click();
  const textField = page.getByRole("textbox", { name: "文字内容" });
  await textField.fill("iPhone 预览状态");
  await page.getByRole("button", { name: "应用文字" }).click();
  await expect(page.getByRole("button", { name: "撤销" })).toBeEnabled();

  await macAnchor.click();
  await expect
    .poll(async () => page.frames()[1].evaluate(() => window.location.hash))
    .toBe("");
  await expect
    .poll(async () => page.frames()[1].evaluate(() => window.scrollY))
    .toBe(0);

  await macAnchor.press("Control+Z");
  await expect(workingCopy.getByRole("heading", { name: "iPhone", exact: true })).toBeVisible();
  await macAnchor.press("Control+Y");
  await expect(workingCopy.getByRole("heading", { name: "iPhone 预览状态" })).toBeVisible();

  await page.getByRole("button", { name: "预览" }).click();
  await expect(workingCopy.getByRole("heading", { name: "iPhone 预览状态" })).toBeVisible();
  await expect(macSection).toBeAttached();
  await expect(workingCopy.locator("#iphone")).toHaveCSS("transition-duration", "0.7s, 0.7s");
  await macAnchor.click();
  await expect
    .poll(async () => page.frames()[1].evaluate(() => window.location.hash))
    .toBe("#mac");
  await expect(macSection).toBeAttached();
  await expect
    .poll(async () => page.frames()[1].evaluate(() => window.scrollY))
    .toBeGreaterThan(500);

  await page.getByRole("button", { name: "编辑" }).click();
  await expect
    .poll(async () => page.frames()[1].evaluate(() => window.location.hash))
    .toBe("#mac");
  await expect
    .poll(async () => page.frames()[1].evaluate(() => window.scrollY))
    .toBeGreaterThan(500);
  await page.getByRole("searchbox", { name: "搜索 HTML 层级" }).fill("MacBook Air");
  await page.getByRole("treeitem", { name: "MacBook Air h2 可编辑", exact: true }).click();
  await expect(page.getByLabel("当前选择")).toContainText("文字对象");

  await page.getByRole("button", { name: "撤销" }).click();
  await expect(page.getByRole("button", { name: "撤销" })).toBeDisabled();
});

test("CSS animation is paused only while editing without changing its definition", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "选择本地 HTML" }).click();
  const chooserPromise = page.waitForEvent("filechooser");
  await page
    .getByRole("dialog", { name: "仅打开受信任的 HTML" })
    .getByRole("button", { name: "我信任此文件，继续" })
    .click();
  await (await chooserPromise).setFiles({
    name: "animated.html",
    mimeType: "text/html",
    buffer: Buffer.from(`<!doctype html><html><head><style>
      @keyframes drift { from { transform: translateX(0); } to { transform: translateX(80px); } }
      #animated { animation: drift 30s linear infinite; }
    </style></head><body><p id="animated">Animated object</p></body></html>`),
  });

  const animated = page.frameLocator('iframe[title="HTML 工作副本"]').locator("#animated");
  await expect(animated).toHaveCSS("animation-name", "drift");
  await expect(animated).toHaveCSS("animation-play-state", "paused");

  await page.getByRole("button", { name: "预览" }).click();
  await expect(animated).toHaveCSS("animation-name", "drift");
  await expect(animated).toHaveCSS("animation-play-state", "running");
  await page.getByRole("button", { name: "编辑" }).click();
  await expect(animated).toHaveCSS("animation-name", "drift");
  await expect(animated).toHaveCSS("animation-play-state", "paused");
});
