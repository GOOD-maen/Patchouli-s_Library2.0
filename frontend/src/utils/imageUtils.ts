export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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