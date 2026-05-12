# Crystal Sync — 项目文档

## 概述

一款 Electron 桌面端应用。PC 后台运行 WebDAV 服务，配合手机端 Obsidian 插件 "Remotely Save" 实现局域网同步。每次手机 PUT 写入前自动快照本地文件到 `.sync-history/`，提供版本历史浏览和 Monaco Diff 对比恢复。

## 系统架构

```
┌─ Mobile (Remotely Save) ─┐
│  PROPFIND / GET / PUT     │
└──────────┬────────────────┘
           │ LAN HTTP
┌──────────▼────────────────────────────────┐
│  Main Process                              │
│  ├─ webdav-service.ts   服务器生命周期      │
│  ├─ versioned-file-system.ts  PUT拦截快照   │
│  └─ ipc-handler.ts      IPC 通道注册        │
├───────────────────────────────────────────┤
│  Preload (contextBridge)                    │
│  └─ electronAPI.invoke() / .on()           │
├───────────────────────────────────────────┤
│  Renderer (Vue 3 + Pinia + Tailwind v4)    │
│  ├─ SyncPanel        服务器控制面板         │
│  ├─ SnapshotBrowser  版本历史浏览器         │
│  ├─ DiffEditor       Monaco 差异对比        │
│  ├─ Sidebar          导航图标               │
│  ├─ Tabs             标签栏                 │
│  └─ Editors          编辑器容器             │
└────────────────────────────────────────────┘
```

## 核心机制

### 版本快照（Version Snapshot）

每次 PUT 请求到达时，`VersionedFileSystem._openWriteStream` 在写入前：
1. 检查本地文件是否存在
2. 若存在，将当前内容复制到 `.sync-history/{相对路径}/{ISO时间戳}.md`
3. IPC 推送 `sync:snapshot` 事件通知 UI 刷新

### 版本恢复

用户选中历史快照后，点击 Restore：
1. `sync:readFile` 读取快照内容和当前文件内容
2. Monaco Diff Editor 对比展示
3. `sync:restoreSnapshot` 将快照复制回工作文件

## 项目结构

```
crystal-sync/
├── src/
│   ├── main/                          # Electron 主进程
│   │   ├── main.ts                    # 入口：托盘、窗口、IPC 注册
│   │   ├── ipc-handler.ts             # 所有 IPC 通道处理
│   │   └── service/
│   │       ├── webdav-service.ts      # WebDAV 服务器启停、状态
│   │       ├── versioned-file-system.ts # PUT 拦截 → 快照
│   │       ├── shell-service.ts       # 终端 Shell 子进程
│   │       └── conflict-server.js     # 独立测试服务器
│   ├── preload/
│   │   └── preload.ts                 # contextBridge 暴露 electronAPI
│   ├── renderer/slotPanelFront/       # Vue 3 渲染进程
│   │   ├── App.vue                    # 无框窗口壳
│   │   ├── style.css                  # 全局主题 (Linear Dark)
│   │   ├── main.ts                    # Vue 入口
│   │   ├── store/
│   │   │   ├── sessionStore.ts        # EditorSession 管理 (Pinia)
│   │   │   └── tabStore.ts            # Tab 列表、创建/切换/关闭
│   │   ├── core/
│   │   │   ├── editor/EditorSession.ts         # 编辑器会话包装
│   │   │   ├── tab/TabManager.cs               # Tab 历史 MRU
│   │   │   └── models/editor/
│   │   │       ├── EditorPanelAbstract.ts      # 编辑器面板抽象类
│   │   │       └── EditorTypes.ts              # 类型定义
│   │   ├── editors/
│   │   │   ├── ExtensionEditor/ExtensionEditor.ts  # Vue 组件挂载器
│   │   │   └── terminalEditor/TerminalEditor.ts    # xterm 终端
│   │   └── workbench/
│   │       ├── index.vue              # CSS Grid 主布局
│   │       ├── sideBar/index.vue      # 侧边栏导航
│   │       ├── tabs/index.vue         # 标签栏
│   │       ├── editors/index.vue      # 编辑器挂载容器
│   │       ├── syncPanel/index.vue    # 服务器控制面板
│   │       ├── snapshotBrowser/index.vue  # 版本历史浏览器
│   │       └── diffEditor/index.vue   # Monaco Diff 编辑器
│   └── workers/
│       └── worker.ts                  # Worker 线程桩
├── vite.main.config.ts
├── vite.preload.config.ts
├── vite.renderer.config.ts
├── vite.worker.config.ts
├── forge.config.ts
├── package.json
└── doc/
    ├── project-outline.md             # 本文档
    ├── dev-log.md                     # 开发日志
    └── architecture/                  # 架构笔记 (原 slotPanel)
```

## IPC 通道

### Request/Response (invoke/handle)

