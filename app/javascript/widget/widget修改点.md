### 去掉widget底部的 Powered by Chatwoot 字样
- 修改文件: app\javascript\widget\components\layouts\ViewWithHeader.vue
- 修改点: 将 disableBranding 设为 true

### 对话机器人名称,不完全固定从配置中获取,

### 消息头像和名称修改
- 修改文件: app/javascript/widget/components/AgentMessage.vue
- 修改点: agentName 和 avatarUrl 计算属性，优先读取 content_attributes.my_ext_bot_info 中的 name 和 avatar 替换显示
