import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

const fixture = fileURLToPath(new URL("./fixtures/history-recovery.html", import.meta.url));
const replacementSvg = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="50" height="30">
    <rect width="50" height="30" fill="#2563eb"/>
  </svg>
`);

async function importFixture(page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "选择本地 HTML" }).click();
  const chooser = page.waitForEvent("filechooser");
  await page
    .getByRole("dialog", { name: "仅打开受信任的 HTML" })
    .getByRole("button", { name: "我信任此文件，继续" })
    .click();
  await (await chooser).setFiles(fixture);
  return page.frameLocator('iframe[title="HTML 工作副本"]');
}

async function dragBy(page, locator, dx, dy) {
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 6 });
  await page.mouse.up();
}

test("all edit types follow one intent history through workspace shortcuts", async ({ page }) => {
  const workingCopy = await importFixture(page);
  const headline = workingCopy.locator("#headline");
  const image = workingCopy.locator("#hero");
  const movable = workingCopy.locator("#movable");
  const originalImage = await image.getAttribute("src");
  const originalBox = await movable.boundingBox();

  await headline.click();
  await page.getByRole("textbox", { name: "文字内容" }).fill("修改后的标题");
  await page.getByRole("button", { name: "应用文字", exact: true }).click();
  await page.getByLabel("字号").fill("30");
  await page.getByRole("button", { name: "保存字体属性" }).click();

  await image.click();
  const imageChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "从本地替换图片" }).click();
  await (await imageChooser).setFiles({
    name: "history-blue.svg",
    mimeType: "image/svg+xml",
    buffer: replacementSvg,
  });
  await page.getByRole("dialog", { name: "选择图片适配方式" }).getByRole("button", { name: "替换图片" }).click();
  const replacementImage = await image.getAttribute("src");

  await headline.click();
  await page.getByRole("button", { name: "选择父容器" }).click();
  await dragBy(page, page.getByRole("button", { name: "移动所选内容" }), 60, 30);
  const movedBox = await movable.boundingBox();
  await dragBy(page, page.getByLabel("右下角等比缩放手柄"), 75, 45);
  const scaledBox = await movable.boundingBox();

  await page.getByRole("treeitem", { name: /修改后的标题 p 可编辑/ }).click();
  await page.getByLabel("背景色", { exact: true }).fill("#123456");
  await page.getByRole("button", { name: "保存外观" }).click();
  await expect(headline).toHaveCSS("background-color", "rgb(18, 52, 86)");

  // Shortcuts are editor-wide even when focus is in the outer property panel.
  await page.keyboard.press("Control+Z");
  await expect(headline).not.toHaveCSS("background-color", "rgb(18, 52, 86)");
  await expect(page.getByRole("treeitem", { selected: true })).toContainText("修改后的标题");
  await expect(page.getByRole("textbox", { name: "文字内容" })).toHaveValue("修改后的标题");
  await expect(page.getByLabel("当前选框")).toBeVisible();

  await page.keyboard.press("Control+Z");
  await expect.poll(async () => (await movable.boundingBox()).width).toBeCloseTo(movedBox.width, 0);
  await page.keyboard.press("Control+Z");
  await expect.poll(async () => (await movable.boundingBox()).x).toBeCloseTo(originalBox.x, 0);
  await page.keyboard.press("Control+Z");
  await expect(image).toHaveAttribute("src", originalImage);
  await page.keyboard.press("Control+Z");
  await expect(headline).toHaveCSS("font-size", "20px");
  await expect(page.getByLabel("字号")).toHaveValue("20");
  await page.keyboard.press("Control+Z");
  await expect(headline).toHaveText("原始标题");
  await expect(page.getByRole("textbox", { name: "文字内容" })).toHaveValue("原始标题");
  await expect(page.getByRole("button", { name: "撤销" })).toBeDisabled();

  await page.keyboard.press("Control+Y");
  await expect(headline).toHaveText("修改后的标题");
  await page.keyboard.press("Control+Shift+Z");
  await expect(headline).toHaveCSS("font-size", "30px");
  for (let index = 0; index < 4; index += 1) await page.keyboard.press("Control+Y");
  await expect(image).toHaveAttribute("src", replacementImage);
  await expect.poll(async () => (await movable.boundingBox()).x).toBeCloseTo(scaledBox.x, 0);
  await expect.poll(async () => (await movable.boundingBox()).width).toBeCloseTo(scaledBox.width, 0);
  await expect(headline).toHaveCSS("background-color", "rgb(18, 52, 86)");
  await expect(page.getByRole("button", { name: "重做" })).toBeDisabled();
});

test("a new edit after undo discards redo and the latest project reopens in a new page", async ({
  context,
  page,
}) => {
  const workingCopy = await importFixture(page);
  const headline = workingCopy.locator("#headline");
  await headline.click();
  await page.getByRole("textbox", { name: "文字内容" }).fill("将被撤销的标题");
  await page.getByRole("button", { name: "应用文字", exact: true }).click();
  await page.getByLabel("字号").fill("28");
  await page.getByRole("button", { name: "保存字体属性" }).click();

  await page.keyboard.press("Control+Z");
  await expect(headline).toHaveCSS("font-size", "20px");
  await page.getByLabel("文字颜色").fill("#14532d");
  await page.getByRole("button", { name: "保存字体属性" }).click();
  await expect(page.getByRole("button", { name: "重做" })).toBeDisabled();
  await page.keyboard.press("Control+Y");
  await expect(headline).toHaveCSS("font-size", "20px");
  await expect(headline).toHaveCSS("color", "rgb(20, 83, 45)");

  const reopened = await context.newPage();
  await reopened.goto("/");
  const restoredCopy = reopened.frameLocator('iframe[title="HTML 工作副本"]');
  await expect(reopened.getByLabel("当前文档")).toContainText("已从浏览器恢复");
  await expect(restoredCopy.locator("#headline")).toHaveText("将被撤销的标题");
  await expect(restoredCopy.locator("#headline")).toHaveCSS("font-size", "20px");
  await expect(restoredCopy.locator("#headline")).toHaveCSS("color", "rgb(20, 83, 45)");
  await expect(reopened.getByRole("button", { name: "重做" })).toBeDisabled();
});

for (const storageFailure of [
  { name: "quota exhaustion", domName: "QuotaExceededError" },
  { name: "unexpected storage exception", domName: "UnknownError" },
]) {
  test(`reports ${storageFailure.name} without claiming the edit was saved`, async ({ page }) => {
    const workingCopy = await importFixture(page);
    await page.evaluate((domName) => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function setItem(key, value) {
        if (key === "html-visual-editor.recent-project.v1") {
          throw new DOMException("storage write failed", domName);
        }
        return originalSetItem.call(this, key, value);
      };
    }, storageFailure.domName);

    await workingCopy.locator("#headline").click();
    await page.getByRole("textbox", { name: "文字内容" }).fill("尚未安全保存");
    await page.getByRole("button", { name: "应用文字", exact: true }).click();

    const documentState = page.getByLabel("当前文档");
    await expect(documentState).toContainText(
      storageFailure.domName === "QuotaExceededError" ? "本地空间不足" : "本地保存失败",
    );
    await expect(documentState).toContainText("导出 HTML");
    await expect(documentState).not.toContainText("已保存到浏览器");
    await expect(page.getByRole("button", { name: "导出 HTML" })).toBeEnabled();
    await expect(workingCopy.locator("#headline")).toHaveText("尚未安全保存");
  });
}

test("offers a clean recovery path when the recent local project is corrupted", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("html-visual-editor.recent-project.v1", "{broken-json");
  });
  await page.reload();

  const recoveryError = page.getByRole("alert", { name: "本地项目无法恢复" });
  await expect(recoveryError).toContainText("最近项目数据已损坏");
  await expect(recoveryError).toContainText("重新选择 HTML");
  await recoveryError.getByRole("button", { name: "清除损坏数据并重新开始" }).click();
  await expect(recoveryError).toBeHidden();
  await expect(page.getByLabel("当前文档")).toContainText("未打开文档");

  await page.reload();
  await expect(page.getByRole("alert", { name: "本地项目无法恢复" })).toBeHidden();
  await expect(page.getByRole("button", { name: "选择本地 HTML" })).toBeVisible();
});
