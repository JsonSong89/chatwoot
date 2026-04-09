import { mutations, normalizeBotInfo } from '../../conversation/mutations';

const temporaryMessagePayload = {
  content: 'hello',
  id: 1,
  message_type: 0,
  status: 'in_progress',
};

const incomingMessagePayload = {
  content: 'hello',
  id: 1,
  message_type: 0,
  status: 'sent',
};

const outgoingMessagePayload = {
  content: 'hello',
  id: 1,
  message_type: 1,
  status: 'sent',
};

describe('#mutations', () => {
  describe('#pushMessageToConversation', () => {
    it('add message to conversation if outgoing', () => {
      const state = { conversations: {} };
      mutations.pushMessageToConversation(state, outgoingMessagePayload);
      expect(state.conversations).toEqual({
        1: outgoingMessagePayload,
      });
    });

    it('merges my_ext_bot_info into sender for outgoing messages', () => {
      const state = { conversations: {} };
      const payload = {
        ...outgoingMessagePayload,
        content_attributes: {
          my_ext_bot_info: {
            name: '售前客服',
            avatar: 'https://example.com/a.png',
          },
        },
        sender: { id: 1, name: 'Agent', avatar_url: '/old.png' },
      };
      mutations.pushMessageToConversation(state, payload);
      expect(state.conversations[1]).toMatchObject({
        sender: expect.objectContaining({
          name: '售前客服',
          available_name: '售前客服',
          avatar_url: 'https://example.com/a.png',
        }),
      });
    });

    it('parses my_ext_bot_info JSON string for outgoing messages', () => {
      const state = { conversations: {} };
      const payload = {
        ...outgoingMessagePayload,
        content_attributes: {
          my_ext_bot_info: JSON.stringify({
            name: '物流专员',
            avatar: 'https://example.com/b.png',
          }),
        },
      };
      mutations.pushMessageToConversation(state, payload);
      expect(state.conversations[1].sender).toMatchObject({
        name: '物流专员',
        available_name: '物流专员',
        avatar_url: 'https://example.com/b.png',
      });
    });

    it('add message to conversation if message in undelivered', () => {
      const state = { conversations: {} };
      mutations.pushMessageToConversation(state, temporaryMessagePayload);
      expect(state.conversations).toEqual({
        1: temporaryMessagePayload,
      });
    });

    it('replaces temporary message in conversation with actual message', () => {
      const state = {
        conversations: {
          rand_id_123: {
            content: 'hello',
            id: 'rand_id_123',
            message_type: 0,
            status: 'in_progress',
          },
        },
      };
      mutations.pushMessageToConversation(state, incomingMessagePayload);
      expect(state.conversations).toEqual({
        1: incomingMessagePayload,
      });
    });

    it('adds message in conversation if it is a new message', () => {
      const state = { conversations: {} };
      mutations.pushMessageToConversation(state, incomingMessagePayload);
      expect(state.conversations).toEqual({
        1: incomingMessagePayload,
      });
    });
  });

  describe('#setConversationListLoading', () => {
    it('set status correctly', () => {
      const state = { uiFlags: { isFetchingList: false } };
      mutations.setConversationListLoading(state, true);
      expect(state.uiFlags.isFetchingList).toEqual(true);
    });
  });

  describe('#setConversationUIFlag', () => {
    it('set uiFlags correctly', () => {
      const state = { uiFlags: { isFetchingList: false } };
      mutations.setConversationUIFlag(state, { isCreating: true });
      expect(state.uiFlags).toEqual({
        isFetchingList: false,
        isCreating: true,
      });
    });
  });

  describe('#setMessagesInConversation', () => {
    it('sets allMessagesLoaded flag if payload is empty', () => {
      const state = { uiFlags: { allMessagesLoaded: false } };
      mutations.setMessagesInConversation(state, []);
      expect(state.uiFlags.allMessagesLoaded).toEqual(true);
    });

    it('sets messages if payload is not empty', () => {
      const state = {
        uiFlags: { allMessagesLoaded: false },
        conversations: {},
      };
      mutations.setMessagesInConversation(state, [{ id: 1, content: 'hello' }]);
      expect(state.conversations).toEqual({
        1: { id: 1, content: 'hello' },
      });
      expect(state.uiFlags.allMessagesLoaded).toEqual(false);
    });
  });

  describe('#toggleAgentTypingStatus', () => {
    it('sets isAgentTyping flag to true', () => {
      const state = { uiFlags: { isAgentTyping: false } };
      mutations.toggleAgentTypingStatus(state, { status: 'on' });
      expect(state.uiFlags.isAgentTyping).toEqual(true);
    });

    it('sets isAgentTyping flag to false', () => {
      const state = { uiFlags: { isAgentTyping: true } };
      mutations.toggleAgentTypingStatus(state, { status: 'off' });
      expect(state.uiFlags.isAgentTyping).toEqual(false);
    });
  });

  describe('#updateAttachmentMessageStatus', () => {
    it('Updates status of loading messages if payload is not empty', () => {
      const state = {
        conversations: {
          rand_id_123: {
            content: '',
            id: 'rand_id_123',
            message_type: 0,
            status: 'in_progress',
            attachment: {
              file: '',
              file_type: 'image',
            },
          },
        },
      };
      const message = {
        id: '1',
        content: '',
        status: 'sent',
        message_type: 0,
        attachments: [
          {
            file: '',
            file_type: 'image',
          },
        ],
      };
      mutations.updateAttachmentMessageStatus(state, {
        message,
        tempId: 'rand_id_123',
      });

      expect(state.conversations).toEqual({
        1: {
          id: '1',
          content: '',
          message_type: 0,
          status: 'sent',
          attachments: [
            {
              file: '',
              file_type: 'image',
            },
          ],
        },
      });
    });
  });

  describe('#clearConversations', () => {
    it('clears conversations and pending metadata', () => {
      const state = {
        conversations: { 1: { id: 1 } },
        pendingCustomAttributes: { plan: 'enterprise' },
        pendingLabels: ['vip'],
      };
      mutations.clearConversations(state);
      expect(state.conversations).toEqual({});
      expect(state.pendingCustomAttributes).toEqual({});
      expect(state.pendingLabels).toEqual([]);
    });
  });

  describe('#setPendingCustomAttributes', () => {
    it('merges custom attributes into pending state', () => {
      const state = { pendingCustomAttributes: { existing: 'value' } };
      mutations.setPendingCustomAttributes(state, { plan: 'enterprise' });
      expect(state.pendingCustomAttributes).toEqual({
        existing: 'value',
        plan: 'enterprise',
      });
    });
  });

  describe('#setPendingLabels', () => {
    it('adds label to pending state', () => {
      const state = { pendingLabels: [] };
      mutations.setPendingLabels(state, 'vip');
      expect(state.pendingLabels).toEqual(['vip']);
    });

    it('does not add duplicate labels', () => {
      const state = { pendingLabels: ['vip'] };
      mutations.setPendingLabels(state, 'vip');
      expect(state.pendingLabels).toEqual(['vip']);
    });
  });

  describe('#removePendingCustomAttribute', () => {
    it('removes a single key from pending custom attributes', () => {
      const state = {
        pendingCustomAttributes: { plan: 'enterprise', region: 'us' },
      };
      mutations.removePendingCustomAttribute(state, 'plan');
      expect(state.pendingCustomAttributes).toEqual({ region: 'us' });
    });
  });

  describe('#removePendingLabel', () => {
    it('removes a label from pending labels', () => {
      const state = { pendingLabels: ['vip', 'premium'] };
      mutations.removePendingLabel(state, 'vip');
      expect(state.pendingLabels).toEqual(['premium']);
    });

    it('does nothing if label not present', () => {
      const state = { pendingLabels: ['vip'] };
      mutations.removePendingLabel(state, 'premium');
      expect(state.pendingLabels).toEqual(['vip']);
    });
  });

  describe('#clearPendingConversationMetadata', () => {
    it('clears pending custom attributes and labels', () => {
      const state = {
        pendingCustomAttributes: { plan: 'enterprise' },
        pendingLabels: ['vip'],
      };
      mutations.clearPendingConversationMetadata(state);
      expect(state.pendingCustomAttributes).toEqual({});
      expect(state.pendingLabels).toEqual([]);
    });
  });

  describe('#deleteMessage', () => {
    it('delete the message from conversation', () => {
      const state = { conversations: { 1: { id: 1 } } };
      mutations.deleteMessage(state, 1);
      expect(state.conversations).toEqual({});
    });
  });

  describe('#setMissingMessagesInConversation', () => {
    it('replaces conversations with normalized sorted payload', () => {
      const state = {
        conversations: { 99: { id: 99, message_type: 1 } },
      };
      const payload = {
        1: {
          id: 1,
          message_type: 1,
          content_attributes: {
            my_ext_bot_info: { name: 'Bot A', avatar: 'https://x/a.png' },
          },
          created_at: 100,
        },
      };
      mutations.setMissingMessagesInConversation(state, payload);
      expect(state.conversations).toEqual({
        1: normalizeBotInfo(payload[1]),
      });
    });
  });

  describe('#setMissingMessages', () => {
    it('sets messages if payload is not empty', () => {
      const state = {
        uiFlags: { allMessagesLoaded: false },
        conversations: {
          454: {
            id: 454,
            content: 'hi',
            message_type: 0,
            content_type: 'text',
            content_attributes: {},
            created_at: 1682432667,
            conversation_id: 20,
          },
          464: {
            id: 464,
            content: 'hey will be back soon',
            message_type: 3,
            content_type: 'text',
            content_attributes: {},
            created_at: 1682490729,
            conversation_id: 20,
          },
        },
      };
      mutations.setMessagesInConversation(state, [
        {
          id: 455,
          content: 'Hey billowing-grass-423 how are you?',
          message_type: 3,
          content_type: 'text',
          content_attributes: {},
          created_at: 1682432667,
          conversation_id: 20,
        },
      ]);
      expect(state.conversations).toEqual({
        454: {
          id: 454,
          content: 'hi',
          message_type: 0,
          content_type: 'text',
          content_attributes: {},
          created_at: 1682432667,
          conversation_id: 20,
        },
        455: {
          id: 455,
          content: 'Hey billowing-grass-423 how are you?',
          message_type: 3,
          content_type: 'text',
          content_attributes: {},
          created_at: 1682432667,
          conversation_id: 20,
        },
        464: {
          id: 464,
          content: 'hey will be back soon',
          message_type: 3,
          content_type: 'text',
          content_attributes: {},
          created_at: 1682490729,
          conversation_id: 20,
        },
      });
    });
  });
});
