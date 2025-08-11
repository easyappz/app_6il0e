import instance from './axios';

export async function getMe() {
  const res = await instance.get('/api/users/me');
  return res.data; // { success, data: User }
}

export async function updateMe(payload) {
  const res = await instance.patch('/api/users/me', payload);
  return res.data; // { success, data: User }
}

export async function getUserById(id) {
  const res = await instance.get(`/api/users/${id}`);
  return res.data; // { success, data: User }
}

export async function getUserPosts(id) {
  const res = await instance.get(`/api/users/${id}/posts`);
  return res.data; // { success, data: Post[] }
}
