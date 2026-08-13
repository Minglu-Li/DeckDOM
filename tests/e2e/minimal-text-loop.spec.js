import { expect, test } from "@playwright/test";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const acceptanceFixture = fileURLToPath(
  new URL("../../testexample/test2.html", import.meta.url),
);

test("user can edit one text object, recover it, preview it, and export a standalone HTML file", async ({
  context,
  page,
}, testInfo) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "选择本地 HTML" }).click();
  const trustDialog = page.getByRole("dialog", { name: "仅打开受信任的 HTML" });
  await expect(trustDialog).toBeVisible();
  await expect(trustDialog).toContainText("原页面可能访问第三方网络资源或发送请求");

  const fileChooserPromise = page.waitForEvent("filechooser");
  await trustDialog.getByRole("button", { name: "我信任此文件，继续" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(acceptanceFixture);

  const workingCopy = page.frameLocator('iframe[title="HTML 工作副本"]');
  await expect(workingCopy.getByRole("heading", { name: "iPhone", exact: true })).toBeVisible();
  await expect(page.getByLabel("当前文档")).toContainText("test2.html");

  await workingCopy.getByRole("link", { name: "Mac", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "文字内容" })).toHaveValue("Mac");
  await expect
    .poll(async () => page.frames()[1].evaluate(() => window.location.hash))
    .toBe("");

  await workingCopy.getByRole("heading", { name: "iPhone", exact: true }).click();
  const textField = page.getByRole("textbox", { name: "文字内容" });
  await expect(textField).toHaveValue("iPhone");
  await textField.fill("iPhone 未来阵容");
  await expect(workingCopy.getByRole("heading", { name: "iPhone 未来阵容" })).toBeVisible();
  await page.getByRole("button", { name: "应用文字" }).click();

  await page.getByRole("button", { name: "撤销" }).click();
  await expect(workingCopy.getByRole("heading", { name: "iPhone", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "重做" }).click();
  await expect(workingCopy.getByRole("heading", { name: "iPhone 未来阵容" })).toBeVisible();

  await page.reload();
  await expect(workingCopy.getByRole("heading", { name: "iPhone 未来阵容" })).toBeVisible();
  await expect(page.getByLabel("当前文档")).toContainText("已从浏览器恢复");
  await page.getByRole("button", { name: "撤销" }).click();
  await expect(workingCopy.getByRole("heading", { name: "iPhone", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "重做" }).click();
  await expect(workingCopy.getByRole("heading", { name: "iPhone 未来阵容" })).toBeVisible();

  await workingCopy.getByRole("heading", { name: "iPhone 未来阵容" }).click();
  await expect(page.getByLabel("当前选择")).toBeVisible();
  await page.getByRole("button", { name: "预览" }).click();
  await expect(page.getByLabel("当前选择")).toBeHidden();
  await workingCopy.getByRole("link", { name: "Mac", exact: true }).click();
  await expect
    .poll(() => page.frames().find((frame) => frame !== page.mainFrame())?.url())
    .toContain("#mac");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 HTML" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("test2-edited.html");

  const downloadPath = path.join(testInfo.outputDir, download.suggestedFilename());
  await download.saveAs(downloadPath);
  const deliverable = await context.newPage();
  await deliverable.goto(pathToFileURL(downloadPath).href, { waitUntil: "domcontentloaded" });
  await expect(deliverable).toHaveTitle("Apple风格演示页");
  await expect(deliverable.getByRole("heading", { name: "iPhone 未来阵容" })).toBeVisible();
  await expect(deliverable.locator("[data-html-editor-id]").first()).toBeAttached();
  await expect(deliverable.getByText("对象属性", { exact: true })).toHaveCount(0);

  const untouchedOriginal = await context.newPage();
  await untouchedOriginal.goto("http://127.0.0.1:4391/testexample/test2.html");
  await expect(untouchedOriginal.getByRole("heading", { name: "iPhone", exact: true })).toBeVisible();
});
