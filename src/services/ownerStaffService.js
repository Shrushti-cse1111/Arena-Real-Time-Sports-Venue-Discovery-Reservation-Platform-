/**
 * ownerStaffService.js
 * Backend staff management simulation for Arena Owner Portal:
 * - GET /owner/staff/roles
 * - GET /owner/staff?venueId=
 * - POST /owner/staff/invite
 * - DELETE /owner/staff/:id
 * - POST /owner/staff/:id/resend
 * - PATCH /owner/staff/:id/status
 */

const STORAGE_KEY_STAFF = 'arena_owner_staff_members';

// Configurable roles with granular permission scopes (backend configured)
export const STAFF_ROLES = [
  {
    id: 'manager',
    title: 'Manager',
    description: 'Full operations management: bookings, court availability, slot pricing, customer reviews & analytics.',
    permissions: ['view_dashboard', 'manage_bookings', 'manage_availability', 'manage_pricing', 'view_analytics', 'manage_reviews'],
    restricted: ['modify_bank_account', 'delete_venue', 'payout_settings'],
    badgeColor: '#2563EB',
    badgeBg: '#EFF6FF',
  },
  {
    id: 'reception',
    title: 'Reception',
    description: 'Front-desk operations: create walk-ins, check-in players via QR, process payments & view daily schedule.',
    permissions: ['view_dashboard', 'create_walk_in', 'check_in_players', 'view_schedule'],
    restricted: ['modify_bank_account', 'manage_pricing', 'delete_venue', 'view_earnings', 'payout_settings'],
    badgeColor: '#059669',
    badgeBg: '#ECFDF5',
  },
  {
    id: 'booking_staff',
    title: 'Booking Staff',
    description: 'Reservation management: manage upcoming slots, handle customer bookings & handle cancellations.',
    permissions: ['view_dashboard', 'manage_bookings', 'view_schedule'],
    restricted: ['modify_bank_account', 'manage_pricing', 'delete_venue', 'view_earnings'],
    badgeColor: '#7C3AED',
    badgeBg: '#F5F3FF',
  },
  {
    id: 'venue_staff',
    title: 'Venue Staff',
    description: 'Court management: view daily schedules, manage court cleanliness & verify player check-ins.',
    permissions: ['view_schedule', 'check_in_players'],
    restricted: ['modify_bank_account', 'manage_pricing', 'manage_bookings', 'view_earnings'],
    badgeColor: '#D97706',
    badgeBg: '#FFFBEB',
  },
];

// Initial default staff members
const DEFAULT_STAFF = [
  {
    id: 'staff-101',
    venueId: 'venue-101',
    name: 'Anita Sharma',
    mobile: '9823177881',
    role: 'manager',
    roleTitle: 'Manager',
    status: 'active', // 'active' | 'invited' | 'expired' | 'inactive'
    invitationToken: 'inv_verified_101',
    invitedAt: '2026-08-10T10:00:00.000Z',
    expiresAt: '2026-08-17T10:00:00.000Z',
    hasHistoricalBookings: true,
    historicalBookingsCount: 142,
  },
  {
    id: 'staff-102',
    venueId: 'venue-101',
    name: 'Rohan Deshmukh',
    mobile: '9765433221',
    role: 'reception',
    roleTitle: 'Reception',
    status: 'active',
    invitationToken: 'inv_verified_102',
    invitedAt: '2026-09-01T11:30:00.000Z',
    expiresAt: '2026-09-08T11:30:00.000Z',
    hasHistoricalBookings: true,
    historicalBookingsCount: 88,
  },
  {
    id: 'staff-103',
    venueId: 'venue-101',
    name: 'Vikram Patil',
    mobile: '9922011445',
    role: 'booking_staff',
    roleTitle: 'Booking Staff',
    status: 'invited',
    invitationToken: 'inv_sec_9922011445_tok',
    invitedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    hasHistoricalBookings: false,
    historicalBookingsCount: 0,
  },
  {
    id: 'staff-104',
    venueId: 'venue-101',
    name: 'Priya Joshi',
    mobile: '9890122334',
    role: 'venue_staff',
    roleTitle: 'Venue Staff',
    status: 'expired',
    invitationToken: 'inv_sec_expired_9890122334',
    invitedAt: '2026-08-01T09:00:00.000Z',
    expiresAt: '2026-08-08T09:00:00.000Z',
    hasHistoricalBookings: false,
    historicalBookingsCount: 0,
  },
  {
    id: 'staff-105',
    venueId: 'venue-102',
    name: 'Siddharth Rao',
    mobile: '9822998877',
    role: 'manager',
    roleTitle: 'Manager',
    status: 'active',
    invitationToken: 'inv_verified_105',
    invitedAt: '2026-08-15T14:00:00.000Z',
    expiresAt: '2026-08-22T14:00:00.000Z',
    hasHistoricalBookings: true,
    historicalBookingsCount: 45,
  },
];

function getStoredStaff() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAFF);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(DEFAULT_STAFF));
      return DEFAULT_STAFF;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_STAFF;
  } catch (e) {
    return DEFAULT_STAFF;
  }
}

