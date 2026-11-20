// 统一从 request.ts 取 API 根地址，避免多处重复定义
import { BASE_URL } from './request';

export { BASE_URL };

export const getFullImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  let path = url;
  if (path.startsWith('images/covers/')) {
    path = `/uploads/${path}`;
  } else if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  return `${BASE_URL}${path}`;
};
