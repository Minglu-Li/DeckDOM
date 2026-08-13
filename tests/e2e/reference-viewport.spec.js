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

async function expectSelectionContains(page, workingCopy, target) {
  const overlay = await page.getByLabel("当前选框").boundingBox();
  const box = await workingCopy.locator(target).boundingBox();
  expect(overlay).not.toBeNull();
  expect(box).not.toBeNull();
  expect(overlay.x).toBeLessThanOrEqual(box.x + 3);
  expect(overlay.y).toBeLessThanOrEqual(box.y + 3);
  expect(overlay.x + overlay.width).toBeGreaterThanOrEqual(box.x + box.width - 3);
  expect(overlay.y + overlay.height).toBeGreaterThanOrEqual(box.y + box.height - 3);
}

test("user can resize and zoom a desktop reference viewport without changing document layout size", async ({ page }) => {
  const workingCopy = await importTrustedHtml(page, "test2.html");
  const frame = page.locator('iframe[title="HTML 工作副本"]');

  await expect(page.getByLabel("参考视口宽度")).toHaveValue("1440");
  await expect(page.getByLabel("参考视口高度")).toHaveValue("900");
  await expect(frame).toHaveAttribute("width", "1440");
  await expect(frame).toHaveAttribute("height", "900");
  await expect(page.getByText("修改只保证当前参考视口下的预期结果", { exact: true })).toBeVisible();

  await workingCopy.getByRole("heading", { name: "iPhone", exact: true }).click();
  await expectSelectionContains(page, workingCopy, "#iphone h1");

  await page.getByLabel("参考视口宽度").fill("1024");
  await page.getByLabel("参考视口高度").fill("768");
  await page.getByRole("button", { name: "应用参考视口" }).click();
  await expect(frame).toHaveAttribute("width", "1024");
  await expect(frame).toHaveAttribute("height", "768");
  await expect
    .poll(() => page.frames().find((candidate) => candidate !== page.mainFrame())?.evaluate(() => window.innerWidth))
    .toBe(1024);
  await expect
    .poll(() => workingCopy.locator(".two-col-wrap").first().evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(" ").length,
    ))
    .toBe(1);
  await expectSelectionContains(page, workingCopy, "#iphone h1");

  const iframeViewportBeforeZoom = await frame.evaluate((element) => ({
    width: element.contentWindow.innerWidth,
    height: element.contentWindow.innerHeight,
  }));
  await page.getByRole("button", { name: "放大" }).click();
  await expect(page.getByLabel("画布显示缩放")).toHaveText("74%");
  await expect
    .poll(() => frame.evaluate((element) => element.getBoundingClientRect().width))
    .toBeCloseTo(1024 * 0.74, 0);
  expect(await frame.evaluate((element) => element.contentWindow.innerWidth)).toBe(iframeViewportBeforeZoom.width);
  expect(await frame.evaluate((element) => element.contentWindow.innerHeight)).toBe(iframeViewportBeforeZoom.height);
  await expectSelectionContains(page, workingCopy, "#iphone h1");

  await page.getByRole("button", { name: "适合画布" }).click();
  await expect(page.getByLabel("画布显示缩放")).not.toHaveText("74%");
  await expectSelectionContains(page, workingCopy, "#iphone h1");
});

test("long page remains scrollable and selection follows content outside the first viewport", async ({ page }) => {
  const workingCopy = await importTrustedHtml(page, "test2.html");
  await workingCopy.getByRole("heading", { name: "Apple Trade In 换购计划", exact: true }).scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.frames().find((candidate) => candidate !== page.mainFrame())?.evaluate(() => window.scrollY))
    .toBeGreaterThan(900);
  await workingCopy.getByRole("heading", { name: "Apple Trade In 换购计划", exact: true }).click();
  await expectSelectionContains(page, workingCopy, "#tradein h2");

  await workingCopy.getByRole("heading", { name: "iPhone", exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByLabel("当前选框")).not.toBeInViewport();
  await expect(page.getByLabel("对象路径")).toContainText("tradein");
  await expect(workingCopy.locator(".product-section")).toHaveCount(4);
});

test("paged acceptance fixture keeps its original page shape after viewport changes", async ({ page }) => {
  const workingCopy = await importTrustedHtml(page, "test1.html");
  await expect(workingCopy.locator(".slide-item")).toHaveCount(12);
  await expect(workingCopy.locator(".slide-item.active")).toHaveCount(1);

  await page.getByLabel("参考视口宽度").fill("1280");
  await page.getByLabel("参考视口高度").fill("720");
  await page.getByRole("button", { name: "应用参考视口" }).click();
  await expect(workingCopy.locator(".slide-item")).toHaveCount(12);
  await expect(workingCopy.locator(".slide-item.active")).toHaveCount(1);
  await expect(page.getByText("幻灯片缩略图", { exact: true })).toHaveCount(0);
});
