import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeClosed } from 'lucide-react';
import { loginApi } from '../../services/authApi';
import { useAuthStore } from '../../stores/useAuthStore';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const accountRef = useRef<HTMLInputElement>(null);

  // 加载记住的用户名
  useEffect(() => {
    const saved = localStorage.getItem('rememberedUsername');
    if (saved) {
      setAccount(saved);
      setRemember(true);
    }
    accountRef.current?.focus();
  }, []);

  // 表单验证
  const validate = (): boolean => {
    if (!account.trim()) {
      setError('请输入邮箱/用户名');
      return false;
    }
    if (!password) {
      setError('请输入密码');
      return false;
    }
    return true;
  };

  // 登录请求

  const setAuth = useAuthStore(state => state.setAuth);

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const data = await loginApi(account, password);
      if (data.success) {
        // 存储 token（后端直接返回 token 字段）
        if (data.token) {
        setAuth(data.token, data.user || null);
        }
        // 记住我功能
        if (remember) {
          localStorage.setItem('rememberedUsername', account);
        } else {
          localStorage.removeItem('rememberedUsername');
        }
        navigate('/'); // 跳转到首页
      } else {
        setError(data.message || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 回车切换焦点
  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter') {
      if (field === 'account') {
        document.getElementById('password-input')?.focus();
      } else if (field === 'password') {
        handleLogin();
      }
    }
  };

  return (
    <>
      <h2 className="form-title">登录</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="input-group">
        <input
          ref={accountRef}
          type="text"
          placeholder="邮箱/用户名"
          value={account}
          onChange={e => setAccount(e.target.value)}
          onKeyDown={e => handleKeyDown(e, 'account')}
        />
      </div>

      <div className="input-group password-group">
        <input
          id="password-input"
          type={showPassword ? 'text' : 'password'}
          placeholder="密码"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => handleKeyDown(e, 'password')}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="eye-btn"
        >
          {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
        </button>
      </div>

      <div className="remember-forgot">
        <label>
          <input
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
          />
          记住我
        </label>
        <button className="link-btn" onClick={() => navigate('/auth/forget-password')}>
          忘记密码?
        </button>
      </div>

      <button className="submit-btn" onClick={handleLogin} disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>

      <div className="extra-link">
        没有账号？ <button className="link-btn" onClick={() => navigate('/auth/register')}>立即注册</button>
      </div>
    </>
  );
};

export default LoginForm;