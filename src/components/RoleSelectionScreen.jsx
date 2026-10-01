import React from 'react';
import { User, Building2, ShieldAlert, ChevronRight, Lock } from 'lucide-react';

export default function RoleSelectionScreen({
  selectedRole,
  onSelectRole,
  onContinue,
  onNavigateLogin,
  onNavigateAdmin,
}) {
  return (
    <div className="screen-body fade-in">
      <h1 className="screen-title">Join Arena</h1>
      <p className="screen-subtitle">Choose how you want to use Arena</p>

      <div className="role-cards-container">
        {/* OPTION 1: PLAYER */}
        <div
          className={`role-card ${selectedRole === 'player' ? 'selected' : ''}`}
          onClick={() => onSelectRole('player')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectRole('player')}
        >
          <div className="role-icon-box">
            <User size={24} strokeWidth={2} />
          </div>
          <div className="role-content">
            <div className="role-title-row">
              <span className="role-title">Player</span>
              <div className="radio-checkmark">
                {selectedRole === 'player' && <div className="radio-dot" />}
              </div>
            </div>
            <p className="role-description">
              Find venues, choose a slot and book your game.
            </p>
          </div>
        </div>

        {/* OPTION 2: VENUE OWNER */}
        <div
          className={`role-card ${selectedRole === 'owner' ? 'selected' : ''}`}
          onClick={() => onSelectRole('owner')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectRole('owner')}
        >
          <div className="role-icon-box">
            <Building2 size={24} strokeWidth={2} />
          </div>
          <div className="role-content">
            <div className="role-title-row">
              <span className="role-title">Venue Owner</span>
              <div className="radio-checkmark">
                {selectedRole === 'owner' && <div className="radio-dot" />}
              </div>
            </div>
            <p className="role-description">
              List your venue and manage bookings.
            </p>
          </div>
        </div>

        {/* OPTION 3: ADMINISTRATOR */}
        <div
          className={`role-card ${selectedRole === 'admin' ? 'selected' : ''}`}
          onClick={() => onSelectRole('admin')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectRole('admin')}
          style={{ borderColor: selectedRole === 'admin' ? '#2563EB' : '#CBD5E1', background: selectedRole === 'admin' ? '#EFF6FF' : '#FAFAFA' }}
        >
          <div className="role-icon-box" style={{ background: '#0F172A', color: '#38BDF8' }}>
            <ShieldAlert size={24} strokeWidth={2} />
          </div>
          <div className="role-content">
            <div className="role-title-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="role-title">Platform Admin</span>
                <span style={{ fontSize: '0.625rem', fontWeight: 800, background: '#1E293B', color: '#93C5FD', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                  2FA
                </span>
              </div>
              <div className="radio-checkmark">
                {selectedRole === 'admin' && <div className="radio-dot" />}
              </div>
            </div>
            <p className="role-description">
              Secure operations gate with 2FA protection.
            </p>
          </div>
        </div>
      </div>

      <div className="bottom-action-container">
        <button
          type="button"
          className="btn-primary"
          disabled={!selectedRole}
          onClick={onContinue}
        >
          <span>Continue</span>
          <ChevronRight size={18} />
        </button>

        <p className="form-footer-link" style={{ textAlign: 'center', marginTop: '0.85rem' }}>
          Already have an account?{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => onNavigateLogin(selectedRole || 'player')}
          >
            Log In
          </button>
        </p>

        <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
          <button
            type="button"
            className="link-btn"
            onClick={onNavigateAdmin}
            style={{ fontSize: '0.78rem', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Lock size={12} />
            <span>Administrator & 2FA Console</span>
          </button>
        </div>
      </div>
    </div>
  );
}

