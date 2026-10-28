// customImageCommand.ts
import { ICommand, TextAreaTextApi, commands } from '@uiw/react-md-editor';
import { authFetch } from '../../utils/request';
import { getFullImageUrl } from '../../utils/imageUtils';

/**
 * 上传图片到统一存储接口，返回根相对 URL（例如 /uploads/temp/xxx.png）
 */
async function uploadImageToServer(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await authFetch('/api/uploads/temp', {
    method: 'POST',
    body: formData,
    autoJson: false,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success || !data?.url) {
    throw new Error(data?.message || `上传失败 (${response.status})`);
  }
  return data.url as string;
}

/**
 * 自定义图片上传命令，替换原生图片按钮
 */
export const customImageCommand: ICommand = {
  // 保留原生按钮的图标、标题等
  ...commands.image,
  execute: async (_state, api: TextAreaTextApi) => {
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
        // 编辑器预览需要绝对地址；保存时 managePage 会统一转回根相对路径
        const markdownText = `![图片](${getFullImageUrl(imageUrl)})`;
        api.replaceSelection(markdownText);
      } catch (error) {
        console.error('图片上传失败:', error);
        alert(error instanceof Error ? error.message : '图片上传失败，请检查网络或登录状态');
      }
    };

    input.click();
  },
};
