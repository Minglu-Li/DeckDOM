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
      <div class="hierarchy-tree" role="tree" aria-label="HTML 层级树" hidden></div>
    </aside>

    <main class="working-copy-panel" aria-labelledby="working-copy-title">
      <div class="canvas-toolbar">
        <div class="tool-state">
          <button type="button" disabled><span class="cursor-icon" aria-hidden="true">↖</span>选择</button>
          <span class="canvas-toolbar-rule" aria-hidden="true"></span>
          <p><span>工作副本</span><strong id="working-copy-title">尚未载入</strong></p>
        </div>
        <div class="viewport-tools" aria-label="参考视口与缩放">
          <span class="viewport-label">参考视口</span>
          <label class="viewport-dimension">
            <span class="visually-hidden">参考视口宽度</span>
            <input type="number" inputmode="numeric" aria-label="参考视口宽度" value="1440" disabled>
          </label>
          <span aria-hidden="true">×</span>
          <label class="viewport-dimension">
            <span class="visually-hidden">参考视口高度</span>
            <input type="number" inputmode="numeric" aria-label="参考视口高度" value="900" disabled>
          </label>
          <button type="button" data-apply-viewport disabled>应用参考视口</button>
          <span class="canvas-toolbar-rule" aria-hidden="true"></span>
          <button class="zoom-button" type="button" aria-label="缩小" data-zoom-out disabled>−</button>
          <output aria-label="画布显示缩放">64%</output>
          <button class="zoom-button" type="button" aria-label="放大" data-zoom-in disabled>+</button>
          <button type="button" data-fit-canvas disabled>适合画布</button>
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
        <div class="object-summary"><strong>文字对象</strong><span>可编辑</span></div>
        <label for="text-content">文字内容</label>
        <textarea id="text-content" rows="5"></textarea>
        <p class="inline-edit-status" hidden>正在工作副本中就地编辑</p>
        <p>双击工作副本中的文字可就地编辑；应用文字用于替换全部内容。</p>
        <button class="button apply-text-button" type="button">应用文字</button>
        <fieldset class="text-style-fields">
          <legend>文字样式</legend>
          <label>字体族<input name="fontFamily" type="text"></label>
          <label>字号<input name="fontSize" type="number" min="1" step="1"><span>px</span></label>
          <label>字重<select name="fontWeight"><option value="400">常规</option><option value="500">中等</option><option value="600">半粗</option><option value="700">粗体</option><option value="800">特粗</option></select></label>
          <label>字形<select name="fontStyle"><option value="normal">常规</option><option value="italic">斜体</option></select></label>
          <label>行高<input name="lineHeight" type="number" min="1" step="1"><span>px</span></label>
          <label>字间距<input name="letterSpacing" type="number" step="0.1"><span>px</span></label>
          <label>对齐<select name="textAlign"><option value="start">开始</option><option value="left">左对齐</option><option value="center">居中</option><option value="right">右对齐</option><option value="justify">两端对齐</option></select></label>
          <label>文字颜色<input name="color" type="color"></label>
        </fieldset>
        <button class="button apply-text-style-button" type="button">保存字体属性</button>
      </section>
      <section class="image-properties" aria-label="当前图片" hidden>
        <div class="object-summary"><strong>图片对象</strong><span>可替换</span></div>
        <dl class="image-details">
          <div><dt>替代文字</dt><dd data-image-alt></dd></div>
          <div><dt>显示尺寸</dt><dd data-image-size></dd></div>
          <div><dt>图片来源</dt><dd data-image-source></dd></div>
        </dl>
        <p>新图片会沿用当前对象的布局尺寸和基础外观。</p>
        <button class="button replace-image-button" type="button">从本地替换图片</button>
        <input id="replacement-image-input" class="visually-hidden" type="file" accept="image/*">
        <p class="image-replacement-status" role="alert" hidden></p>
      </section>
      <section class="object-properties" aria-label="当前对象" hidden>
        <div class="object-summary"><strong></strong><span></span></div>
        <p class="object-message"></p>
      </section>
      <div class="selection-actions" hidden>
        <button class="button select-parent-button" type="button">选择父容器</button>
      </div>
      <div class="property-placeholders" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
    </aside>

    <footer class="statusbar" aria-label="编辑器状态">
      <div class="status-path"><span>路径</span><strong aria-label="对象路径">未选择对象</strong></div>
      <div class="status-items">
        <span class="viewport-guarantee">修改只保证当前参考视口下的预期结果</span>
        <span data-status-document><i class="status-dot status-dot-idle"></i>等待文档</span>
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

    <dialog class="replace-text-dialog" aria-labelledby="replace-text-dialog-title">
      <form method="dialog">
        <p class="empty-kicker">Replace all text</p>
        <h2 id="replace-text-dialog-title">替换全部文字会清除内部格式</h2>
        <p>当前文字包含 strong、span、code 等内联结构。继续后只保留输入的纯文字。</p>
        <div class="trust-dialog-actions">
          <button class="button" value="cancel">取消</button>
          <button class="button replace-text-confirm" type="button">仍然替换</button>
        </div>
      </form>
    </dialog>
  </div>
