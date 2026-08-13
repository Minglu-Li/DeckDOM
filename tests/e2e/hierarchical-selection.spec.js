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

test("user can select the smallest object, its parent, and a searched tree result", async ({ page }) => {
  const workingCopy = await importTrustedHtml(page, "test2.html");
  await expect(workingCopy.getByRole("heading", { name: "iPhone", exact: true })).toBeVisible();

  const treeSearch = page.getByRole("searchbox", { name: "搜索 HTML 层级" });
  await expect(treeSearch).toBeEnabled();

  await workingCopy.getByRole("heading", { name: "iPhone", exact: true }).click();
  await expect(page.getByLabel("当前选择")).toContainText("文字对象");
  await expect(page.getByLabel("对象路径")).toContainText("section#iphone");
  await expect(page.getByLabel("对象路径")).toContainText("h1");
  await expect(page.getByLabel("当前选框")).toContainText("h1");
  await expect(page.getByRole("treeitem", { selected: true })).toContainText("iPhone");

  const textField = page.getByRole("textbox", { name: "文字内容" });
  await textField.fill("iPhone 新章");
  await expect(page.getByRole("treeitem", { selected: true })).toContainText("iPhone 新章");

  await page.getByRole("button", { name: "选择父容器" }).click();
  await expect(page.getByLabel("当前对象")).toContainText("普通容器");
  await expect(page.getByLabel("对象路径")).toHaveText(/section#iphone$/);
  await expect(page.getByLabel("当前选框")).toContainText("section");
  await expect(page.getByRole("treeitem", { selected: true })).toContainText("section");

  await treeSearch.fill("iPhone 全系");
  const imageRow = page.getByRole("treeitem", { name: /iPhone 全系.*可编辑/ });
  await expect(imageRow).toBeVisible();
  await imageRow.click();
  await expect(page.getByLabel("当前对象")).toContainText("图片对象");
  await expect(page.getByLabel("对象路径")).toContainText("img");
  await expect(page.getByRole("treeitem", { selected: true })).toContainText("iPhone 全系");

  await treeSearch.fill("Apple Trade In 换购计划");
  const tradeIn = page.getByRole("treeitem", { name: "Apple Trade In 换购计划 h2 可编辑", exact: true });
  await expect(tradeIn).toBeVisible();
  await tradeIn.click();
  await expect(page.getByRole("textbox", { name: "文字内容" })).toHaveValue("Apple Trade In 换购计划");
  await expect(page.getByLabel("对象路径")).toContainText("section#tradein");
  await expect(page.getByLabel("当前选框")).toBeVisible();
});

test("user sees atomic and locked boundaries without losing original content", async ({ page }) => {
  const workingCopy = await importTrustedHtml(page, "../tests/e2e/fixtures/object-capabilities.html");
  await expect(workingCopy.getByRole("heading", { name: "季度总结" })).toBeVisible();
  await expect(workingCopy.locator("#brand-art")).toBeAttached();
  await expect(workingCopy.locator("#invisible-chart")).toBeAttached();

  const treeSearch = page.getByRole("searchbox", { name: "搜索 HTML 层级" });
  await treeSearch.fill("初始运行状态");
  await page.getByRole("treeitem", { name: "初始运行状态 p 可编辑", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "文字内容" })).toHaveValue("初始运行状态");
  await treeSearch.fill("");
  await expect(page.getByRole("treeitem", { selected: true })).toContainText("运行状态已更新");
  await expect(page.getByRole("textbox", { name: "文字内容" })).toHaveValue("运行状态已更新");

  await treeSearch.fill("brand-art");
  const atomicObject = page.getByRole("treeitem", { name: /#brand-art.*整体对象/ });
  await expect(atomicObject).toBeVisible();
  await atomicObject.click();
  await expect(page.getByLabel("当前对象")).toContainText("整体对象");
  await expect(page.getByLabel("当前对象")).toContainText("内部结构保持原样运行");
  await expect(page.getByLabel("当前选框")).toBeVisible();

  await treeSearch.fill("invisible-chart");
  const lockedObject = page.getByRole("treeitem", { name: /#invisible-chart.*锁定/ });
  await expect(lockedObject).toBeVisible();
  await lockedObject.click();
  await expect(page.getByLabel("当前对象")).toContainText("锁定");
  await expect(page.getByLabel("当前对象")).toContainText("已锁定并继续保留原效果");
  await expect(page.getByLabel("当前选框")).toBeHidden();
});

test("paged acceptance fixture supports text and parent-container selection", async ({ page }) => {
  const workingCopy = await importTrustedHtml(page, "test1.html");
  await workingCopy.getByRole("heading", { name: "JVM 垃圾回收 GC 全套课件", exact: true }).click();
  await expect(page.getByLabel("当前选择")).toContainText("文字对象");
  await expect(page.getByLabel("对象路径")).toContainText("h1");
  await page.getByRole("button", { name: "选择父容器" }).click();
  await expect(page.getByLabel("当前对象")).toContainText("普通容器");
  await expect(page.getByLabel("对象路径")).toContainText("div");
  await expect(page.getByLabel("当前选框")).toBeVisible();
});
