import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { TEST_SERVER_ORIGIN } from "./test-server.js";

const fixturePath = (name) => fileURLToPath(
  new URL(`../../testexample/${name}`, import.meta.url),
);

const replacementSvg = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="20">
    <rect width="30" height="20" fill="#2563eb"/>
  </svg>
`);

async function importTrustedFile(page, file) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "选择本地 HTML" }).click();
  const chooserPromise = page.waitForEvent("filechooser");
  await page
    .getByRole("dialog", { name: "仅打开受信任的 HTML" })
    .getByRole("button", { name: "我信任此文件，继续" })
    .click();
  await (await chooserPromise).setFiles(file);
  return page.frameLocator('iframe[title="HTML 工作副本"]');
}

async function exportToPage(context, page, testInfo) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 HTML" }).click();
  const download = await downloadPromise;
  const downloadPath = path.join(testInfo.outputDir, download.suggestedFilename());
  await download.saveAs(downloadPath);
  const deliverable = await context.newPage();
  await deliverable.goto(pathToFileURL(downloadPath).href, { waitUntil: "domcontentloaded" });
  return { deliverable, download, downloadPath };
}

async function dragBy(page, locator, dx, dy) {
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 6 });
  await page.mouse.up();
}

const renderedState = (locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    text: element.textContent,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    color: style.color,
    backgroundColor: style.backgroundColor,
    borderWidth: style.borderWidth,
    borderRadius: style.borderRadius,
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
  };
});

test("downloads one clean high-fidelity deliverable with every MVP edit materialized locally", async ({
  context,
  page,
}, testInfo) => {
  await page.route("https://assets.example.test/**", (route) => route.abort("failed"));
  const source = `<!doctype html><html><head><title>综合交付验收</title>
    <link rel="stylesheet" href="https://assets.example.test/theme.css">
    <style>
      .shared { width: 220px; margin: 24px; padding: 12px; color: rgb(20, 20, 20); background: rgb(245, 245, 245); border: 2px solid rgb(80, 80, 80); border-radius: 4px; }
      img { width: 90px; height: 60px; object-fit: cover; }
      #behavior { animation: pulse 30s linear infinite; }
      @keyframes pulse { from { opacity: 0.8; } to { opacity: 1; } }
    </style>
    <script src="https://assets.example.test/runtime.js"></script>
    </head><body>
    <p id="target" class="shared" data-html-editor-id="stable-target" style="transform: rotate(2deg); background-color: rgb(200, 200, 200)">原始文字</p>
    <p id="peer" class="shared" data-html-editor-id="stable-peer">同类对象保持原样</p>
    <img id="photo" data-html-editor-id="stable-photo" alt="产品图片" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='60'%3E%3Crect width='90' height='60' fill='%23d97706'/%3E%3C/svg%3E">
    <button id="behavior" onclick="this.textContent = '原脚本仍在运行'">运行原脚本</button>
    </body></html>`;
  const workingCopy = await importTrustedFile(page, {
    name: "combined.html",
    mimeType: "text/html",
    buffer: Buffer.from(source),
  });

  const target = workingCopy.locator("#target");
  const peer = workingCopy.locator("#peer");
  await target.click();
  await page.getByRole("textbox", { name: "文字内容" }).fill("最终交付文字");
  await page.getByRole("button", { name: "应用文字" }).click();
  await page.getByLabel("字号").fill("28");
  await page.getByLabel("字重").selectOption("700");
  await page.getByLabel("文字颜色").fill("#123456");
  await page.getByRole("button", { name: "保存字体属性" }).click();
  await page.getByLabel("背景色", { exact: true }).fill("#abcdef");
  await page.locator('.appearance-fields input[name="borderWidth"]').fill("8");
  await page.locator('.appearance-fields input[name="borderRadius"]').fill("18");
  await page.getByRole("button", { name: "保存外观" }).click();

  await dragBy(page, page.getByRole("button", { name: "移动所选内容" }), 64, 32);
  await dragBy(page, page.getByLabel("右下角等比缩放手柄"), 48, 28);

  await workingCopy.locator("#photo").click();
  const imageChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "从本地替换图片" }).click();
  await (await imageChooser).setFiles({
    name: "replacement.svg",
    mimeType: "image/svg+xml",
    buffer: replacementSvg,
  });
  await page.getByRole("dialog", { name: "选择图片适配方式" }).getByRole("button", { name: "替换图片" }).click();

  const expectedTarget = await renderedState(target);
  const expectedPeer = await renderedState(peer);
  const replacementSource = await workingCopy.locator("#photo").getAttribute("src");
  expect(replacementSource).toMatch(/^data:image\/svg\+xml;base64,/);

  const { deliverable, download } = await exportToPage(context, page, testInfo);
  expect(download.suggestedFilename()).toBe("combined-edited.html");
  await expect(deliverable).toHaveTitle("综合交付验收");

  const actualTarget = await renderedState(deliverable.locator("#target"));
  const actualPeer = await renderedState(deliverable.locator("#peer"));
  expect(actualTarget.text).toBe(expectedTarget.text);
  expect(actualTarget.fontSize).toBe(expectedTarget.fontSize);
  expect(actualTarget.fontWeight).toBe(expectedTarget.fontWeight);
  expect(actualTarget.color).toBe(expectedTarget.color);
  expect(actualTarget.backgroundColor).toBe(expectedTarget.backgroundColor);
  expect(actualTarget.borderWidth).toBe(expectedTarget.borderWidth);
  expect(actualTarget.borderRadius).toBe(expectedTarget.borderRadius);
  expect(actualTarget.rect.x).toBeCloseTo(expectedTarget.rect.x, 0);
  expect(actualTarget.rect.y).toBeCloseTo(expectedTarget.rect.y, 0);
  expect(actualTarget.rect.width).toBeCloseTo(expectedTarget.rect.width, 0);
  expect(actualTarget.rect.height).toBeCloseTo(expectedTarget.rect.height, 0);
  expect(actualPeer).toEqual(expectedPeer);

  await expect(deliverable.locator("#photo")).toHaveAttribute("src", replacementSource);
  expect(await deliverable.locator("#photo").evaluate((image) => image.complete && image.naturalWidth === 30)).toBe(true);
  await expect(deliverable.locator("#target")).toHaveAttribute("data-html-editor-id", "stable-target");
  await expect(deliverable.locator('link[href="https://assets.example.test/theme.css"]')).toHaveCount(1);
  await expect(deliverable.locator('script[src="https://assets.example.test/runtime.js"]')).toHaveCount(1);
  await expect(deliverable.locator("style[data-html-editor-export-patch]")).toHaveCount(1);
  await expect(deliverable.locator("#target")).toHaveAttribute(
    "style",
    "transform: rotate(2deg); background-color: rgb(200, 200, 200)",
  );

  await deliverable.getByRole("button", { name: "运行原脚本" }).click();
  await expect(deliverable.getByRole("button", { name: "原脚本仍在运行" })).toBeVisible();
  await expect(deliverable.locator("#behavior")).toHaveCSS("animation-name", "pulse");
  await expect(deliverable.locator("#behavior")).toHaveCSS("animation-play-state", "running");
  await expect(deliverable.locator('[data-html-editor-assist], [data-html-editor-selected], [contenteditable], meta[name="html-editor-import-token"]')).toHaveCount(0);
  await expect(deliverable.locator(".selection-overlay, .scale-handle, .editor-workspace")).toHaveCount(0);
  await expect(deliverable.locator("html")).not.toHaveAttribute("data-html-editor-mode");
  await expect(deliverable.getByText("对象属性", { exact: true })).toHaveCount(0);
});

for (const fixture of ["test1.html", "test2.html"]) {
  test(`preserves ${fixture} page shape and key interactions without changing the uploaded fixture`, async ({
    context,
    page,
  }, testInfo) => {
    const sourcePath = fixturePath(fixture);
    const originalBytes = await readFile(sourcePath);
    const workingCopy = await importTrustedFile(page, sourcePath);
    if (fixture === "test1.html") {
      await expect(workingCopy.locator("#currentPage")).toHaveText("1");
    } else {
      await expect(workingCopy.getByRole("heading", { name: "iPhone", exact: true })).toBeVisible();
    }

    const { deliverable } = await exportToPage(context, page, testInfo);
    if (fixture === "test1.html") {
      await deliverable.getByRole("button", { name: "下一页" }).click();
      await expect(deliverable.locator("#currentPage")).toHaveText("2");
      await deliverable.getByRole("button", { name: "切换主题" }).click();
      await expect(deliverable.locator("html")).toHaveAttribute("data-theme", "dark");
      const original = await context.newPage();
      await original.goto(`${TEST_SERVER_ORIGIN}/testexample/test1.html`);
      await expect(original.locator("#currentPage")).toHaveText("1");
      await expect(original.locator("html")).not.toHaveAttribute("data-theme", "dark");
    } else {
      await expect(deliverable.locator('img[src="https://picsum.photos/id/1/1200/600"]')).toHaveCount(1);
      await deliverable.getByRole("link", { name: "Mac", exact: true }).click();
      await expect.poll(() => deliverable.evaluate(() => window.location.hash)).toBe("#mac");
      await expect.poll(() => deliverable.evaluate(() => window.scrollY)).toBeGreaterThan(500);
      const original = await context.newPage();
      await original.goto(`${TEST_SERVER_ORIGIN}/testexample/test2.html`);
      await expect(original.getByRole("heading", { name: "iPhone", exact: true })).toBeVisible();
      expect(await original.evaluate(() => window.location.hash)).toBe("");
    }
    await expect(deliverable.locator("[data-html-editor-id]").first()).toBeAttached();
    await expect(deliverable.locator("[data-html-editor-assist], [data-html-editor-selected]")).toHaveCount(0);
    expect(await readFile(sourcePath)).toEqual(originalBytes);
  });
}
