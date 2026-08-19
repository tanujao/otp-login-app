import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../services/api';
import '../styles/Register.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName.trim() || !lastName.trim()) {
      setError('Please complete all fields before continuing.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/auth/register', {
        email,
        first_name: firstName,
        last_name: lastName
      });
      if (response.data.success) {
        setSuccessCode(response.data.code);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong while creating your account.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (successCode) {
      setCopyError(false);
      try {
        await navigator.clipboard.writeText(successCode);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 3000);
      } catch {
        setCopyError(true);
      }
    }
  };

  if (successCode) {
    return (
      <div className="page-container register-page">
        <div className="progress-row" aria-label="Checkout progress">
          <span className="progress-step complete">&#10003; Account</span><span className="progress-line complete" />
          <span className="progress-step active">2 Verify</span><span className="progress-line" />
          <span className="progress-step">3 Checkout</span>
        </div>
        <div className="card text-center success-card">
          <div className="success-icon">&#10003;</div>
          <p className="eyebrow">ACCOUNT READY</p>
          <h2 className="title">Account created!</h2>
          <p className="subtitle">Your secure login code is</p>
          
          <div className="code-display">{successCode}</div>
          
          <Button onClick={handleCopy} variant="secondary" className="copy-button mb-4">
            {copied ? '&#10003; Copied' : 'Copy OTP'}
          </Button>
          {copyError && <p className="copy-error">Clipboard access was blocked. Please copy the code manually.</p>}
          
          <div className="info-box">
            <strong>Keep this code safe.</strong><br />
            You will need it during checkout.
          </div>
          
          <Link to="/checkout" className="btn btn-primary mt-4 inline-block">
            Continue to Checkout <span aria-hidden="true">&#8594;</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container register-page">
      <div className="register-layout">
        <aside className="register-aside">
          <div className="aside-mark">&#9889;</div>
          <p className="eyebrow aside-eyebrow">SECURE CHECKOUT</p>
          <h1>Fast. Simple. Secure.</h1>
          <p className="aside-copy">Create your account once and move through checkout with less friction.</p>
          <ul className="feature-list">
            <li><span>&#10003;</span> Secure OTP authentication</li>
            <li><span>&#10003;</span> Faster checkout next time</li>
            <li><span>&#10003;</span> Guest checkout supported</li>
          </ul>
        </aside>
        <div className="card register-card">
          <div className="progress-row" aria-label="Checkout progress">
            <span className="progress-step active">1 Account</span><span className="progress-line" />
            <span className="progress-step">2 Verify</span><span className="progress-line" />
            <span className="progress-step">3 Checkout</span>
          </div>
          <div className="mb-6">
            <p className="eyebrow">CREATE YOUR ACCOUNT</p>
            <h2 className="title">Register once, checkout faster.</h2>
            <p className="subtitle">We will generate a secure one-time login code for you.</p>
          </div>
        
        {error && <div className="alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
            <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            required
            disabled={loading}
          />
          <Input
            label="First Name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            required
            disabled={loading}
          />
          <Input
            label="Last Name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            required
            disabled={loading}
          />
          
          <Button type="submit" isLoading={loading} className="w-full mt-4">
            {loading ? 'Creating account...' : 'Create Account'} <span aria-hidden="true">&#8594;</span>
          </Button>
        </form>
        
        <div className="text-center mt-6 text-sm link-container">
          <span className="text-gray-600">Already registered? </span>
          <Link to="/checkout" className="link-primary">Go to Checkout</Link>
        </div>
        </div>
      </div>
    </div>
  );
}
