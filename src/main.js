import "./styles.css";

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="editor-workspace">
    <div class="compatibility-notice" role="status" hidden>
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3 2.7 20h18.6L12 3Zm0 5.8v5.4m0 2.9v.1"/></svg>
      <p><strong>当前环境不在正式支持范围内</strong><span>请使用最新版桌面 Chrome 或 Edge 获得受支持的编辑体验。</span></p>
    </div>

    <header class="topbar" aria-label="文件与编辑工具">
      <a class="brand" href="/" aria-label="HTML Visual Editor 首页">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <span><b>HTML</b><em>Visual Editor</em></span>
      </a>

      <div class="document-state" aria-label="当前文档">
        <span class="document-icon" aria-hidden="true"></span>
        <span><strong>未打开文档</strong><small>等待本地 HTML</small></span>
      </div>

      <nav class="topbar-actions" aria-label="文档操作">
        <button class="button upload-button" type="button" data-open-html>
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5"/></svg>
          打开 HTML
        </button>
        <input id="html-file-input" class="visually-hidden" type="file" accept=".html,text/html">
        <div class="button-group" aria-label="编辑历史">
          <button type="button" title="撤销" data-undo disabled><span aria-hidden="true">↶</span><span class="visually-hidden">撤销</span></button>
          <button type="button" title="重做" data-redo disabled><span aria-hidden="true">↷</span><span class="visually-hidden">重做</span></button>
        </div>
        <div class="mode-switch" aria-label="工作模式">
          <button type="button" aria-pressed="true" data-edit-mode disabled>编辑</button>
          <button type="button" aria-pressed="false" data-preview-mode disabled>预览</button>
        </div>
        <button class="button export-button" type="button" data-export disabled>
          导出 HTML
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 4v12m0 0 4.5-4.5M12 16l-4.5-4.5M5 19h14"/></svg>
        </button>
      </nav>
    </header>

    <aside class="hierarchy-panel panel" aria-labelledby="hierarchy-title">
      <div class="panel-heading">
        <span class="section-index" aria-hidden="true">01</span>
        <div><p>Structure</p><h2 id="hierarchy-title">HTML 层级</h2></div>
      </div>
      <label class="search-box">
        <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4.5 4.5"/></svg>
        <span class="visually-hidden">搜索 HTML 层级</span>
        <input type="search" placeholder="搜索对象" disabled>
      </label>
      <div class="panel-meta"><span>页面对象</span><span>0</span></div>
      <p class="locked-content-status" role="status" aria-label="锁定内容状态" hidden></p>
      <div class="panel-empty hierarchy-empty">
        <span aria-hidden="true">&lt;/&gt;</span>
        <p>打开 HTML 后，这里会显示页面原有层级。</p>
      </div>
    </aside>

    <main class="working-copy-panel" aria-labelledby="working-copy-title">
      <div class="canvas-toolbar">
        <div class="tool-state">
          <button type="button" disabled><span class="cursor-icon" aria-hidden="true">↖</span>选择</button>
          <span class="canvas-toolbar-rule" aria-hidden="true"></span>
          <p><span>工作副本</span><strong id="working-copy-title">尚未载入</strong></p>
        </div>
        <div class="viewport-tools" aria-label="参考视口与缩放">
          <label>参考视口</label>
          <button type="button" disabled>1440 × 900 <span aria-hidden="true">⌄</span></button>
          <span class="canvas-toolbar-rule" aria-hidden="true"></span>
          <button class="zoom-button" type="button" aria-label="缩小" disabled>−</button>
          <output>64%</output>
          <button class="zoom-button" type="button" aria-label="放大" disabled>+</button>
        </div>
      </div>

      <section class="canvas-stage" aria-label="实时工作副本区域">
        <div class="measure-rule measure-rule-horizontal" aria-hidden="true"></div>
        <div class="measure-rule measure-rule-vertical" aria-hidden="true"></div>
        <div class="canvas-coordinate canvas-coordinate-x" aria-hidden="true">1440</div>
        <div class="canvas-coordinate canvas-coordinate-y" aria-hidden="true">900</div>

        <section class="import-diagnostic" role="alert" aria-labelledby="import-diagnostic-title" hidden>
          <p class="diagnostic-kicker">Import error</p>
          <h2 id="import-diagnostic-title">导入错误</h2>
          <p class="import-diagnostic-message"></p>
          <button class="button" type="button" data-retry-import>重新选择 HTML</button>
        </section>

        <section class="resource-status" role="status" aria-labelledby="resource-status-title" hidden>
          <div class="resource-status-heading">
            <div>
              <p class="diagnostic-kicker">Resource notice</p>
              <h2 id="resource-status-title">资源状态</h2>
              <strong class="resource-status-summary"></strong>
            </div>
            <button type="button" aria-label="关闭资源状态">×</button>
          </div>
          <ul></ul>
        </section>

        <div class="upload-empty-state">
          <div class="empty-document" aria-hidden="true">
            <span class="paper-fold"></span>
            <i></i><i></i><i></i>
            <b>&lt;/&gt;</b>
          </div>
          <p class="empty-kicker">Start with your document</p>
          <h1>把 HTML 放到工作台</h1>
          <p class="empty-description">打开一个受信任的单文件 HTML，在浏览器真实渲染结果上继续修改。</p>
          <button class="button empty-upload-button" type="button" data-open-html>选择本地 HTML</button>
          <div class="local-processing-note">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10V8a5 5 0 0 1 10 0v2m-11 0h12v10H6V10Z"/></svg>
            <span><strong>文件仅在浏览器本地处理</strong><span>编辑器不会把文档上传到产品服务器。</span></span>
          </div>
        </div>
      </section>
    </main>

    <aside class="properties-panel panel" aria-labelledby="properties-title">
      <div class="panel-heading">
        <span class="section-index" aria-hidden="true">02</span>
        <div><p>Inspector</p><h2 id="properties-title">对象属性</h2></div>
      </div>
      <div class="selection-badge">未选择对象</div>
      <div class="panel-empty properties-empty">
        <span class="selection-glyph" aria-hidden="true">↖</span>
        <h3>先选择页面内容</h3>
        <p>载入文档后，单击文字、图片或普通容器即可查看相关属性。</p>
      </div>
      <section class="text-properties" aria-label="当前选择" hidden>
        <label for="text-content">文字内容</label>
        <textarea id="text-content" rows="5"></textarea>
        <p>文字会立即呈现在真实工作副本中，应用后进入编辑历史。</p>
        <button class="button apply-text-button" type="button">应用文字</button>
      </section>
      <div class="property-placeholders" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
    </aside>

    <footer class="statusbar" aria-label="编辑器状态">
      <div class="status-path"><span>路径</span><strong>未选择对象</strong></div>
      <div class="status-items">
        <span><i class="status-dot status-dot-idle"></i>等待文档</span>
        <span data-resource-summary><i class="status-dot status-dot-clear"></i>资源 0</span>
        <span><i class="status-dot status-dot-supported"></i>桌面 Chromium</span>
        <span class="status-local"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10V8a5 5 0 0 1 10 0v2m-11 0h12v10H6V10Z"/></svg>本地处理</span>
      </div>
    </footer>

    <dialog class="trust-dialog" aria-labelledby="trust-dialog-title">
      <form method="dialog">
        <span class="trust-dialog-icon" aria-hidden="true">&lt;/&gt;</span>
        <p class="empty-kicker">Trusted input</p>
        <h2 id="trust-dialog-title">仅打开受信任的 HTML</h2>
        <p>文件和修改只在浏览器本地处理，不会上传到产品服务器。</p>
        <p class="trust-warning"><strong>这不是安全沙箱。</strong> 原 HTML 的脚本会真实运行，原页面可能访问第三方网络资源或发送请求。</p>
        <div class="trust-dialog-actions">
          <button class="button" value="cancel">取消</button>
          <button class="button trust-confirm" type="button">我信任此文件，继续</button>
        </div>
      </form>
    </dialog>
  </div>
