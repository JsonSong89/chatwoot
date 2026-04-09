import { MESSAGE_TYPE } from 'widget/helpers/constants';
import { findUndeliveredMessage } from './helpers';

function parseMyExtBotInfo(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') return raw;
  return null;
}

/** Merge content_attributes.my_ext_bot_info into sender for OUTGOING (agent) messages. */
export function normalizeBotInfo(message) {
  if (!message || message.message_type !== MESSAGE_TYPE.OUTGOING) {
    return message;
  }
  const botInfo = parseMyExtBotInfo(
    message.content_attributes?.my_ext_bot_info
  );
  if (!botInfo) return message;
  const name = botInfo.name;
  const avatar = botInfo.avatar;
  if (!name && !avatar) return message;

  const sender = { ...(message.sender || {}) };
  if (name) {
    sender.name = name;
    sender.available_name = name;
  }
  if (avatar) {
    sender.avatar_url = avatar;
  }
  return { ...message, sender };
}

export const mutations = {
  clearConversations($state) {
    $state.conversations = {};
    $state.pendingCustomAttributes = {};
    $state.pendingLabels = [];
  },
  pushMessageToConversation($state, message) {
    const { id, status, message_type: type } = message;

    const messagesInbox = $state.conversations;
    const isMessageIncoming = type === MESSAGE_TYPE.INCOMING;
    const isTemporaryMessage = status === 'in_progress';

    if (!isMessageIncoming || isTemporaryMessage) {
      messagesInbox[id] = normalizeBotInfo(message);
      return;
    }

    const [messageInConversation] = findUndeliveredMessage(
      messagesInbox,
      message
    );
    if (!messageInConversation) {
      messagesInbox[id] = normalizeBotInfo(message);
    } else {
      // [VITE] instead of leaving undefined behind, we remove it completely
      // remove the temporary message and replace it with the new message
      // messagesInbox[messageInConversation.id] = undefined;
      delete messagesInbox[messageInConversation.id];
      messagesInbox[id] = normalizeBotInfo(message);
    }
  },

  updateAttachmentMessageStatus($state, { message, tempId }) {
    const { id } = message;
    const messagesInbox = $state.conversations;

    const messageInConversation = messagesInbox[tempId];

    if (messageInConversation) {
      // [VITE] instead of leaving undefined behind, we remove it completely
      // remove the temporary message and replace it with the new message
      // messagesInbox[tempId] = undefined;
      delete messagesInbox[tempId];
      messagesInbox[id] = normalizeBotInfo({ ...message });
    }
  },

  setConversationUIFlag($state, uiFlags) {
    $state.uiFlags = {
      ...$state.uiFlags,
      ...uiFlags,
    };
  },

  setConversationListLoading($state, status) {
    $state.uiFlags.isFetchingList = status;
  },

  setMessagesInConversation($state, payload) {
    if (!payload.length) {
      $state.uiFlags.allMessagesLoaded = true;
      return;
    }

    payload.forEach(message => {
      $state.conversations[message.id] = normalizeBotInfo(message);
    });
  },

  setMissingMessagesInConversation($state, payload) {
    const next = {};
    Object.entries(payload).forEach(([key, msg]) => {
      next[key] = normalizeBotInfo(msg);
    });
    $state.conversations = next;
  },

  updateMessage($state, { id, content_attributes }) {
    const prev = $state.conversations[id];
    if (!prev) return;
    const merged = {
      ...prev,
      content_attributes: {
        ...(prev.content_attributes || {}),
        ...content_attributes,
      },
    };
    $state.conversations[id] = normalizeBotInfo(merged);
  },

  updateMessageMeta($state, { id, meta }) {
    const message = $state.conversations[id];
    if (!message) return;

    const newMeta = message.meta ? { ...message.meta, ...meta } : { ...meta };
    message.meta = { ...newMeta };
  },

  deleteMessage($state, id) {
    delete $state.conversations[id];
    // [VITE] In Vue 3 proxy objects, we can't delete properties by setting them to undefined
    // Instead, we have to use the delete operator
    // $state.conversations[id] = undefined;
  },

  toggleAgentTypingStatus($state, { status }) {
    $state.uiFlags.isAgentTyping = status === 'on';
  },

  setMetaUserLastSeenAt($state, lastSeen) {
    $state.meta.userLastSeenAt = lastSeen;
  },

  setLastMessageId($state) {
    const { conversations } = $state;
    const lastMessage = Object.values(conversations).pop();
    if (!lastMessage) return;
    const { id } = lastMessage;
    $state.lastMessageId = id;
  },

  setPendingCustomAttributes($state, data) {
    $state.pendingCustomAttributes = {
      ...$state.pendingCustomAttributes,
      ...data,
    };
  },

  setPendingLabels($state, label) {
    if (!$state.pendingLabels.includes(label)) {
      $state.pendingLabels.push(label);
    }
  },

  removePendingCustomAttribute($state, key) {
    const { [key]: _, ...rest } = $state.pendingCustomAttributes;
    $state.pendingCustomAttributes = rest;
  },

  removePendingLabel($state, label) {
    $state.pendingLabels = $state.pendingLabels.filter(l => l !== label);
  },

  clearPendingConversationMetadata($state) {
    $state.pendingCustomAttributes = {};
    $state.pendingLabels = [];
  },
};
