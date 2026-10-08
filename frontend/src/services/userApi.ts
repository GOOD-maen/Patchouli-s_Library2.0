// src/services/userApi.ts
import { authFetch } from '../utils/request';

export const fetchCurrentUser = async () => {
  const response = await authFetch('/api/user/me');
  if (!response.ok) throw new Error('获取用户信息失败');
  const result = await response.json();
  return result.data || result;
};