`;

const STORAGE_KEY = "html-visual-editor.recent-project.v1";
const TEXT_OBJECT_SELECTOR = "h1,h2,h3,h4,h5,h6,p,a,button,li,td,th,pre,code,blockquote";
const IMAGE_OBJECT_SELECTOR = "img";
const CONTAINER_OBJECT_SELECTOR = "section,article,nav,header,footer,main,aside,div,ul,ol,table,tbody,thead,tr";
const COMPLEX_OBJECT_SELECTOR = "svg,canvas,video,audio,iframe,object,embed";
const DISCOVERABLE_SELECTOR = `${TEXT_OBJECT_SELECTOR},${IMAGE_OBJECT_SELECTOR},${CONTAINER_OBJECT_SELECTOR},${COMPLEX_OBJECT_SELECTOR}`;

const state = {
  sourceName: "",
  originalHtml: "",
  edits: {},
  history: [],
  historyIndex: -1,
  selectedId: null,
  selectedElement: null,
  pendingText: "",
  pendingTextStyles: {},
  mode: "edit",
  restored: false,
  inlineEditingElement: null,
  inlineEditingBeforeHtml: "",
  objects: [],
  nextObjectId: 1,
  observer: null,
  selectionAnimationFrame: null,
  resources: [],
  viewportWidth: 1440,
  viewportHeight: 900,
  canvasZoom: 0.64,
  fitCanvasActive: false,
  visualGesture: null,
};

const refs = {
  fileInput: document.querySelector("#html-file-input"),
  trustDialog: document.querySelector(".trust-dialog"),
  trustConfirm: document.querySelector(".trust-confirm"),
  replaceTextDialog: document.querySelector(".replace-text-dialog"),
  replaceTextConfirm: document.querySelector(".replace-text-confirm"),
  emptyState: document.querySelector(".upload-empty-state"),
  canvasStage: document.querySelector(".canvas-stage"),
  documentName: document.querySelector(".document-state strong"),
  documentStatus: document.querySelector(".document-state small"),
  workingCopyTitle: document.querySelector("#working-copy-title"),
  hierarchyCount: document.querySelector(".panel-meta span:last-child"),
  hierarchyEmpty: document.querySelector(".hierarchy-empty"),
  hierarchyTree: document.querySelector(".hierarchy-tree"),
  treeSearch: document.querySelector(".search-box input"),
  propertiesEmpty: document.querySelector(".properties-empty"),
  textProperties: document.querySelector(".text-properties"),
  textContent: document.querySelector("#text-content"),
  inlineEditStatus: document.querySelector(".inline-edit-status"),
  textSummary: document.querySelector(".text-properties .object-summary"),
  applyText: document.querySelector(".apply-text-button"),
  textStyleFields: document.querySelector(".text-style-fields"),
  applyTextStyle: document.querySelector(".apply-text-style-button"),
  imageProperties: document.querySelector(".image-properties"),
  imageAlt: document.querySelector("[data-image-alt]"),
  imageSize: document.querySelector("[data-image-size]"),
  imageSource: document.querySelector("[data-image-source]"),
  replaceImage: document.querySelector(".replace-image-button"),
  replacementImageInput: document.querySelector("#replacement-image-input"),
  imageReplacementStatus: document.querySelector(".image-replacement-status"),
  objectProperties: document.querySelector(".object-properties"),
  objectSummary: document.querySelector(".object-properties .object-summary"),
  objectMessage: document.querySelector(".object-message"),
  selectionActions: document.querySelector(".selection-actions"),
  selectParent: document.querySelector(".select-parent-button"),
  selectionBadge: document.querySelector(".selection-badge"),
  placeholders: document.querySelector(".property-placeholders"),
  undo: document.querySelector("[data-undo]"),
  redo: document.querySelector("[data-redo]"),
  editMode: document.querySelector("[data-edit-mode]"),
  previewMode: document.querySelector("[data-preview-mode]"),
  exportButton: document.querySelector("[data-export]"),
  statusPath: document.querySelector(".status-path strong"),
  statusDocument: document.querySelector("[data-status-document]"),
  statusResources: document.querySelector("[data-resource-summary]"),
  importDiagnostic: document.querySelector(".import-diagnostic"),
  importDiagnosticMessage: document.querySelector(".import-diagnostic-message"),
  resourceStatus: document.querySelector(".resource-status"),
  resourceStatusSummary: document.querySelector(".resource-status-summary"),
  resourceList: document.querySelector(".resource-status ul"),
  lockedContentStatus: document.querySelector(".locked-content-status"),
  viewportWidth: document.querySelector('[aria-label="参考视口宽度"]'),
  viewportHeight: document.querySelector('[aria-label="参考视口高度"]'),
  applyViewport: document.querySelector("[data-apply-viewport]"),
  zoomOut: document.querySelector("[data-zoom-out]"),
  zoomIn: document.querySelector("[data-zoom-in]"),
  zoomOutput: document.querySelector('[aria-label="画布显示缩放"]'),
  fitCanvas: document.querySelector("[data-fit-canvas]"),
  coordinateX: document.querySelector(".canvas-coordinate-x"),
  coordinateY: document.querySelector(".canvas-coordinate-y"),
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
refs.treeSearch.addEventListener("input", renderHierarchyTree);
refs.textContent.addEventListener("input", previewTextChange);
refs.applyText.addEventListener("click", commitTextChange);
refs.textStyleFields.addEventListener("input", previewTextStyles);
refs.textStyleFields.addEventListener("change", previewTextStyles);
refs.applyTextStyle.addEventListener("click", commitTextStyles);
refs.replaceTextConfirm.addEventListener("click", () => {
  refs.replaceTextDialog.close();
  commitTextReplacement();
});
refs.replaceTextDialog.addEventListener("close", () => {
  if (refs.replaceTextDialog.returnValue === "cancel") restoreSelectedTextPreview();
});
refs.replaceImage.addEventListener("click", () => {
  hideImageReplacementStatus();
  refs.replacementImageInput.click();
});
refs.replacementImageInput.addEventListener("change", replaceSelectedImage);
refs.replacementImageInput.addEventListener("cancel", () => {
  showImageReplacementStatus("未选择图片，原图片保持不变。");
});
refs.undo.addEventListener("click", undo);
refs.redo.addEventListener("click", redo);
refs.editMode.addEventListener("click", () => setMode("edit"));
refs.previewMode.addEventListener("click", () => setMode("preview"));
refs.exportButton.addEventListener("click", exportHtml);
refs.selectParent.addEventListener("click", selectParentContainer);
refs.applyViewport.addEventListener("click", applyReferenceViewport);
refs.zoomOut.addEventListener("click", () => changeCanvasZoom(-0.1));
refs.zoomIn.addEventListener("click", () => changeCanvasZoom(0.1));
refs.fitCanvas.addEventListener("click", fitCanvasToStage);

const stageResizeObserver = new ResizeObserver(() => {
  if (state.fitCanvasActive && state.originalHtml) fitCanvasToStage();
  else syncSelectionSurfaces();
});
stageResizeObserver.observe(refs.canvasStage);

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
    state.selectedElement = null;
    state.objects = [];
    state.nextObjectId = 1;
    state.restored = false;
    state.resources = inspectDeclaredResources(html);
    state.viewportWidth = 1440;
    state.viewportHeight = 900;
    state.canvasZoom = 0.64;
    state.fitCanvasActive = false;
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
    viewportWidth: state.viewportWidth,
    viewportHeight: state.viewportHeight,
    canvasZoom: state.canvasZoom,
    fitCanvasActive: state.fitCanvasActive,
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
  setViewportControlsDisabled(true);
}

function setViewportControlsDisabled(disabled) {
  [
    refs.viewportWidth,
    refs.viewportHeight,
    refs.applyViewport,
    refs.zoomOut,
    refs.zoomIn,
    refs.fitCanvas,
  ].forEach((control) => {
    control.disabled = disabled;
  });
}

function applyReferenceViewport() {
  const width = Number(refs.viewportWidth.value);
  const height = Number(refs.viewportHeight.value);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    refs.documentStatus.textContent = "请输入有效的参考视口尺寸";
    return;
  }
  state.viewportWidth = width;
  state.viewportHeight = height;
  applyViewportPresentation();
  if (state.fitCanvasActive) fitCanvasToStage();
  saveProject();
}

function changeCanvasZoom(delta) {
  state.fitCanvasActive = false;
  state.canvasZoom = Math.min(1.5, Math.max(0.2, Math.round((state.canvasZoom + delta) * 100) / 100));
  applyViewportPresentation();
  saveProject();
}

function fitCanvasToStage() {
  if (!state.originalHtml) return;
  const availableWidth = Math.max(1, refs.canvasStage.clientWidth - 56);
  const availableHeight = Math.max(1, refs.canvasStage.clientHeight - 56);
  state.fitCanvasActive = true;
  state.canvasZoom = Math.min(
    1,
    Math.max(0.2, Math.floor(Math.min(
      availableWidth / state.viewportWidth,
      availableHeight / state.viewportHeight,
    ) * 100) / 100),
  );
  applyViewportPresentation();
  saveProject();
}

function applyViewportPresentation(frame = document.querySelector(".working-copy-frame")) {
  refs.viewportWidth.value = String(state.viewportWidth);
  refs.viewportHeight.value = String(state.viewportHeight);
  refs.zoomOutput.value = `${Math.round(state.canvasZoom * 100)}%`;
  refs.zoomOutput.textContent = refs.zoomOutput.value;
  refs.coordinateX.textContent = String(state.viewportWidth);
  refs.coordinateY.textContent = String(state.viewportHeight);
  if (!frame) return;
  frame.setAttribute("width", String(state.viewportWidth));
  frame.setAttribute("height", String(state.viewportHeight));
  frame.style.width = `${state.viewportWidth}px`;
  frame.style.height = `${state.viewportHeight}px`;
  frame.style.setProperty("--canvas-zoom", String(state.canvasZoom));
  requestAnimationFrame(syncSelectionSurfaces);
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
  applyViewportPresentation(frame);

  const importToken = crypto.randomUUID();
  frame.srcdoc = buildWorkingCopyHtml(importToken);
  await waitForWorkingCopyDocument(frame, importToken);

  installEditingBoundary(frame);
  discoverObjects(frame.contentDocument);
  renderHierarchyTree();
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
    html[data-html-editor-mode="edit"] [data-html-editor-id] { cursor: default !important; }
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
  const usedIds = new Set();
  [...doc.querySelectorAll(DISCOVERABLE_SELECTOR)].forEach((element, index) => {
    let id = element.dataset.htmlEditorId;
    if (!id || usedIds.has(id)) id = `object-${index + 1}`;
    while (usedIds.has(id)) id = `object-${index + 1}-${usedIds.size + 1}`;
    element.dataset.htmlEditorId = id;
    usedIds.add(id);
  });
}

function applyEdits(doc) {
  Object.entries(state.edits).forEach(([id, edit]) => {
    const element = doc.querySelector(`[data-html-editor-id="${CSS.escape(id)}"]`);
    if (!element) return;
    if (typeof edit.html === "string") element.innerHTML = edit.html;
    else if (typeof edit.text === "string") element.textContent = edit.text;
    applyTextStyleEdit(element, edit.styles);
    if (element.matches("img") && typeof edit.imageDataUrl === "string") {
      element.setAttribute("src", edit.imageDataUrl);
      element.removeAttribute("srcset");
    }
  });
  applyVisualEditStyle(doc);
}

function applyVisualEditStyle(doc) {
  let style = doc.querySelector("style[data-html-editor-visual-edits]");
  const rules = Object.entries(state.edits).flatMap(([id, edit]) => {
    if (!edit.visual) return [];
    const { x = 0, y = 0, scale = 1 } = edit.visual;
    return [`[data-html-editor-id="${CSS.escape(id)}"] { translate: ${x}px ${y}px; scale: ${scale}; transform-origin: center center; }`];
  });
  if (!rules.length) {
    style?.remove();
    return;
  }
  if (!style) {
    style = doc.createElement("style");
    style.dataset.htmlEditorVisualEdits = "true";
    doc.head.append(style);
  }
  style.textContent = rules.join("\n");
}

function installEditingBoundary(frame) {
  const frameDocument = frame.contentDocument;
  if (!frameDocument) return;

  if (state.mode === "edit") {
    frameDocument.documentElement.dataset.htmlEditorMode = "edit";
    frameDocument.addEventListener("click", handleWorkingCopyClick, true);
    frameDocument.addEventListener("transitionend", syncSelectionSurfaces, true);
    frameDocument.addEventListener("animationend", syncSelectionSurfaces, true);
    frameDocument.addEventListener("dblclick", handleWorkingCopyDoubleClick, true);
    frame.contentWindow.addEventListener("scroll", scheduleSelectionSync, { passive: true });
    observeWorkingCopy(frameDocument);
  } else {
    frameDocument.documentElement.dataset.htmlEditorMode = "preview";
  }
}

function handleWorkingCopyClick(event) {
  if (state.mode !== "edit") return;
  const target = event.target?.closest?.("[data-html-editor-id]") || null;
  if (!target) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  selectObject(target);
}

function handleWorkingCopyDoubleClick(event) {
  if (state.mode !== "edit") return;
  const target = event.target?.closest?.("[data-html-editor-id]") || null;
  const object = target ? objectForElement(target) : null;
  if (!target || object?.kind !== "text") return;
  event.preventDefault();
  event.stopImmediatePropagation();
  selectObject(target);
  beginInlineTextEditing(target);
}

function beginInlineTextEditing(element) {
  if (state.inlineEditingElement === element) return;
  finishInlineTextEditing();
  state.inlineEditingElement = element;
  state.inlineEditingBeforeHtml = element.innerHTML;
  element.contentEditable = "true";
  element.dataset.htmlEditorInlineEditing = "true";
  element.addEventListener("keydown", handleInlineEditingKeydown);
  element.addEventListener("input", handleInlineEditingInput);
  element.addEventListener("paste", handleInlineEditingPaste);
  element.addEventListener("blur", finishInlineTextEditing, { once: true });
  refs.inlineEditStatus.hidden = false;
  document.querySelector(".selection-overlay")?.classList.add("is-inline-editing");
  element.focus();
}

function handleInlineEditingKeydown(event) {
  if (event.key !== "Escape") return;
  event.preventDefault();
  finishInlineTextEditing();
}

function handleInlineEditingInput() {
  if (!state.inlineEditingElement) return;
  state.pendingText = state.inlineEditingElement.textContent;
  refs.textContent.value = state.pendingText;
  refreshObjectLabels();
  syncSelectionSurfaces();
}

function handleInlineEditingPaste(event) {
  event.preventDefault();
  const text = event.clipboardData?.getData("text/plain") || "";
  const selection = event.currentTarget.ownerDocument.getSelection();
  if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const node = event.currentTarget.ownerDocument.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  handleInlineEditingInput();
}

function finishInlineTextEditing() {
  const element = state.inlineEditingElement;
  if (!element) return;
  const beforeHtml = state.inlineEditingBeforeHtml;
  const afterHtml = element.innerHTML;
  element.removeEventListener("keydown", handleInlineEditingKeydown);
  element.removeEventListener("input", handleInlineEditingInput);
  element.removeEventListener("paste", handleInlineEditingPaste);
  element.removeAttribute("contenteditable");
  delete element.dataset.htmlEditorInlineEditing;
  state.inlineEditingElement = null;
  state.inlineEditingBeforeHtml = "";
  refs.inlineEditStatus.hidden = true;
  document.querySelector(".selection-overlay")?.classList.remove("is-inline-editing");
  if (beforeHtml !== afterHtml) commitTextHtml(afterHtml);
}

function selectObject(element) {
  clearSelection();
  state.selectedElement = element;
  state.selectedId = element.dataset.htmlEditorId;
  element.dataset.htmlEditorSelected = "true";
  refs.propertiesEmpty.hidden = true;
  refs.placeholders.hidden = true;
  refs.selectionActions.hidden = false;
  const object = objectForElement(element);
  if (!object) return;

  if (object.kind === "text") {
    state.pendingText = element.textContent;
    refs.textContent.value = state.pendingText;
    populateTextStyleFields(element);
    refs.textProperties.hidden = false;
    refs.imageProperties.hidden = true;
    refs.objectProperties.hidden = true;
    refs.imageProperties.setAttribute("aria-label", "当前图片");
    refs.objectProperties.setAttribute("aria-label", "当前对象");
  } else if (object.kind === "image") {
    refs.textProperties.hidden = true;
    refs.imageProperties.hidden = false;
    refs.objectProperties.hidden = true;
    refs.imageProperties.setAttribute("aria-label", "当前对象 · 当前图片");
    refs.objectProperties.setAttribute("aria-label", "其他对象");
    updateImageProperties();
  } else {
    refs.textProperties.hidden = true;
    refs.imageProperties.hidden = true;
    refs.objectProperties.hidden = false;
    refs.imageProperties.setAttribute("aria-label", "当前图片");
    refs.objectProperties.setAttribute("aria-label", "当前对象");
    refs.objectSummary.querySelector("strong").textContent = objectTypeLabel(object);
    refs.objectSummary.querySelector("span").textContent = object.statusLabel;
    refs.objectMessage.textContent = object.message;
  }
  refs.selectionBadge.textContent = `${object.tag} · ${objectTypeLabel(object)}`;
  syncSelectionSurfaces();
}

function clearSelection() {
  if (state.inlineEditingElement) finishInlineTextEditing();
  cancelVisualGesture();
  if (state.selectedElement?.isConnected) {
    delete state.selectedElement.dataset.htmlEditorSelected;
  }
  state.selectedElement = null;
  state.selectedId = null;
  refs.propertiesEmpty.hidden = false;
  refs.textProperties.hidden = true;
  refs.imageProperties.hidden = true;
  refs.objectProperties.hidden = true;
  refs.selectionActions.hidden = true;
  refs.placeholders.hidden = false;
  refs.selectionBadge.textContent = "未选择对象";
  refs.imageProperties.setAttribute("aria-label", "当前图片");
  refs.objectProperties.setAttribute("aria-label", "当前对象");
  hideImageReplacementStatus();
  refs.statusPath.textContent = "未选择对象";
  document.querySelector(".selection-overlay")?.remove();
  refs.hierarchyTree.querySelectorAll('[aria-selected="true"]').forEach((row) => row.setAttribute("aria-selected", "false"));
}

function previewTextChange() {
  if (!state.selectedElement) return;
  state.pendingText = refs.textContent.value;
  state.selectedElement.textContent = state.pendingText;
  refreshObjectLabels();
  syncSelectionSurfaces();
}

function updateImageProperties() {
  if (!state.selectedElement?.matches("img") || !state.selectedId) return;
  const rect = state.selectedElement.getBoundingClientRect();
  const edit = state.edits[state.selectedId];
  const source = state.selectedElement.getAttribute("src") || "未设置来源";
  refs.imageAlt.textContent = state.selectedElement.getAttribute("alt") || "无替代文字";
  refs.imageSize.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
  refs.imageSource.textContent = edit?.imageName || describeImageSource(source);
}

function describeImageSource(source) {
  if (/^data:/i.test(source)) return "原文档内嵌图片";
  if (isExternalUrl(source)) return "外部图片 URL";
  return source || "未设置来源";
}

async function replaceSelectedImage(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) {
    showImageReplacementStatus("未选择图片，原图片保持不变。");
    return;
  }
  if (!state.selectedElement?.matches("img") || !state.selectedId) {
    showImageReplacementStatus("当前没有可替换的图片对象。");
    return;
  }

  const selectedId = state.selectedId;
  const selectedElement = state.selectedElement;
  try {
    if (!file.type.startsWith("image/")) throw new Error("unsupported-type");
    const imageDataUrl = await readFileAsDataUrl(file);
    await validateImageData(imageDataUrl);
    if (state.selectedId !== selectedId || state.selectedElement !== selectedElement) {
      throw new Error("selection-changed");
    }

    const before = structuredClone(state.edits);
    state.edits[selectedId] = {
      ...state.edits[selectedId],
      imageDataUrl,
      imageName: file.name,
    };
    selectedElement.setAttribute("src", imageDataUrl);
    selectedElement.removeAttribute("srcset");
    recordEditHistory(before);
    hideImageReplacementStatus();
    updateImageProperties();
    syncSelectionSurfaces();
  } catch (error) {
    console.error("Unable to replace the selected image", error);
    const message = error?.message === "selection-changed"
      ? "读取图片时选择目标已改变，原图片保持不变。"
      : "无法读取或不支持这个图片文件，原图片保持不变。";
    showImageReplacementStatus(message);
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result), { once: true });
    reader.addEventListener("error", () => reject(reader.error || new Error("read-failed")), { once: true });
    reader.addEventListener("abort", () => reject(new Error("read-aborted")), { once: true });
    reader.readAsDataURL(file);
  });
}

function validateImageData(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) resolve();
      else reject(new Error("invalid-image"));
    }, { once: true });
    image.addEventListener("error", () => reject(new Error("invalid-image")), { once: true });
    image.src = source;
  });
}

function showImageReplacementStatus(message) {
  refs.imageReplacementStatus.textContent = message;
  refs.imageReplacementStatus.hidden = false;
}

function hideImageReplacementStatus() {
  refs.imageReplacementStatus.hidden = true;
  refs.imageReplacementStatus.textContent = "";
}

function discoverObjects(frameDocument) {
  state.objects = [...frameDocument.querySelectorAll("[data-html-editor-id]")].map((element) => {
    const kind = classifyObject(element);
    const rect = element.getBoundingClientRect();
    const stableOutline = rect.width >= 2 && rect.height >= 2;
    const status = kind === "complex" ? (stableOutline ? "atomic" : "locked") : "editable";
    return {
      id: element.dataset.htmlEditorId,
      tag: element.tagName.toLowerCase(),
      kind,
      status,
      statusLabel: status === "editable" ? "可编辑" : status === "atomic" ? "整体对象" : "锁定",
      label: objectLabel(element, kind),
      message: status === "atomic"
        ? "内部结构保持原样运行；当前内容只能作为整体对象选择。"
        : status === "locked"
          ? "当前内容无法可靠确定操作边界，已锁定并继续保留原效果。"
          : "可从工作副本或 HTML 层级树选择。",
      depth: objectDepth(element),
    };
  });
}

function objectDepth(element) {
  let depth = 1;
  let current = element.parentElement?.closest("[data-html-editor-id]");
  while (current) {
    depth += 1;
    current = current.parentElement?.closest("[data-html-editor-id]");
  }
  return depth;
}

function observeWorkingCopy(frameDocument) {
  state.observer?.disconnect();
  let updateQueued = false;
  state.observer = new MutationObserver(() => {
    if (updateQueued) return;
    updateQueued = true;
    requestAnimationFrame(() => {
      updateQueued = false;
      assignLiveEditorIds(frameDocument);
      discoverObjects(frameDocument);
      if (state.selectedElement && !state.selectedElement.isConnected) {
        clearSelection();
        refs.propertiesEmpty.querySelector("h3").textContent = "对象已不在当前页面";
        refs.propertiesEmpty.querySelector("p").textContent = "原页面状态发生变化，请从工作副本或层级树重新选择。";
      } else {
        const selectedObject = objectForElement(state.selectedElement);
        if (selectedObject?.kind === "text" && document.activeElement !== refs.textContent) {
          state.pendingText = state.selectedElement.textContent;
          refs.textContent.value = state.pendingText;
        }
        refreshObjectLabels();
        syncSelectionSurfaces();
      }
      renderHierarchyTree();
    });
  });
  state.observer.observe(frameDocument.body, {
    attributes: true,
    attributeFilter: ["class", "style", "hidden", "open"],
    childList: true,
    characterData: true,
    subtree: true,
  });
}

function assignLiveEditorIds(frameDocument) {
  const usedIds = new Set(
    [...frameDocument.querySelectorAll("[data-html-editor-id]")]
      .map((element) => element.dataset.htmlEditorId)
      .filter(Boolean),
  );
  [...frameDocument.querySelectorAll(DISCOVERABLE_SELECTOR)].forEach((element) => {
    if (element.dataset.htmlEditorId) return;
    let id;
    do {
      id = `runtime-${state.nextObjectId++}`;
    } while (usedIds.has(id));
    element.dataset.htmlEditorId = id;
    usedIds.add(id);
  });
}

function classifyObject(element) {
  if (element.matches(COMPLEX_OBJECT_SELECTOR)) return "complex";
  if (element.matches(IMAGE_OBJECT_SELECTOR)) return "image";
  if (element.matches(TEXT_OBJECT_SELECTOR)) return "text";
  return "container";
}

function objectLabel(element, kind) {
  if (kind === "image") return element.getAttribute("alt") || "无替代文字的图片";
  const text = (element.textContent || "").replace(/\s+/g, " ").trim();
  if (text) return text.slice(0, 46);
  if (element.id) return `#${element.id}`;
  const firstClass = typeof element.className === "string" ? element.className.trim().split(/\s+/)[0] : "";
  return firstClass ? `.${firstClass}` : element.tagName.toLowerCase();
}

