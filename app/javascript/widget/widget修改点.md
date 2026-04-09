### 去掉widget底部的 Powered by Chatwoot 字样
- 修改文件: app\javascript\widget\components\layouts\ViewWithHeader.vue
- 修改点: 将 disableBranding 设为 true

### 对话机器人名称,不完全固定从配置中获取,

### 消息头像和名称（my_ext_bot_info）— Store 统一映射
- 修改文件: [app/javascript/widget/store/modules/conversation/mutations.js](app/javascript/widget/store/modules/conversation/mutations.js)
- 修改点: 新增 `normalizeBotInfo`，在写入 `conversations` 前将 `content_attributes.my_ext_bot_info` 合并到 `sender`（仅 OUTGOING）；修正 `setMissingMessagesInConversation` 写入 `conversations`；`updateMessage` / `updateAttachmentMessageStatus` 路径同样 normalize。
- 修改文件: [app/javascript/widget/store/modules/conversation/actions.js](app/javascript/widget/store/modules/conversation/actions.js)
- 修改点: `syncLatestMessages` 不再直接改 state，使用展开合并后 `commit('setMissingMessagesInConversation', sortedMap)`。

### 消息聚合逻辑（与 sender 对齐）
- 修改文件: [app/javascript/widget/store/modules/conversation/helpers.js](app/javascript/widget/store/modules/conversation/helpers.js)
- 修改点: `getSenderName` 使用 `sender.available_name || sender.name`（依赖 store 已映射 bot 信息）。

### 消息展示组件（去重复判断）
- 修改文件: [app/javascript/widget/components/AgentMessage.vue](app/javascript/widget/components/AgentMessage.vue)
- 修改点: `agentName` / `avatarUrl` 优先走 `message.sender`，去掉对 `my_ext_bot_info` 的单独分支；保留 `additional_attributes`、inbox 头像、模板消息等回退。

### 执行计划文档
- [app/javascript/widget/plans/my_ext_bot_info_store_normalize.md](app/javascript/widget/plans/my_ext_bot_info_store_normalize.md)
