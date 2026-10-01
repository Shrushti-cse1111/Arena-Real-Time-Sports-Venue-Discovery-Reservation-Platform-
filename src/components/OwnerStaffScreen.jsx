import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Phone,
  RotateCcw,
  Sparkles,
  Building2,
  Lock,
  ChevronRight,
  Info,
} from 'lucide-react';
import { ownerStaffService, STAFF_ROLES } from '../services/ownerStaffService';
import OwnerBottomNav from './OwnerBottomNav';

export default function OwnerStaffScreen({
  venue = null,
  onNavigateTab = () => {},
  onBack = () => {},
}) {
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState(STAFF_ROLES);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Invite Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [selectedRole, setSelectedRole] = useState('manager');
  const [mobileDuplicateError, setMobileDuplicateError] = useState(false);

  // Remove Modal State
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const venueId = venue?.id || 'venue-101';
  const venueTitle = venue?.name || 'Arena Sports Club';

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ownerStaffService.getStaffMembers(venueId);
      setStaffList(data);
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Real-time mobile validation and duplicate check
  useEffect(() => {
    const clean = mobile.replace(/\D/g, '');
    if (clean.length === 10) {
      const isDuplicate = staffList.some(
        (m) => m.mobile.replace(/\D/g, '') === clean && m.status !== 'inactive'
      );
      setMobileDuplicateError(isDuplicate);
    } else {
      setMobileDuplicateError(false);
    }
  }, [mobile, staffList]);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setToastMessage('Please enter the staff member\'s full name.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const clean = mobile.replace(/\D/g, '');
    if (clean.length !== 10 || !/^[6-9]\d{9}$/.test(clean)) {
      setToastMessage('Please enter a valid 10-digit Indian mobile number.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (mobileDuplicateError) return;

    setSubmitting(true);
    try {
      const res = await ownerStaffService.inviteStaff({
        venueId,
        name,
        mobile: clean,
        roleId: selectedRole,
      });

      setToastMessage(res.message);
      setName('');
      setMobile('');
      setSelectedRole('manager');
      fetchStaff();
    } catch (err) {
      setToastMessage(err.message || 'Failed to send invitation.');
    } finally {
      setSubmitting(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    try {
      const res = await ownerStaffService.removeStaff(memberToRemove.id);
      setToastMessage(res.message);
      setMemberToRemove(null);
      fetchStaff();
    } catch (err) {
      setToastMessage(err.message || 'Failed to remove staff member.');
    } finally {
      setIsRemoving(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleResendInvite = async (staffId) => {
    try {
      const res = await ownerStaffService.resendInvite(staffId);
      setToastMessage(res.message);
      fetchStaff();
    } catch (err) {
      setToastMessage(err.message || 'Failed to resend invitation.');
    } finally {
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span
            style={{
              background: '#F0FDF4',
              color: '#16A34A',
              border: '1px solid #BBF7D0',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <CheckCircle2 size={11} />
            Active
          </span>
        );
      case 'invited':
        return (
          <span
            style={{
              background: '#FFFBEB',
              color: '#D97706',
              border: '1px solid #FDE68A',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <Clock size={11} />
            Invited
          </span>
        );
      case 'expired':
        return (
          <span
            style={{
              background: '#F1F5F9',
              color: '#64748B',
              border: '1px solid #CBD5E1',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <AlertCircle size={11} />
            Expired
          </span>
        );
      case 'inactive':
      default:
        return (
          <span
            style={{
              background: '#F1F5F9',
              color: '#94A3B8',
              border: '1px solid #E2E8F0',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            Inactive
          </span>
        );
    }
  };

  const selectedRoleObj = roles.find((r) => r.id === selectedRole) || roles[0];

  return (
    <div className="owner-staff-screen screen-container" style={{ paddingBottom: '5rem' }}>
      {/* Live Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--text-main, #0F172A)',
            color: '#FFFFFF',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            zIndex: 100,
            boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            maxWidth: '90%',
          }}
        >
          <Sparkles size={14} color="#FBBF24" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="screen-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="screen-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            Staff Management
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
            <Building2 size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{venueTitle}</span>
          </div>
        </div>
      </div>

      {/* Invite Staff Card */}
      <div
        className="invite-staff-card"
        style={{
          background: 'var(--bg-surface, #FFFFFF)',
          border: '1px solid var(--border-color, #E2E8F0)',
          borderRadius: 'var(--radius-md, 12px)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
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
            <UserPlus size={16} />
          </div>
          <div>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Invite Staff Member
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Add managers, receptionists, or court staff with role-based permissions
            </span>
          </div>
        </div>

        <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Name Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Anita Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.875rem' }}
              required
            />
          </div>

          {/* Mobile Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Mobile Number
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div
                style={{
                  background: '#F1F5F9',
                  border: '1px solid var(--border-color, #CBD5E1)',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '0.55rem 0.65rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                +91
              </div>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                className="input-field"
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.875rem',
                  borderColor: mobileDuplicateError ? '#EF4444' : undefined,
                }}
                required
              />
            </div>
            {/* Inline Duplicate Mobile Error */}
            {mobileDuplicateError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#DC2626', fontSize: '0.75rem', marginTop: '0.35rem', fontWeight: 600 }}>
                <AlertCircle size={13} />
                <span>This mobile number is already added.</span>
              </div>
            )}
          </div>

          {/* Role Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Role Assignment
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.875rem', cursor: 'pointer' }}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>

            {/* Role Permissions Scope Pill */}
            {selectedRoleObj && (
              <div
                style={{
                  background: selectedRoleObj.badgeBg || '#F8FAFC',
                  border: `1px solid ${selectedRoleObj.badgeColor || '#E2E8F0'}33`,
                  borderRadius: '6px',
                  padding: '0.5rem 0.65rem',
                  marginTop: '0.45rem',
                  fontSize: '0.6875rem',
                  color: 'var(--text-main)',
                  lineHeight: 1.4,
                }}
              >
                <div style={{ fontWeight: 700, color: selectedRoleObj.badgeColor, marginBottom: '2px' }}>
                  {selectedRoleObj.title} Permissions:
                </div>
                {selectedRoleObj.description}
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={submitting || mobileDuplicateError || !name.trim() || mobile.replace(/\D/g, '').length !== 10}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.65rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              opacity: (submitting || mobileDuplicateError || !name.trim() || mobile.replace(/\D/g, '').length !== 10) ? 0.6 : 1,
              cursor: (submitting || mobileDuplicateError || !name.trim() || mobile.replace(/\D/g, '').length !== 10) ? 'not-allowed' : 'pointer',
              marginTop: '0.25rem',
            }}
          >
            {submitting ? 'Sending invite...' : 'Send invite'}
          </button>
        </form>
      </div>

      {/* Staff Table Card */}
      <div
        className="staff-table-card"
        style={{
          background: 'var(--bg-surface, #FFFFFF)',
          border: '1px solid var(--border-color, #E2E8F0)',
          borderRadius: 'var(--radius-md, 12px)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0,0,0,0.05))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users size={16} color="var(--text-main)" />
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Staff Directory ({staffList.filter((m) => m.status !== 'inactive').length})
            </h2>
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="skeleton-card" style={{ height: '56px', background: '#E2E8F0', borderRadius: '8px' }} />
            <div className="skeleton-card" style={{ height: '56px', background: '#E2E8F0', borderRadius: '8px' }} />
            <div className="skeleton-card" style={{ height: '56px', background: '#E2E8F0', borderRadius: '8px' }} />
          </div>
        )}

        {/* Empty State */}
        {!loading && staffList.filter((m) => m.status !== 'inactive').length === 0 && (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--action-blue-light, #EFF6FF)',
                color: 'var(--action-blue, #2563EB)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem auto',
              }}
            >
              <Users size={22} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
              No staff members added yet.
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto' }}>
              Use the invite form above to add your venue managers, receptionists, and booking assistants.
            </p>
          </div>
        )}

        {/* Staff Table / List */}
        {!loading && staffList.filter((m) => m.status !== 'inactive').length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {staffList
              .filter((m) => m.status !== 'inactive')
              .map((member) => {
                const roleMeta = roles.find((r) => r.id === member.role) || { title: member.roleTitle || 'Staff', badgeColor: '#2563EB', badgeBg: '#EFF6FF' };
                const isExpired = member.status === 'expired';

                return (
                  <div
                    key={member.id}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '0.75rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#FFFFFF',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Member Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: roleMeta.badgeBg || '#EFF6FF',
                          color: roleMeta.badgeColor || '#2563EB',
                          fontWeight: 800,
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>+91 {member.mobile}</span>
                          <span>•</span>
                          <span style={{ fontWeight: 600, color: roleMeta.badgeColor }}>
                            {roleMeta.title}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {getStatusBadge(member.status)}

                      {/* Resend for Expired / Invited */}
                      {isExpired && (
                        <button
                          type="button"
                          onClick={() => handleResendInvite(member.id)}
                          style={{
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: 'var(--action-blue)',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '3px 6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <RotateCcw size={11} />
                          Resend
                        </button>
                      )}

                      {/* Ghost Remove Button (✕) */}
                      <button
                        type="button"
                        onClick={() => setMemberToRemove(member)}
                        aria-label={`Remove ${member.name}`}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#94A3B8',
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#EF4444';
                          e.currentTarget.style.background = '#FEF2F2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#94A3B8';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Security & RBAC Callout */}
      <div
        style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '0.85rem 1rem',
          marginTop: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.65rem',
        }}
      >
        <Shield size={18} color="var(--action-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          <strong style={{ color: 'var(--text-main)' }}>Owner Security Guard:</strong> Staff members are strictly restricted from viewing or editing your bank settlement details, payout credentials, or platform settings.
        </div>
      </div>

      {/* Inline Confirmation Modal for Remove Flow */}
      {memberToRemove && (
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
              <AlertCircle size={24} />
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: 'var(--text-main)' }}>
              Remove {memberToRemove.name}?
            </h3>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0', lineHeight: 1.4 }}>
              {memberToRemove.hasHistoricalBookings
                ? 'This staff member has historical booking activity. Their access will be deactivated while preserving all match logs.'
                : 'Are you sure you want to revoke their access? They will no longer be able to log in to this venue.'}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMemberToRemove(null)}
                style={{ flex: 1, padding: '0.55rem', fontSize: '0.8125rem' }}
              >
                No, Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={isRemoving}
                onClick={handleConfirmRemove}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  fontSize: '0.8125rem',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontWeight: 700,
                  cursor: isRemoving ? 'not-allowed' : 'pointer',
                }}
              >
                {isRemoving ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owner Bottom Navigation */}
      <OwnerBottomNav
        activeTab="staff"
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
        }}
      />
    </div>
  );
}
