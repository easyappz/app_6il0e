import instance from './axios';

// All functions return res.data with common shape { success, data, error? }

export const getConversations = async ({ page = 1, limit = 20 } = {}) => {
  const res = await instance.get('/api/messages/conversations', { params: { page, limit } });
  return res.data;
};

export const createOrGetConversation = async ({ participantId }) => {
  const res = await instance.post('/api/messages/conversations', { participantId });
  return res.data;
};

export const getConversation = async (id) => {
  const res = await instance.get(`/api/messages/conversations/${id}`);
  return res.data;
};

export const getMessages = async (id, { page = 1, limit = 30 } = {}) => {
  const res = await instance.get(`/api/messages/conversations/${id}/messages`, { params: { page, limit } });
  return res.data;
};

export const sendMessage = async (id, { text }) => {
  const res = await instance.post(`/api/messages/conversations/${id}/messages`, { text });
  return res.data;
};

export const markRead = async (id, { before }) => {
  const res = await instance.post(`/api/messages/conversations/${id}/read`, { before });
  return res.data;
};

export const getUnreadCount = async () => {
  const res = await instance.get('/api/messages/unread-count');
  return res.data;
};
