import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const fixturePath = (name) => fileURLToPath(new URL(`../../testexample/${name}`, import.meta.url));

async function importTrustedHtml(page, { name, html }) {
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
    name,
    mimeType: "text/html",
    buffer: Buffer.from(html),
  });
  return page.frameLocator('iframe[title="HTML 工作副本"]');
}

async function importTrustedFixture(page, name) {
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

test("selected parent does not trap selection inside its overlay", async ({ page }) => {
  const workingCopy = await importTrustedHtml(page, {
    name: "nested-section.html",
    html: `<!doctype html><html><head><style>
      body { margin: 0; padding: 48px; }
      section { width: 520px; min-height: 240px; padding: 32px; background: #eef2ff; }
    </style></head><body><section><h2>Section heading</h2><p>Section copy</p></section></body></html>`,
  });

  await workingCopy.getByRole("heading", { name: "Section heading" }).click();
  await page.getByRole("button", { name: "选择父容器" }).click();
  await expect(page.locator(".selection-badge")).toContainText("普通容器");
  await page.getByLabel("背景色", { exact: true }).fill("#dbeafe");
  await page.getByRole("button", { name: "保存外观" }).click();

  await workingCopy.getByRole("heading", { name: "Section heading" }).click();
  await expect(page.locator(".selection-badge")).toContainText("文字对象");
  await expect(page.getByRole("button", { name: "移动所选内容" })).toBeVisible();

  await workingCopy.locator("body").click({ position: { x: 8, y: 8 } });
  await expect(page.locator(".selection-badge")).toHaveText("未选择对象");
  await workingCopy.getByRole("heading", { name: "Section heading" }).click();
  await workingCopy.locator("body").press("Escape");
  await expect(page.locator(".selection-badge")).toHaveText("未选择对象");
  await expect(page.getByLabel("当前选框")).toHaveCount(0);
});

test("direct replacement remains the default and keeps the new image ratio", async ({ page }) => {
  const originalSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#f97316"/></svg>').toString("base64");
  const workingCopy = await importTrustedHtml(page, {
    name: "direct-image.html",
    html: `<!doctype html><html><head><style>.hero { width: 240px; height: auto; display: block; }</style></head><body><img class="hero" alt="Direct hero" src="data:image/svg+xml;base64,${originalSvg}"></body></html>`,
  });
  const hero = workingCopy.getByAltText("Direct hero");
  await hero.click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "从本地替换图片" }).click();
  await (await chooser).setFiles({
    name: "portrait.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="300"><rect width="100" height="300" fill="#2563eb"/></svg>'),
  });
  const fitDialog = page.getByRole("dialog", { name: "选择图片适配方式" });
  await expect(fitDialog.getByRole("radio", { name: /直接替换/ })).toBeChecked();
  await fitDialog.getByRole("button", { name: "替换图片" }).click();
  await expect(hero).toHaveCSS("height", "720px");
  await expect(hero).toHaveCSS("object-fit", "fill");
});

test("image fit dialog can be cancelled with Escape without changing the image", async ({ page }) => {
  const originalSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#f97316"/></svg>').toString("base64");
  const originalSource = `data:image/svg+xml;base64,${originalSvg}`;
  const workingCopy = await importTrustedHtml(page, {
    name: "cancel-image.html",
    html: `<!doctype html><html><body><img width="240" alt="Cancel hero" src="${originalSource}"></body></html>`,
  });
  const hero = workingCopy.getByAltText("Cancel hero");
  await hero.click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "从本地替换图片" }).click();
  await (await chooser).setFiles({
    name: "portrait.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="300"><rect width="100" height="300" fill="#2563eb"/></svg>'),
  });
  const fitDialog = page.getByRole("dialog", { name: "选择图片适配方式" });
  await expect(fitDialog).toBeVisible();
  await fitDialog.press("Escape");
  await expect(fitDialog).toBeHidden();
  await expect(hero).toHaveAttribute("src", originalSource);
  await expect(page.getByRole("button", { name: "撤销" })).toBeDisabled();
});