| 通道 | 参数 | 返回 |
|------|------|------|
| `webdav:start` | `vaultPath`, `port?` | `WebDAVStatus` |
| `webdav:stop` | — | `WebDAVStatus` |
| `webdav:status` | — | `WebDAVStatus` |
| `sync:listSnapshots` | — | `{ files: FileEntry[] }` |
| `sync:readFile` | `filePath` (绝对路径) | `{ content: string }` |
| `sync:restoreSnapshot` | `snapshotPath`, `targetPath` | `{ ok: true }` |
| `shell:exec` | `command` | `{ ok: true }` |
| `shell:interrupt` | — | `{ ok: true }` |
| `sys:closeWindow` | — | — |
| `sys:maximizeWindow` | — | — |
| `sys:minimizeWindow` | — | — |
| `app:quit` | — | — |

### Push Events (send/on)

| 事件 | 载荷 | 触发时机 |
|------|------|---------|
| `sync:snapshot` | `SnapshotEvent` | PUT 快照创建后 |
| `webdav:statusChanged` | `WebDAVStatus` | 服务器启动/停止后 |
| `shell:stdout` | `string` | 子进程输出 |
| `shell:stderr` | `string` | 子进程错误 |
| `shell:close` | `number` | 子进程退出 |

## Vault 快照结构

```
vault/
├── .sync-history/
│   ├── Welcome.md/
│   │   ├── 2026-05-11T14-30-00-000Z.md
│   │   └── 2026-05-11T15-00-00-000Z.md
│   └── daliy/
│       └── 每日/
│           └── 五月十日.md/
│               └── 2026-05-11T14-30-00-000Z.md
├── Welcome.md
└── daliy/...
```

## 设计风格

Linear Dark 主题：
- 背景：`#0d0d0d` / `#141414` / `#1a1a1a`
- 强调色：`#5e6ad2` (Linear Purple)
- 文字：`#fff` / `#999` / `#666`
- 边框：`rgba(255,255,255,0.04)`
- Monaco Editor：`vs-dark` 主题

## 依赖

| 包 | 用途 |
|---|------|
| `webdav-server` | WebDAV 协议实现 |
| `monaco-editor` | Diff 编辑器 |
| `vite-plugin-monaco-editor` | Monaco Worker 打包 |
| `@xterm/xterm` | 终端模拟 |
| `lucide-vue-next` | 图标库 |
| `pinia` | 状态管理 |
| `tailwindcss` v4 | CSS 框架 |

---

## v0.2.0 Complete — Vault 管理器 + 快照管理

### Feature 1: Vault 预设管理 ✓

- 保存多个 vault 预设（路径 + 自定义名称）
- 持久化到 `~/.crystal-sync/vaults.json`
- 热切换：选中预设后若服务器运行中则自动重启
- SyncPanel 显示当前 vault 名称
- Sidebar FolderOpen 图标 → VaultSwitcher 面板

### Feature 2: IP 分类展示 ✓

- `LAN` — `192.168.x.x` / `10.x.x.x` / `172.16-31.x.x`
- `Tailscale` — `100.x.x.x`（远程穿透，已实测可用）
- `Other` — 其余地址

### Feature 3: 快照管理 ✓

- 按日期折叠分组（Today / Yesterday / YYYY-MM-DD）
- 每个文件显示快照数量 badge，日期组可折叠/展开
- 删除单个快照（× 按钮）+ 删除文件全部快照（Trash2 按钮）
- IPC: `sync:deleteSnapshot`，删除后自动清理空目录

### 新增文件

| 文件 | 用途 |
|------|------|
| `src/main/service/vault-store.ts` | Vault 预设 JSON 持久化 |
| `src/renderer/slotPanelFront/workbench/vaultSwitcher/index.vue` | Vault 切换面板 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/main/ipc-handler.ts` | 新增 vault + snapshot delete 通道 |
| `src/main/service/webdav-service.ts` | IP 分类返回；热切换 vault 路径；EADDRINUSE 修复 |
| `src/renderer/slotPanelFront/workbench/sideBar/index.vue` | 新增 VaultSwitcher 图标 |
| `src/renderer/slotPanelFront/workbench/syncPanel/index.vue` | IP 分类展示；显示 vault 名称 |
| `src/renderer/slotPanelFront/workbench/snapshotBrowser/index.vue` | 按日期折叠；删除按钮 |

### 新增 IPC

| 通道 | 参数 | 返回 |
|------|------|------|
| `vault:list` | — | `{ presets, activeId }` |
| `vault:save` | `{ name, path }` | `{ preset }` |
| `vault:delete` | `id` | `{ ok }` |
| `vault:setActive` | `id` | `{ preset }` |
| `vault:selectFolder` | — | `{ path }` (系统对话框) |
| `sync:deleteSnapshot` | `snapshotPath` (绝对路径) | `{ ok }` |

### 数据模型

```typescript
interface VaultPreset {
  id: string;
  name: string;
  path: string;
  createdAt: number;
}
// ~/.crystal-sync/vaults.json → { activeId, presets[] }

interface CategorizedIPs {
  lan: string[];       // 192.168.x.x
  tailscale: string[]; // 100.x.x.x
  other: string[];     // 其余
}
```
