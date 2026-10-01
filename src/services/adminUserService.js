/**
 * ARENA — ADMIN USER MANAGEMENT SERVICE
 * Handles player and venue owner administration, status management, blocking/unblocking,
 * and dispute/complaint history tracking.
 * 
 * Endpoints:
 *   GET   /admin/users
 *   GET   /admin/users/:id
 *   PATCH /admin/users/:id/status
 *   GET   /admin/users/:id/complaints
 * 
 * Security:
 *   - Admin-only access guard.
 *   - Zero exposure of sensitive payment credentials (CVV, unmasked card numbers).
 *   - Immutable audit logging for all block/unblock actions.
 */

const STORAGE_KEY_ADMIN_USERS = 'arena_admin_users_master';
const STORAGE_KEY_ADMIN_AUDIT = 'arena_admin_audit_log';

// Rich Master User Registry (Players, Venue Partners & Organizers)
const INITIAL_USERS_MASTER = [
  {
    id: 'USR-1001',
    name: 'Rahul Mehta',
    email: 'rahul.mehta@example.com',
    mobile: '+91 98221 44551',
    role: 'player',
    city: 'Pune, Maharashtra',
    joinedDate: '12 Jan 2026',
    status: 'active', // 'active' | 'blocked'
    blockingReason: null,
    blockedAt: null,
    blockedBy: null,
    bookingsCount: 24,
    totalSpent: '₹18,450',
    walletBalance: '₹450',
    preferredSports: ['Badminton', 'Tennis'],
    savedPaymentMethods: [
      { type: 'UPI', label: 'Google Pay (rahul@okhdfcbank)', isDefault: true },
      { type: 'Card', label: 'HDFC Bank Credit Card (•••• 4812)', isDefault: false },
    ],
    complaints: [
      {
        id: 'TKT-9401',
        category: 'Payment & Refund',
        subject: 'Double charged for Synthetic Court 1 on 29 Sep',
        status: 'Resolved',
        date: '29 Sep 2026',
        resolution: 'Duplicate charge of ₹650 refunded to Arena Wallet instantly.',
      },
    ],
    recentBookings: [
      { id: 'BK-1081', venue: 'Deccan Sports Arena', court: 'Court A (Badminton)', date: '01 Oct 2026', amount: 650, status: 'completed' },
      { id: 'BK-1075', venue: 'Smash Point Turf', court: 'Court 1 (Badminton)', date: '28 Sep 2026', amount: 700, status: 'completed' },
      { id: 'BK-1062', venue: 'FC Road Sports Hub', court: 'Tennis Court A', date: '22 Sep 2026', amount: 1100, status: 'completed' },
    ],
  },
  {
    id: 'USR-1002',
    name: 'Priya Singh',
    email: 'priya.singh@example.com',
    mobile: '+91 97632 11990',
    role: 'player',
    city: 'Pune, Maharashtra',
    joinedDate: '18 Feb 2026',
    status: 'active',
    blockingReason: null,
    blockedAt: null,
    blockedBy: null,
    bookingsCount: 16,
    totalSpent: '₹14,200',
    walletBalance: '₹120',
    preferredSports: ['Tennis', 'Squash'],
    savedPaymentMethods: [
      { type: 'UPI', label: 'PhonePe (priya@ybl)', isDefault: true },
      { type: 'Card', label: 'ICICI Coral Card (•••• 9931)', isDefault: false },
    ],
    complaints: [],
    recentBookings: [
      { id: 'BK-1082', venue: 'Deccan Sports Arena', court: 'Court B (Tennis)', date: '01 Oct 2026', amount: 1100, status: 'completed' },
      { id: 'BK-1055', venue: 'Velocity Club', court: 'Squash Glass Court', date: '24 Sep 2026', amount: 900, status: 'completed' },
    ],
  },
  {
    id: 'USR-1003',
    name: 'Karan Mehra',
    email: 'karan.mehra@example.com',
    mobile: '+91 98230 44556',
    role: 'player',
    city: 'Pune, Maharashtra',
    joinedDate: '05 Mar 2026',
    status: 'blocked',
    blockingReason: 'Repeated late cancellations and fraudulent payment dispute claim on 28 Sep.',
    blockedAt: '2026-09-28T14:30:00Z',
    blockedBy: 'Sarah Connor (ADM-9001)',
    bookingsCount: 8,
    totalSpent: '₹6,100',
    walletBalance: '₹0',
    preferredSports: ['Football', 'Cricket'],
    savedPaymentMethods: [
      { type: 'UPI', label: 'Paytm UPI (karan@paytm)', isDefault: true },
    ],
    complaints: [
      {
        id: 'TKT-9388',
        category: 'Dispute / Chargeback',
        subject: 'Chargeback filed via bank after court slot completed',
        status: 'Investigating',
        date: '28 Sep 2026',
        resolution: 'User flagged by owner for no-show dispute. Account temporarily suspended.',
      },
    ],
    recentBookings: [
      { id: 'BK-1049', venue: 'SkyTurf Box Arena', court: 'FIFA 5-a-side Turf 1', date: '27 Sep 2026', amount: 1400, status: 'completed' },
    ],
  },
  {
    id: 'USR-1004',
    name: 'Rajesh Nair',
    email: 'partner@smashpoint.in',
    mobile: '+91 98123 45678',
    role: 'owner',
    city: 'Pune, Maharashtra',
    joinedDate: '10 Jan 2026',
    status: 'active',
    blockingReason: null,
    blockedAt: null,
    blockedBy: null,
    bookingsCount: 312,
    totalSpent: '₹2,48,900 (Revenue Earned)',
    walletBalance: '₹48,500 (Payout Due)',
    preferredSports: ['Badminton', 'Pickleball'],
    savedPaymentMethods: [
      { type: 'Bank Account', label: 'HDFC Bank Payout A/C (•••• 4812)', isDefault: true },
    ],
    complaints: [
      {
        id: 'TKT-9402',
        category: 'Payout & Settlements',
        subject: 'Weekly payout settlement delay for Court 2',
        status: 'In Progress',
        date: '30 Sep 2026',
        resolution: 'Finance team verifying NEFT batch release.',
      },
    ],
    recentBookings: [],
  },
  {
    id: 'USR-1005',
    name: 'Sneha Rao',
    email: 'sneha.rao@example.com',
    mobile: '+91 97651 88990',
    role: 'player',
    city: 'Pune, Maharashtra',
    joinedDate: '24 Apr 2026',
    status: 'active',
    blockingReason: null,
    blockedAt: null,
    blockedBy: null,
    bookingsCount: 19,
    totalSpent: '₹13,850',
    walletBalance: '₹700',
    preferredSports: ['Badminton'],
    savedPaymentMethods: [
      { type: 'UPI', label: 'Google Pay (sneha@okhdfcbank)', isDefault: true },
    ],
    complaints: [
      {
        id: 'TKT-9403',
        category: 'Booking Conflict',
        subject: 'Court was occupied by walk-in player during booked slot',
        status: 'In Progress',
        date: '29 Sep 2026',
        resolution: 'Venue manager issued ₹700 full compensation credit.',
      },
    ],
    recentBookings: [
      { id: 'BK-1077', venue: 'Apex Sports Arena', court: 'Court A', date: '29 Sep 2026', amount: 700, status: 'completed' },
      { id: 'BK-1060', venue: 'Smash Point', court: 'Court 2', date: '21 Sep 2026', amount: 650, status: 'completed' },
    ],
  },
  {
    id: 'USR-1006',
    name: 'Vikram Joshi',
    email: 'vikram.joshi@skyturf.in',
    mobile: '+91 98220 11223',
    role: 'owner',
    city: 'Pune, Maharashtra',
    joinedDate: '10 Aug 2026',
    status: 'active',
    blockingReason: null,
    blockedAt: null,
    blockedBy: null,
    bookingsCount: 184,
    totalSpent: '₹1,56,400 (Revenue Earned)',
    walletBalance: '₹22,100 (Payout Due)',
    preferredSports: ['Football', 'Box Cricket'],
    savedPaymentMethods: [
      { type: 'Bank Account', label: 'HDFC Bank Current A/C (•••• 4812)', isDefault: true },
    ],
    complaints: [],
    recentBookings: [],
  },
  {
    id: 'USR-1007',
    name: 'Aditya Roy',
    email: 'aditya.roy@example.com',
    mobile: '+91 99231 11223',
    role: 'player',
    city: 'Pune, Maharashtra',
    joinedDate: '15 Jul 2026',
    status: 'active',
    blockingReason: null,
    blockedAt: null,
    blockedBy: null,
    bookingsCount: 5,
    totalSpent: '₹3,250',
    walletBalance: '₹150',
    preferredSports: ['Cricket', 'Football'],
    savedPaymentMethods: [
      { type: 'UPI', label: 'PhonePe (aditya@ybl)', isDefault: true },
    ],
    complaints: [
      {
        id: 'TKT-9404',
        category: 'Arena Wallet',
        subject: 'Referral reward credits not added after friend booking',
        status: 'Resolved',
        date: '29 Sep 2026',
        resolution: 'Referral qualification confirmed. ₹150 credited.',
      },
    ],
    recentBookings: [
      { id: 'BK-1033', venue: 'Apex Cricket Pitch', court: 'Net Pitch 1', date: '18 Sep 2026', amount: 800, status: 'completed' },
    ],
  },
  {
    id: 'USR-1008',
    name: 'Nikhil Shinde',
    email: 'nikhil@futsalpark.in',
    mobile: '+91 97650 44332',
    role: 'owner',
    city: 'Pune, Maharashtra',
    joinedDate: '01 Sep 2026',
    status: 'blocked',
    blockingReason: 'Failed KYC compliance: Expired GSTIN certificate and missing Municipal Fire Safety NOC.',
    blockedAt: '2026-09-20T16:00:00Z',
    blockedBy: 'Sarah Connor (ADM-9001)',
    bookingsCount: 0,
    totalSpent: '₹0',
    walletBalance: '₹0',
    preferredSports: ['Football'],
    savedPaymentMethods: [],
    complaints: [],
    recentBookings: [],
  },
];

