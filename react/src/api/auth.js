import instance from './axios';

// Auth API based on server/src/api_schema.yaml
export async function register(payload) {
  const res = await instance.post('/api/auth/register', payload);
  return res.data; // { success, data: { token, user }, error? }
}

export async function login(payload) {
  const res = await instance.post('/api/auth/login', payload);
  return res.data; // { success, data: { token, user }, error? }
}
