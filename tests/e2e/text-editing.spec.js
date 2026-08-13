import { expect, test } from "@playwright/test";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const fixture = fileURLToPath(new URL("./fixtures/text-editing.html", import.meta.url));

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

test("double-click edits text in place while preserving inline semantics", async ({
  context,
  page,
}, testInfo) => {
  const workingCopy = await importFixture(page);
  const textObject = workingCopy.locator("#inline-copy");
  await expect(textObject).toContainText("欢迎 重要客户 使用 HTML 编辑器");

  await textObject.dblclick();
  await expect(textObject).toHaveAttribute("contenteditable", "true");
  await expect(page.getByText("正在工作副本中就地编辑", { exact: true })).toBeVisible();

  await textObject.press("End");
  await textObject.pressSequentially("，现在即可修改", { delay: 10 });
  await textObject.press("Escape");

  await expect(textObject).toContainText("现在即可修改");
  await expect(textObject.locator("strong")).toHaveText("重要客户");
  await expect(textObject.locator("code")).toHaveText("HTML");
  await expect(page.getByRole("button", { name: "撤销" })).toBeEnabled();

  await page.getByRole("button", { name: "撤销" }).click();
  await expect(textObject.locator("strong")).toHaveText("重要客户");
  await expect(textObject.locator("code")).toHaveText("HTML");
  await page.getByRole("button", { name: "重做" }).click();
  await expect(textObject).toContainText("现在即可修改");
  await expect(textObject.locator("strong")).toHaveText("重要客户");

  await page.reload();
  await expect(textObject).toContainText("现在即可修改");
  await expect(textObject.locator("strong")).toHaveText("重要客户");
  await expect(textObject.locator("code")).toHaveText("HTML");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 HTML" }).click();
  const download = await downloadPromise;
  const downloadPath = path.join(testInfo.outputDir, download.suggestedFilename());
  await download.saveAs(downloadPath);
  const deliverable = await context.newPage();
  await deliverable.goto(pathToFileURL(downloadPath).href);
  await expect(deliverable.locator("#inline-copy")).toContainText("现在即可修改");
  await expect(deliverable.locator("#inline-copy strong")).toHaveText("重要客户");
  await expect(deliverable.locator("#inline-copy code")).toHaveText("HTML");
});

test("pastes external rich content as plain text", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const workingCopy = await importFixture(page);
  await page.evaluate(async () => {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob(["外部纯文本"], { type: "text/plain" }),
        "text/html": new Blob(
          ['<em style="color: red" data-external-format="true">外部富文本</em>'],
          { type: "text/html" },
        ),
      }),
    ]);
  });

  const textObject = workingCopy.locator("#inline-copy");
  await textObject.dblclick();
  await textObject.press("End");
  await textObject.press("Control+V");
  await textObject.press("Escape");

  await expect(textObject).toContainText("外部纯文本");
  await expect(textObject.locator('[data-external-format="true"]')).toHaveCount(0);
  await expect(textObject.locator("em")).toHaveCount(0);
  await expect(textObject.locator("strong")).toHaveText("重要客户");
  await expect(textObject.locator("code")).toHaveText("HTML");
});

test("warns before replacing all text and allows cancellation", async ({ page }) => {
  const workingCopy = await importFixture(page);
  const textObject = workingCopy.locator("#inline-copy");
  await textObject.click();
  await page.getByRole("textbox", { name: "文字内容" }).fill("完全替换后的文字");
  await expect(textObject).toContainText("完全替换后的文字");

  await page.getByRole("button", { name: "应用文字", exact: true }).click();
  const warning = page.getByRole("dialog", { name: "替换全部文字会清除内部格式" });
  await expect(warning).toContainText("strong、span、code");
  await warning.getByRole("button", { name: "取消" }).click();
  await expect(textObject.locator("strong")).toHaveText("重要客户");
  await expect(textObject.locator("code")).toHaveText("HTML");

  await page.getByRole("textbox", { name: "文字内容" }).fill("确认替换全部文字");
  await page.getByRole("button", { name: "应用文字", exact: true }).click();
  await page
    .getByRole("dialog", { name: "替换全部文字会清除内部格式" })
    .getByRole("button", { name: "仍然替换" })
    .click();
  await expect(textObject).toHaveText("确认替换全部文字");
  await expect(textObject.locator("strong,code,span")).toHaveCount(0);
});

test("shows natural browser reflow while editing plain text", async ({ page }) => {
  const workingCopy = await importFixture(page);
  const textObject = workingCopy.locator("#plain-copy");
  const neighbor = workingCopy.locator("#inline-copy");
  const initialTextHeight = await textObject.evaluate((element) => element.getBoundingClientRect().height);
  const initialNeighborTop = await neighbor.evaluate((element) => element.getBoundingClientRect().top);

  await textObject.dblclick();
  await textObject.press("Control+A");
  await textObject.pressSequentially(
    "这是一段足够长的普通文字，会由原有固定宽度触发浏览器自然换行并推动相邻内容重新排版。",
  );

  await expect
    .poll(() => textObject.evaluate((element) => element.getBoundingClientRect().height))
    .toBeGreaterThan(initialTextHeight);
  await expect
    .poll(() => neighbor.evaluate((element) => element.getBoundingClientRect().top))
    .toBeGreaterThan(initialNeighborTop);
  await textObject.press("Escape");
});