function objectTypeLabel(object) {
  return object.kind === "text"
    ? "文字对象"
    : object.kind === "image"
      ? "图片对象"
      : object.kind === "container"
        ? "普通容器"
        : object.statusLabel;
}

function objectForElement(element) {
  return state.objects.find(({ id }) => id === element.dataset.htmlEditorId);
}

function renderHierarchyTree() {
  const query = refs.treeSearch.value.trim().toLocaleLowerCase();
  const visibleObjects = state.objects.filter((object) => {
    if (!query) return true;
    return `${object.tag} ${object.label} ${object.statusLabel}`.toLocaleLowerCase().includes(query);
  });

  refs.hierarchyTree.replaceChildren(...visibleObjects.map((object) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `tree-row tree-row-${object.status}`;
    row.setAttribute("role", "treeitem");
    row.setAttribute("aria-selected", String(object.id === state.selectedId));
    row.setAttribute("aria-level", String(object.depth));
    row.setAttribute("aria-label", `${object.label} ${object.tag} ${object.statusLabel}`);
    row.dataset.editorId = object.id;
    row.style.setProperty("--tree-depth", Math.min(6, object.depth - 1));
    row.innerHTML = `
      <span class="tree-object-icon" aria-hidden="true">${object.kind === "text" ? "T" : object.kind === "image" ? "▧" : object.kind === "container" ? "◇" : "◆"}</span>
      <span class="tree-object-label"><strong>${escapeHtml(object.label)}</strong><small>${object.tag}</small></span>
      <span class="tree-status">${object.statusLabel}</span>
    `;
    row.addEventListener("click", () => {
      const element = document.querySelector(".working-copy-frame")?.contentDocument
        ?.querySelector(`[data-html-editor-id="${CSS.escape(object.id)}"]`);
      if (element) selectObject(element);
    });
    return row;
  }));
}

