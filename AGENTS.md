# AGENTS.md

## 项目目标

这是一个个人单机、手机优先的“消费训练”PWA：按月设置训练额度，记录消费，查看余额和明细。数据只存浏览器本地。

## 原则

- 保持极简：只维护记录、月度额度、统计和 JSON 备份恢复。
- 不把它扩展为传统记账软件。
- 不加入账号、云同步、分类、图表、提醒、社交、AI、理财或收入等功能。
- 优先采用少依赖、可离线、便于 GitHub Pages 部署的实现。
- 改动数据结构时必须兼容或迁移已有本地数据。

## 命令

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run preview -- --host
```
