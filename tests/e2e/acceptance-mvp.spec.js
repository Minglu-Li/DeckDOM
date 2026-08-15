import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const sourcePath = (name) => fileURLToPath(new URL(`../../testexample/${name}`, import.meta.url));
const screenshotOptions = { animations: "disabled", maxDiffPixelRatio: 0.01 };
const replacementSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#2563eb"/><circle cx="60" cy="40" r="22" fill="#f8fafc"/></svg>`);

test.describe.configure({ mode: "serial", timeout: 90_000 });

async function importOriginal(page, name) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "选择本地 HTML" }).click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("dialog", { name: "仅打开受信任的 HTML" })
    .getByRole("button", { name: "我信任此文件，继续" }).click();
  await (await chooser).setFiles(sourcePath(name));
  return page.frameLocator('iframe[title="HTML 工作副本"]');
}

async function dragBy(page, locator, dx, dy) {
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 8 });
  await page.mouse.up();
}

async function selectThroughTree(page, query, itemName) {
  const treeSearch = page.getByRole("searchbox", { name: "搜索 HTML 层级" });
  await treeSearch.fill(query);
  await page.getByRole("treeitem", { name: itemName }).click();
  await treeSearch.fill("");
}

async function exportToPage(context, page, testInfo) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 HTML" }).click();
  const download = await downloadPromise;
  const downloadPath = path.join(testInfo.outputDir, download.suggestedFilename());
  await download.saveAs(downloadPath);
  const deliverable = await context.newPage();
  await deliverable.goto(pathToFileURL(downloadPath).href, { waitUntil: "domcontentloaded" });
  return deliverable;
}

const renderedState = (locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    text: element.textContent,
    color: style.color,
    fontSize: style.fontSize,
    backgroundColor: style.backgroundColor,
    borderRadius: style.borderRadius,
    rect: {
      x: rect.x + window.scrollX,
      y: rect.y + window.scrollY,
      width: rect.width,
      height: rect.height,
    },
  };
});

function expectUntouched(actual, expected, { position = true } = {}) {
  expect({ ...actual, rect: undefined }).toEqual({ ...expected, rect: undefined });
  const edges = position ? ["x", "y", "width", "height"] : ["width", "height"];
  for (const edge of edges) {
    expect(Math.abs(actual.rect[edge] - expected.rect[edge]), `${edge} rendering drift`).toBeLessThanOrEqual(1);
  }
}

