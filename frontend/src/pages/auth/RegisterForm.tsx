import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeClosed } from 'lucide-react';
import { registerApi, sendRegisterCodeApi } from '../../services/authApi';

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();

  // 表单数据
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [confirmPwd, setConfirmPwd] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // 控制动态显示
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 错误信息
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    confirmPwd: '',
    email: '',
    verificationCode: ''
  });

  // 抖动状态
  const [shaking, setShaking] = useState({
    username: false,
    password: false,
    confirmPwd: false,
    email: false,
    verificationCode: false
  });

  // 验证码倒计时
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const timerRef = useRef<number | null>(null);

  // 加载状态
  const [loading, setLoading] = useState(false);

  // refs 用于焦点管理
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPwdRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  // 初始化自动聚焦用户名
  useEffect(() => {
    usernameRef.current?.focus();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 监听密码：有内容则显示确认密码框
  useEffect(() => {
    if (form.password) setShowConfirm(true);
    else setShowConfirm(false);
  }, [form.password]);

  // 监听邮箱：有内容且格式正确则显示验证码框
  useEffect(() => {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (form.email && emailValid) setShowCode(true);
    else setShowCode(false);
  }, [form.email]);

  // 字段验证规则
  const validateField = (field: string, value: string): boolean => {
    let errorMsg = '';
    switch (field) {
      case 'username':
        if (!value.trim()) errorMsg = '用户名不能为空';
        else if (value.length > 20) errorMsg = '用户名不能超过20个字符';
        setErrors(prev => ({ ...prev, username: errorMsg }));
        return !errorMsg;
      case 'password':
        if (!value) errorMsg = '密码不能为空';
        else if (value.length < 6) errorMsg = '密码至少6个字符';
        setErrors(prev => ({ ...prev, password: errorMsg }));
        return !errorMsg;
      case 'confirmPwd':
        if (!showConfirm) return true;
        if (!value) errorMsg = '请再次输入密码';
        else if (form.password !== value) errorMsg = '两次输入的密码不一致';
        setErrors(prev => ({ ...prev, confirmPwd: errorMsg }));
        return !errorMsg;
      case 'email':
        if (!value) errorMsg = '邮箱不能为空';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errorMsg = '邮箱格式不正确';
        setErrors(prev => ({ ...prev, email: errorMsg }));
        return !errorMsg;
      case 'verificationCode':
        if (!showCode) return true;
        if (!value) errorMsg = '验证码不能为空';
        setErrors(prev => ({ ...prev, verificationCode: errorMsg }));
        return !errorMsg;
      default:
        return true;
    }
  };

  // 抖动动画
  const shakeField = (field: keyof typeof shaking) => {
    setShaking(prev => ({ ...prev, [field]: true }));
    setTimeout(() => setShaking(prev => ({ ...prev, [field]: false })), 400);
  };

  // 失焦处理
  const handleBlur = (field: string) => {
    let value = '';
    if (field === 'confirmPwd') value = confirmPwd;
    else if (field === 'verificationCode') value = verificationCode;
    else value = form[field as keyof typeof form];
    const isValid = validateField(field, value);
    if (!isValid) shakeField(field as keyof typeof shaking);
  };

  // 上下游重置（修改用户名/密码/邮箱会清空后续字段）
  const resetDownstream = (changedField: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (changedField === 'username') {
      setForm(prev => ({ ...prev, password: '', email: '' }));
      setConfirmPwd('');
      setVerificationCode('');
      setShowConfirm(false);
      setShowCode(false);
      setErrors({ username: '', password: '', confirmPwd: '', email: '', verificationCode: '' });
      setCountdown(0);
    } else if (changedField === 'password') {
      setConfirmPwd('');
      setForm(prev => ({ ...prev, email: '' }));
      setVerificationCode('');
      setShowCode(false);
      setErrors(prev => ({ ...prev, confirmPwd: '', email: '', verificationCode: '' }));
      setCountdown(0);
    } else if (changedField === 'email') {
      setVerificationCode('');
      setErrors(prev => ({ ...prev, verificationCode: '' }));
      setCountdown(0);
    }
  };

  // 输入处理 + 下游重置
  const handleInputChange = (field: string, value: string) => {
    if (field === 'username') {
      setForm(prev => ({ ...prev, username: value }));
      resetDownstream('username');
    } else if (field === 'password') {
      setForm(prev => ({ ...prev, password: value }));
      resetDownstream('password');
    } else if (field === 'email') {
      setForm(prev => ({ ...prev, email: value }));
      resetDownstream('email');
    } else if (field === 'confirmPwd') {
      setConfirmPwd(value);
    } else if (field === 'verificationCode') {
      setVerificationCode(value);
    }
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // 发送验证码
  const handleSendCode = async () => {
    const isValid = validateField('email', form.email);
    if (!isValid) {
      shakeField('email');
      return;
    }
    if (countdown > 0 || sending) return;
    setSending(true);
    try {
      const data = await sendRegisterCodeApi(form.email);
      if (data.success) {
        setCountdown(60);
        timerRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrors(prev => ({ ...prev, email: data.message || '发送失败' }));
        shakeField('email');
      }
    } catch {
      setErrors(prev => ({ ...prev, email: '网络错误，请稍后重试' }));
      shakeField('email');
    } finally {
      setSending(false);
    }
  };

  // 表单整体有效性
  const isFormValid = (): boolean => {
    if (!form.username.trim() || errors.username) return false;
    if (!form.password || errors.password) return false;
    if (showConfirm && (!confirmPwd || errors.confirmPwd)) return false;
    if (!form.email || errors.email) return false;
    if (showCode && (!verificationCode || errors.verificationCode)) return false;
    return true;
  };

  // 提交注册
  const handleRegister = async () => {
    const fields = ['username', 'password', 'email'];
    if (showConfirm) fields.push('confirmPwd');
    if (showCode) fields.push('verificationCode');
    let hasError = false;
    for (const f of fields) {
      let value = '';
      if (f === 'confirmPwd') value = confirmPwd;
      else if (f === 'verificationCode') value = verificationCode;
      else value = form[f as keyof typeof form];
      const valid = validateField(f, value);
      if (!valid) {
        shakeField(f as keyof typeof shaking);
        hasError = true;
      }
    }
    if (hasError) return;

    setLoading(true);
    try {
      const data = await registerApi(form.username, form.password, form.email, verificationCode);
      if (data.success) {
        navigate('/auth/login');
      } else {
        const msg = data.message;
        if (msg && msg.includes('验证码')) {
          setErrors(prev => ({ ...prev, verificationCode: msg }));
          shakeField('verificationCode');
        } else if (msg && msg.includes('用户名')) {
          setErrors(prev => ({ ...prev, username: msg }));
          shakeField('username');
        } else if (msg && msg.includes('邮箱')) {
          setErrors(prev => ({ ...prev, email: msg }));
          shakeField('email');
        } else {
          alert(msg || '注册失败');
        }
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || '注册失败，请稍后重试';
      if (errorMsg.includes('邮箱') || errorMsg.includes('email')) {
        setErrors(prev => ({ ...prev, email: errorMsg }));
        shakeField('email');
      } else {
        alert(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // 回车切换焦点
  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key !== 'Enter') return;
    const focusOrder = ['username', 'password', 'confirmPwd', 'email', 'verificationCode', 'register'];
    const idx = focusOrder.indexOf(field);
    if (idx === -1) return;
    for (let i = idx + 1; i < focusOrder.length; i++) {
      const next = focusOrder[i];
      if (next === 'confirmPwd' && !showConfirm) continue;
      if (next === 'verificationCode' && !showCode) continue;
      if (next === 'register') {
        if (isFormValid() && !loading) handleRegister();
        return;
      }
      const refMap: any = {
        username: usernameRef,
        password: passwordRef,
        confirmPwd: confirmPwdRef,
        email: emailRef,
        verificationCode: codeRef
      };
      refMap[next]?.current?.focus();
      break;
    }
  };

  return (
    <>
      <h2 className="form-title">注册</h2>

      {/* 用户名 */}
      <div className="input-group">
        <input
          ref={usernameRef}
          type="text"
          placeholder="用户名"
          value={form.username}
          onChange={e => handleInputChange('username', e.target.value)}
          onBlur={() => handleBlur('username')}
          onKeyDown={e => handleKeyDown(e, 'username')}
          className={shaking.username ? 'shake' : ''}
        />
        {errors.username && <span className="error-msg">{errors.username}</span>}
      </div>

      {/* 密码 */}
      <div className="input-group password-group">
        <input
          ref={passwordRef}
          type={showPassword ? 'text' : 'password'}
          placeholder="密码"
          value={form.password}
          onChange={e => handleInputChange('password', e.target.value)}
          onBlur={() => handleBlur('password')}
          onKeyDown={e => handleKeyDown(e, 'password')}
          className={shaking.password ? 'shake' : ''}
        />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="eye-btn">
          {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
        </button>
        {errors.password && <span className="error-msg">{errors.password}</span>}
      </div>

      {/* 确认密码（动态） */}
      {showConfirm && (
        <div className="input-group">
          <input
            ref={confirmPwdRef}
            type="password"
            placeholder="确认密码"
            value={confirmPwd}
            onChange={e => handleInputChange('confirmPwd', e.target.value)}
            onBlur={() => handleBlur('confirmPwd')}
            onKeyDown={e => handleKeyDown(e, 'confirmPwd')}
            className={shaking.confirmPwd ? 'shake' : ''}
          />
          {errors.confirmPwd && <span className="error-msg">{errors.confirmPwd}</span>}
        </div>
      )}

      {/* 邮箱 */}
      <div className="input-group">
        <input
          ref={emailRef}
          type="email"
          placeholder="邮箱"
          value={form.email}
          onChange={e => handleInputChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          onKeyDown={e => handleKeyDown(e, 'email')}
          className={shaking.email ? 'shake' : ''}
        />
        {errors.email && <span className="error-msg">{errors.email}</span>}
      </div>

      {/* 验证码（动态） */}
      {showCode && (
        <div className="input-group verification-group">
          <input
            ref={codeRef}
            type="text"
            placeholder="验证码"
            value={verificationCode}
            onChange={e => handleInputChange('verificationCode', e.target.value)}
            onBlur={() => handleBlur('verificationCode')}
            onKeyDown={e => handleKeyDown(e, 'verificationCode')}
            className={shaking.verificationCode ? 'shake' : ''}
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={countdown > 0 || sending}
            className="send-code-btn"
          >
            {countdown > 0 ? `${countdown}s` : '发送'}
          </button>
          {errors.verificationCode && <span className="error-msg">{errors.verificationCode}</span>}
        </div>
      )}

      <button
        className="submit-btn"
        onClick={handleRegister}
        disabled={!isFormValid() || loading}
      >
        {loading ? '注册中...' : '注册'}
      </button>

      <div className="extra-link">
        已有账号？ <button className="link-btn" onClick={() => navigate('/auth/login')}>去登录</button>
      </div>
    </>
  );
};

export default RegisterForm;