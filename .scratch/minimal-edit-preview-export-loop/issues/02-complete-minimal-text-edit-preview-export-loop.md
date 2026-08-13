# 02 — 打通纯文字对象的最小完整闭环

**What to build:** 交付第一条贯穿所有产品层次的 tracer bullet：用户确认受信任输入后上传单个 HTML 展示文档，选择一个普通文字对象，修改文字，撤销或重做，刷新后恢复项目，切换预览，并导出一个脱离 Web 编辑器仍保留修改的单文件 HTML 交付文件。

**Blocked by:** 01 — 建立可运行的编辑工作台与浏览器 E2E seam.

**Status:** resolved

- [x] 用户在受信任输入提示中确认后，可以上传一个本地 `.html` 文件并看到浏览器真实渲染形成的工作副本。
- [x] 原始上传 HTML 在项目中保持不可变；文字修改记录在独立修改层，并通过稳定编辑标识关联到目标对象。
- [x] 用户可以选择一个普通文字对象并通过对象属性区修改其纯文字内容，结果立即呈现在工作副本中。
- [x] 一次文字提交形成一个用户意图级历史步骤，支持撤销与重做。
- [x] 提交后的原始 HTML、修改层和最小必要项目状态保存到浏览器本地，刷新后可以恢复同一修改。
- [x] 编辑模式中的普通点击不执行被选文字对象所属链接或按钮的页面行为；预览模式不显示编辑选框并呈现修改后的文字。
- [x] 导出生成新的单文件 HTML 交付文件，不覆盖原始文件；它在不加载 Web 编辑器的独立页面中打开后仍显示修改文字。
- [x] 端到端测试用一份真实验收样例覆盖上传、选择、修改、撤销、重做、刷新恢复、预览和独立打开导出文件的完整路径。

## Comments

- Implemented the first vertical tracer bullet against the original `testexample/test2.html` acceptance fixture.
- Kept original HTML immutable while applying text edits through stable editor IDs in a separate edit layer and user-intent history.
- Verified with `npm run build` and `npm run test:e2e` (5 tests passed in desktop Chrome, including independent opening of the downloaded HTML deliverable).
