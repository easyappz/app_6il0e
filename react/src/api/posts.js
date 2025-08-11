import instance from './axios';

export async function getFeed(params = { page: 1, limit: 20, commentsLimit: 3 }) {
  const res = await instance.get('/api/posts/feed', { params });
  return res.data; // { success, data: Post[] }
}

export async function createPost(payload) {
  const res = await instance.post('/api/posts', payload);
  return res.data; // { success, data: Post }
}

export async function likePost(id) {
  const res = await instance.post(`/api/posts/${id}/like`);
  return res.data; // { success, data: { postId, likesCount } }
}

export async function unlikePost(id) {
  const res = await instance.delete(`/api/posts/${id}/like`);
  return res.data; // { success, data: { postId, likesCount } }
}

export async function getPost(id) {
  const res = await instance.get(`/api/posts/${id}`);
  return res.data; // { success, data: Post }
}

export async function addComment(id, payload) {
  const res = await instance.post(`/api/posts/${id}/comment`, payload);
  return res.data; // { success, data: { postId, comment } }
}