test("interaction tool operates a paged document without leaving edit mode", async ({ page }) => {
  const workingCopy = await importTrustedFixture(page, "test1.html");
  const currentPage = workingCopy.locator("#currentPage");
  const documentRoot = workingCopy.locator("html");

  await expect(page.getByRole("button", { name: "选择内容" })).toHaveAttribute("aria-pressed", "true");
  await workingCopy.getByRole("button", { name: "下一页" }).click();
  await expect(currentPage).toHaveText("1");

  await page.getByRole("button", { name: "操作页面" }).click();
  await expect(page.getByRole("button", { name: "操作页面" })).toHaveAttribute("aria-pressed", "true");
  await workingCopy.getByRole("button", { name: "下一页" }).click();
  await expect(currentPage).toHaveText("2");
  await workingCopy.getByRole("button", { name: "切换主题" }).click();
  await expect(documentRoot).toHaveAttribute("data-theme", "dark");

  await workingCopy.locator("body").press("Escape");
  await expect(page.getByRole("button", { name: "选择内容" })).toHaveAttribute("aria-pressed", "true");
  await expect(currentPage).toHaveText("2");
  await expect(documentRoot).toHaveAttribute("data-theme", "dark");
  await workingCopy.getByRole("button", { name: "下一页" }).click();
  await expect(currentPage).toHaveText("2");
  await expect(page.getByRole("button", { name: "预览" })).toHaveAttribute("aria-pressed", "false");
});

test("image replacement can fill the existing frame without changing image pixels", async ({ context, page }, testInfo) => {
  const originalSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#f97316"/></svg>').toString("base64");
  const workingCopy = await importTrustedHtml(page, {
    name: "image-frame.html",
    html: `<!doctype html><html><head><style>.hero { width: 240px; height: auto; display: block; }</style></head><body><img class="hero" alt="Hero" src="data:image/svg+xml;base64,${originalSvg}"></body></html>`,
  });
  const hero = workingCopy.getByAltText("Hero");
  const originalBox = await hero.boundingBox();
  const originalLogicalBox = await hero.evaluate((image) => {
    const rect = image.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });

  await hero.click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "从本地替换图片" }).click();
  await (await chooser).setFiles({
    name: "portrait.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="300"><rect width="100" height="300" fill="#2563eb"/></svg>'),
  });

  const fitDialog = page.getByRole("dialog", { name: "选择图片适配方式" });
  await expect(fitDialog.getByRole("radio", { name: /直接替换/ })).toBeChecked();
  await expect(hero).toHaveAttribute("src", `data:image/svg+xml;base64,${originalSvg}`);
  await fitDialog.getByRole("radio", { name: /填充原图框/ }).check();
  await fitDialog.getByRole("button", { name: "替换图片" }).click();

  await expect(hero).toHaveCSS("object-fit", "cover");
  await expect.poll(async () => (await hero.boundingBox()).width).toBeCloseTo(originalBox.width, 0);
  await expect.poll(async () => (await hero.boundingBox()).height).toBeCloseTo(originalBox.height, 0);
  const replacementSource = await hero.getAttribute("src");

  await page.getByRole("button", { name: "撤销" }).click();
  await expect(hero).toHaveAttribute("src", `data:image/svg+xml;base64,${originalSvg}`);
  await expect(hero).not.toHaveCSS("object-fit", "cover");
  await page.getByRole("button", { name: "重做" }).click();
  await expect(hero).toHaveAttribute("src", replacementSource);
  await expect(hero).toHaveCSS("object-fit", "cover");

  await page.reload();
  await expect(hero).toHaveAttribute("src", replacementSource);
  await expect(hero).toHaveCSS("object-fit", "cover");
  await expect.poll(async () => (await hero.boundingBox()).height).toBeCloseTo(originalBox.height, 0);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 HTML" }).click();
  const download = await downloadPromise;
  const downloadPath = path.join(testInfo.outputDir, download.suggestedFilename());
  await download.saveAs(downloadPath);
  const deliverable = await context.newPage();
  await deliverable.goto(pathToFileURL(downloadPath).href, { waitUntil: "load" });
  const exportedHero = deliverable.getByAltText("Hero");
  await expect(exportedHero).toHaveAttribute("src", replacementSource);
  await expect(exportedHero).toHaveCSS("object-fit", "cover");
  await expect.poll(async () => (await exportedHero.boundingBox()).height).toBeCloseTo(originalLogicalBox.height, 0);
});
