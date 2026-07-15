# AGENTS.md

## 项目目标

这是一个个人单机、手机优先的“消费训练”PWA：按月设置训练额度，记录消费原因，在使用后补充反馈，并通过可解释的本地规则识别消费效果。数据只存浏览器本地。

## 原则

- 保持极简：前台只保留记录、反馈、月度统计和 JSON 备份恢复；复杂分析隐藏在本地规则中。
- 不把它扩展为传统记账软件。
- 不加入账号、云同步、手工消费分类、图表、提醒、社交、云端 AI、理财或收入等功能。
- 优先采用少依赖、可离线、便于 GitHub Pages 部署的实现。
- 改动数据结构时必须兼容或迁移已有本地数据。
- 评分协议放在 `src/analysis/config.ts`，计算保持纯函数、可测试、可解释。
- 后续需求辅助优先复用 `src/analysis/recommend.ts` 的本地历史检索接口。

## 命令

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run preview -- --host
```
