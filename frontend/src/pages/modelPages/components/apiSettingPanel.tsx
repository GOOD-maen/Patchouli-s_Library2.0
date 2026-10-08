import { useState, useEffect } from 'react';
import './apiSettingPanel.css';
import type { ApiConfig } from '../modelPage';

interface ApiSettingsPanelProps {
  config: ApiConfig;
  onSave: (config: ApiConfig) => void;
}

function ApiSettingsPanel({ config, onSave }: ApiSettingsPanelProps) {
  const [form, setForm] = useState<ApiConfig>(config);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(config);
  }, [config]);

  const handleChange = (key: keyof ApiConfig, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="apiSettingsPanel">
      <div className="settings-header">
        <h2>API 设置</h2>
        <p className="settings-desc">配置 DeepSeek API 与语音参数</p>
      </div>

      <div className="settings-form">
        {/* API Key */}
        <div className="form-item">
          <label>API Key</label>
          <input
            type="password"
            value={form.apiKey}
            onChange={e => handleChange('apiKey', e.target.value)}
            placeholder="sk-xxxxxxxxxxxxxxxx"
          />
          <div className="form-hint">在 DeepSeek 控制台获取你的 API Key</div>
        </div>

        {/* Base URL */}
        <div className="form-item">
          <label>Base URL</label>
          <input
            type="text"
            value={form.baseUrl}
            onChange={e => handleChange('baseUrl', e.target.value)}
            placeholder="https://api.deepseek.com"
          />
          <div className="form-hint">DeepSeek API 的基础地址</div>
        </div>

        {/* 模型选择 */}
        <div className="form-item">
          <label>模型</label>
          <select
            value={form.model}
            onChange={e => handleChange('model', e.target.value)}
          >
            <option value="deepseek-chat">deepseek-chat（通用对话）</option>
            <option value="deepseek-reasoner">deepseek-reasoner（推理模型）</option>
          </select>
          <div className="form-hint">选择要使用的模型</div>
        </div>

        {/* 温度 */}
        <div className="form-item">
          <label>温度（Temperature）: {form.temperature}</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={form.temperature}
            onChange={e => handleChange('temperature', parseFloat(e.target.value))}
          />
          <div className="form-hint">值越高回答越随机，值越低越稳定（推荐 0.7）</div>
        </div>

        {/* 最大 Tokens */}
        <div className="form-item">
          <label>最大 Tokens</label>
          <input
            type="number"
            value={form.maxTokens}
            onChange={e => handleChange('maxTokens', parseInt(e.target.value) || 0)}
            min="1"
            max="8192"
          />
          <div className="form-hint">单次回复的最大长度</div>
        </div>

        {/* 自动播放语音 */}
        <div className="form-item">
          <label>自动播放语音</label>
          <div className="toggle-wrapper">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={form.autoPlayTts}
                onChange={e => handleChange('autoPlayTts', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">
              {form.autoPlayTts ? '开启' : '关闭'}
            </span>
          </div>
          <div className="form-hint">开启后，AI 回复会自动播放语音</div>
        </div>

        {/* 音色 */}
        <div className="form-item">
          <label>音色</label>
          <select
            value={form.ttsVoice}
            onChange={e => handleChange('ttsVoice', e.target.value)}
          >
            <option value="zh-CN-XiaoxiaoNeural">晓晓（女声，温柔）</option>
            <option value="zh-CN-XiaoyiNeural">晓伊（女声，活泼）</option>
            <option value="zh-CN-YunxiNeural">云希（男声，阳光）</option>
            <option value="zh-CN-YunjianNeural">云健（男声，沉稳）</option>
            <option value="zh-CN-YunyangNeural">云扬（男声，专业）</option>
          </select>
          <div className="form-hint">选择 AI 说话的声音</div>
        </div>

        {/* 语速 */}
        <div className="form-item">
          <label>语速：{form.ttsRate}</label>
          <input
            type="range"
            min="-50"
            max="50"
            step="5"
            value={parseInt(form.ttsRate.replace('%', '').replace('+', ''))}
            onChange={e => {
              const val = parseInt(e.target.value);
              const rateStr = val >= 0 ? `+${val}%` : `${val}%`;
              handleChange('ttsRate', rateStr);
            }}
          />
          <div className="form-hint">调整 AI 说话的快慢</div>
        </div>

        {/* 音量 */}
        <div className="form-item">
          <label>音量：{form.ttsVolume}</label>
          <input
            type="range"
            min="-50"
            max="50"
            step="5"
            value={parseInt(form.ttsVolume.replace('%', '').replace('+', ''))}
            onChange={e => {
              const val = parseInt(e.target.value);
              const volStr = val >= 0 ? `+${val}%` : `${val}%`;
              handleChange('ttsVolume', volStr);
            }}
          />
          <div className="form-hint">调整 AI 说话的音量</div>
        </div>

        {/* 保存按钮 */}
        <div className="form-actions">
          <button className="save-btn" onClick={handleSave}>
            保存设置
          </button>
          {saved && <span className="saved-tip">✅ 已保存</span>}
        </div>
      </div>
    </div>
  );
}

export default ApiSettingsPanel;