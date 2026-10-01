import React, { useState } from 'react';
import {
  User,
  Building2,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export default function LoginScreen({
  initialRole = 'player',
  onLoginSuccess,
  onRequireOtp,
  onNavigateRegister,
  onNavigateAdmin,
}) {
  const [activeRole, setActiveRole] = useState(initialRole); // 'player' | 'owner'
  const [authMethod, setAuthMethod] = useState('otp'); // 'otp' | 'password'

  // Form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [identifier, setIdentifier] = useState(''); // email or venue ID
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotAlert, setForgotAlert] = useState(false);

  // Switch roles smoothly
  const handleRoleChange = (role) => {
    setActiveRole(role);
    setError('');
  };

  // Switch auth method
  const handleMethodChange = (method) => {
    setAuthMethod(method);
    setError('');
  };

  // Demo auto-fill helpers
  const handleDemoFill = (role) => {
    setActiveRole(role);
    setError('');
    if (role === 'player') {
      setPhoneNumber('9876543210');
      setIdentifier('rahul.sharma@example.com');
      setPassword('PlayerPass@123');
    } else {
      setPhoneNumber('9812345678');
      setIdentifier('partner@smashpoint.in');
      setPassword('VenuePartner@2026');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (authMethod === 'otp') {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        setError('Please enter a valid 10-digit mobile number');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onRequireOtp({
          role: activeRole,
          phoneNumber: cleanPhone,
          countryCode,
        });
      }, 600);
    } else {
      // Password mode validation
      if (!identifier.trim()) {
        setError(activeRole === 'player' ? 'Please enter your email or phone' : 'Please enter your registered email or Venue ID');
        return;
      }
      if (!password || password.length < 6) {
        setError('Please enter your password (minimum 6 characters)');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        if (activeRole === 'player') {
          const derivedName = identifier.includes('@')
            ? identifier.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
            : 'Player';
          onLoginSuccess({
            role: 'player',
            fullName: derivedName,
            phoneNumber: phoneNumber || identifier.replace(/\D/g, '') || '',
            email: identifier.includes('@') ? identifier : '',
            city: 'Pune, Maharashtra',
          });
        } else {
          const derivedOwnerName = identifier.includes('@')
            ? identifier.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
            : 'Venue Partner';
          onLoginSuccess({
            role: 'owner',
            ownerFullName: derivedOwnerName,
            ownerPhoneNumber: phoneNumber || identifier.replace(/\D/g, '') || '',
            ownerEmail: identifier.includes('@') ? identifier : '',
            venueName: 'Registered Sports Venue',
            venueLocation: 'Pune, Maharashtra',
            primarySport: 'Badminton',
          });
        }
      }, 700);
    }
  };

  return (
    <div className="screen-body fade-in" style={{ paddingBottom: '2rem' }}>
      {/* Brand Header */}
      <div className="login-brand-section">
        <div className="login-logo-badge">
          <div className="brand-icon-inner">
            <Zap size={22} className="brand-zap-icon" />
          </div>
          <div className="brand-text-col">
            <span className="brand-title">ARENA</span>
            <span className="brand-tagline">SPORTS & TURFS</span>
          </div>
        </div>

        <h1 className="login-welcome-title">Welcome Back</h1>
        <p className="login-welcome-subtitle">
          {activeRole === 'player'
            ? 'Sign in to book courts, challenge friends & join games'
            : 'Sign in to manage turf bookings, slots & venue revenue'}
        </p>
      </div>

      {/* Segmented Role Switcher */}
      <div className="auth-role-segment">
        <button
          type="button"
          className={`role-segment-btn ${activeRole === 'player' ? 'active' : ''}`}
          onClick={() => handleRoleChange('player')}
        >
          <User size={18} />
          <span>Player / User</span>
        </button>

        <button
          type="button"
          className={`role-segment-btn ${activeRole === 'owner' ? 'active' : ''}`}
          onClick={() => handleRoleChange('owner')}
        >
          <Building2 size={18} />
          <span>Venue Partner</span>
        </button>
      </div>

      {/* Role Badge Indicator */}
      <div className="active-role-indicator">
        <div className="role-indicator-dot" />
        <span>
          Signing in as{' '}
          <strong>{activeRole === 'player' ? 'Player' : 'Venue Partner'}</strong>
        </span>
      </div>

      {/* Auth Method Toggle: Phone OTP vs Password */}
      <div className="auth-method-tabs">
        <button
          type="button"
          className={`method-tab ${authMethod === 'otp' ? 'active' : ''}`}
          onClick={() => handleMethodChange('otp')}
        >
          <Phone size={15} />
          <span>Mobile OTP</span>
          <span className="fast-badge">Fast</span>
        </button>
        <button
          type="button"
          className={`method-tab ${authMethod === 'password' ? 'active' : ''}`}
          onClick={() => handleMethodChange('password')}
        >
          <Lock size={15} />
          <span>Password</span>
        </button>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="login-form-container">
        {authMethod === 'otp' ? (
          /* OTP Phone Input */
          <div className="form-group">
            <label className="form-label" htmlFor="login-phone">
              {activeRole === 'player' ? 'Mobile Number' : 'Registered Mobile Number'}
            </label>
            <div className="phone-input-group">
              <select
                className="country-code-select"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                <option value="+91">🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+971">🇦🇪 +971</option>
                <option value="+65">🇸🇬 +65</option>
              </select>
              <div className="input-wrapper" style={{ flex: 1 }}>
                <input
                  id="login-phone"
                  type="tel"
                  className="input-field"
                  placeholder="98765 43210"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  autoComplete="tel-national"
                />
              </div>
            </div>
            <span className="input-help-text">
              We will send an SMS OTP verification code to this number.
            </span>
          </div>
        ) : (
          /* Password Form Fields */
          <div className="form-group-list" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-identifier">
                {activeRole === 'player' ? 'Email or Mobile Number' : 'Business Email or Venue ID'}
              </label>
              <div className="input-wrapper">
                <input
                  id="login-identifier"
                  type="text"
                  className="input-field"
                  placeholder={
                    activeRole === 'player'
                      ? 'e.g. rahul@example.com or 9876543210'
                      : 'e.g. partner@smashpoint.in or VEN-4029'
                  }
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError('');
                  }}
                  autoComplete="username"
                />
                <span className="input-icon-right">
                  {identifier.includes('@') ? (
                    <Mail size={18} color="#94A3B8" />
                  ) : (
                    <User size={18} color="#94A3B8" />
                  )}
                </span>
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
                <button
                  type="button"
                  className="link-btn-sm"
                  onClick={() => setForgotAlert(true)}
                >
                  Forgot?
                </button>
              </div>
              <div className="input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#64748B" />
                  ) : (
                    <Eye size={18} color="#64748B" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remember me & Forgot Alert */}
        <div className="remember-forgot-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="custom-checkbox"
            />
            <span>Remember this device</span>
          </label>

          {authMethod === 'otp' && (
            <button
              type="button"
              className="link-btn-sm"
              onClick={() => setForgotAlert(true)}
            >
              Need help?
            </button>
          )}
        </div>

        {/* Forgot Password / Need Help Notice */}
        {forgotAlert && (
          <div className="forgot-notice-banner fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle size={16} color="#2563EB" />
              <span>
                {authMethod === 'otp'
                  ? 'Having trouble receiving OTP? Check network or contact support at support@arena.com.'
                  : 'Password reset link will be sent to your registered email upon submitting identifier.'}
              </span>
            </div>
            <button
              type="button"
              className="close-notice-btn"
              onClick={() => setForgotAlert(false)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Error message */}
        {error && <div className="login-error-badge fade-in">{error}</div>}

        {/* Primary Submit Button */}
        <button
          type="submit"
          className="btn-primary login-submit-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="btn-loading-spinner">Signing in...</span>
          ) : authMethod === 'otp' ? (
            <>
              <span>Get OTP & Sign In</span>
              <ArrowRight size={18} />
            </>
          ) : (
            <>
              <span>Sign In as {activeRole === 'player' ? 'Player' : 'Partner'}</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Social Logins for Player / Contact for Venue */}
      {activeRole === 'player' ? (
        <div className="social-login-section">
          <div className="divider-row">
            <span className="divider-line" />
            <span className="divider-text">Or continue with</span>
            <span className="divider-line" />
          </div>

          <div className="social-btn-grid">
            <button
              type="button"
              className="social-btn"
              onClick={() => handleDemoFill('player')}
              title="Sign in with Google"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              className="social-btn"
              onClick={() => handleDemoFill('player')}
              title="Sign in with Apple"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0F172A">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.86c.65-.8 1.09-1.91.97-3.02-.94.04-2.07.63-2.73 1.4-.58.67-1.09 1.77-.95 2.85 1.05.08 2.12-.55 2.71-1.23z" />
              </svg>
              <span>Apple</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="partner-support-box">
          <Building2 size={16} color="#2563EB" />
          <span>Need venue onboarding assistance?</span>
          <a
            href="mailto:partners@arena.com"
            style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none', marginLeft: '0.25rem' }}
          >
            Contact Partner Desk
          </a>
        </div>
      )}

      {/* Quick Demo Fill Buttons for effortless review */}
      <div className="demo-credentials-card">
        <div className="demo-card-header">
          <Sparkles size={14} color="#D97706" />
          <span>Quick 1-Click Demo Logins</span>
        </div>
        <div className="demo-chips-row">
          <button
            type="button"
            className="demo-chip-btn player-demo-chip"
            onClick={() => handleDemoFill('player')}
          >
            👤 Demo Player (Rahul)
          </button>
          <button
            type="button"
            className="demo-chip-btn owner-demo-chip"
            onClick={() => handleDemoFill('owner')}
          >
            🏢 Demo Venue (Smash Point)
          </button>
          {onNavigateAdmin && (
            <button
              type="button"
              className="demo-chip-btn"
              onClick={onNavigateAdmin}
              style={{ background: '#0F172A', color: '#93C5FD', borderColor: '#1E293B' }}
            >
              🛡️ Admin 2FA Portal
            </button>
          )}
        </div>
      </div>

      {/* Footer Registration Link */}
      <div className="login-footer-section">
        <p className="form-footer-link">
          {activeRole === 'player'
            ? "Don't have a player account? "
            : 'Want to list your sports venue? '}
          <button
            type="button"
            className="link-btn"
            onClick={() => onNavigateRegister(activeRole)}
          >
            {activeRole === 'player' ? 'Create Account' : 'Register Venue'}
          </button>
        </p>

        {onNavigateAdmin && (
          <p style={{ textAlign: 'center', margin: '0.4rem 0 0.6rem 0' }}>
            <button
              type="button"
              className="link-btn"
              onClick={onNavigateAdmin}
              style={{ fontSize: '0.78rem', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <Lock size={12} />
              <span>Restricted Administrator Login (2FA)</span>
            </button>
          </p>
        )}

        <div className="security-badge-row">
          <ShieldCheck size={14} color="#10B981" />
          <span>256-bit encrypted secure Arena sports network</span>
        </div>
      </div>
    </div>
  );
}
