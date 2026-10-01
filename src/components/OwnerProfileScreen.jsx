import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Mail,
  Phone,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Headphones,
  Check,
} from 'lucide-react';
import { ownerProfileService } from '../services/ownerProfileService';
import OwnerBottomNav from './OwnerBottomNav';

export default function OwnerProfileScreen({
  ownerData = {},
  onNavigateSupport = () => {},
  onLogout = () => {},
  onNavigateTab = () => {},
  onBack = () => {},
}) {
  const [profile, setProfile] = useState(null);
  const [savedValues, setSavedValues] = useState({ businessName: '', supportEmail: '' });
  const [businessName, setBusinessName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Fetch authenticated owner profile on mount
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setSaveError(null);
    try {
      const data = await ownerProfileService.getProfile();
      setProfile(data);
      const initialBName = data.businessName || ownerData.venueName || 'Arena Sports Ventures LLP';
      const initialEmail = data.supportEmail || ownerData.ownerEmail || 'contact@arenasports.in';
      setBusinessName(initialBName);
      setSupportEmail(initialEmail);
      setSavedValues({ businessName: initialBName, supportEmail: initialEmail });
    } catch (err) {
      setSaveError("Couldn't load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [ownerData]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Determine if editable fields differ from last saved backend value
  const isDirty =
    businessName.trim() !== savedValues.businessName.trim() ||
    supportEmail.trim() !== savedValues.supportEmail.trim();

  // Basic validation check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(supportEmail.trim());
  const isFormValid = businessName.trim().length > 0 && isEmailValid;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isDirty || !isFormValid || isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const payload = {};
      if (businessName.trim() !== savedValues.businessName.trim()) {
        payload.businessName = businessName.trim();
      }
      if (supportEmail.trim() !== savedValues.supportEmail.trim()) {
        payload.supportEmail = supportEmail.trim();
      }

      const res = await ownerProfileService.updateProfile(payload);
      
      // Update local state and saved values
      setProfile(res.profile);
      setSavedValues({
        businessName: res.profile.businessName,
        supportEmail: res.profile.supportEmail,
      });

      // Show "✓ Saved" for approximately 1.5 seconds
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 1500);
    } catch (err) {
      setSaveError("Couldn't save your changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      await ownerProfileService.logout();
    } catch (e) {}
    setShowLogoutModal(false);
    onLogout();
  };

  return (
    <div className="owner-profile-screen screen-container" style={{ paddingBottom: '5.5rem' }}>
      {/* Screen Header */}
      <div className="screen-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="screen-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            Profile &amp; Settings
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>
            Manage business credentials, payout accounts &amp; security
          </span>
        </div>
      </div>

      {/* Save Error Banner (Preserves user's unsaved values) */}
      {saveError && (
        <div
          className="error-banner"
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md, 8px)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8125rem',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{saveError}</span>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton-card" style={{ height: '180px', background: '#E2E8F0', borderRadius: '12px' }} />
          <div className="skeleton-card" style={{ height: '180px', background: '#E2E8F0', borderRadius: '12px' }} />
        </div>
      )}

      {!loading && profile && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 1. Business Details Card */}
          <div
            className="settings-card"
            style={{
              background: 'var(--bg-surface, #FFFFFF)',
              border: '1px solid var(--border-color, #E2E8F0)',
              borderRadius: 'var(--radius-md, 12px)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0,0,0,0.05))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--action-blue-light, #EFF6FF)',
                  color: 'var(--action-blue, #2563EB)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={16} />
              </div>
              <div>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Business Details
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Public identity &amp; customer communication
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Business Name Field (Editable) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.875rem' }}
                  required
                />
              </div>

              {/* Contact Number Field (Disabled / Tied to Auth) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Contact Number
                  </label>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: '#059669',
                      background: '#ECFDF5',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <ShieldCheck size={11} /> Verified ID
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={profile.contactNumber || ownerData.ownerPhoneNumber || '+91 98221 44551'}
                    disabled
                    className="input-field"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem 0.55rem 2rem',
                      fontSize: '0.875rem',
                      background: '#F8FAFC',
                      color: 'var(--text-muted)',
                      cursor: 'not-allowed',
                      border: '1px solid #CBD5E1',
                    }}
                  />
                  <Lock size={13} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Authentication identity is tied to this mobile number. Contact compliance to update.
                </span>
              </div>

              {/* Support Email Field (Editable) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Support Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="input-field"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.875rem',
                    borderColor: (!isEmailValid && supportEmail.length > 0) ? '#EF4444' : undefined,
                  }}
                  required
                />
                {!isEmailValid && supportEmail.length > 0 && (
                  <span style={{ fontSize: '0.6875rem', color: '#DC2626', marginTop: '0.2rem', display: 'block' }}>
                    Please enter a valid email format.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Payout Account Card (Masked & Disabled) */}
          <div
            className="settings-card"
            style={{
              background: 'var(--bg-surface, #FFFFFF)',
              border: '1px solid var(--border-color, #E2E8F0)',
              borderRadius: 'var(--radius-md, 12px)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0,0,0,0.05))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#F0FDF4',
                    color: '#16A34A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CreditCard size={16} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    Payout Account
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Direct settlement bank account
                  </span>
                </div>
              </div>

              <span
                style={{
                  background: '#F0FDF4',
                  color: '#16A34A',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  border: '1px solid #BBF7D0',
                }}
              >
                ● Verified
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Masked Account Number (Disabled) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={profile.payoutAccount?.maskedAccountNumber || '•••• •••• •••• 8842'}
                  disabled
                  className="input-field"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.875rem',
                    background: '#F8FAFC',
                    color: 'var(--text-main)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    cursor: 'not-allowed',
                    border: '1px solid #CBD5E1',
                  }}
                />
              </div>

              {/* IFSC Code (Disabled) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={profile.payoutAccount?.ifscCode || 'HDFC0000123'}
                    disabled
                    className="input-field"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.875rem',
                      background: '#F8FAFC',
                      color: 'var(--text-muted)',
                      cursor: 'not-allowed',
                      border: '1px solid #CBD5E1',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={profile.payoutAccount?.bankName || 'HDFC Bank'}
                    disabled
                    className="input-field"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.875rem',
                      background: '#F8FAFC',
                      color: 'var(--text-muted)',
                      cursor: 'not-allowed',
                      border: '1px solid #CBD5E1',
                    }}
                  />
                </div>
              </div>

              {/* Contact Support to Change Pill */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Lock size={13} color="var(--text-muted)" />
                  <span>Contact support to change bank account</span>
                </div>
                <button
                  type="button"
                  onClick={onNavigateSupport}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--action-blue, #2563EB)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: 0,
                  }}
                >
                  Help Desk <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Save Changes Button (Initially Disabled, enables when dirty) */}
          <div>
            <button
              type="submit"
              disabled={!isDirty || !isFormValid || isSaving || saveSuccess}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                opacity: (!isDirty || !isFormValid || isSaving || saveSuccess) ? 0.6 : 1,
                cursor: (!isDirty || !isFormValid || isSaving || saveSuccess) ? 'not-allowed' : 'pointer',
                background: saveSuccess ? '#059669' : undefined,
                borderColor: saveSuccess ? '#059669' : undefined,
                transition: 'all 0.2s ease',
              }}
            >
              {saveSuccess ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <Check size={16} /> ✓ Saved
                </span>
              ) : isSaving ? (
                'Saving changes...'
              ) : (
                'Save changes'
              )}
            </button>
          </div>

          {/* 4. Logout Button (Full-width danger ghost button with extra spacing) */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FCA5A5',
                borderRadius: 'var(--radius-md, 8px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FEE2E2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FEF2F2';
              }}
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </form>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 150,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md, 14px)',
              padding: '1.5rem',
              maxWidth: '340px',
              width: '100%',
              boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0,0,0,0.1))',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#FEF2F2',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              <LogOut size={22} />
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: 'var(--text-main)' }}>
              Log out of Arena?
            </h3>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0', lineHeight: 1.4 }}>
              You will need to verify your phone number via OTP to log back into the Owner Portal.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowLogoutModal(false)}
                style={{ flex: 1, padding: '0.55rem', fontSize: '0.8125rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmLogout}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  fontSize: '0.8125rem',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owner Bottom Navigation */}
      <OwnerBottomNav
        activeTab="profile"
        onNavigate={(tab) => {
          if (tab === 'dashboard') onNavigateTab('owner-dashboard');
          else if (tab === 'bookings') onNavigateTab('owner-bookings');
          else if (tab === 'analytics') onNavigateTab('owner-analytics');
          else if (tab === 'availability') onNavigateTab('owner-availability');
          else if (tab === 'venues') onNavigateTab('owner-venues');
          else if (tab === 'reviews') onNavigateTab('owner-reviews');
          else if (tab === 'promotions') onNavigateTab('owner-promotions');
          else if (tab === 'earnings') onNavigateTab('owner-earnings');
          else if (tab === 'staff') onNavigateTab('owner-staff');
          else if (tab === 'profile') onNavigateTab('owner-profile');
        }}
      />
    </div>
  );
}