function refreshObjectLabels() {
  const object = objectForElement(state.selectedElement);
  if (!object) return;
  object.label = objectLabel(state.selectedElement, object.kind);
  renderHierarchyTree();
}

function selectParentContainer() {
  if (!state.selectedElement) return;
  const parent = state.selectedElement.parentElement?.closest("[data-html-editor-id]");
  if (parent) selectObject(parent);
}

function syncSelectionSurfaces() {
  const element = state.selectedElement;
  if (!element?.isConnected || state.mode !== "edit") return;
  const object = objectForElement(element);
  if (!object) return;
  refs.statusPath.textContent = buildObjectPath(element);
  renderHierarchyTree();
  if (object.status === "locked") document.querySelector(".selection-overlay")?.remove();
  else renderSelectionOverlay(element, object);
  refs.selectParent.disabled = !element.parentElement?.closest("[data-html-editor-id]");
}

function buildObjectPath(element) {
  const pieces = [];
  let current = element;
  while (current && current !== element.ownerDocument.body && pieces.length < 6) {
    const id = current.id ? `#${current.id}` : "";
    pieces.unshift(`${current.tagName.toLowerCase()}${id}`);
    current = current.parentElement;
  }
  return pieces.join(" › ");
}

function renderSelectionOverlay(element, object) {
  let overlay = document.querySelector(".selection-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "selection-overlay";
    overlay.setAttribute("aria-label", "当前选框");
    overlay.innerHTML = `
      <span class="selection-overlay-label"></span>
      <button type="button" class="scale-handle scale-handle-nw" data-scale-handle aria-label="左上角等比缩放手柄"></button>
      <button type="button" class="scale-handle scale-handle-ne" data-scale-handle aria-label="右上角等比缩放手柄"></button>
      <button type="button" class="scale-handle scale-handle-sw" data-scale-handle aria-label="左下角等比缩放手柄"></button>
      <button type="button" class="scale-handle scale-handle-se" data-scale-handle aria-label="右下角等比缩放手柄"></button>
    `;
    overlay.addEventListener("pointerdown", beginVisualGesture);
    overlay.addEventListener("pointermove", updateVisualGesture);
    overlay.addEventListener("pointerup", finishVisualGesture);
    overlay.addEventListener("pointercancel", cancelVisualGesture);
    overlay.addEventListener("dblclick", handleSelectionOverlayDoubleClick);
    refs.canvasStage.append(overlay);
  }
  const frame = document.querySelector(".working-copy-frame");
  const frameRect = frame.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const scaleX = frameRect.width / frame.offsetWidth;
  const scaleY = frameRect.height / frame.offsetHeight;
  const stageRect = refs.canvasStage.getBoundingClientRect();
  overlay.style.left = `${frameRect.left - stageRect.left + elementRect.left * scaleX}px`;
  overlay.style.top = `${frameRect.top - stageRect.top + elementRect.top * scaleY}px`;
  overlay.style.width = `${Math.max(3, elementRect.width * scaleX)}px`;
  overlay.style.height = `${Math.max(3, elementRect.height * scaleY)}px`;
  overlay.querySelector(".selection-overlay-label").textContent = `${object.tag} · ${object.statusLabel}`;
}

