# Obsidian LAN Sync Bridge — 项目大纲

## 项目背景与目标

**痛点**：现有 Obsidian 同步方案依赖公有云（iCloud/OneDrive）、自建 VPS、或官方付费订阅。在"手机与电脑同处一个局域网"的常见场景下，缺乏一个极其轻量、纯本地且能优雅处理冲突的方案。

**目标**：开发一款 Electron 桌面端应用。PC 后台静默运行 WebDAV 服务，配合手机端 Obsidian 插件 "Remotely Save"，实现无缝局域网同步。桌面端提供可视化界面，专职解决版本冲突。

## 系统架构

### 移动端（黑盒）
- Obsidian + Remotely Save 插件
- 主动发起局域网 HTTP (WebDAV) 请求，执行增量比对、GET/PUT

### PC Main Process（核心服务层）
- **WebDAV Server** — 监听本地端口，暴露 Obsidian Vault 为 WebDAV 根
- **Conflict Interceptor** — 拦截 PUT 请求，mtime 比对，阻断覆盖并暂存到 .sync-cache/
- **IPC 通信** — 派发 ON_CONFLICT 事件，接收 RESOLVE_CONFLICT 指令

### PC Renderer Process（UI 展示层）
- **系统托盘** — 服务状态指示灯、局域网 IP + 端口
- **Diff Workspace** — Monaco Editor diff 模式，冲突时弹窗
- **三个操作** — 采纳本地 / 采纳移动端 / 手动合并保存

## 核心业务流

### 无冲突标准同步
手机 → PROPFIND → 文件树 → 比对 → PUT → 中间件检查 mtime → 直接落盘 → 托盘通知

### 冲突拦截与合并（核心亮点）
手机 PUT → 中间件发现本地也修改了 → 暂存到 .sync-cache/xxx_mobile.md → 对手机返回 200 OK → IPC 通知 UI → 弹 Diff 面板 → 用户合并 → 覆盖本地 → 下次同步手机拉走合并版

## Sprint 规划

### Sprint 1：基础设施搭建
- Electron Forge + Vite 四通道构建（已完成 80%）
- 系统托盘框架
- 窗口关闭 → 隐藏到托盘
- IPC 基础通信

### Sprint 2：WebDAV 引擎挂载
- 引入 webdav-server 库
- 主进程挂载本地文件夹为 WebDAV
- 验收：浏览器 / Remotely Save 可连接并读写

### Sprint 3：拦截器与缓存系统
- PUT 请求中间件
- mtime 检查逻辑
- .sync-cache/ 缓存写入
- IPC 冲突事件定义

### Sprint 4：UI 与 Diff 编辑器
- Monaco Editor diff 模式
- 冲突弹窗面板
- 合并保存回调
- 托盘状态气泡
