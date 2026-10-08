import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeClosed } from 'lucide-react';
import { sendResetCodeApi, verifyResetCodeApi, resetPasswordApi } from '../../services/authApi';

const ForgetPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'reset'>('email');

  // 邮箱步骤数据
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [shakingEmail, setShakingEmail] = useState(false);
  const [shakingCode, setShakingCode] = useState(false);

  // 重置步骤数据
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [shakingPassword, setShakingPassword] = useState(false);
  const [shakingConfirm, setShakingConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 验证码倒计时
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const timerRef = useRef<number | null>(null); // 修正类型

  // 加载状态
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendCode = async () => {
    if (!email) {
      setEmailError('邮箱不能为空');
      setShakingEmail(true);
      setTimeout(() => setShakingEmail(false), 400);
      return;
    }
    if (!isEmailValid(email)) {
      setEmailError('邮箱格式不正确');
      setShakingEmail(true);
      setTimeout(() => setShakingEmail(false), 400);
      return;
    }
    if (countdown > 0 || sending) return;
    setSending(true);
    try {
      const data = await sendResetCodeApi(email);
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
        setEmailError(data.message || '发送失败');
        setShakingEmail(true);
        setTimeout(() => setShakingEmail(false), 400);
      }
    } catch {
      setEmailError('网络错误，请稍后重试');
      setShakingEmail(true);
      setTimeout(() => setShakingEmail(false), 400);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    let hasError = false;
    if (!email) {
      setEmailError('邮箱不能为空');
      setShakingEmail(true);
      setTimeout(() => setShakingEmail(false), 400);
      hasError = true;
    } else if (!isEmailValid(email)) {
      setEmailError('邮箱格式不正确');
      setShakingEmail(true);
      setTimeout(() => setShakingEmail(false), 400);
      hasError = true;
    }
    if (!code) {
      setCodeError('验证码不能为空');
      setShakingCode(true);
      setTimeout(() => setShakingCode(false), 400);
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      const data = await verifyResetCodeApi(email, code);
      if (data.success) {
        setStep('reset');
      } else {
        setCodeError(data.message || '验证码错误');
        setShakingCode(true);
        setTimeout(() => setShakingCode(false), 400);
      }
    } catch {
      setCodeError('验证失败，请稍后重试');
      setShakingCode(true);
      setTimeout(() => setShakingCode(false), 400);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    let hasError = false;
    if (!newPassword) {
      setPasswordError('密码不能为空');
      setShakingPassword(true);
      setTimeout(() => setShakingPassword(false), 400);
      hasError = true;
    } else if (newPassword.length < 6) {
      setPasswordError('密码至少6个字符');
      setShakingPassword(true);
      setTimeout(() => setShakingPassword(false), 400);
      hasError = true;
    }
    if (!confirmPassword) {
      setConfirmError('请再次输入密码');
      setShakingConfirm(true);
      setTimeout(() => setShakingConfirm(false), 400);
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmError('两次输入的密码不一致');
      setShakingConfirm(true);
      setTimeout(() => setShakingConfirm(false), 400);
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      const data = await resetPasswordApi(email, newPassword);
      if (data.success) {
        navigate('/auth/login');
      } else {
        setPasswordError(data.message || '重置失败');
        setShakingPassword(true);
        setTimeout(() => setShakingPassword(false), 400);
      }
    } catch {
      setPasswordError('网络错误，请稍后重试');
      setShakingPassword(true);
      setTimeout(() => setShakingPassword(false), 400);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key !== 'Enter') return;
    if (step === 'email') {
      if (field === 'email') codeRef.current?.focus();
      else if (field === 'code') handleVerifyCode();
    } else {
      if (field === 'password') confirmRef.current?.focus();
      else if (field === 'confirm') handleResetPassword();
    }
  };

  return (
    <>
      <h2 className="form-title">{step === 'email' ? '找回密码' : '重置密码'}</h2>

      {step === 'email' ? (
        <>
          <div className="input-group">
            <input
              ref={emailRef}
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              onBlur={() => {
                if (!email) setEmailError('邮箱不能为空');
                else if (!isEmailValid(email)) setEmailError('邮箱格式不正确');
                else setEmailError('');
              }}
              onKeyDown={e => handleKeyDown(e, 'email')}
              className={shakingEmail ? 'shake' : ''}
            />
            {emailError && <span className="error-msg">{emailError}</span>}
          </div>

          <div className="input-group verification-group">
            <input
              ref={codeRef}
              type="text"
              placeholder="验证码"
              value={code}
              onChange={e => {
                setCode(e.target.value);
                setCodeError('');
              }}
              onKeyDown={e => handleKeyDown(e, 'code')}
              className={shakingCode ? 'shake' : ''}
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={countdown > 0 || sending}
              className="send-code-btn"
            >
              {countdown > 0 ? `${countdown}s` : '发送'}
            </button>
            {codeError && <span className="error-msg">{codeError}</span>}
          </div>

          <button className="submit-btn" onClick={handleVerifyCode} disabled={loading}>
            {loading ? '验证中...' : '下一步'}
          </button>
        </>
      ) : (
        <>
          <div className="input-group password-group">
            <input
              ref={passwordRef}
              type={showPassword ? 'text' : 'password'}
              placeholder="新密码"
              value={newPassword}
              onChange={e => {
                setNewPassword(e.target.value);
                setPasswordError('');
              }}
              onBlur={() => {
                if (!newPassword) setPasswordError('密码不能为空');
                else if (newPassword.length < 6) setPasswordError('密码至少6个字符');
                else setPasswordError('');
              }}
              onKeyDown={e => handleKeyDown(e, 'password')}
              className={shakingPassword ? 'shake' : ''}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="eye-btn">
              {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
            </button>
            {passwordError && <span className="error-msg">{passwordError}</span>}
          </div>

          <div className="input-group">
            <input
              ref={confirmRef}
              type="password"
              placeholder="确认新密码"
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                setConfirmError('');
              }}
              onBlur={() => {
                if (!confirmPassword) setConfirmError('请再次输入密码');
                else if (newPassword !== confirmPassword) setConfirmError('两次密码不一致');
                else setConfirmError('');
              }}
              onKeyDown={e => handleKeyDown(e, 'confirm')}
              className={shakingConfirm ? 'shake' : ''}
            />
            {confirmError && <span className="error-msg">{confirmError}</span>}
          </div>

          <button className="submit-btn" onClick={handleResetPassword} disabled={loading}>
            {loading ? '重置中...' : '确认重置'}
          </button>
        </>
      )}

      <div className="extra-link">
        想起来了？ <button className="link-btn" onClick={() => navigate('/auth/login')}>返回登录</button>
      </div>
    </>
  );
};

export default ForgetPasswordForm;