function scheduleSelectionSync() {
  if (state.selectionAnimationFrame != null) return;
  state.selectionAnimationFrame = requestAnimationFrame(() => {
    state.selectionAnimationFrame = null;
    syncSelectionSurfaces();
  });
}

function beginVisualGesture(event) {
  if (event.button !== 0 || !state.selectedElement || !state.selectedId) return;
  const object = objectForElement(state.selectedElement);
  if (!object || object.status !== "editable" || !["text", "image", "container"].includes(object.kind)) return;
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.setPointerCapture(event.pointerId);
  const overlayRect = event.currentTarget.getBoundingClientRect();
  const visual = state.edits[state.selectedId]?.visual || { x: 0, y: 0, scale: 1 };
  state.visualGesture = {
    pointerId: event.pointerId,
    type: event.target.closest("[data-scale-handle]") ? "scale" : "move",
    objectId: state.selectedId,
    before: structuredClone(state.edits),
    startX: event.clientX,
    startY: event.clientY,
    centerX: overlayRect.left + overlayRect.width / 2,
    centerY: overlayRect.top + overlayRect.height / 2,
    startDistance: Math.max(1, Math.hypot(
      event.clientX - (overlayRect.left + overlayRect.width / 2),
      event.clientY - (overlayRect.top + overlayRect.height / 2),
    )),
    visual: { x: visual.x || 0, y: visual.y || 0, scale: visual.scale || 1 },
  };
}

