// customImageCommand.ts
import { ICommand, TextAreaTextApi } from '@uiw/react-md-editor';
import { commands } from '@uiw/react-md-editor';

/**
 * 从 localStorage 获取认证 token
 * 根据你的 useAuthStore 的 persist 配置，token 存储在 'auth-storage' 的 state.accessToken 中
 */
function getAuthToken(): string | null {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.accessToken || null;
    }
  } catch (e) {
    console.error('读取 token 失败', e);
  }
  return null;
}

/**
 * 上传图片到服务器
 * @param file 图片文件
 * @returns 图片访问 URL
 */
async function uploadImageToServer(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('http://localhost:8080/api/upload/temp-image', {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    // 尝试读取错误信息（可能是 HTML 或 JSON）
    const errorText = await response.text();
    throw new Error(`上传失败 (${response.status}): ${errorText}`);
  }

  // 确保响应是 JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('服务器返回非 JSON 格式');
  }

  const data = await response.json();
  if (!data.url) {
    throw new Error('后端未返回图片 URL');
  }
  return data.url;
}

/**
 * 自定义图片上传命令，替换原生图片按钮
 */
export const customImageCommand: ICommand = {
  // 保留原生按钮的图标、标题等
  ...commands.image,
  execute: async (state, api: TextAreaTextApi) => {
    // 创建隐藏的文件选择器
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // 简单校验文件类型和大小
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('图片不能超过 5MB');
        return;
      }

      try {
        const imageUrl = await uploadImageToServer(file);
        const fullUrl = `http://localhost:8080${imageUrl}`;
        const markdownText = `![图片](${fullUrl})`;
        api.replaceSelection(markdownText);
      } catch (error) {
        console.error('图片上传失败:', error);
        alert('图片上传失败，请检查网络或登录状态');
      }
    };

    input.click();
  },
};