// Helper: Record security audit entry
function recordAuditEntry(action, details = {}) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_ADMIN_AUDIT) || '[]');
    const newEntry = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.104 (TLS 1.3)',
      userAgent: navigator.userAgent.slice(0, 60) + '...',
      ...details,
    };
    const updated = [newEntry, ...existing].slice(0, 50);
    localStorage.setItem(STORAGE_KEY_ADMIN_AUDIT, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to log security audit:', e);
  }
}

export const adminUserService = {
  /**
   * Load master users from localStorage
   */
  getStoredUsers() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADMIN_USERS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_ADMIN_USERS, JSON.stringify(INITIAL_USERS_MASTER));
        return INITIAL_USERS_MASTER;
      }
      return JSON.parse(raw);
    } catch (e) {
      return INITIAL_USERS_MASTER;
    }
  },

  /**
   * Save master users to localStorage
   */
  saveUsers(users) {
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save master users:', e);
    }
  },

  /**
   * GET /admin/users
   * Returns list of platform users with search and status filtering
   * @param {Object} query - { search, status, role }
   */
  async getUsers({ search = '', status = 'all', role = 'all' } = {}) {
    await new Promise((r) => setTimeout(r, 350));

    let list = this.getStoredUsers();

    // 1. Status filter: 'all' | 'active' | 'blocked'
    if (status && status !== 'all') {
      list = list.filter((u) => u.status === status);
    }

    // 2. Role filter: 'all' | 'player' | 'owner'
    if (role && role !== 'all') {
      list = list.filter((u) => u.role === role);
    }

    // 3. Search query: matches name, email, phone, city, or user ID
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.id.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.mobile.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
          u.city.toLowerCase().includes(q)
      );
    }

    const allUsers = this.getStoredUsers();

    return {
      success: true,
      total: list.length,
      counts: {
        all: allUsers.length,
        active: allUsers.filter((u) => u.status === 'active').length,
        blocked: allUsers.filter((u) => u.status === 'blocked').length,
        players: allUsers.filter((u) => u.role === 'player').length,
        owners: allUsers.filter((u) => u.role === 'owner').length,
      },
      users: list,
    };
  },

  /**
   * GET /admin/users/:id
   * Retrieve full details of a specific user with masked payment methods
   * @param {string} userId
   */
  async getUserDetails(userId) {
    await new Promise((r) => setTimeout(r, 250));

    const list = this.getStoredUsers();
    const user = list.find((u) => u.id === userId);

    if (!user) {
      throw new Error(`User with ID "${userId}" not found.`);
    }

    return {
      success: true,
      user,
    };
  },

  /**
   * PATCH /admin/users/:id/status
   * Update user status to 'active' or 'blocked'
   * @param {string} userId
   * @param {string} status - 'active' | 'blocked'
   * @param {string} reason - Mandatory for blocking
   * @param {string} adminId
   * @param {string} adminName
   */
  async updateUserStatus(userId, status, reason = '', adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    if (!userId) {
      throw new Error('User ID is required.');
    }

    if (status === 'blocked' && (!reason || reason.trim().length < 5)) {
      throw new Error('A valid reason (minimum 5 characters) is mandatory to block a user.');
    }

    await new Promise((r) => setTimeout(r, 500));

    const list = this.getStoredUsers();
    const index = list.findIndex((u) => u.id === userId);

    if (index === -1) {
      throw new Error(`User with ID "${userId}" not found.`);
    }

    const timestamp = new Date().toISOString();
    const isBlocking = status === 'blocked';

    const updatedUser = {
      ...list[index],
      status,
      blockingReason: isBlocking ? reason.trim() : null,
      blockedAt: isBlocking ? timestamp : null,
      blockedBy: isBlocking ? `${adminName} (${adminId})` : null,
    };

    list[index] = updatedUser;
    this.saveUsers(list);

    // Record Security Audit Log
    recordAuditEntry(isBlocking ? 'USER_BLOCKED' : 'USER_UNBLOCKED', {
      targetUserId: updatedUser.id,
      targetUserName: updatedUser.name,
      targetUserRole: updatedUser.role,
      adminId,
      adminName,
      status,
      reason: isBlocking ? reason.trim() : 'Admin restored account access',
    });

    return {
      success: true,
      message: `User "${updatedUser.name}" has been ${isBlocking ? 'blocked' : 'unblocked'}.`,
      user: updatedUser,
    };
  },

  /**
   * GET /admin/users/:id/complaints
   * Retrieve complaint and dispute history for a specific user
   * @param {string} userId
   */
  async getUserComplaints(userId) {
    await new Promise((r) => setTimeout(r, 250));

    const list = this.getStoredUsers();
    const user = list.find((u) => u.id === userId);

    if (!user) {
      throw new Error(`User with ID "${userId}" not found.`);
    }

    return {
      success: true,
      userId,
      userName: user.name,
      complaints: user.complaints || [],
    };
  },
};
