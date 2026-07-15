# 消费训练

一个手机优先的极简消费训练记录工具。它只记录你主动想观察的消费：设置每月额度、记下消费原因、在实际使用后补充反馈，并通过可解释的本地规则给出简短效果判断。没有账号和后端，数据不会上传。

首次打开可以阅读“为什么我们需要训练消费能力”。完整理念文章保存在 `src/content/why-consumption-training.md`，以后可以直接更新这个文件。

## 本地运行

需要 Node.js 20 或更新版本。

```bash
npm install
npm run dev
```

让同一局域网内的手机访问：

```bash
npm run dev -- --host
```

终端会显示电脑和局域网访问地址。手机和电脑需连接同一个 Wi-Fi。

## 测试和构建

```bash
npm run typecheck
npm run test
npm run build
```

构建结果在 `dist` 目录。可用 `npm run preview -- --host` 本地预览生产版本。

## 部署到 GitHub Pages

1. 在 GitHub 创建空仓库，将本项目提交并推送到 `main` 分支。
2. 打开仓库的 **Settings → Pages**。
3. 在 **Build and deployment** 的来源中选择 **GitHub Actions**。
4. 推送后，项目自带的 `.github/workflows/deploy-pages.yml` 会自动测试、构建和部署。

Vite 已使用相对资源路径，因此项目站点和用户站点均可部署。

## 添加到手机桌面

- Android：用 Chrome 打开 HTTPS 部署地址，点右上角菜单，选择“安装应用”或“添加到主屏幕”。
- iPhone：用 Safari 打开 HTTPS 部署地址，点底部“分享”，选择“添加到主屏幕”，再点“添加”。

首次联网打开后等待页面加载完成，离线缓存会自动建立。安装后可从桌面以独立窗口打开，并能离线记录、编辑和查看。

## 数据与备份

消费记录和月度额度保存在当前浏览器的 `localStorage` 中，只属于当前设备和当前站点地址。清理站点数据、卸载浏览器或更换部署地址可能导致数据不可见。

点应用右上角的“…”可导出全部数据为 JSON 文件。恢复时选择该 JSON 文件，应用会先校验内容，确认后覆盖当前设备中的记录和额度。