test("applies object-level text styles through history, recovery, and export", async ({
  context,
  page,
}, testInfo) => {
  const workingCopy = await importFixture(page);
  const selected = workingCopy.locator("#plain-copy");
  const untouched = workingCopy.locator("#untouched-copy");
  await selected.click();

  await page.getByLabel("字体族").fill("Georgia");
  await page.getByLabel("字号").fill("30");
  await page.getByLabel("字重").selectOption("700");
  await page.getByLabel("字形").selectOption("italic");
  await page.getByLabel("行高").fill("42");
  await page.getByLabel("字间距").fill("2");
  await page.getByLabel("对齐").selectOption("center");
  await page.getByLabel("文字颜色").fill("#123456");

  await expect.poll(() => selected.evaluate((element) => getComputedStyle(element).fontSize)).toBe("30px");
  await expect.poll(() => selected.evaluate((element) => getComputedStyle(element).fontWeight)).toBe("700");
  await expect.poll(() => selected.evaluate((element) => getComputedStyle(element).fontStyle)).toBe("italic");
  await expect.poll(() => selected.evaluate((element) => getComputedStyle(element).lineHeight)).toBe("42px");
  await expect.poll(() => selected.evaluate((element) => getComputedStyle(element).letterSpacing)).toBe("2px");
  await expect.poll(() => selected.evaluate((element) => getComputedStyle(element).textAlign)).toBe("center");
  await expect.poll(() => selected.evaluate((element) => getComputedStyle(element).color)).toBe("rgb(18, 52, 86)");
  await expect.poll(() => untouched.evaluate((element) => getComputedStyle(element).fontSize)).toBe("16px");

  await page.getByRole("button", { name: "保存字体属性" }).click();
  await page.getByRole("button", { name: "撤销" }).click();
  await expect.poll(() => selected.evaluate((element) => getComputedStyle(element).fontSize)).toBe("16px");
  await page.getByRole("button", { name: "重做" }).click();
  await expect.poll(() => selected.evaluate((element) => getComputedStyle(element).fontSize)).toBe("30px");

  await page.reload();
  const restored = workingCopy.locator("#plain-copy");
  await expect.poll(() => restored.evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Georgia");
  await expect.poll(() => restored.evaluate((element) => getComputedStyle(element).fontSize)).toBe("30px");
  await expect.poll(() => restored.evaluate((element) => getComputedStyle(element).fontWeight)).toBe("700");
  await expect.poll(() => restored.evaluate((element) => getComputedStyle(element).fontStyle)).toBe("italic");
  await expect.poll(() => restored.evaluate((element) => getComputedStyle(element).lineHeight)).toBe("42px");
  await expect.poll(() => restored.evaluate((element) => getComputedStyle(element).letterSpacing)).toBe("2px");
  await expect.poll(() => restored.evaluate((element) => getComputedStyle(element).textAlign)).toBe("center");
  await expect.poll(() => restored.evaluate((element) => getComputedStyle(element).color)).toBe("rgb(18, 52, 86)");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 HTML" }).click();
  const download = await downloadPromise;
  const downloadPath = path.join(testInfo.outputDir, download.suggestedFilename());
  await download.saveAs(downloadPath);
  const deliverable = await context.newPage();
  await deliverable.goto(pathToFileURL(downloadPath).href);
  await expect.poll(() => deliverable.locator("#plain-copy").evaluate((element) => getComputedStyle(element).fontSize)).toBe("30px");
  await expect.poll(() => deliverable.locator("#plain-copy").evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Georgia");
  await expect.poll(() => deliverable.locator("#plain-copy").evaluate((element) => getComputedStyle(element).fontWeight)).toBe("700");
  await expect.poll(() => deliverable.locator("#plain-copy").evaluate((element) => getComputedStyle(element).fontStyle)).toBe("italic");
  await expect.poll(() => deliverable.locator("#plain-copy").evaluate((element) => getComputedStyle(element).lineHeight)).toBe("42px");
  await expect.poll(() => deliverable.locator("#plain-copy").evaluate((element) => getComputedStyle(element).letterSpacing)).toBe("2px");
  await expect.poll(() => deliverable.locator("#plain-copy").evaluate((element) => getComputedStyle(element).textAlign)).toBe("center");
  await expect.poll(() => deliverable.locator("#plain-copy").evaluate((element) => getComputedStyle(element).color)).toBe("rgb(18, 52, 86)");
  await expect.poll(() => deliverable.locator("#untouched-copy").evaluate((element) => getComputedStyle(element).fontSize)).toBe("16px");
});
