import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  KeyRound,
  ArrowRight,
  RotateCw,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowLeft,
  Lock,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { adminAuthService } from '../services/adminAuthService';

export default function Admin2faScreen({
  challengeData,
  onVerifySuccess,
  onBackToLogin,
}) {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(challengeData?.expiresInSeconds || 60);
  const [canResend, setCanResend] = useState(false);
  const [resendRemaining, setResendRemaining] = useState(challengeData?.resendRemaining ?? 3);
  const [currentChallengeToken, setCurrentChallengeToken] = useState(challengeData?.challengeToken || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  const inputRefs = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer for OTP expiration & resend availability
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // Handle single digit input
  const handleDigitChange = (index, value) => {
    const numericVal = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (!numericVal) {
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    // Single digit entry
    newDigits[index] = numericVal.slice(-1);
    setOtpDigits(newDigits);
    setErrorBanner('');

    // Auto-advance focus to next field
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle full 6-digit paste (e.g. from SMS/Authenticator/Clipboard)
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pastedData.length >= 6) {
      const pasteArray = pastedData.slice(0, 6).split('');
      setOtpDigits(pasteArray);
      setErrorBanner('');
      inputRefs.current[5]?.focus();
    }
  };

  // 1-Click Demo OTP Auto-fill
  const handleAutoFillDemo = () => {
    const demoCode = (challengeData?.demoOtpHint || '849201').split('');
    setOtpDigits(demoCode);
    setErrorBanner('');
    setSuccessBanner('Demo 2FA code (849201) filled. Click Verify to proceed.');
    inputRefs.current[5]?.focus();
  };

  // Trigger POST /admin/auth/2fa/resend
  const handleResendOtp = async () => {
    if (!canResend || resendRemaining <= 0 || isResending) return;

    setIsResending(true);
    setErrorBanner('');
    setSuccessBanner('');

    try {
      const response = await adminAuthService.resend2FA({
        challengeToken: currentChallengeToken,
      });

      if (response.success) {
        setTimer(response.expiresInSeconds || 60);
        setCanResend(false);
        setResendRemaining(response.resendRemaining);
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessBanner(response.message || 'A fresh 6-digit 2FA code has been dispatched.');
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setErrorBanner(err.message || 'Failed to resend 2FA code.');
    } finally {
      setIsResending(false);
    }
  };

  // Trigger POST /admin/auth/2fa/verify
  const handleVerifySubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorBanner('');
    setSuccessBanner('');

    const fullCode = otpDigits.join('');

    // Strict 6-digit validation
    if (fullCode.length !== 6 || !/^\d{6}$/.test(fullCode)) {
      setErrorBanner('Please enter the complete 6-digit 2FA verification code.');
      return;
    }

    if (timer === 0 && !canResend) {
      setErrorBanner('This 2FA code has expired. Please request a new code.');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await adminAuthService.verify2FA({
        challengeToken: currentChallengeToken,
        otp: fullCode,
      });

      if (response.success && response.session) {
        setIsVerifying(false);
        // Successful login! Redirect to Admin Dashboard
        onVerifySuccess(response.session);
      }
    } catch (err) {
      setIsVerifying(false);
      setErrorBanner(err.message || 'Invalid 2FA code.');
    }
  };

  const isComplete = otpDigits.every((d) => d !== '');

  return (
    <div className="screen-body fade-in admin-auth-screen" style={{ paddingBottom: '2.5rem' }}>
      {/* Top Header / Back navigation */}
      <div className="admin-auth-top-bar">
        <button
          type="button"
          className="admin-back-btn"
          onClick={onBackToLogin}
          title="Back to login"
          disabled={isVerifying}
        >
          <ArrowLeft size={16} />
          <span>Change Account</span>
        </button>
        <div className="admin-status-pill">
          <Lock size={12} style={{ marginRight: '4px' }} />
          <span>STEP 2 OF 2</span>
        </div>
      </div>

      {/* 2FA Header Hero */}
      <div className="admin-hero-section">
        <div className="admin-shield-icon-wrapper" style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)' }}>
          <ShieldCheck size={30} className="admin-shield-icon" style={{ color: '#818CF8' }} />
        </div>
        <h1 className="admin-title">Two-Factor Authentication</h1>
        <p className="admin-subtitle">
          Enter the 6-digit multi-factor verification code dispatched to your registered administrator address.
        </p>
      </div>

      {/* Destination Badge */}
      <div className="admin-destination-card">
        <div className="destination-left">
          <KeyRound size={18} color="#2563EB" />
          <div className="destination-info">
            <span className="destination-label">Verified Admin ID</span>
            <span className="destination-val">{challengeData?.maskedEmail || 'ad***@arena.com'}</span>
          </div>
        </div>
        <div className="destination-phone-tag">
          Ending in ••••{challengeData?.phoneEnding || '8901'}
        </div>
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div className="admin-error-banner fade-in" role="alert" style={{ marginTop: '1rem' }}>
          <div className="error-banner-icon">
            <AlertTriangle size={18} />
          </div>
          <div className="error-banner-text">
            <strong>2FA Error:</strong> {errorBanner}
          </div>
          <button
            type="button"
            className="error-banner-close"
            onClick={() => setErrorBanner('')}
            aria-label="Dismiss error"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="admin-success-banner fade-in" role="status" style={{ marginTop: '1rem' }}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* 6-Digit OTP Form */}
      <form onSubmit={handleVerifySubmit} className="admin-2fa-form" style={{ marginTop: '1.25rem' }}>
        <div className="otp-digit-boxes-container">
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              className={`otp-box-input ${digit ? 'filled' : ''} ${errorBanner ? 'error' : ''}`}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isVerifying}
              autoComplete="one-time-code"
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        {/* Live Timer & Resend Controls */}
        <div className="admin-otp-timer-row">
          <div className="timer-indicator-col">
            <Clock size={15} color={timer > 10 ? '#2563EB' : timer > 0 ? '#F59E0B' : '#EF4444'} />
            {timer > 0 ? (
              <span className="timer-text">
                Code expires in <strong>0:{timer < 10 ? `0${timer}` : timer}</strong>
              </span>
            ) : (
              <span className="timer-expired-text">Code expired</span>
            )}
          </div>

          <div className="resend-action-col">
            {canResend && resendRemaining > 0 ? (
              <button
                type="button"
                className="admin-resend-btn"
                onClick={handleResendOtp}
                disabled={isResending}
              >
                <RotateCw size={14} className={isResending ? 'spin-icon' : ''} />
                <span>{isResending ? 'Sending...' : 'Resend 2FA Code'}</span>
              </button>
            ) : resendRemaining === 0 ? (
              <span className="resend-limit-reached">Resend limit reached</span>
            ) : (
              <span className="resend-disabled-note">
                Resend in <strong>{timer}s</strong>
              </span>
            )}
          </div>
        </div>

        {/* Rate Limit Remaining Indicator */}
        <div className="rate-limit-badge-row">
          <span>Resends remaining for this session:</span>
          <span className="rate-limit-count">{resendRemaining} / 3</span>
        </div>

        {/* 1-Click Demo OTP helper */}
        <div className="auto-fill-demo-section" style={{ marginTop: '0.85rem' }}>
          <button
            type="button"
            className="admin-demo-fill-btn"
            onClick={handleAutoFillDemo}
            title="Auto-fills verified test 2FA OTP"
          >
            <Sparkles size={14} color="#D97706" />
            <span>Auto-fill Demo 2FA Code ({challengeData?.demoOtpHint || '849201'})</span>
          </button>
        </div>

        {/* Verify Action Button */}
        <button
          type="submit"
          className="btn-primary admin-submit-btn"
          disabled={!isComplete || isVerifying}
          style={{ marginTop: '1.5rem' }}
        >
          {isVerifying ? (
            <div className="admin-loading-row">
              <span className="admin-spinner" />
              <span>Validating OTP & Establishing Secure Session...</span>
            </div>
          ) : (
            <>
              <span>Verify & Authorize Admin Session</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Security Note */}
      <div className="admin-footer-security" style={{ marginTop: '1.75rem' }}>
        <div className="security-badge-row">
          <ShieldCheck size={14} color="#10B981" />
          <span>Zero-Knowledge Proof Session Guard • 8h Token Expiry</span>
        </div>
      </div>
    </div>
  );
}
