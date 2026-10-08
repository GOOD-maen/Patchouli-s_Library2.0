// src/utils/request.ts
import { useAuthStore } from '../stores/useAuthStore';

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface RequestOptions extends RequestInit {
  skipAuthRedirect?: boolean;
  autoJson?: boolean;
  _retry?: boolean;
}

/**
 * 静默刷新：用 Cookie 里的 Refresh Token 换新的 Access Token
 * @returns 新的 Access Token，失败返回 null
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',   // ⬅️ 关键：带上 Cookie
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.success && data.token) {
      // 更新 store 里的 accessToken
      const user = useAuthStore.getState().user;
      useAuthStore.getState().setAuth(data.token, user!);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 统一的认证请求函数
 * - 自动添加 Authorization: Bearer <accessToken>
 * - 401 时自动静默刷新，刷新成功后重发原请求
 * - 刷新失败则清除状态并跳转登录页
 */
export async function authFetch(endpoint: string, options: RequestOptions = {}) {
  const { skipAuthRedirect = false, autoJson = true, _retry = false, ...fetchOptions } = options;

  const accessToken = useAuthStore.getState().accessToken;
  const headers = new Headers(fetchOptions.headers);

  if (autoJson && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',   // ⬅️ 带上 Cookie（用于刷新）
  });

  // ⬇️ 401 时尝试静默刷新
  if (response.status === 401 && !_retry && !skipAuthRedirect) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      // 刷新成功，用新 token 重发原请求
      return authFetch(endpoint, { ...options, _retry: true });
    }

    // 刷新失败，清除状态并跳转
    useAuthStore.getState().clearAuth();
    if (!window.location.pathname.includes('/auth/login')) {
      window.location.href = '/auth/login';
    }
    throw new Error('登录已过期，请重新登录');
  }

  return response;
}

/**
 * 公开请求（不携带 token，不处理 401）
 */
export async function publicFetch(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  return fetch(url, options);
}