`;

const STORAGE_KEY = "html-visual-editor.recent-project.v1";
const TEXT_OBJECT_SELECTOR = "h1,h2,h3,h4,h5,h6,p,a,button,li,td,th,pre,code,blockquote";
const LOCKED_CONTENT_SELECTOR = "svg,canvas,video,audio,iframe";

const state = {
  sourceName: "",
  originalHtml: "",
  edits: {},
  history: [],
  historyIndex: -1,
  selectedId: null,
  selectedElement: null,
  pendingText: "",
  mode: "edit",
  restored: false,
  resources: [],
};

const refs = {
  fileInput: document.querySelector("#html-file-input"),
  trustDialog: document.querySelector(".trust-dialog"),
  trustConfirm: document.querySelector(".trust-confirm"),
  emptyState: document.querySelector(".upload-empty-state"),
  canvasStage: document.querySelector(".canvas-stage"),
  documentName: document.querySelector(".document-state strong"),
  documentStatus: document.querySelector(".document-state small"),
  workingCopyTitle: document.querySelector("#working-copy-title"),
  hierarchyCount: document.querySelector(".panel-meta span:last-child"),
  hierarchyEmpty: document.querySelector(".hierarchy-empty"),
  propertiesEmpty: document.querySelector(".properties-empty"),
  textProperties: document.querySelector(".text-properties"),
  textContent: document.querySelector("#text-content"),
  applyText: document.querySelector(".apply-text-button"),
  selectionBadge: document.querySelector(".selection-badge"),
  placeholders: document.querySelector(".property-placeholders"),
  undo: document.querySelector("[data-undo]"),
  redo: document.querySelector("[data-redo]"),
  editMode: document.querySelector("[data-edit-mode]"),
  previewMode: document.querySelector("[data-preview-mode]"),
  exportButton: document.querySelector("[data-export]"),
  statusPath: document.querySelector(".status-path strong"),
  statusDocument: document.querySelector(".status-items > span:first-child"),
  statusResources: document.querySelector("[data-resource-summary]"),
  importDiagnostic: document.querySelector(".import-diagnostic"),
  importDiagnosticMessage: document.querySelector(".import-diagnostic-message"),
  resourceStatus: document.querySelector(".resource-status"),
  resourceStatusSummary: document.querySelector(".resource-status-summary"),
  resourceList: document.querySelector(".resource-status ul"),
  lockedContentStatus: document.querySelector(".locked-content-status"),
};

document.querySelectorAll("[data-open-html]").forEach((button) => {
  button.addEventListener("click", openTrustDialog);
});
document.querySelector("[data-retry-import]").addEventListener("click", openTrustDialog);
document
  .querySelector('.resource-status button[aria-label="关闭资源状态"]')
  .addEventListener("click", () => {
    refs.resourceStatus.hidden = true;
  });
refs.trustConfirm.addEventListener("click", () => {
  refs.trustDialog.close();
  refs.fileInput.click();
});
refs.fileInput.addEventListener("change", importSelectedFile);
refs.textContent.addEventListener("input", previewTextChange);
refs.applyText.addEventListener("click", commitTextChange);
refs.undo.addEventListener("click", undo);
refs.redo.addEventListener("click", redo);
refs.editMode.addEventListener("click", () => setMode("edit"));
refs.previewMode.addEventListener("click", () => setMode("preview"));
refs.exportButton.addEventListener("click", exportHtml);

restoreRecentProject();

async function importSelectedFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    hideImportError();
    if (!/\.html$/i.test(file.name)) {
      showImportError(
        "仅支持单个 .html 文件。MVP 不支持 ZIP、资源目录或源码工程。",
      );
      return;
    }

    const html = await file.text();
    validateHtmlInput(html);
    const previousProject = captureProjectState();
    state.sourceName = file.name;
    state.originalHtml = html;
    state.edits = {};
    state.history = [];
    state.historyIndex = -1;
    state.selectedId = null;
    state.restored = false;
    state.resources = inspectDeclaredResources(html);
    try {
      await loadWorkingCopy();
      saveProject();
    } catch (error) {
      restoreProjectState(previousProject);
      if (state.originalHtml) await loadWorkingCopy();
      else resetEmptyWorkspace();
      throw error;
    }
  } catch (error) {
    console.error("Unable to import the selected HTML", error);
    showImportError("无法载入这个 HTML。最近保存的本地项目未被覆盖，请重新选择文件。");
  } finally {
    refs.fileInput.value = "";
  }
}

function validateHtmlInput(html) {
  if (!html.trim()) throw new Error("The selected HTML is empty.");
}

function captureProjectState() {
  return {
    sourceName: state.sourceName,
    originalHtml: state.originalHtml,
    edits: structuredClone(state.edits),
    history: structuredClone(state.history),
    historyIndex: state.historyIndex,
    mode: state.mode,
    restored: state.restored,
    resources: structuredClone(state.resources),
  };
}

function restoreProjectState(project) {
  Object.assign(state, project, { selectedId: null, selectedElement: null });
}

function openTrustDialog() {
  refs.trustDialog.showModal();
}

function showImportError(message) {
  refs.importDiagnosticMessage.textContent = message;
  refs.importDiagnostic.hidden = false;
  refs.statusDocument.innerHTML = '<i class="status-dot status-dot-error"></i>导入错误';
}

function hideImportError() {
  refs.importDiagnostic.hidden = true;
}

function resetEmptyWorkspace() {
  document.querySelector(".working-copy-frame")?.remove();
  refs.emptyState.hidden = false;
  refs.documentName.textContent = "未打开文档";
  refs.documentStatus.textContent = "等待本地 HTML";
  refs.workingCopyTitle.textContent = "尚未载入";
  refs.hierarchyCount.textContent = "0";
  refs.editMode.disabled = true;
  refs.previewMode.disabled = true;
  refs.exportButton.disabled = true;
}

async function loadWorkingCopy() {
  clearSelection();
  refs.emptyState.hidden = true;

  let frame = document.querySelector(".working-copy-frame");
  if (!frame) {
    frame = document.createElement("iframe");
    frame.className = "working-copy-frame";
    frame.title = "HTML 工作副本";
    refs.canvasStage.append(frame);
  }

  const importToken = crypto.randomUUID();
  frame.srcdoc = buildWorkingCopyHtml(importToken);
  await waitForWorkingCopyDocument(frame, importToken);

  installEditingBoundary(frame);
  await detectFailedExternalResources(frame);
  updateProjectChrome(frame);
}

async function waitForWorkingCopyDocument(frame, importToken) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const loadedToken = frame.contentDocument
      ?.querySelector('meta[name="html-editor-import-token"]')
      ?.getAttribute("content");
    if (loadedToken === importToken) return;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  throw new Error("The HTML working copy did not become ready.");
}

function buildWorkingCopyHtml(importToken) {
  const doc = new DOMParser().parseFromString(state.originalHtml, "text/html");
  const token = doc.createElement("meta");
  token.name = "html-editor-import-token";
  token.content = importToken;
  doc.head.append(token);
  assignEditorIds(doc);
  applyEdits(doc);
  const assistStyle = doc.createElement("style");
  assistStyle.dataset.htmlEditorAssist = "true";
  assistStyle.textContent = `
    html[data-html-editor-mode="edit"] ${TEXT_OBJECT_SELECTOR} { cursor: default !important; }
    [data-html-editor-selected="true"] {
      outline: 3px solid #2f5bff !important;
      outline-offset: 3px !important;
    }
  `;
  doc.head.append(assistStyle);
  return `<!doctype html>\n${doc.documentElement.outerHTML}`;
}

function inspectDeclaredResources(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const urls = [];
  const collect = (element, attribute) => {
    const value = element.getAttribute(attribute)?.trim();
    if (value) urls.push(value);
  };

  doc.querySelectorAll("img[src],script[src],source[src],audio[src]").forEach((element) =>
    collect(element, "src"),
  );
  doc.querySelectorAll("link[href]").forEach((element) => collect(element, "href"));
  doc.querySelectorAll("video[poster]").forEach((element) => collect(element, "poster"));
  doc.querySelectorAll("img[srcset],source[srcset]").forEach((element) => {
    element
      .getAttribute("srcset")
      .split(",")
      .map((candidate) => candidate.trim().split(/\s+/)[0])
      .filter(Boolean)
      .forEach((url) => urls.push(url));
  });
  doc.querySelectorAll("style,[style]").forEach((element) => {
    const css = element.tagName === "STYLE" ? element.textContent : element.getAttribute("style");
    for (const match of css?.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi) || []) {
      if (match[2]) urls.push(match[2]);
    }
  });

  return [...new Set(urls)]
    .filter((url) => !/^(?:data:|blob:|about:|#)/i.test(url))
    .map((url) => ({
      url,
      kind: isExternalUrl(url) ? "external" : "missing",
    }));
}

function isExternalUrl(url) {
  return /^(?:https?:)?\/\//i.test(url);
}

async function detectFailedExternalResources(frame) {
  if (!state.resources.some((resource) => resource.kind === "external")) return;

  await new Promise((resolve) => setTimeout(resolve, 0));
  const failedUrls = new Set();
  frame.contentDocument?.querySelectorAll("img[src]").forEach((image) => {
    const declaredUrl = image.getAttribute("src")?.trim();
    if (isExternalUrl(declaredUrl) && image.complete && image.naturalWidth === 0) {
      failedUrls.add(declaredUrl);
    } else if (isExternalUrl(declaredUrl) && !image.complete) {
      image.addEventListener("error", () => markExternalResourceFailed(declaredUrl), { once: true });
    }
  });
  frame.contentDocument?.querySelectorAll("link[href]").forEach((link) => {
    const declaredUrl = link.getAttribute("href")?.trim();
    if (isExternalUrl(declaredUrl) && link.relList.contains("stylesheet") && !link.sheet) {
      failedUrls.add(declaredUrl);
    }
    if (isExternalUrl(declaredUrl) && link.relList.contains("stylesheet")) {
      link.addEventListener("error", () => markExternalResourceFailed(declaredUrl), { once: true });
    }
  });
  state.resources = state.resources.map((resource) =>
    failedUrls.has(resource.url) ? { ...resource, kind: "failed" } : resource,
  );
}

function markExternalResourceFailed(url) {
  state.resources = state.resources.map((resource) =>
    resource.url === url ? { ...resource, kind: "failed" } : resource,
  );
  updateResourceStatus();
}

function assignEditorIds(doc) {
  [...doc.querySelectorAll(TEXT_OBJECT_SELECTOR)].forEach((element, index) => {
    if (!element.dataset.htmlEditorId) {
      element.dataset.htmlEditorId = `text-${index + 1}`;
    }
  });
}

function applyEdits(doc) {
  Object.entries(state.edits).forEach(([id, edit]) => {
    const element = doc.querySelector(`[data-html-editor-id="${CSS.escape(id)}"]`);
    if (element && typeof edit.text === "string") element.textContent = edit.text;
  });
}

function installEditingBoundary(frame) {
  const frameDocument = frame.contentDocument;
  if (!frameDocument) return;

  if (state.mode === "edit") {
    frameDocument.documentElement.dataset.htmlEditorMode = "edit";
    frameDocument.addEventListener("click", handleWorkingCopyClick, true);
  } else {
    frameDocument.documentElement.dataset.htmlEditorMode = "preview";
  }
}

function handleWorkingCopyClick(event) {
  if (state.mode !== "edit") return;
  const target = event.target?.closest?.(TEXT_OBJECT_SELECTOR) || null;
  if (!target) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  selectTextObject(target);
}

function selectTextObject(element) {
  clearSelection();
  state.selectedElement = element;
  state.selectedId = element.dataset.htmlEditorId;
  state.pendingText = element.textContent;
  element.dataset.htmlEditorSelected = "true";
  refs.textContent.value = state.pendingText;
  refs.propertiesEmpty.hidden = true;
  refs.textProperties.hidden = false;
  refs.placeholders.hidden = true;
  refs.selectionBadge.textContent = element.tagName.toLowerCase();
  refs.statusPath.textContent = `${element.tagName.toLowerCase()} · ${state.selectedId}`;
}

function clearSelection() {
  if (state.selectedElement?.isConnected) {
    delete state.selectedElement.dataset.htmlEditorSelected;
  }
  state.selectedElement = null;
  state.selectedId = null;
  if (!refs) return;
  refs.propertiesEmpty.hidden = false;
  refs.textProperties.hidden = true;
  refs.placeholders.hidden = false;
  refs.selectionBadge.textContent = "未选择对象";
  refs.statusPath.textContent = "未选择对象";
}

function previewTextChange() {
  if (!state.selectedElement) return;
  state.pendingText = refs.textContent.value;
  state.selectedElement.textContent = state.pendingText;
}

function commitTextChange() {
  if (!state.selectedElement || !state.selectedId) return;
  const before = structuredClone(state.edits);
  const originalDocument = new DOMParser().parseFromString(state.originalHtml, "text/html");
  assignEditorIds(originalDocument);
  const originalText = originalDocument
    .querySelector(`[data-html-editor-id="${CSS.escape(state.selectedId)}"]`)
    ?.textContent;

  if (state.pendingText === originalText) delete state.edits[state.selectedId];
  else state.edits[state.selectedId] = { text: state.pendingText };

  if (JSON.stringify(before) === JSON.stringify(state.edits)) return;
  state.history.splice(state.historyIndex + 1);
  state.history.push({ before, after: structuredClone(state.edits) });
  state.historyIndex = state.history.length - 1;
  saveProject();
  syncHistoryButtons();
  refs.documentStatus.textContent = "已保存到浏览器";
}

function undo() {
  if (state.historyIndex < 0) return;
  state.edits = structuredClone(state.history[state.historyIndex].before);
  state.historyIndex -= 1;
  syncLoadedWorkingCopy();
  saveProject();
  syncHistoryButtons();
}

function redo() {
  if (state.historyIndex >= state.history.length - 1) return;
  state.historyIndex += 1;
  state.edits = structuredClone(state.history[state.historyIndex].after);
  syncLoadedWorkingCopy();
  saveProject();
  syncHistoryButtons();
}

function syncLoadedWorkingCopy() {
  clearSelection();
  const currentDocument = document.querySelector(".working-copy-frame")?.contentDocument;
  if (!currentDocument) return;
  const originalDocument = new DOMParser().parseFromString(state.originalHtml, "text/html");
  assignEditorIds(originalDocument);

  currentDocument.querySelectorAll("[data-html-editor-id]").forEach((element) => {
    const id = element.dataset.htmlEditorId;
    const originalElement = originalDocument.querySelector(
      `[data-html-editor-id="${CSS.escape(id)}"]`,
    );
    const text = state.edits[id]?.text ?? originalElement?.textContent;
    if (typeof text === "string") element.textContent = text;
  });
}

async function setMode(mode) {
  if (!state.originalHtml || state.mode === mode) return;
  state.mode = mode;
  refs.editMode.setAttribute("aria-pressed", String(mode === "edit"));
  refs.previewMode.setAttribute("aria-pressed", String(mode === "preview"));
  clearSelection();
  await loadWorkingCopy();
  saveProject();
}

function saveProject() {
  const project = {
    sourceName: state.sourceName,
    originalHtml: state.originalHtml,
    edits: state.edits,
    history: state.history,
    historyIndex: state.historyIndex,
    mode: state.mode,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch (error) {
    refs.documentStatus.textContent = "本地保存失败，请尽快导出";
    console.error("Unable to save the local project", error);
  }
}

function restoreRecentProject() {
  let project;
  try {
    project = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch (error) {
    console.error("Unable to read the local project", error);
    return;
  }
  if (!project?.originalHtml || !project?.sourceName) return;

  state.sourceName = project.sourceName;
  state.originalHtml = project.originalHtml;
  state.edits = project.edits || {};
  state.history = project.history || [];
  state.historyIndex = Number.isInteger(project.historyIndex) ? project.historyIndex : -1;
  state.mode = project.mode === "preview" ? "preview" : "edit";
  state.restored = true;
  state.resources = inspectDeclaredResources(project.originalHtml);
  loadWorkingCopy();
}

function updateProjectChrome(frame) {
  const count = frame.contentDocument?.querySelectorAll(TEXT_OBJECT_SELECTOR).length || 0;
  const lockedCount = frame.contentDocument?.querySelectorAll(LOCKED_CONTENT_SELECTOR).length || 0;
  refs.documentName.textContent = state.sourceName;
  refs.documentStatus.textContent = state.restored ? "已从浏览器恢复" : "已保存到浏览器";
  refs.workingCopyTitle.textContent = state.mode === "edit" ? "编辑模式" : "预览模式";
  refs.hierarchyCount.textContent = String(count);
  refs.hierarchyEmpty.querySelector("p").textContent = "文字对象已可从工作副本中直接选择。完整层级树将在后续切片提供。";
  refs.lockedContentStatus.hidden = lockedCount === 0;
  refs.lockedContentStatus.textContent = lockedCount
    ? `锁定内容 ${lockedCount} · 保留原样运行，MVP 暂不直接编辑`
    : "";
  refs.statusDocument.innerHTML = `<i class="status-dot status-dot-supported"></i>${state.restored ? "已从浏览器恢复" : "文档已载入"}`;
  refs.editMode.disabled = false;
  refs.previewMode.disabled = false;
  refs.exportButton.disabled = false;
  refs.editMode.setAttribute("aria-pressed", String(state.mode === "edit"));
  refs.previewMode.setAttribute("aria-pressed", String(state.mode === "preview"));
  updateResourceStatus();
  syncHistoryButtons();
}

function updateResourceStatus() {
  const issues = state.resources.filter((resource) => resource.kind !== "external");
  const missingCount = state.resources.filter((resource) => resource.kind === "missing").length;
  const failedCount = state.resources.filter((resource) => resource.kind === "failed").length;
  const externalCount = state.resources.filter((resource) => resource.kind === "external").length;

  refs.resourceList.replaceChildren(
    ...issues.map((resource) => {
      const item = document.createElement("li");
      const label = resource.kind === "missing" ? "缺失" : "加载失败";
      const detail =
        resource.kind === "missing" ? "未随单 HTML 提供" : "外部 URL 保持原样，当前未能加载";
      item.dataset.resourceKind = resource.kind;
      item.innerHTML = `<strong>${label}</strong><code></code><span>${detail}</span>`;
      item.querySelector("code").textContent = resource.url;
      return item;
    }),
  );
  refs.resourceStatus.hidden = issues.length === 0;

  const summary = missingCount
    ? `缺失资源 ${missingCount}`
    : failedCount
      ? `资源失败 ${failedCount}`
      : externalCount
        ? `外部资源 ${externalCount}`
        : "资源 0";
  const statusClass = issues.length ? "status-dot-warning" : "status-dot-clear";
  refs.resourceStatusSummary.textContent = summary;
  refs.statusResources.innerHTML = `<i class="status-dot ${statusClass}"></i>${summary}`;
}

function syncHistoryButtons() {
  refs.undo.disabled = state.historyIndex < 0;
  refs.redo.disabled = state.historyIndex >= state.history.length - 1;
}

function exportHtml() {
  const doc = new DOMParser().parseFromString(state.originalHtml, "text/html");
  assignEditorIds(doc);
  applyEdits(doc);
  const output = `<!doctype html>\n${doc.documentElement.outerHTML}`;
  const blobUrl = URL.createObjectURL(new Blob([output], { type: "text/html;charset=utf-8" }));
  const download = document.createElement("a");
  download.href = blobUrl;
  download.download = state.sourceName.replace(/\.html?$/i, "") + "-edited.html";
  download.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

function isSupportedEnvironment() {
  const desktopViewport = window.matchMedia("(min-width: 900px)").matches;
  const chromium = /(?:Chrome|Chromium|Edg)\//.test(navigator.userAgent);
  const mobileBrowser = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return desktopViewport && chromium && !mobileBrowser;
}

function updateCompatibilityNotice() {
  const notice = document.querySelector(".compatibility-notice");
  notice.hidden = isSupportedEnvironment();
  document.querySelector(".editor-workspace").classList.toggle("has-compatibility-notice", !notice.hidden);
}

updateCompatibilityNotice();
window.addEventListener("resize", updateCompatibilityNotice);