function updateVisualGesture(event) {
  const gesture = state.visualGesture;
  if (!gesture || event.pointerId !== gesture.pointerId) return;
  event.preventDefault();
  const visual = { ...gesture.visual };
  if (gesture.type === "move") {
    const frame = document.querySelector(".working-copy-frame");
    const frameScale = frame.getBoundingClientRect().width / frame.offsetWidth;
    visual.x += (event.clientX - gesture.startX) / frameScale;
    visual.y += (event.clientY - gesture.startY) / frameScale;
  } else {
    const distance = Math.hypot(event.clientX - gesture.centerX, event.clientY - gesture.centerY);
    visual.scale = Math.max(0.1, Math.min(10, gesture.visual.scale * distance / gesture.startDistance));
  }
  state.edits[gesture.objectId] = { ...state.edits[gesture.objectId], visual };
  applyVisualEditStyle(state.selectedElement.ownerDocument);
  syncSelectionSurfaces();
}

function finishVisualGesture(event) {
  const gesture = state.visualGesture;
  if (!gesture || event.pointerId !== gesture.pointerId) return;
  event.currentTarget.releasePointerCapture(event.pointerId);
  state.visualGesture = null;
  recordEditHistory(gesture.before);
}

function handleSelectionOverlayDoubleClick(event) {
  if (event.target.closest("[data-scale-handle]")) return;
  const object = state.selectedElement ? objectForElement(state.selectedElement) : null;
  if (object?.kind !== "text") return;
  event.preventDefault();
  event.stopPropagation();
  beginInlineTextEditing(state.selectedElement);
}