async function expectCleanDeliverable(page) {
  await expect(page.locator('[data-html-editor-assist], [data-html-editor-selected], [contenteditable], meta[name="html-editor-import-token"]')).toHaveCount(0);
  await expect(page.locator(".selection-overlay, .scale-handle, .editor-workspace")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-html-editor-mode");
}

test("the original paged document completes every applicable MVP step without becoming another document", async ({ context, page }, testInfo) => {
  const fixture = sourcePath("test1.html");
  const originalBytes = await readFile(fixture);
  const workingCopy = await importOriginal(page, "test1.html");
  const headline = workingCopy.getByRole("heading", { name: "JVM 垃圾回收 GC 全套课件", exact: true });
  const untouched = workingCopy.getByRole("heading", { name: "面试 / 课堂 PPT 演示专用", exact: true });

  await expect(workingCopy.locator(".slide-item")).toHaveCount(12);
  await expect(workingCopy.locator(".slide-item.active")).toHaveCount(1);
  await expect(workingCopy.locator("img")).toHaveCount(0); // Source-fixture N/A: test1 contains no image object.
  await expect(workingCopy.locator(".slide-wrap")).toHaveScreenshot("test1-initial.png", screenshotOptions);

  await headline.click();
  await expect(page.getByLabel("当前选择")).toContainText("文字对象");
  await page.getByRole("button", { name: "选择父容器" }).click();
  await expect(page.getByLabel("当前对象")).toContainText("普通容器");
  await selectThroughTree(page, "JVM 垃圾回收", /JVM 垃圾回收 GC 全套课件 h1 可编辑/);
  const untouchedBefore = await renderedState(untouched);

  await page.getByRole("textbox", { name: "文字内容" }).fill("JVM GC 发布验收课件");
  await page.getByRole("button", { name: "应用文字", exact: true }).click();
  await page.getByLabel("字号").fill("34");
  await page.getByLabel("文字颜色").fill("#7c2d12");
  await page.getByRole("button", { name: "保存字体属性" }).click();
  await page.getByLabel("背景色", { exact: true }).fill("#fef3c7");
  await page.locator('.appearance-fields input[name="borderRadius"]').fill("18");
  await page.getByRole("button", { name: "保存外观" }).click();
  await dragBy(page, page.getByRole("button", { name: "移动所选内容" }), 36, 18);
  await dragBy(page, page.getByLabel("右下角等比缩放手柄"), 42, 24);
  const edited = await renderedState(workingCopy.getByRole("heading", { name: "JVM GC 发布验收课件" }));

  for (let index = 0; index < 5; index += 1) await page.keyboard.press("Control+Z");
  await expect(headline).toHaveText("JVM 垃圾回收 GC 全套课件");
  await expect(page.getByRole("button", { name: "撤销" })).toBeDisabled();
  await page.keyboard.press("Control+Y");
  await page.keyboard.press("Control+Shift+Z");
  for (let index = 0; index < 3; index += 1) await page.keyboard.press("Control+Y");
  await expect(workingCopy.getByRole("heading", { name: "JVM GC 发布验收课件" })).toHaveCSS("font-size", "34px");
  await page.keyboard.press("Control+Z");
  await page.getByLabel("背景色", { exact: true }).fill("#fde68a");
  await page.getByRole("button", { name: "保存外观" }).click();
  await expect(page.getByRole("button", { name: "重做" })).toBeDisabled();
  await dragBy(page, page.getByLabel("右下角等比缩放手柄"), 42, 24);

  await page.reload();
  const restored = workingCopy.getByRole("heading", { name: "JVM GC 发布验收课件" });
  await expect(restored).toHaveCSS("font-size", "34px");
  await expect(page.getByLabel("当前文档")).toContainText("已从浏览器恢复");
  const reopened = await context.newPage();
  await reopened.goto("/");
  await expect(reopened.frameLocator('iframe[title="HTML 工作副本"]').getByRole("heading", { name: "JVM GC 发布验收课件" })).toBeVisible();
  await reopened.close();
  await expect(workingCopy.locator(".slide-wrap")).toHaveScreenshot("test1-edited.png", screenshotOptions);
  expectUntouched(await renderedState(untouched), untouchedBefore);

  const finalWorkingState = await renderedState(restored);

  const currentPage = workingCopy.locator("#currentPage");
  await workingCopy.getByRole("button", { name: "下一页" }).click();
  await workingCopy.getByRole("button", { name: "上一页" }).click();
  await workingCopy.getByRole("button", { name: "切换主题" }).click();
  await workingCopy.locator("body").press("PageDown");
  await workingCopy.locator("body").press("T");
  await expect(currentPage).toHaveText("1");
  await expect(workingCopy.locator("html")).not.toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "预览" }).click();
  await workingCopy.getByRole("button", { name: "下一页" }).click();
  await expect(currentPage).toHaveText("2");
  await workingCopy.getByRole("button", { name: "上一页" }).click();
  await expect(currentPage).toHaveText("1");
  await workingCopy.locator("body").press("PageDown");
  await expect(currentPage).toHaveText("2");
  await workingCopy.locator("body").press("PageUp");
  await workingCopy.locator("body").press("T");
  await expect(workingCopy.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(workingCopy.locator(".slide-wrap")).toHaveScreenshot("test1-preview.png", screenshotOptions);

  const deliverable = await exportToPage(context, page, testInfo);
  const deliveredHeadline = deliverable.getByRole("heading", { name: "JVM GC 发布验收课件" });
  const delivered = await renderedState(deliveredHeadline);
  expect(delivered.text).toBe(edited.text);
  expect(delivered.fontSize).toBe("34px");
  expect(delivered.color).toBe("rgb(124, 45, 18)");
  expect(delivered.backgroundColor).toBe("rgb(253, 230, 138)");
  expect(delivered.rect).toEqual(finalWorkingState.rect);
  await expect(deliverable.locator(".slide-item")).toHaveCount(12);
  await expect(deliverable.locator(".slide-item.active")).toHaveCount(1);
  await deliverable.getByRole("button", { name: "下一页" }).click();
  await expect(deliverable.locator("#currentPage")).toHaveText("2");
  await deliverable.getByRole("button", { name: "上一页" }).click();
  await deliverable.getByRole("button", { name: "切换主题" }).click();
  await expect(deliverable.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(deliverable.locator(".slide-item.active")).toHaveCSS("transition-duration", "0.5s");
  await expectCleanDeliverable(deliverable);
  await expect(deliverable.locator(".slide-wrap")).toHaveScreenshot("test1-deliverable.png", screenshotOptions);
  expect(await readFile(fixture)).toEqual(originalBytes);
});

test("the original long document completes every MVP step and remains responsive and navigable", async ({ context, page }, testInfo) => {
  await context.route("https://picsum.photos/**", (route) => route.abort("failed"));
  const fixture = sourcePath("test2.html");
  const originalBytes = await readFile(fixture);
  const workingCopy = await importOriginal(page, "test2.html");
  const headline = workingCopy.getByRole("heading", { name: "iPhone", exact: true });
  const description = workingCopy.getByText("来看看 iPhone 最新阵容", { exact: true });
  const hero = workingCopy.getByRole("img", { name: "iPhone 全系" });
  const peerImage = workingCopy.getByRole("img", { name: "MacBook Air M5" });
  const imageMask = [workingCopy.locator("img")];

  await expect(workingCopy.locator(".slide-item")).toHaveCount(0);
  await expect(workingCopy.locator(".product-section")).toHaveCount(4);
  await expect(workingCopy.locator("#iphone")).toHaveScreenshot("test2-initial.png", { ...screenshotOptions, mask: imageMask });
  await headline.click();
  await expect(page.getByLabel("当前选择")).toContainText("文字对象");
  await page.getByRole("button", { name: "选择父容器" }).click();
  await expect(page.getByLabel("当前对象")).toContainText("普通容器");
  await selectThroughTree(page, "iPhone 全系", /iPhone 全系 img 可编辑/);
  await expect(page.getByLabel("当前对象")).toContainText("图片对象");
  const descriptionBefore = await renderedState(description);
  const descriptionMarkup = await description.evaluate((element) => element.outerHTML);
  const peerImageSource = await peerImage.getAttribute("src");

  await headline.click();
  await page.getByRole("textbox", { name: "文字内容" }).fill("iPhone 发布验收阵容");
  await page.getByRole("button", { name: "应用文字", exact: true }).click();
  await page.getByLabel("字号").fill("46");
  await page.getByLabel("文字颜色").fill("#1d4ed8");
  await page.getByRole("button", { name: "保存字体属性" }).click();
  await page.getByLabel("背景色", { exact: true }).fill("#dbeafe");
  await page.locator('.appearance-fields input[name="borderRadius"]').fill("20");
  await page.getByRole("button", { name: "保存外观" }).click();
  await dragBy(page, page.getByRole("button", { name: "移动所选内容" }), 48, 24);
  await dragBy(page, page.getByLabel("右下角等比缩放手柄"), 52, 30);
  await hero.click();
  const imageChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "从本地替换图片" }).click();
  await (await imageChooser).setFiles({ name: "acceptance-blue.svg", mimeType: "image/svg+xml", buffer: replacementSvg });
  await page.getByRole("dialog", { name: "选择图片适配方式" }).getByRole("button", { name: "替换图片" }).click();
  const replacementSource = await hero.getAttribute("src");

  for (let index = 0; index < 6; index += 1) await page.keyboard.press("Control+Z");
  await expect(headline).toHaveText("iPhone");
  await expect(hero).not.toHaveAttribute("src", replacementSource);
  for (let index = 0; index < 6; index += 1) await page.keyboard.press(index === 1 ? "Control+Shift+Z" : "Control+Y");
  await expect(workingCopy.getByRole("heading", { name: "iPhone 发布验收阵容" })).toHaveCSS("font-size", "46px");
  await expect(hero).toHaveAttribute("src", replacementSource);
  await page.keyboard.press("Control+Z");
  await workingCopy.getByRole("heading", { name: "iPhone 发布验收阵容" }).click();
  await page.getByLabel("背景色", { exact: true }).fill("#bfdbfe");
  await page.getByRole("button", { name: "保存外观" }).click();
  await expect(page.getByRole("button", { name: "重做" })).toBeDisabled();
  await hero.click();
  const secondChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "从本地替换图片" }).click();
  await (await secondChooser).setFiles({ name: "acceptance-blue.svg", mimeType: "image/svg+xml", buffer: replacementSvg });
  await page.getByRole("dialog", { name: "选择图片适配方式" }).getByRole("button", { name: "替换图片" }).click();

  const frame = page.locator('iframe[title="HTML 工作副本"]');
  await workingCopy.locator("#iphone h1").hover();
  await page.mouse.wheel(0, 1200);
  await expect.poll(() => frame.evaluate((element) => element.contentWindow.scrollY)).toBeGreaterThan(300);
  await page.getByLabel("参考视口宽度").fill("1024");
  await page.getByLabel("参考视口高度").fill("768");
  await page.getByRole("button", { name: "应用参考视口" }).click();
  await expect(workingCopy.locator(".two-col-wrap").first()).toHaveCSS("grid-template-columns", /px$/);
  await page.getByLabel("参考视口宽度").fill("1440");
  await page.getByLabel("参考视口高度").fill("900");
  await page.getByRole("button", { name: "应用参考视口" }).click();

  await page.reload();
  const restoredHeadline = workingCopy.getByRole("heading", { name: "iPhone 发布验收阵容" });
  await expect(restoredHeadline).toHaveCSS("font-size", "46px");
  await expect(hero).toHaveAttribute("src", replacementSource);
  const reopened = await context.newPage();
  await reopened.goto("/");
  await expect(reopened.frameLocator('iframe[title="HTML 工作副本"]').getByRole("heading", { name: "iPhone 发布验收阵容" })).toBeVisible();
  await reopened.close();
  await expect(workingCopy.locator("#iphone")).toHaveScreenshot("test2-edited.png", { ...screenshotOptions, mask: imageMask });
  expect(await description.evaluate((element) => element.outerHTML)).toBe(descriptionMarkup);
  expectUntouched(await renderedState(description), descriptionBefore, { position: false });
  await expect(peerImage).toHaveAttribute("src", peerImageSource);

  await page.getByRole("button", { name: "预览" }).click();
  await workingCopy.getByRole("link", { name: "Mac", exact: true }).click();
  await expect.poll(() => frame.evaluate((element) => element.contentWindow.location.hash)).toBe("#mac");
  await expect.poll(() => frame.evaluate((element) => element.contentWindow.scrollY)).toBeGreaterThan(500);
  await workingCopy.getByRole("link", { name: "iPhone", exact: true }).click();
  await expect.poll(() => frame.evaluate((element) => element.contentWindow.location.hash)).toBe("#iphone");
  await expect(workingCopy.locator("#iphone")).toHaveScreenshot("test2-preview.png", { ...screenshotOptions, mask: imageMask });

  const expected = await renderedState(restoredHeadline);
  const deliverable = await exportToPage(context, page, testInfo);
  const deliveredHeadline = deliverable.getByRole("heading", { name: "iPhone 发布验收阵容" });
  const actual = await renderedState(deliveredHeadline);
  expect(actual.text).toBe(expected.text);
  expect(actual.fontSize).toBe(expected.fontSize);
  expect(actual.color).toBe(expected.color);
  expect(actual.backgroundColor).toBe(expected.backgroundColor);
  expect(actual.backgroundColor).toBe("rgb(191, 219, 254)");
  await expect(deliverable.getByRole("img", { name: "iPhone 全系" })).toHaveAttribute("src", replacementSource);
  await expect(deliverable.getByRole("img", { name: "MacBook Air M5" })).toHaveAttribute("src", peerImageSource);
  await deliverable.getByRole("link", { name: "Mac", exact: true }).click();
  await expect.poll(() => deliverable.evaluate(() => window.location.hash)).toBe("#mac");
  await expect.poll(() => deliverable.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  await deliverable.setViewportSize({ width: 1024, height: 768 });
  await expect(deliverable.locator(".two-col-wrap").first()).toHaveCSS("grid-template-columns", /px$/);
  await deliverable.setViewportSize({ width: 1440, height: 900 });
  await deliverable.getByRole("link", { name: "iPhone", exact: true }).click();
  await expectCleanDeliverable(deliverable);
  await expect(deliverable.locator("#iphone")).toHaveScreenshot("test2-deliverable.png", { ...screenshotOptions, mask: [deliverable.locator("img")] });
  expect(await readFile(fixture)).toEqual(originalBytes);
});
