# Widget：my_ext_bot_info 统一写入 Store 执行计划

## 目标

- 根据 `content_attributes.my_ext_bot_info` 动态显示座席消息头像与名称。
- `my_ext_bot_info` 不同的座席消息不聚合，各自展示。
- WebSocket、HTTP 历史、HTTP 同步、未读列表（数据来自 `conversations`）行为一致。

## 方案

在消息写入 `conversations` 前调用 `normalizeBotInfo(message)`，将扩展信息合并到 `sender`：

- `name` → `sender.name`、`sender.available_name`
- `avatar` → `sender.avatar_url`
- 合并方式：`{ ...(message.sender || {}), ... }`，保留 `availability_status` 等字段

**条件**：仅当 `message_type === MESSAGE_TYPE.OUTGOING`（1）且存在有效 `my_ext_bot_info`（含 `name` 或 `avatar`）时处理。

**字符串**：若 `my_ext_bot_info` 为 JSON 字符串，在 normalize 内 `JSON.parse`（失败则跳过）。

## 同步路径修正

- `setMissingMessagesInConversation` 必须写入 `$state.conversations`（原 `$state.conversation` 为错误键名）。
- `syncLatestMessages` 不得在 action 内直接修改 `state.conversations`；先构造新对象再 `commit`。

## 涉及 mutation

- `pushMessageToConversation`：凡写入 inbox 的消息均 normalize。
- `setMessagesInConversation`：每条历史消息 normalize。
- `setMissingMessagesInConversation`：对 payload 中每条消息 normalize 后赋给 `conversations`。
- `updateAttachmentMessageStatus`：最终消息 normalize。
- `updateMessage`：合并 `content_attributes` 后 normalize。

## 可选清理

- `helpers.js` 的 `getSenderName` 以 `sender.available_name || sender.name` 为准（与 store 一致）。
- `AgentMessage.vue` 去掉对 `my_ext_bot_info` 的重复读取，保留无 `sender` 时的回退链。

## 验收

- 两条 OUTGOING、`my_ext_bot_info.name` 不同 → 不聚合，头像名称正确。
- 分页历史、WS、`syncLatestMessages`、未读气泡与主会话一致。
