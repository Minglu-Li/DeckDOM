import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

const fixture = fileURLToPath(new URL("./fixtures/visual-transform.html", import.meta.url));

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

const geometry = (workingCopy) => workingCopy.locator("#target").evaluate((target) => {
  const neighbor = target.ownerDocument.querySelector("#neighbor");
  const targetRect = target.getBoundingClientRect();
  const neighborRect = neighbor.getBoundingClientRect();
  return {
    target: { x: targetRect.x, y: targetRect.y, width: targetRect.width, height: targetRect.height },
    neighbor: { x: neighborRect.x, y: neighborRect.y, width: neighborRect.width, height: neighborRect.height },
  };
});

async function dragBy(page, locator, dx, dy, steps = 8) {
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps });
  await page.mouse.up();
}

test("user moves one object continuously without reflowing its flex neighbor", async ({ page }) => {
  const workingCopy = await importFixture(page);
  await workingCopy.getByRole("heading", { name: "移动我" }).click();
  await page.getByRole("button", { name: "选择父容器" }).click();

  const before = await geometry(workingCopy);
  const renderedBefore = await workingCopy.locator("#target").boundingBox();
  const moveHandle = page.getByRole("button", { name: "移动所选内容" });
  const overlayBefore = await moveHandle.boundingBox();
  await page.mouse.move(overlayBefore.x + overlayBefore.width / 2, overlayBefore.y + overlayBefore.height / 2);
  await page.mouse.down();
  await page.mouse.move(overlayBefore.x + overlayBefore.width / 2 + 90, overlayBefore.y + overlayBefore.height / 2 + 45, { steps: 4 });
  const renderedDuring = await workingCopy.locator("#target").boundingBox();
  expect(renderedDuring.x).toBeGreaterThan(renderedBefore.x + 35);
  await page.mouse.move(overlayBefore.x + overlayBefore.width / 2 + 120, overlayBefore.y + overlayBefore.height / 2 + 60, { steps: 4 });
  await page.mouse.up();

  const moved = await geometry(workingCopy);
  const renderedMoved = await workingCopy.locator("#target").boundingBox();
  expect(renderedMoved.x).toBeCloseTo(renderedBefore.x + 120, 0);
  expect(renderedMoved.y).toBeCloseTo(renderedBefore.y + 60, 0);
  expect(moved.neighbor.x).toBeCloseTo(before.neighbor.x, 0);
  expect(moved.neighbor.y).toBeCloseTo(before.neighbor.y, 0);
  expect(moved.target.x + moved.target.width).toBeGreaterThan(moved.neighbor.x);

  await page.getByRole("button", { name: "撤销" }).click();
  await expect.poll(() => geometry(workingCopy)).toMatchObject(before);
  await page.getByRole("button", { name: "重做" }).click();
  await expect.poll(async () => (await geometry(workingCopy)).target.x).toBeCloseTo(moved.target.x, 0);
});

test("corner handle scales proportionally, preserves layout occupancy and survives recovery", async ({ context, page }) => {
  const workingCopy = await importFixture(page);
  await workingCopy.getByRole("heading", { name: "移动我" }).click();
  await page.getByRole("button", { name: "选择父容器" }).click();
  const before = await geometry(workingCopy);
  const originalTransform = await workingCopy.locator("#target").evaluate(
    (element) => getComputedStyle(element).transform,
  );

  await dragBy(page, page.getByLabel("右下角等比缩放手柄"), 90, 45);
  const scaled = await geometry(workingCopy);
  expect(scaled.target.width).toBeGreaterThan(before.target.width * 1.35);
  expect(scaled.target.width / scaled.target.height).toBeCloseTo(before.target.width / before.target.height, 1);
  expect(scaled.neighbor.x).toBeCloseTo(before.neighbor.x, 0);
  expect(scaled.neighbor.width).toBeCloseTo(before.neighbor.width, 0);
  await expect.poll(() => workingCopy.locator("#target").evaluate(
    (element) => getComputedStyle(element).transform,
  )).toBe(originalTransform);

  await page.reload();
  await expect.poll(async () => (await geometry(workingCopy)).target.width).toBeCloseTo(scaled.target.width, 0);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 HTML" }).click();
  const download = await downloadPromise;
  const html = await (await download.createReadStream()).toArray();
  const output = Buffer.concat(html).toString("utf8");
  const deliverable = await context.newPage();
  await deliverable.goto(`data:text/html;base64,${Buffer.from(output).toString("base64")}`);
  const deliveredTarget = await deliverable.locator("#target").boundingBox();
  const deliveredNeighbor = await deliverable.locator("#neighbor").boundingBox();
  expect(deliveredTarget.width).toBeCloseTo(scaled.target.width, 0);
  expect(deliveredTarget.height).toBeCloseTo(scaled.target.height, 0);
  expect(deliveredNeighbor.x).toBeCloseTo(scaled.neighbor.x, 0);
  await expect(deliverable.locator("#target")).toHaveCSS("transform", originalTransform);
  await expect(deliverable.getByLabel("当前选框")).toHaveCount(0);
});

test("visual transforms target only the selected text or image stable object", async ({ page }) => {
  const workingCopy = await importFixture(page);
  const textBefore = await workingCopy.locator("#copy-a").boundingBox();
  const peerBefore = await workingCopy.locator("#copy-b").boundingBox();
  const imageBefore = await workingCopy.locator("#photo").boundingBox();

  await workingCopy.getByText("当前文字", { exact: true }).click();
  await dragBy(page, page.getByRole("button", { name: "移动所选内容" }), 64, -24);
  const textMoved = await workingCopy.locator("#copy-a").boundingBox();
  const peerAfter = await workingCopy.locator("#copy-b").boundingBox();
  expect(textMoved.x).toBeCloseTo(textBefore.x + 64, 0);
  expect(textMoved.y).toBeCloseTo(textBefore.y - 24, 0);
  expect(peerAfter).toMatchObject(peerBefore);

  await workingCopy.getByRole("img", { name: "缩放图片" }).click();
  await dragBy(page, page.getByLabel("左上角等比缩放手柄"), -45, -30);
  const imageScaled = await workingCopy.locator("#photo").boundingBox();
  expect(imageScaled.width).toBeGreaterThan(imageBefore.width * 1.25);
  expect(imageScaled.width / imageScaled.height).toBeCloseTo(imageBefore.width / imageBefore.height, 1);
  const textAfterImageScale = await workingCopy.locator("#copy-a").boundingBox();
  expect(textAfterImageScale.x).toBeCloseTo(textMoved.x, 0);
  expect(textAfterImageScale.y).toBeCloseTo(textMoved.y, 0);
});
