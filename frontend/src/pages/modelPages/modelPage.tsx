import { useState, useEffect, useRef } from 'react';
import './modelPage.css';
import ChatMessages from './components/chatMessages';
import ChatInput from './components/chatInput';
import Live2dStage from './components/live2dStage';
import LocalModelPanel from './components/localModelPanel';
import ApiSettingsPanel from './components/apiSettingPanel';
import { callDeepSeek } from './components/deepseekApi';
import { generateSpeech } from './utils/edgeTts';
import Loge from '../components/loge';

type ModelType = 'api' | 'apiSettings' | 'local';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ApiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  autoPlayTts: boolean;
  ttsVoice: string;
  ttsRate: string;
  ttsVolume: string;
}

const DEFAULT_API_CONFIG: ApiConfig = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2048,
  autoPlayTts: true,
  ttsVoice: 'zh-CN-XiaoxiaoNeural',
  ttsRate: '+0%',
  ttsVolume: '+0%',
};

const STORAGE_KEY = 'deepseek-api-config';
const MESSAGES_STORAGE_KEY = 'model-page-messages';

function loadApiConfig(): ApiConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_API_CONFIG, ...parsed };
    }
  } catch (err) {
    console.error('读取 API 配置失败:', err);
  }
  return DEFAULT_API_CONFIG;
}

function loadMessages(): Message[] {
  try {
    const saved = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('读取消息失败:', err);
  }
  return [];
}

function ModelPage() {
  const [activeModel, setActiveModel] = useState<ModelType>('api');
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [apiConfig, setApiConfig] = useState<ApiConfig>(loadApiConfig);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [live2dModel, setLive2dModel] = useState<any>(null);

  // ⬇️ 新增：全局音量变量
  const lipSyncVolumeRef = useRef<number>(0);

  // ⬇️ 新增：拿到模型后，劫持 motionManager.update，在动画更新后覆盖嘴巴参数
  useEffect(() => {
    if (!live2dModel) return;

    const motionManager = live2dModel?.internalModel?.motionManager;
    const originalUpdate = motionManager?.update;

    if (motionManager && originalUpdate) {
      motionManager.update = function (...args: any[]) {
        originalUpdate.apply(this, args);

        const coreModel = live2dModel?.internalModel?.coreModel;
        if (coreModel && typeof coreModel.setParameterValueById === 'function') {
          // 加增益，嘴巴更明显
          const v = Math.min(lipSyncVolumeRef.current * 5, 1);
          coreModel.setParameterValueById('ParamMouthOpenY', v);
        }
      };
    }

    return () => {
      if (motionManager && originalUpdate) {
        motionManager.update = originalUpdate;
      }
    };
  }, [live2dModel]);

  useEffect(() => {
    try {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.error('保存消息失败:', err);
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleSaveConfig = (config: ApiConfig) => {
    setApiConfig(config);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (err) {
      console.error('保存 API 配置失败:', err);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const reply = await callDeepSeek(apiConfig, newMessages);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);

      if (apiConfig.autoPlayTts) {
        console.log('🔊 准备调用 TTS，文本:', reply);
        generateSpeech(
          reply,
          apiConfig.ttsVoice,
          apiConfig.ttsRate,
          apiConfig.ttsVolume
        )
          .then(audioUrl => {
            console.log('🔊 音频URL:', audioUrl);
            if (audioRef.current) {
              audioRef.current.pause();
            }
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.addEventListener('play', () => {
              console.log('🎤 音频开始播放');

              const audioContext = new AudioContext();
              const source = audioContext.createMediaElementSource(audio);
              const analyser = audioContext.createAnalyser();
              analyser.fftSize = 256;
              source.connect(analyser);
              analyser.connect(audioContext.destination);

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              let rafId = 0;

              const animate = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const volume = sum / dataArray.length / 255;

                // ⬇️ 只更新全局音量变量，不直接写参数
                lipSyncVolumeRef.current = volume;

                rafId = requestAnimationFrame(animate);
              };
              animate();

              audio.addEventListener('ended', () => {
                cancelAnimationFrame(rafId);
                // ⬇️ 结束后把音量归零
                lipSyncVolumeRef.current = 0;
                audioContext.close();
              }, { once: true });
            });

            audio.play()
              .then(() => console.log('✅ 播放成功'))
              .catch(err => console.error('❌ 播放被拦截:', err));
          })
          .catch(ttsErr => {
            console.error('TTS 播放失败:', ttsErr);
          });
      } else {
        console.log('🔇 自动播放已关闭，跳过 TTS');
      }

    } catch (err: any) {
      console.error('调用 API 失败:', err);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `❌ 出错了：${err.message || '未知错误'}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  return (
    <div className="modelPage">
      <div className="sidebar">
        <div className="sidebar-logo">
          <Loge shouldTurnBlack={true} size="small" />
        </div>
        <div
          className={`sidebar-btn ${activeModel === 'api' ? 'active' : ''}`}
          onClick={() => setActiveModel('api')}
        >
          API 模型
        </div>
        <div
          className={`sidebar-btn ${activeModel === 'apiSettings' ? 'active' : ''}`}
          onClick={() => setActiveModel('apiSettings')}
        >
          API 设置
        </div>
        <div
          className={`sidebar-btn ${activeModel === 'local' ? 'active' : ''}`}
          onClick={() => setActiveModel('local')}
        >
          本地模型
        </div>
      </div>

      <div className="main-content">
        {activeModel === 'api' && (
          <div className="api-layout">
            <div className="chat-area">
              <ChatMessages messages={messages} isLoading={isLoading} />
            </div>
            <div className="bottom-area">
              <div className="live2d-area">
                <Live2dStage onModelReady={setLive2dModel} />
              </div>
              <div className="input-area">
                <ChatInput
                  value={inputValue}
                  onChange={setInputValue}
                  onSend={handleSend}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        {activeModel === 'apiSettings' && (
          <ApiSettingsPanel config={apiConfig} onSave={handleSaveConfig} />
        )}

        {activeModel === 'local' && <LocalModelPanel />}
      </div>
    </div>
  );
}

export default ModelPage;