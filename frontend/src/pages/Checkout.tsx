import { useState, useEffect, useRef } from 'react';
import Input from '../components/Input';
import Button from '../components/Button';
import OTPModal from '../components/OTPModal';
import api from '../services/api';
import { type User } from '../types';
import '../styles/Checkout.css';

export default function Checkout() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  
  const [recognizing, setRecognizing] = useState(false);
  const [recognitionState, setRecognitionState] = useState<'idle' | 'recognized' | 'guest' | 'error'>('idle');
  const [showModal, setShowModal] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', phone: '', address: '' });
  const handledEmail = useRef<string | null>(null);

  // Validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const emailValid = isValidEmail(email);

  useEffect(() => {
    if (!emailValid) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (handledEmail.current === normalizedEmail || user?.email === normalizedEmail) return;

    const controller = new AbortController();
    const timerId = window.setTimeout(async () => {
      setRecognizing(true);
      setRecognitionState('idle');
      try {
        const response = await api.post('/api/auth/recognize', { email: normalizedEmail }, { signal: controller.signal });
        if (controller.signal.aborted) return;
        handledEmail.current = normalizedEmail;
        if (response.data.recognized) {
          setRecognitionState('recognized');
          setShowModal(true);
        } else {
          setRecognitionState('guest');
          setShowModal(false);
          setUser(null);
        }
      } catch (err: any) {
        if (err.code !== 'ERR_CANCELED' && !controller.signal.aborted) {
          setRecognitionState('error');
        }
      } finally {
        if (!controller.signal.aborted) setRecognizing(false);
      }
    }, 650);

    return () => {
      window.clearTimeout(timerId);
      controller.abort();
    };
  }, [email, emailValid, user]);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const normalizedEmail = value.trim().toLowerCase();
    if (user && user.email !== normalizedEmail) setUser(null);
    if (handledEmail.current !== normalizedEmail) {
      handledEmail.current = null;
      setRecognitionState('idle');
      setShowModal(false);
    }
    setFieldErrors(current => ({ ...current, email: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = {
      email: !email ? 'Email is required.' : !emailValid ? 'Please enter a valid email address.' : '',
      phone: !phone || !/^[6-9]\d{9}$/.test(phone.trim()) ? 'Please enter a valid 10-digit phone number.' : '',
      address: !shippingAddress.trim() ? 'Shipping address is required.' : '',
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setError('Please check the highlighted fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/api/checkout', {
        user_id: user?.id || null,
        email,
        phone,
        shipping_address: shippingAddress
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong while submitting checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = (loggedInUser: User) => {
    setUser(loggedInUser);
    handledEmail.current = loggedInUser.email;
    setShowModal(false);
  };

  const handleOTPSkip = () => {
    setShowModal(false);
    setUser(null);
  };

  if (success) {
    return (
      <div className="page-container checkout-page">
        <div className="card text-center success-card">
          <div className="success-icon">&#10003;</div>
          <p className="eyebrow">ORDER RECEIVED</p>
          <h2 className="title">Checkout submitted</h2>
          <p className="subtitle">Your details have been securely saved.</p>
          <Button onClick={() => window.location.reload()} variant="primary">
            Start another checkout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container checkout-page">
      <div className="checkout-heading">
        <div>
          <p className="eyebrow">STEP 3 OF 3</p>
          <h1 className="title">Complete your checkout</h1>
          <p className="subtitle">Secure your order with a few final details.</p>
        </div>
        <div className="checkout-badge">&#128274; Secure</div>
      </div>

      <div className="checkout-layout">
        <section className="card checkout-card">
          {user ? (
            <div className="user-greeting"><span className="status-dot" /> Welcome back, {user.first_name} {user.last_name}!</div>
          ) : recognitionState === 'guest' ? (
            <div className="guest-greeting"><span className="status-dot" /> You&apos;re continuing as a guest.</div>
          ) : null}
        
        {error && <div className="alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="example@gmail.com"
              required
              disabled={loading}
              error={fieldErrors.email}
              helperText={
                recognizing ? (
                  <span className="recognizing-text">
                    <span className="loader-spinner-small"></span> Checking account...
                  </span>
                ) : (
                  recognitionState === 'recognized' ? <span className="valid-text">&#10003; Account recognized</span> :
                  recognitionState === 'guest' ? <span className="guest-text">&#10003; Continue as guest</span> :
                  emailValid && <span className="valid-text">&#10003; Valid email</span>
                )
              }
            />
          </div>
          
          <div className="input-group">
            <Input
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              required
              disabled={loading}
              error={fieldErrors.phone}
            />
          </div>
          
          <div className="input-group">
            <Input
              label="Shipping Address"
              type="text"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="123 Main Street, Bangalore"
              required
              disabled={loading}
              error={fieldErrors.address}
            />
          </div>
          
          <Button type="submit" isLoading={loading} className="w-full mt-6">
            {loading ? 'Submitting...' : 'Complete Checkout'} <span aria-hidden="true">&#8594;</span>
          </Button>
        </form>
        </section>

        <aside className="security-panel">
          <div className="security-icon">&#128274;</div>
          <h2>Secure checkout</h2>
          <p>Your information is protected throughout the checkout process.</p>
          <ul>
            <li><span>&#10003;</span> Secure authentication</li>
            <li><span>&#10003;</span> Your information protected</li>
            <li><span>&#10003;</span> Fast checkout</li>
          </ul>
          <div className="guest-note">No account? No problem. Guest checkout is always available.</div>
        </aside>
      </div>

      <OTPModal
        email={email}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleOTPVerify}
        onSkip={handleOTPSkip}
      />
    </div>
  );
}
