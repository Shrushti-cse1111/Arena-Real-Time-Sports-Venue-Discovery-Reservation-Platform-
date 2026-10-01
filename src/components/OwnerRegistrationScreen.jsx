import React, { useState, useEffect } from 'react';
import { AlertCircle, Building2, Phone, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ownerAuthService } from '../services/ownerAuthService';

export default function OwnerRegistrationScreen({
  formData = {},
  setFormData = () => {},
  onSubmit = () => {},
  onNavigateVerification = () => {},
  onNavigateDashboard = () => {},
  initialMode = 'signup',
}) {
  const [mode, setMode] = useState(initialMode); // 'signup' | 'login'

  // Form Fields
  const [businessName, setBusinessName] = useState(formData.venueName || formData.ownerFullName || '');
  const [mobileNumber, setMobileNumber] = useState(formData.ownerPhoneNumber || '');
  const [countryCode, setCountryCode] = useState(formData.ownerCountryCode || '+91');
  const [otp, setOtp] = useState('');

  // Flow & State
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(30); // 30s countdown timer
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [apiError, setApiError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [touched, setTouched] = useState({ businessName: false, mobileNumber: false, otp: false });

  // 30-second countdown timer
  useEffect(() => {
    let timerId = null;
    if (otpSent && countdown > 0) {
      timerId = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [otpSent, countdown]);

  // Request OTP Call (POST /auth/owner/request-otp)
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setTouched((prev) => ({ ...prev, businessName: true, mobileNumber: true }));

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (mode === 'signup' && !businessName.trim()) {
      setValidationError('Please enter your business or venue name.');
      return;
    }
    if (!cleanMobile || cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      setValidationError('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).');
      return;
    }

    setValidationError('');
    setApiError('');
    setIsRequestingOtp(true);

    try {
      await ownerAuthService.requestOtp({ mobileNumber: cleanMobile, businessName });
      setOtpSent(true);
      setCountdown(30);
    } catch (err) {
      setApiError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleResendCode = () => {
    handleRequestOtp();
  };

  // Field Validation Checks
  const cleanMobile = mobileNumber.replace(/\D/g, '');
  const isBusinessNameValid = mode === 'login' || businessName.trim().length > 0;
  const isMobileValid = cleanMobile.length === 10 && /^[6-9]\d{9}$/.test(cleanMobile);
  const isOtpValid = otp.trim().length === 6;
  const isAllValid = isBusinessNameValid && isMobileValid && isOtpValid;

  // Mode Switcher Handler
  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    setOtpSent(false);
    setOtp('');
    setApiError('');
    setValidationError('');
    setTouched({ businessName: false, mobileNumber: false, otp: false });
  };

  // Verify OTP & Authenticate Handler (POST /auth/owner/verify-otp)
  const handleVerifyAndSubmit = async (e) => {
    e.preventDefault();
    setTouched({ businessName: true, mobileNumber: true, otp: true });

    if (isSubmitting) return;

    if (!otpSent) {
      handleRequestOtp();
      return;
    }

    // Never silently do nothing on tap!
    if (!isAllValid) {
      let missing = [];
      if (mode === 'signup' && !isBusinessNameValid) missing.push('Business Name');
      if (!isMobileValid) missing.push('Valid 10-digit Mobile');
      if (!isOtpValid) missing.push('6-digit OTP code');

      setValidationError(`Please complete required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`);
      return;
    }

    setValidationError('');
    setApiError('');
    setIsSubmitting(true);

    try {
      const res = await ownerAuthService.verifyOtp({
        mobileNumber: cleanMobile,
        otp,
        businessName,
      });

      // Update form data state
      const updatedData = {
        ...formData,
        venueName: businessName || formData.venueName || 'Sports Arena Venue',
        ownerFullName: businessName || formData.ownerFullName || 'Venue Partner',
        ownerPhoneNumber: cleanMobile,
        ownerCountryCode: countryCode,
        verificationStatus: res.verificationStatus,
      };

      if (typeof setFormData === 'function') {
        setFormData(updatedData);
      }

      if (typeof onSubmit === 'function') {
        onSubmit(res.session);
      }

      // Check Verification Status and Navigate:
      // unverified / pending / rejected -> Business Verification Screen
      // verified -> Owner Dashboard Screen
      if (res.verificationStatus === 'verified') {
        onNavigateDashboard(res.session);
      } else {
        onNavigateVerification(res.session);
      }
    } catch (err) {
      setApiError(err.message || 'Verification failed. Invalid OTP code or request error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="screen-body fade-in">
      <div className="auth-stacked-container">

        {/* CARD 1: CREATE YOUR OWNER ACCOUNT */}
        <div className={`auth-stacked-card ${mode === 'signup' ? 'active-card' : ''}`}>
          <h2 className="auth-card-title">Create your owner account</h2>
          <p className="auth-card-subtitle">
            {mode === 'signup'
              ? 'List your sports facility, manage courts & receive automated bookings.'
              : 'Register a new venue partner account with Arena.'}
          </p>

          {mode === 'signup' && (
            <form onSubmit={handleVerifyAndSubmit} noValidate>

              {/* Inline Banner above form if request fails (--danger-bg / --danger) */}
              {apiError && (
                <div className="auth-danger-banner">
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Validation notification banner when button tapped while invalid */}
              {validationError && !apiError && (
                <div className="auth-danger-banner">
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Field 1: Business name */}
              <div className="auth-field-group">
                <label htmlFor="businessName" className="auth-field-label">
                  Business name *
                </label>
                <input
                  id="businessName"
                  type="text"
                  disabled={otpSent}
                  className={`auth-field-input ${touched.businessName && !isBusinessNameValid ? 'has-error' : ''}`}
                  placeholder="e.g. Apex Sports Arena"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, businessName: true }))}
                />
              </div>

              {/* Field 2: Mobile number */}
              <div className="auth-field-group">
                <label htmlFor="mobileNumber" className="auth-field-label">
                  Mobile number *
                </label>
                <div className="auth-phone-input-row">
                  <select
                    className="auth-country-select"
                    disabled={otpSent}
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+971">🇦🇪 +971</option>
                  </select>
                  <input
                    id="mobileNumber"
                    type="tel"
                    maxLength={10}
                    disabled={otpSent}
                    className={`auth-field-input ${touched.mobileNumber && !isMobileValid ? 'has-error' : ''}`}
                    placeholder="98765 43210"
                    value={mobileNumber}
                    onChange={(e) => {
                      setMobileNumber(e.target.value.replace(/\D/g, ''));
                      if (validationError) setValidationError('');
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, mobileNumber: true }))}
                  />
                </div>
              </div>

              {/* Step 1 Button: Request OTP */}
              {!otpSent && (
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={isRequestingOtp}
                  className={`auth-primary-btn ${isRequestingOtp ? 'is-loading' : ''}`}
                >
                  {isRequestingOtp ? (
                    <span className="auth-spinner" />
                  ) : (
                    <>
                      <span>Send OTP Code</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              )}

              {/* Field 3: OTP (Rendered when OTP is requested) */}
              {otpSent && (
                <div className="auth-field-group" style={{ marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label htmlFor="otp" className="auth-field-label">
                      6-Digit OTP *
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      style={{ fontSize: '11px', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Edit Mobile
                    </button>
                  </div>
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    autoFocus
                    className={`auth-field-input ${touched.otp && !isOtpValid ? 'has-error' : ''}`}
                    placeholder="Enter 6-digit OTP (e.g. 123456)"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      if (validationError) setValidationError('');
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, otp: true }))}
                  />

                  {/* Below OTP: 11px resend countdown or resend link */}
                  {countdown > 0 ? (
                    <span className="auth-resend-countdown">
                      Resend code in 00:{countdown < 10 ? '0' + countdown : countdown}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="auth-resend-link"
                      onClick={handleResendCode}
                    >
                      Resend code
                    </button>
                  )}

                  {/* Continue Submit Button */}
                  <button
                    type="submit"
                    onClick={handleVerifyAndSubmit}
                    disabled={!isAllValid || isSubmitting}
                    className={`auth-primary-btn ${!isAllValid || isSubmitting ? 'is-disabled' : ''} ${isSubmitting ? 'is-loading' : ''}`}
                    style={{ marginTop: '1rem' }}
                  >
                    {isSubmitting ? (
                      <span className="auth-spinner" />
                    ) : (
                      <>
                        <span>Continue to Owner Account</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          )}

          {mode === 'login' && (
            <button
              type="button"
              className="auth-secondary-btn"
              onClick={() => handleSwitchMode('signup')}
            >
              Switch to Account Creation
            </button>
          )}
        </div>

        {/* CARD 2: ALREADY LISTING WITH ARENA? */}
        <div className={`auth-stacked-card ${mode === 'login' ? 'active-card' : ''}`}>
          <h2 className="auth-card-title">Already listing with Arena?</h2>
          <p className="auth-card-subtitle">
            {mode === 'login'
              ? 'Sign in to access your venue dashboard, bookings & payouts.'
              : 'Already have an existing venue account? Sign in here.'}
          </p>

          {mode === 'login' && (
            <form onSubmit={handleVerifyAndSubmit} noValidate>

              {/* Inline Banner above form if request fails */}
              {apiError && (
                <div className="auth-danger-banner">
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Validation notification banner */}
              {validationError && !apiError && (
                <div className="auth-danger-banner">
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Field 1: Mobile number */}
              <div className="auth-field-group">
                <label htmlFor="loginMobileNumber" className="auth-field-label">
                  Registered Mobile number *
                </label>
                <div className="auth-phone-input-row">
                  <select
                    className="auth-country-select"
                    disabled={otpSent}
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+971">🇦🇪 +971</option>
                  </select>
                  <input
                    id="loginMobileNumber"
                    type="tel"
                    maxLength={10}
                    disabled={otpSent}
                    className={`auth-field-input ${touched.mobileNumber && !isMobileValid ? 'has-error' : ''}`}
                    placeholder="98765 43210"
                    value={mobileNumber}
                    onChange={(e) => {
                      setMobileNumber(e.target.value.replace(/\D/g, ''));
                      if (validationError) setValidationError('');
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, mobileNumber: true }))}
                  />
                </div>
              </div>

              {!otpSent && (
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={isRequestingOtp}
                  className={`auth-primary-btn ${isRequestingOtp ? 'is-loading' : ''}`}
                >
                  {isRequestingOtp ? (
                    <span className="auth-spinner" />
                  ) : (
                    <>
                      <span>Send OTP Code</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              )}

              {otpSent && (
                <div className="auth-field-group" style={{ marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label htmlFor="loginOtp" className="auth-field-label">
                      6-Digit OTP *
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      style={{ fontSize: '11px', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Edit Mobile
                    </button>
                  </div>
                  <input
                    id="loginOtp"
                    type="text"
                    maxLength={6}
                    autoFocus
                    className={`auth-field-input ${touched.otp && !isOtpValid ? 'has-error' : ''}`}
                    placeholder="Enter 6-digit OTP (e.g. 123456)"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      if (validationError) setValidationError('');
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, otp: true }))}
                  />

                  {countdown > 0 ? (
                    <span className="auth-resend-countdown">
                      Resend code in 00:{countdown < 10 ? '0' + countdown : countdown}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="auth-resend-link"
                      onClick={handleResendCode}
                    >
                      Resend code
                    </button>
                  )}

                  <button
                    type="submit"
                    onClick={handleVerifyAndSubmit}
                    disabled={!isAllValid || isSubmitting}
                    className={`auth-primary-btn ${!isAllValid || isSubmitting ? 'is-disabled' : ''} ${isSubmitting ? 'is-loading' : ''}`}
                    style={{ marginTop: '1rem' }}
                  >
                    {isSubmitting ? (
                      <span className="auth-spinner" />
                    ) : (
                      <>
                        <span>Sign In to Owner Account</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          )}

          {mode === 'signup' && (
            <button
              type="button"
              className="auth-secondary-btn"
              onClick={() => handleSwitchMode('login')}
            >
              Sign in to your account
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
