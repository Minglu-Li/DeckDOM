import { expect, test } from "@playwright/test";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const fixture = fileURLToPath(new URL("./fixtures/appearance-overrides.html", import.meta.url));

async function importFixture(page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "选择本地 HTML" }).click();
  const chooserPromise = page.waitForEvent("filechooser");
  await page
    .getByRole("dialog", { name: "仅打开受信任的 HTML" })
    .getByRole("button", { name: "我信任此文件，继续" })
    .click();
  await (await chooserPromise).setFiles(fixture);
  return page.frameLocator('iframe[title="HTML 工作副本"]');
}

async function computedStyle(locator, property) {
  return locator.evaluate((element, name) => getComputedStyle(element)[name], property);
}

test("previews and commits a local appearance override as one recoverable intent", async ({
  context,
  page,
}, testInfo) => {
  const workingCopy = await importFixture(page);
  const selected = workingCopy.locator("#primary-copy");
  const untouched = workingCopy.locator("#secondary-copy");
  await selected.click();

  const initialElementWidth = await selected.evaluate((element) => element.getBoundingClientRect().width);
  const initialOverlayWidth = (await page.getByLabel("当前选框").boundingBox()).width;
  await page.getByLabel("背景色", { exact: true }).fill("#123456");
  await page.getByLabel("边框颜色", { exact: true }).fill("#654321");
  await page.locator('.appearance-fields select[name="borderStyle"]').selectOption("dashed", { force: true });
  await page.locator('.appearance-fields input[name="borderWidth"]').fill("10");
  await page.locator('.appearance-fields input[name="borderRadius"]').fill("18");

  await expect.poll(() => computedStyle(selected, "backgroundColor")).toBe("rgb(18, 52, 86)");
  await expect.poll(() => computedStyle(selected, "borderColor")).toBe("rgb(101, 67, 33)");
  await expect.poll(() => computedStyle(selected, "borderStyle")).toBe("dashed");
  await expect.poll(() => computedStyle(selected, "borderWidth")).toBe("10px");
  await expect.poll(() => computedStyle(selected, "borderRadius")).toBe("18px");
  await expect.poll(() => selected.evaluate((element) => element.getBoundingClientRect().width))
    .toBeGreaterThan(initialElementWidth);
  await expect.poll(async () => (await page.getByLabel("当前选框").boundingBox()).width)
    .toBeGreaterThan(initialOverlayWidth);

  await expect.poll(() => computedStyle(untouched, "backgroundColor")).toBe("rgb(250, 250, 250)");
  await expect.poll(() => computedStyle(untouched, "borderWidth")).toBe("2px");
  await page.getByRole("button", { name: "保存外观" }).click();

  await page.getByRole("button", { name: "撤销" }).click();
  await expect.poll(() => computedStyle(selected, "backgroundColor")).toBe("rgb(250, 250, 250)");
  await expect.poll(() => computedStyle(selected, "borderWidth")).toBe("2px");
  await page.getByRole("button", { name: "重做" }).click();
  await expect.poll(() => computedStyle(selected, "backgroundColor")).toBe("rgb(18, 52, 86)");
  await expect.poll(() => computedStyle(selected, "borderWidth")).toBe("10px");

  await page.reload();
  await expect.poll(() => computedStyle(workingCopy.locator("#primary-copy"), "borderRadius")).toBe("18px");
  await expect.poll(() => computedStyle(workingCopy.locator("#secondary-copy"), "borderRadius")).toBe("4px");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 HTML" }).click();
  const download = await downloadPromise;
  const downloadPath = path.join(testInfo.outputDir, download.suggestedFilename());
  await download.saveAs(downloadPath);
  const deliverable = await context.newPage();
  await deliverable.goto(pathToFileURL(downloadPath).href);
  await expect.poll(() => computedStyle(deliverable.locator("#primary-copy"), "backgroundColor"))
    .toBe("rgb(18, 52, 86)");
  await expect.poll(() => computedStyle(deliverable.locator("#primary-copy"), "borderWidth"))
    .toBe("10px");
  await expect.poll(() => computedStyle(deliverable.locator("#secondary-copy"), "borderWidth"))
    .toBe("2px");
});

