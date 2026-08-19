import { useState, useRef, useEffect } from 'react';
import Button from './Button';
import api from '../services/api';
import '../styles/OTPModal.css';

interface OTPModalProps {
  email: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  onSkip: () => void;
}

export default function OTPModal({ email, isOpen, onClose, onSuccess, onSkip }: OTPModalProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCode(['', '', '', '', '', '']);
      setError(null);
      setSecondsLeft(300);
      const focusTimer = window.setTimeout(() => inputRefs.current[0]?.focus(), 100);
      document.body.style.overflow = 'hidden';
      return () => {
        window.clearTimeout(focusTimer);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, secondsLeft]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => setResendCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading && !resending) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, loading, onClose, resending]);

  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      const nextCode = [...code];
      nextCode[index] = '';
      setCode(nextCode);
      return;
    }
    if (digits.length > 1) {
      applyPastedCode(index, digits);
      return;
    }
    const newCode = [...code];
    newCode[index] = digits;
    setCode(newCode);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const applyPastedCode = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    const nextCode = ['', '', '', '', '', ''];
    digits.split('').forEach((digit, offset) => {
      if (index + offset < 6) nextCode[index + offset] = digit;
    });
    setCode(nextCode);
    inputRefs.current[Math.min(index + digits.length, 5)]?.focus();
    setError(null);
  };

  const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    applyPastedCode(index, event.clipboardData.getData('text'));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/auth/verify-otp', { email, code: fullCode });
      if (response.data.success) {
        onSuccess(response.data.user);
      } else {
        setError(response.data.message || 'Invalid login code. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid login code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const response = await api.post('/api/auth/resend-otp', { email });
      if (response.data.success) {
        setCode(['', '', '', '', '', '']);
        setSecondsLeft(300);
        setResendCooldown(30);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to resend the code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="otp-modal-title">
        <button className="modal-close" onClick={onClose} aria-label="Close verification dialog">&times;</button>
        <div className="modal-lock">&#128274;</div>
        <p className="eyebrow">SECURE CHECKOUT</p>
        <h2 id="otp-modal-title" className="modal-title">Welcome back</h2>
        <p className="modal-subtitle">We found an account for <strong>{email}</strong>. Enter your 6-digit login code.</p>
        
        <div className="otp-container">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={`otp-input ${error ? 'error' : ''}`}
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onPaste={e => handlePaste(index, e)}
              onKeyDown={e => handleKeyDown(index, e)}
              disabled={loading}
              autoComplete="off"
            />
          ))}
        </div>
        
        {error && <div className="modal-error">{error}</div>}

        <p className={`expiry-text ${secondsLeft === 0 ? 'expired' : ''}`}>
          {secondsLeft === 0 ? 'This login code has expired.' : `Code expires in ${minutes}:${seconds}`}
        </p>
        
        <div className="modal-actions">
          <Button onClick={verifyCode} isLoading={loading} className="verify-btn" disabled={secondsLeft === 0 || resending}>
            Verify &amp; Continue
          </Button>
          <button className="resend-btn" onClick={resendCode} disabled={loading || resending || resendCooldown > 0}>
            {resending ? 'Sending code...' : resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend code'}
          </button>
          <button className="skip-btn" onClick={onSkip} disabled={loading || resending}>
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
