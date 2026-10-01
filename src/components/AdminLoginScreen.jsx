import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  XCircle,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { adminAuthService } from '../services/adminAuthService';

export default function AdminLoginScreen({
  onRequire2FA,
  onNavigateBack,
  onSwitchToRole,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');

  // Demo Admin quick-fill
  const handleQuickDemoAdmin = () => {
    setEmail('admin@arena.com');
    setPassword('Admin@Arena2026!');
    setErrorBanner('');
  };

  const handleQuickDemoSecurity = () => {
    setEmail('security.admin@arena.com');
    setPassword('Security@2026!');
    setErrorBanner('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorBanner('');

    // Pre-validation checks
    if (!email.trim()) {
      setErrorBanner('Please enter your authorized Admin email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorBanner('Please enter a valid email format (e.g., admin@arena.com).');
      return;
    }

    if (!password) {
      setErrorBanner('Admin security password is required.');
      return;
    }

    setIsLoading(true);

    try {
      // Call POST /admin/auth/login
      const response = await adminAuthService.login({
        email: email.trim(),
        password,
      });

      if (response.success && response.requires2FA) {
        setIsLoading(false);
        // Transition to 2FA verification step with ephemeral challenge details
        onRequire2FA({
          challengeToken: response.challengeToken,
          maskedEmail: response.maskedEmail,
          phoneEnding: response.phoneEnding,
          expiresInSeconds: response.expiresInSeconds,
          resendRemaining: response.resendRemaining,
          demoOtpHint: response.demoOtpHint,
          adminEmail: email.trim(),
        });
      }
    } catch (err) {
      setIsLoading(false);
      setErrorBanner(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="screen-body fade-in admin-auth-screen" style={{ paddingBottom: '2.5rem' }}>
      {/* Top Header / Back navigation */}
      <div className="admin-auth-top-bar">
        <button
          type="button"
          className="admin-back-btn"
          onClick={onNavigateBack}
          title="Back to portal selection"
        >
          <ArrowLeft size={16} />
          <span>Exit Admin</span>
        </button>
        <div className="admin-status-pill">
          <span className="status-dot-pulse" />
          <span>RESTRICTED ACCESS</span>
        </div>
      </div>

      {/* Admin Branding Hero */}
      <div className="admin-hero-section">
        <div className="admin-shield-icon-wrapper">
          <KeyRound size={28} className="admin-shield-icon" />
        </div>
        <h1 className="admin-title">Arena Console</h1>
        <p className="admin-subtitle">
          Superadmin & Platform Operations Gate. 2FA Multi-Factor Authentication is strictly enforced.
        </p>
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div className="admin-error-banner fade-in" role="alert">
          <div className="error-banner-icon">
            <AlertCircle size={18} />
          </div>
          <div className="error-banner-text">
            <strong>Access Denied:</strong> {errorBanner}
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

      {/* Admin Login Form */}
      <form onSubmit={handleSubmit} className="admin-form-container">
        {/* Email Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="admin-email">
            Admin Email Address
          </label>
          <div className="input-wrapper">
            <input
              id="admin-email"
              type="email"
              className={`input-field admin-input ${errorBanner ? 'has-error' : ''}`}
              placeholder="admin@arena.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorBanner) setErrorBanner('');
              }}
              autoComplete="email"
              disabled={isLoading}
              required
            />
            <span className="input-icon-right">
              <Mail size={18} color="#94A3B8" />
            </span>
          </div>
          <span className="input-help-text" style={{ color: '#64748B' }}>
            Only verified platform administrators can authenticate.
          </span>
        </div>

        {/* Password Field */}
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <div className="form-label-row">
            <label className="form-label" htmlFor="admin-password">
              Security Password
            </label>
            <span className="security-tag">
              <Lock size={12} /> High Security
            </span>
          </div>
          <div className="input-wrapper">
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              className={`input-field admin-input ${errorBanner ? 'has-error' : ''}`}
              placeholder="••••••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorBanner) setErrorBanner('');
              }}
              autoComplete="current-password"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              className="input-icon-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff size={18} color="#64748B" />
              ) : (
                <Eye size={18} color="#64748B" />
              )}
            </button>
          </div>
        </div>

        {/* Security Options */}
        <div className="remember-forgot-row" style={{ marginTop: '0.75rem' }}>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="custom-checkbox"
            />
            <span style={{ fontSize: '0.85rem', color: '#475569' }}>
              Enforce Hardware Device Binding
            </span>
          </label>
        </div>

        {/* Login Submit Button */}
        <button
          type="submit"
          className="btn-primary admin-submit-btn"
          disabled={isLoading}
          style={{ marginTop: '1.25rem' }}
        >
          {isLoading ? (
            <div className="admin-loading-row">
              <span className="admin-spinner" />
              <span>Verifying Credentials & Generating 2FA...</span>
            </div>
          ) : (
            <>
              <span>Authenticate & Proceed to 2FA</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Credentials Card for 1-Click Evaluation */}
      <div className="demo-credentials-card" style={{ marginTop: '1.5rem', background: '#F8FAFC', border: '1px dashed #CBD5E1' }}>
        <div className="demo-card-header">
          <Sparkles size={14} color="#D97706" />
          <span style={{ fontWeight: 600, color: '#0F172A' }}>Quick 1-Click Admin Demo Login</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.25rem 0 0.5rem 0' }}>
          Pre-fills verified credentials with step-by-step 2FA security enforcement:
        </p>
        <div className="demo-chips-row" style={{ gap: '0.5rem' }}>
          <button
            type="button"
            className="demo-chip-btn"
            onClick={handleQuickDemoAdmin}
            style={{ flex: 1, background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1E40AF', padding: '0.5rem' }}
          >
            🛡️ Superadmin (Sarah)
          </button>
          <button
            type="button"
            className="demo-chip-btn"
            onClick={handleQuickDemoSecurity}
            style={{ flex: 1, background: '#F0FDF4', borderColor: '#BBF7D0', color: '#166534', padding: '0.5rem' }}
          >
            🔐 Security Officer (Alex)
          </button>
        </div>
      </div>

      {/* Security Footer Notice */}
      <div className="admin-footer-security">
        <div className="security-badge-row">
          <ShieldCheck size={14} color="#10B981" />
          <span>FIPS 140-2 Level 3 HSM Enforced • All actions logged</span>
        </div>

        <p className="form-footer-link" style={{ textAlign: 'center', marginTop: '1rem' }}>
          Looking for customer portal?{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => onSwitchToRole('player')}
          >
            Switch to Player App
          </button>
        </p>
      </div>
    </div>
  );
}
