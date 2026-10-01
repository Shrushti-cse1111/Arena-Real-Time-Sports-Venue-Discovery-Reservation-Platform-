import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Edit2, ArrowRight } from 'lucide-react';

export default function OtpVerificationScreen({ phoneNumber, countryCode, onVerifySuccess, onEditPhone }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setTimer(30);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
  };

  const handleAutoFillDemo = () => {
    setOtp(['4', '8', '2', '9', '1', '6']);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }
    onVerifySuccess();
  };

  const displayPhone = `${countryCode || '+91'} ${phoneNumber || '9876543210'}`;

  return (
    <div className="screen-body fade-in">
      <h1 className="screen-title">Verify Phone</h1>
      <p className="screen-subtitle">We sent a 6-digit verification code to</p>

      <div className="phone-display-badge" style={{ marginBottom: '1.5rem', alignSelf: 'flex-start' }}>
        <ShieldCheck size={16} color="#2563EB" />
        <span>{displayPhone}</span>
        <button
          type="button"
          onClick={onEditPhone}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#64748B' }}
          title="Edit number"
        >
          <Edit2 size={14} />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="otp-container">
          <div className="otp-inputs-grid">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                className="otp-digit-input"
                value={digit}
                maxLength={1}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
              />
            ))}
          </div>

          {error && <span className="error-text">{error}</span>}

          <div className="otp-resend-row">
            <span>Didn't receive code?</span>
            {canResend ? (
              <button type="button" className="link-btn" onClick={handleResend}>
                Resend OTP
              </button>
            ) : (
              <span style={{ fontWeight: 600, color: '#2563EB' }}>Resend in 0:{timer < 10 ? `0${timer}` : timer}s</span>
            )}
          </div>

          <button
            type="button"
            className="chip-btn"
            onClick={handleAutoFillDemo}
            style={{ marginTop: '0.25rem', background: '#F1F5F9', border: '1px solid #E2E8F0' }}
          >
            ⚡ Auto-fill Demo OTP (482916)
          </button>
        </div>

        <div className="bottom-action-container">
          <button type="submit" className="btn-primary" disabled={otp.join('').length < 6}>
            <span>Verify & Continue</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
