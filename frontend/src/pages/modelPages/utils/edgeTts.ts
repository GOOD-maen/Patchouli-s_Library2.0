export async function generateSpeech(
  text: string,
  voice: string = 'zh-CN-XiaoxiaoNeural',
  rate: string = '+0%',
  volume: string = '+0%'
): Promise<string> {
  console.log('🔊 generateSpeech 被调用，文本:', text);

  if (!text.trim()) {
    throw new Error('文本为空');
  }

  const response = await fetch('http://localhost:8080/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, rate, volume }),
  });

  console.log('🔊 TTS 响应状态:', response.status);

  if (!response.ok) {
    throw new Error(`TTS 请求失败 (${response.status})`);
  }

  const audioBlob = await response.blob();
  console.log('🔊 音频 Blob 大小:', audioBlob.size);

  return URL.createObjectURL(audioBlob);
}