function cancelVisualGesture(event) {
  const gesture = state.visualGesture;
  if (!gesture || (event?.pointerId != null && event.pointerId !== gesture.pointerId)) return;
  state.edits = gesture.before;
  state.visualGesture = null;
  const doc = document.querySelector(".working-copy-frame")?.contentDocument;
  if (doc) applyVisualEditStyle(doc);
  syncSelectionSurfaces();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function commitTextChange() {
  if (!state.selectedElement || !state.selectedId) return;
  const originalDocument = new DOMParser().parseFromString(state.originalHtml, "text/html");
  assignEditorIds(originalDocument);
  const originalElement = originalDocument.querySelector(
    `[data-html-editor-id="${CSS.escape(state.selectedId)}"]`,
  );
  const hasInlineMarkup = originalElement?.querySelector("strong,span,code,em,b,i,mark,small,sub,sup");
  if (hasInlineMarkup) {
    refs.replaceTextDialog.returnValue = "";
    refs.replaceTextDialog.showModal();
    return;
  }
  commitTextReplacement();
}

function textStyleControls() {
  return [...refs.textStyleFields.elements].filter((control) => control.name);
}

function readTextStyleControls() {
  return Object.fromEntries(textStyleControls().map((control) => [control.name, control.value.trim()]));
}

function populateTextStyleFields(element) {
  const computed = element.ownerDocument.defaultView.getComputedStyle(element);
  const values = {
    fontFamily: computed.fontFamily,
    fontSize: parseFloat(computed.fontSize),
    fontWeight: computed.fontWeight,
    fontStyle: computed.fontStyle,
    lineHeight: computed.lineHeight === "normal" ? "" : parseFloat(computed.lineHeight),
    letterSpacing: computed.letterSpacing === "normal" ? "0" : parseFloat(computed.letterSpacing),
    textAlign: computed.textAlign,
    color: rgbToHex(computed.color),
  };
  textStyleControls().forEach((control) => {
    control.value = String(values[control.name] ?? "");
  });
  state.pendingTextStyles = readTextStyleControls();
}

function rgbToHex(color) {
  const channels = color.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number);
  if (!channels) return "#000000";
  return `#${channels.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;
}

function normalizeTextStyles(styles) {
  const withPixels = new Set(["fontSize", "lineHeight", "letterSpacing"]);
  return Object.fromEntries(Object.entries(styles).map(([property, value]) => [
    property,
    value && withPixels.has(property) ? `${value}px` : value,
  ]).filter(([, value]) => value !== ""));
}

function applyTextStyleEdit(element, styles = {}) {
  Object.entries(styles || {}).forEach(([property, value]) => {
    element.style[property] = value;
  });
}

function previewTextStyles() {
  if (!state.selectedElement) return;
  state.pendingTextStyles = readTextStyleControls();
  applyTextStyleEdit(state.selectedElement, normalizeTextStyles(state.pendingTextStyles));
  syncSelectionSurfaces();
}

function commitTextStyles() {
  if (!state.selectedElement || !state.selectedId) return;
  const before = structuredClone(state.edits);
  const nextEdit = { ...(state.edits[state.selectedId] || {}) };
  nextEdit.styles = normalizeTextStyles(state.pendingTextStyles);
  if (Object.keys(nextEdit.styles).length === 0) delete nextEdit.styles;
  if (Object.keys(nextEdit).length) state.edits[state.selectedId] = nextEdit;
  else delete state.edits[state.selectedId];
  commitEditSnapshot(before);
}

function commitTextReplacement() {
  if (!state.selectedElement || !state.selectedId) return;
  const before = structuredClone(state.edits);
  const originalDocument = new DOMParser().parseFromString(state.originalHtml, "text/html");
  assignEditorIds(originalDocument);
  const originalText = originalDocument
    .querySelector(`[data-html-editor-id="${CSS.escape(state.selectedId)}"]`)
    ?.textContent;

  const nextEdit = { ...(state.edits[state.selectedId] || {}) };
  delete nextEdit.html;
  if (state.pendingText === originalText) delete nextEdit.text;
  else nextEdit.text = state.pendingText;
  if (Object.keys(nextEdit).length) state.edits[state.selectedId] = nextEdit;
  else delete state.edits[state.selectedId];
  commitEditSnapshot(before);
}

function restoreSelectedTextPreview() {
  if (!state.selectedElement || !state.selectedId) return;
  const originalDocument = new DOMParser().parseFromString(state.originalHtml, "text/html");
  assignEditorIds(originalDocument);
  const originalElement = originalDocument.querySelector(
    `[data-html-editor-id="${CSS.escape(state.selectedId)}"]`,
  );
  const edit = state.edits[state.selectedId];
  if (typeof edit?.html === "string") state.selectedElement.innerHTML = edit.html;
  else if (typeof edit?.text === "string") state.selectedElement.textContent = edit.text;
  else if (originalElement) state.selectedElement.innerHTML = originalElement.innerHTML;
  state.pendingText = state.selectedElement.textContent;
  refs.textContent.value = state.pendingText;
  refreshObjectLabels();
  syncSelectionSurfaces();
}

function commitTextHtml(html) {
  if (!state.selectedElement || !state.selectedId) return;
  const before = structuredClone(state.edits);
  const originalDocument = new DOMParser().parseFromString(state.originalHtml, "text/html");
  assignEditorIds(originalDocument);
  const originalHtml = originalDocument
    .querySelector(`[data-html-editor-id="${CSS.escape(state.selectedId)}"]`)
    ?.innerHTML;
  const nextEdit = { ...(state.edits[state.selectedId] || {}) };
  delete nextEdit.text;
  if (html === originalHtml) delete nextEdit.html;
  else nextEdit.html = html;
  if (Object.keys(nextEdit).length) state.edits[state.selectedId] = nextEdit;
  else delete state.edits[state.selectedId];
  commitEditSnapshot(before);
}

function commitEditSnapshot(before) {
  if (JSON.stringify(before) === JSON.stringify(state.edits)) return;
  recordEditHistory(before);
  refreshObjectLabels();
}

function recordEditHistory(before) {
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
  const selectedId = state.selectedId;
  clearSelection();
  const currentDocument = document.querySelector(".working-copy-frame")?.contentDocument;
  if (!currentDocument) return;
  const originalDocument = new DOMParser().parseFromString(state.originalHtml, "text/html");
  assignEditorIds(originalDocument);

  currentDocument.querySelectorAll(TEXT_OBJECT_SELECTOR).forEach((element) => {
    const id = element.dataset.htmlEditorId;
    const originalElement = originalDocument.querySelector(
      `[data-html-editor-id="${CSS.escape(id)}"]`,
    );
    const edit = state.edits[id];
    if (typeof edit?.html === "string") element.innerHTML = edit.html;
    else if (typeof edit?.text === "string") element.textContent = edit.text;
    else if (originalElement) element.innerHTML = originalElement.innerHTML;
    for (const property of Object.keys(edit?.styles || {})) element.style.removeProperty(property);
    if (originalElement) element.setAttribute("style", originalElement.getAttribute("style") || "");
    applyTextStyleEdit(element, edit?.styles);
  });
  currentDocument.querySelectorAll(IMAGE_OBJECT_SELECTOR).forEach((element) => {
    const id = element.dataset.htmlEditorId;
    const originalElement = originalDocument.querySelector(
      `[data-html-editor-id="${CSS.escape(id)}"]`,
    );
    const source = state.edits[id]?.imageDataUrl ?? originalElement?.getAttribute("src");
    if (typeof source === "string") element.setAttribute("src", source);
    if (state.edits[id]?.imageDataUrl) element.removeAttribute("srcset");
    else if (originalElement?.hasAttribute("srcset")) {
      element.setAttribute("srcset", originalElement.getAttribute("srcset"));
    } else {
      element.removeAttribute("srcset");
    }
  });
  applyVisualEditStyle(currentDocument);
  discoverObjects(currentDocument);
  renderHierarchyTree();
  const selectedElement = selectedId
    ? currentDocument.querySelector(`[data-html-editor-id="${CSS.escape(selectedId)}"]`)
    : null;
  if (selectedElement) selectObject(selectedElement);
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
    viewportWidth: state.viewportWidth,
    viewportHeight: state.viewportHeight,
    canvasZoom: state.canvasZoom,
    fitCanvasActive: state.fitCanvasActive,
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
  state.viewportWidth = Number.isInteger(project.viewportWidth) && project.viewportWidth > 0
    ? project.viewportWidth
    : 1440;
  state.viewportHeight = Number.isInteger(project.viewportHeight) && project.viewportHeight > 0
    ? project.viewportHeight
    : 900;
  state.canvasZoom = typeof project.canvasZoom === "number"
    ? Math.min(1.5, Math.max(0.2, project.canvasZoom))
    : 0.64;
  state.fitCanvasActive = project.fitCanvasActive === true;
  state.restored = true;
  state.resources = inspectDeclaredResources(project.originalHtml);
  loadWorkingCopy();
}

function updateProjectChrome(frame) {
  const count = state.objects.length;
  const preservedComplexCount = state.objects.filter(({ kind }) => kind === "complex").length;
  refs.documentName.textContent = state.sourceName;
  refs.documentStatus.textContent = state.restored ? "已从浏览器恢复" : "已保存到浏览器";
  refs.workingCopyTitle.textContent = state.mode === "edit" ? "编辑模式" : "预览模式";
  refs.hierarchyCount.textContent = String(count);
  refs.hierarchyEmpty.hidden = true;
  refs.hierarchyTree.hidden = false;
  refs.treeSearch.disabled = false;
  refs.lockedContentStatus.hidden = preservedComplexCount === 0;
  refs.lockedContentStatus.textContent = preservedComplexCount
    ? `锁定内容与整体对象 ${preservedComplexCount} · 保留原样运行，内部结构暂不直接编辑`
    : "";
  refs.statusDocument.innerHTML = `<i class="status-dot status-dot-supported"></i>${state.restored ? "已从浏览器恢复" : "文档已载入"}`;
  refs.editMode.disabled = false;
  refs.previewMode.disabled = false;
  refs.exportButton.disabled = false;
  setViewportControlsDisabled(false);
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
