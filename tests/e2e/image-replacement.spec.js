import { expect, test } from "@playwright/test";
import path from "node:path";
import { pathToFileURL } from "node:url";

const originalSvg = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="20">
    <rect width="40" height="20" fill="#d97706"/>
  </svg>
`).toString("base64");
const originalSource = `data:image/svg+xml;base64,${originalSvg}`;

const replacementSvg = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="30">
    <rect width="20" height="30" fill="#2563eb"/>
  </svg>
`);

async function importImageFixture(page) {
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
    name: "shared-images.html",
    mimeType: "text/html",
    buffer: Buffer.from(`<!doctype html><html><head><title>Shared images</title>
      <style>.product-image { width: 160px; height: 90px; object-fit: cover; }</style>
      </head><body>
      <h1>Product gallery</h1>
      <img class="product-image" src="${originalSource}" alt="Primary product">
      <img class="product-image" src="${originalSource}" alt="Secondary product">
      </body></html>`),
  });
  return page.frameLocator('iframe[title="HTML 工作副本"]');
}

test("user replaces only the selected image and keeps it through history, recovery, and export", async ({
  context,
  page,
}, testInfo) => {
  const workingCopy = await importImageFixture(page);
  const primary = workingCopy.getByAltText("Primary product");
  const secondary = workingCopy.getByAltText("Secondary product");
  const originalBox = await primary.boundingBox();

  await primary.click();
  const imageProperties = page.getByRole("region", { name: "当前图片" });
  await expect(imageProperties).toContainText("Primary product");
  await expect(imageProperties).toContainText("160 × 90");
  await expect(imageProperties).toContainText("原文档内嵌图片");

  const replacementChooser = page.waitForEvent("filechooser");
  await imageProperties.getByRole("button", { name: "从本地替换图片" }).click();
  await (await replacementChooser).setFiles({
    name: "blue-product.svg",
    mimeType: "image/svg+xml",
    buffer: replacementSvg,
  });
  await page.getByRole("dialog", { name: "选择图片适配方式" }).getByRole("button", { name: "替换图片" }).click();

  await expect(primary).toHaveAttribute("src", /^data:image\/svg\+xml;base64,/);
  expect(await primary.evaluate((image) => image.complete && image.naturalWidth === 20)).toBe(true);
  await expect(secondary).toHaveAttribute("src", originalSource);
  expect(await primary.boundingBox()).toEqual(originalBox);
  await expect(imageProperties).toContainText("blue-product.svg");

  await page.getByRole("button", { name: "撤销" }).click();
  await expect(primary).toHaveAttribute("src", originalSource);
  await expect(secondary).toHaveAttribute("src", originalSource);
  await page.getByRole("button", { name: "重做" }).click();
  await expect(primary).toHaveAttribute("src", /^data:image\/svg\+xml;base64,/);
  await expect(secondary).toHaveAttribute("src", originalSource);

  const replacementSource = await primary.getAttribute("src");
  await page.reload();
  await expect(primary).toHaveAttribute("src", replacementSource);
  await expect(secondary).toHaveAttribute("src", originalSource);
  await expect(page.getByLabel("当前文档")).toContainText("已从浏览器恢复");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 HTML" }).click();
  const download = await downloadPromise;
  const downloadPath = path.join(testInfo.outputDir, download.suggestedFilename());
  await download.saveAs(downloadPath);

  const deliverable = await context.newPage();
  await deliverable.goto(pathToFileURL(downloadPath).href, { waitUntil: "load" });
  const exportedPrimary = deliverable.getByAltText("Primary product");
  await expect(exportedPrimary).toHaveAttribute("src", replacementSource);
  await expect(deliverable.getByAltText("Secondary product")).toHaveAttribute("src", originalSource);
  expect(await exportedPrimary.evaluate((image) => image.complete && image.naturalWidth === 20)).toBe(true);
});

test("replacement controls reject cancellation and unsupported image data without changing the project", async ({
  page,
}) => {
  const workingCopy = await importImageFixture(page);
  const primary = workingCopy.getByAltText("Primary product");

  await workingCopy.getByRole("heading", { name: "Product gallery" }).click();
  await expect(page.getByRole("region", { name: "当前图片" })).toBeHidden();

  await primary.click();
  const imageProperties = page.getByRole("region", { name: "当前图片" });
  const originalSrc = await primary.getAttribute("src");

  const cancelledChooser = page.waitForEvent("filechooser");
  await imageProperties.getByRole("button", { name: "从本地替换图片" }).click();
  await (await cancelledChooser).setFiles([]);
  await expect(imageProperties.getByRole("alert")).toContainText("未选择图片");
  await expect(primary).toHaveAttribute("src", originalSrc);
  await expect(page.getByRole("button", { name: "撤销" })).toBeDisabled();

  const invalidChooser = page.waitForEvent("filechooser");
  await imageProperties.getByRole("button", { name: "从本地替换图片" }).click();
  await (await invalidChooser).setFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("not image data"),
  });
  await expect(imageProperties.getByRole("alert")).toContainText("无法读取或不支持");
  await expect(imageProperties.getByRole("alert")).toContainText("原图片保持不变");
  await expect(primary).toHaveAttribute("src", originalSrc);
  await expect(page.getByRole("button", { name: "撤销" })).toBeDisabled();
});