test("applies appearance to an image and a parent container without touching peers or descendants", async ({
  context,
  page,
}, testInfo) => {
  const workingCopy = await importFixture(page);
  const selectedImage = workingCopy.locator("#primary-image");
  const untouchedImage = workingCopy.locator("#secondary-image");
  const parent = workingCopy.locator("#primary-card");
  const child = workingCopy.locator("#primary-copy");
  const untouchedParent = workingCopy.locator("#secondary-card");

  await selectedImage.click();
  await expect(page.getByLabel("外观覆盖")).toBeVisible();
  await page.getByLabel("背景色", { exact: true }).fill("#102030");
  await page.locator('.appearance-fields select[name="borderStyle"]').selectOption("dotted", { force: true });
  await page.locator('.appearance-fields input[name="borderWidth"]').fill("7");
  await page.locator('.appearance-fields input[name="borderRadius"]').fill("14");
  await page.getByRole("button", { name: "保存外观" }).click();
  await expect.poll(() => computedStyle(selectedImage, "borderStyle")).toBe("dotted");
  await expect.poll(() => computedStyle(selectedImage, "borderWidth")).toBe("7px");
  await expect.poll(() => computedStyle(untouchedImage, "borderWidth")).toBe("2px");

  await child.click();
  const childBackgroundBefore = await computedStyle(child, "backgroundColor");
  const childBorderBefore = await computedStyle(child, "borderWidth");
  await page.getByRole("button", { name: "选择父容器" }).click();
  await expect(page.getByLabel("当前对象")).toContainText("普通容器");
  await expect(page.getByLabel("外观覆盖")).toBeVisible();
  await page.getByLabel("背景色", { exact: true }).fill("#abcdef");
  await page.getByLabel("边框颜色", { exact: true }).fill("#fedcba");
  await page.locator('.appearance-fields select[name="borderStyle"]').selectOption("double", { force: true });
  await page.locator('.appearance-fields input[name="borderWidth"]').fill("6");
  await page.locator('.appearance-fields input[name="borderRadius"]').fill("22");
  await page.getByRole("button", { name: "保存外观" }).click();

  await expect.poll(() => computedStyle(parent, "backgroundColor")).toBe("rgb(171, 205, 239)");
  await expect.poll(() => computedStyle(parent, "borderStyle")).toBe("double");
  await expect.poll(() => computedStyle(child, "backgroundColor")).toBe(childBackgroundBefore);
  await expect.poll(() => computedStyle(child, "borderWidth")).toBe(childBorderBefore);
  await expect.poll(() => computedStyle(untouchedParent, "backgroundColor")).toBe("rgb(240, 244, 248)");

  await page.getByRole("button", { name: "撤销" }).click();
  await expect.poll(() => computedStyle(parent, "backgroundColor")).toBe("rgb(240, 244, 248)");
  await expect.poll(() => computedStyle(selectedImage, "borderWidth")).toBe("7px");
  await page.getByRole("button", { name: "撤销" }).click();
  await expect.poll(() => computedStyle(selectedImage, "borderWidth")).toBe("2px");
  await page.getByRole("button", { name: "重做" }).click();
  await page.getByRole("button", { name: "重做" }).click();
  await expect.poll(() => computedStyle(selectedImage, "borderWidth")).toBe("7px");
  await expect.poll(() => computedStyle(parent, "borderRadius")).toBe("22px");

  await page.reload();
  await expect.poll(() => computedStyle(workingCopy.locator("#primary-image"), "borderWidth")).toBe("7px");
  await expect.poll(() => computedStyle(workingCopy.locator("#primary-card"), "borderRadius")).toBe("22px");
  await expect.poll(() => computedStyle(workingCopy.locator("#primary-copy"), "borderWidth")).toBe("2px");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 HTML" }).click();
  const download = await downloadPromise;
  const downloadPath = path.join(testInfo.outputDir, download.suggestedFilename());
  await download.saveAs(downloadPath);
  const deliverable = await context.newPage();
  await deliverable.goto(pathToFileURL(downloadPath).href);
  await expect.poll(() => computedStyle(deliverable.locator("#primary-image"), "borderWidth"))
    .toBe("7px");
  await expect.poll(() => computedStyle(deliverable.locator("#primary-card"), "borderRadius"))
    .toBe("22px");
  await expect.poll(() => computedStyle(deliverable.locator("#secondary-card"), "borderRadius"))
    .toBe("4px");
});
