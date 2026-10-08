import type { ApiConfig, Message } from '../modelPage';


export async function callDeepSeek(
  config: ApiConfig,
  messages: Message[]
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('请先在 API 设置中填写 API Key');
  }

  const apiMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: apiMessages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error('API 返回内容为空');
  }

  return reply;
}