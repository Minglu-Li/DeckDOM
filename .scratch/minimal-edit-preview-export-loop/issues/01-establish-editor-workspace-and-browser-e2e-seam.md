# 01 — 建立可运行的编辑工作台与浏览器 E2E seam

**What to build:** 交付正式 MVP 的最小可运行 Web 编辑器外壳。用户可以在受支持桌面浏览器中打开编辑工作台，看到与产品决策一致的文件操作区、HTML 层级区、中央工作副本区域、对象属性区和状态区；自动化测试可以从真实浏览器启动应用并载入现有验收样例，为后续每个垂直切片提供同一个最高层测试 seam。

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] 应用可通过仓库中记录的单一开发命令启动，并在最新版桌面 Chrome 或 Edge 中打开。
- [x] 初始工作台包含顶部工具栏、左侧 HTML 层级区、中央工作副本区域、右侧对象属性区和底部状态区，且不显示幻灯片缩略图。
- [x] 尚未导入 HTML 展示文档时，中央区域显示明确的上传空状态和“文件仅在浏览器本地处理”说明。
- [x] 非正式支持的浏览器或移动尺寸会显示兼容性提示，而不是暗示提供完整兼容保证。
- [x] 建立真实浏览器端到端测试入口，可以启动应用、进入编辑工作台并载入翻页和长滚动两类现有验收样例。
- [x] 测试断言用户可观察行为，不暴露或锁定内部状态管理、组件结构或 DOM 实现细节。
- [x] throwaway prototype 不被直接提升为生产实现；可以沿用其已验证的工作台方向，但正式代码与原型试验开关保持分离。

## Comments

- Implemented the production Vite workspace and Playwright Chromium E2E seam.
- Verified with `npm run build` and `npm run test:e2e` (4 tests passed).
- Completed a 1440×900 visual QA pass of the empty editor workspace.