function saveStoredStaff(staff) {
  try {
    localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(staff));
  } catch (e) {
    console.error('Failed to save staff list:', e);
  }
}

export const ownerStaffService = {
  /**
   * Get all configurable roles and permissions
   * GET /owner/staff/roles
   */
  async getRoles() {
    return STAFF_ROLES;
  },

  /**
   * Get all staff members for a specific venue
   * GET /owner/staff?venueId=
   */
  async getStaffMembers(venueId = 'venue-101') {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const all = getStoredStaff();
    const now = new Date();

    // Check for expired invitations dynamically
    const updated = all.map((member) => {
      if (member.status === 'invited' && member.expiresAt && new Date(member.expiresAt) < now) {
        return { ...member, status: 'expired' };
      }
      return member;
    });

    saveStoredStaff(updated);
    return updated.filter((member) => member.venueId === venueId || venueId === 'all');
  },

  /**
   * Check if a mobile number is already added for a venue
   */
  async isMobileAlreadyAdded(venueId, mobile) {
    const cleanMobile = mobile.replace(/\D/g, '');
    const all = getStoredStaff();
    return all.some(
      (m) =>
        m.venueId === venueId &&
        m.mobile.replace(/\D/g, '') === cleanMobile &&
        m.status !== 'inactive'
    );
  },

  /**
   * Invite a new staff member
   * POST /owner/staff/invite
   */
  async inviteStaff({ venueId = 'venue-101', name, mobile, roleId, ownerId = 'owner-session-id' }) {
    if (!name || !name.trim()) throw new Error('Staff member name is required.');
    
    const cleanMobile = (mobile || '').replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number.');
    }

    const roleObj = STAFF_ROLES.find((r) => r.id === roleId);
    if (!roleObj) throw new Error('Please select a valid role.');

    // Duplicate mobile check in current venue
    const all = getStoredStaff();
    const existing = all.find(
      (m) =>
        m.venueId === venueId &&
        m.mobile.replace(/\D/g, '') === cleanMobile &&
        m.status !== 'inactive'
    );
    if (existing) {
      throw new Error('This mobile number is already added.');
    }

    await new Promise((resolve) => setTimeout(resolve, 450));

    const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const newStaff = {
      id: `staff-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      venueId,
      name: name.trim(),
      mobile: cleanMobile,
      role: roleId,
      roleTitle: roleObj.title,
      status: 'invited',
      invitationToken: token,
      invitedAt: now.toISOString(),
      expiresAt,
      hasHistoricalBookings: false,
      historicalBookingsCount: 0,
      invitedBy: ownerId,
    };

    const updated = [newStaff, ...all];
    saveStoredStaff(updated);

    return {
      success: true,
      message: `Invitation successfully sent to +91 ${cleanMobile} via SMS/WhatsApp.`,
      staff: newStaff,
      token,
    };
  },

  /**
   * Remove / Deactivate a staff member
   * DELETE /owner/staff/:id
   */
  async removeStaff(staffId) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const all = getStoredStaff();
    const target = all.find((m) => m.id === staffId);

    if (!target) throw new Error('Staff member not found.');

    let updated;
    // Historical integrity rule: if staff has historical actions/bookings, soft-deactivate to preserve audit trail
    if (target.hasHistoricalBookings) {
      updated = all.map((m) => (m.id === staffId ? { ...m, status: 'inactive', deactivatedAt: new Date().toISOString() } : m));
    } else {
      updated = all.filter((m) => m.id !== staffId);
    }

    saveStoredStaff(updated);

    return {
      success: true,
      message: target.hasHistoricalBookings
        ? `${target.name} has been deactivated. Historical records are preserved.`
        : `${target.name} has been removed.`,
      deactivated: target.hasHistoricalBookings,
    };
  },

  /**
   * Resend an expired or pending invitation
   * POST /owner/staff/:id/resend
   */
  async resendInvite(staffId) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const all = getStoredStaff();
    let updatedMember = null;

    const updated = all.map((m) => {
      if (m.id === staffId) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        updatedMember = {
          ...m,
          status: 'invited',
          invitationToken: token,
          invitedAt: now.toISOString(),
          expiresAt,
        };
        return updatedMember;
      }
      return m;
    });

    if (!updatedMember) throw new Error('Staff member not found.');

    saveStoredStaff(updated);

    return {
      success: true,
      message: `Fresh invitation sent to +91 ${updatedMember.mobile}. Valid for 7 days.`,
      staff: updatedMember,
    };
  },

  /**
   * Toggle staff active / inactive status
   * PATCH /owner/staff/:id/status
   */
  async toggleStaffStatus(staffId) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const all = getStoredStaff();
    let updatedMember = null;

    const updated = all.map((m) => {
      if (m.id === staffId) {
        const newStatus = m.status === 'active' ? 'inactive' : 'active';
        updatedMember = { ...m, status: newStatus };
        return updatedMember;
      }
      return m;
    });

    if (!updatedMember) throw new Error('Staff member not found.');
    saveStoredStaff(updated);

    return {
      success: true,
      message: `Staff status updated to "${updatedMember.status}".`,
      staff: updatedMember,
    };
  },
};
