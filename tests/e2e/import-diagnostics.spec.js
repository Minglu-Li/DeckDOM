import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

async function chooseTrustedFile(page, file) {
  await page.getByRole("button", { name: /选择本地 HTML|打开 HTML/ }).first().click();
  const chooserPromise = page.waitForEvent("filechooser");
  await page
    .getByRole("dialog", { name: "仅打开受信任的 HTML" })
    .getByRole("button", { name: "我信任此文件，继续" })
    .click();
  const chooser = await chooserPromise;
  await chooser.setFiles(file);
}

test("rejects a non-HTML file and explains the single-file MVP boundary", async ({ page }) => {
  await page.getByRole("button", { name: "选择本地 HTML" }).click();
  const chooserPromise = page.waitForEvent("filechooser");
  await page
    .getByRole("dialog", { name: "仅打开受信任的 HTML" })
    .getByRole("button", { name: "我信任此文件，继续" })
    .click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: "website.zip",
    mimeType: "application/zip",
    buffer: Buffer.from("not an HTML document"),
  });

  const diagnostic = page.getByRole("alert", { name: "导入错误" });
  await expect(diagnostic).toBeVisible();
  await expect(diagnostic).toContainText("仅支持单个 .html 文件");
  await expect(diagnostic).toContainText("不支持 ZIP、资源目录或源码工程");
  await expect(diagnostic.getByRole("button", { name: "重新选择 HTML" })).toBeVisible();
  await expect(page.locator('iframe[title="HTML 工作副本"]')).toHaveCount(0);
});

test("keeps the current and recoverable project when selected HTML cannot be loaded", async ({
  page,
}) => {
  await chooseTrustedFile(page, {
    name: "working.html",
    mimeType: "text/html",
    buffer: Buffer.from("<!doctype html><html><body><h1>Keep this project</h1></body></html>"),
  });
  const workingCopy = page.frameLocator('iframe[title="HTML 工作副本"]');
  await expect(workingCopy.getByRole("heading", { name: "Keep this project" })).toBeVisible();

  await chooseTrustedFile(page, {
    name: "broken.html",
    mimeType: "text/html",
    buffer: Buffer.from("   "),
  });

  const diagnostic = page.getByRole("alert", { name: "导入错误" });
  await expect(diagnostic).toContainText("无法载入这个 HTML");
  await expect(diagnostic).toContainText("最近保存的本地项目未被覆盖");
  await expect(workingCopy.getByRole("heading", { name: "Keep this project" })).toBeVisible();

  await page.reload();
  await expect(workingCopy.getByRole("heading", { name: "Keep this project" })).toBeVisible();
  await expect(page.getByLabel("当前文档")).toContainText("working.html");
});

test("reports missing relative resources while preserving the rest of the page", async ({ page }) => {
  await chooseTrustedFile(page, {
    name: "relative-assets.html",
    mimeType: "text/html",
    buffer: Buffer.from(`<!doctype html>
      <html><body>
        <h1>Visible content remains</h1>
        <img src="./images/not-provided.png" alt="Missing product preview">
      </body></html>`),
  });

  const workingCopy = page.frameLocator('iframe[title="HTML 工作副本"]');
  await expect(workingCopy.getByRole("heading", { name: "Visible content remains" })).toBeVisible();

  const resources = page.getByRole("status", { name: "资源状态" });
  await expect(resources).toContainText("缺失资源 1");
  await expect(resources).toContainText("./images/not-provided.png");
  await expect(resources).toContainText("未随单 HTML 提供");
  await expect(page.getByRole("alert", { name: "导入错误" })).toBeHidden();
});

test("keeps an external URL unchanged and reports a failed load separately", async ({ page }) => {
  await page.route("https://assets.example.test/**", (route) => route.abort("failed"));
  const externalUrl = "https://assets.example.test/not-available.png";
  await chooseTrustedFile(page, {
    name: "external-resource.html",
    mimeType: "text/html",
    buffer: Buffer.from(`<!doctype html><html><body>
      <h1>External resource page</h1>
      <img src="${externalUrl}" alt="External preview">
    </body></html>`),
  });

  const workingCopy = page.frameLocator('iframe[title="HTML 工作副本"]');
  await expect(workingCopy.getByRole("heading", { name: "External resource page" })).toBeVisible();
  await expect(workingCopy.getByAltText("External preview")).toHaveAttribute("src", externalUrl);

  const resources = page.getByRole("status", { name: "资源状态" });
  await expect(resources).toContainText("加载失败");
  await expect(resources).toContainText(externalUrl);
  await expect(resources).toContainText("外部 URL 保持原样");
});

test("presents trusted-input, local-processing, and diagnostic states distinctly", async ({ page }) => {
  await page.getByRole("button", { name: "选择本地 HTML" }).click();
  const trustDialog = page.getByRole("dialog", { name: "仅打开受信任的 HTML" });
  await expect(trustDialog).toContainText("脚本会真实运行");
  await expect(trustDialog).toContainText("第三方网络资源或发送请求");
  await expect(trustDialog).toContainText("不会上传到产品服务器");
  await trustDialog.getByRole("button", { name: "取消" }).click();

  await chooseTrustedFile(page, {
    name: "distinct-states.html",
    mimeType: "text/html",
    buffer: Buffer.from(`<!doctype html><html><body>
      <h1>Stateful page</h1><svg aria-label="Preserved graphic"></svg>
      <img src="./missing.png" alt="Missing image">
    </body></html>`),
  });

  await expect(page.getByRole("status", { name: "锁定内容状态" })).toContainText("锁定内容");
  await expect(page.getByRole("status", { name: "资源状态" })).toContainText("缺失资源");
  await expect(page.locator(".compatibility-notice")).toBeHidden();
  await expect(page.getByRole("alert", { name: "导入错误" })).toBeHidden();
});
