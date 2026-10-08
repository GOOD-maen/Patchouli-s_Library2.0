import { authFetch } from '../utils/request';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: any;
}

// 登录
export const loginApi = async (account: string, password: string): Promise<ApiResponse> => {
  const res = await authFetch('/api/user/login', {
    method: 'POST',
    body: JSON.stringify({ account, password }),
    skipAuthRedirect: true,
  });
  return res.json();
};

// 注册
export const registerApi = async (
  username: string,
  password: string,
  email: string,
  verificationCode: string
): Promise<ApiResponse> => {
  const res = await authFetch('/api/user/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, email, verificationCode }),
    skipAuthRedirect: true,
  });
  return res.json();
};

// 发送注册验证码
export const sendRegisterCodeApi = async (email: string): Promise<ApiResponse> => {
  const res = await authFetch('/api/user/send-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
    skipAuthRedirect: true,
  });
  return res.json();
};

// 发送找回密码验证码
export const sendResetCodeApi = async (email: string): Promise<ApiResponse> => {
  const res = await authFetch('/api/user/send-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
    skipAuthRedirect: true,
  });
  return res.json();
};

// 验证找回密码验证码
export const verifyResetCodeApi = async (email: string, code: string): Promise<ApiResponse> => {
  const res = await authFetch('/api/user/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
    skipAuthRedirect: true,
  });
  return res.json();
};

// 重置密码
export const resetPasswordApi = async (email: string, newPassword: string): Promise<ApiResponse> => {
  const res = await authFetch('/api/user/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, password: newPassword }),
    skipAuthRedirect: true,
  });
  return res.json();
};