/**
 * ARENA — ADMIN OWNER MANAGEMENT SERVICE
 * Manages venue owners / turf partners, business KYC compliance, verification,
 * suspensions, earnings ledger, and complaints tracking.
 * 
 * Endpoints:
 *   GET  /admin/owners
 *   GET  /admin/owners/:id
 *   POST /admin/owners/:id/verify
 *   POST /admin/owners/:id/suspend
 *   POST /admin/owners/:id/reactivate
 * 
 * Rules:
 *   - Suspension requires mandatory reason (min 5 chars).
 *   - Immutable audit logging with Admin ID, timestamp, and action.
 *   - Suspended owners cannot manage venues or accept new bookings.
 */

const STORAGE_KEY_ADMIN_OWNERS = 'arena_admin_owners_master';
const STORAGE_KEY_ADMIN_AUDIT = 'arena_admin_audit_log';
const STORAGE_KEY_VERIFICATION = 'arena_owner_verification_data';

// Master initial owners list
const INITIAL_OWNERS_MASTER = [
  {
    id: 'OWN-201',
    name: 'Rajesh Nair',
    email: 'partner@smashpoint.in',
    phone: '+91 98123 45678',
    city: 'Pune, Maharashtra',
    joinedDate: '10 Jan 2026',
    status: 'active', // 'active' | 'suspended'
    verificationStatus: 'verified', // 'pending' | 'verified' | 'rejected'
    suspensionReason: null,
    suspendedAt: null,
    suspendedBy: null,
    businessInfo: {
      businessName: 'Smash Point Sports & Leisure LLP',
      legalEntityType: 'Limited Liability Partnership',
      gstNumber: '27AABCS1429B1Z8',
      panNumber: 'AABCS1429B',
      registeredAddress: 'Plot 42, Baner-Balewadi Road, Pune 411045',
      contactPerson: 'Rajesh Nair (Managing Partner)',
      businessPhone: '+91 98123 45678',
      businessEmail: 'accounts@smashpoint.in',
    },
    verificationDocuments: {
      gstCertificate: { name: 'GST_Reg_Certificate_2026.pdf', size: '1.2 MB', verified: true, uploadedAt: '10 Jan 2026' },
      idProof: { name: 'Managing_Partner_PAN.pdf', size: '640 KB', verified: true, uploadedAt: '10 Jan 2026' },
      addressProof: { name: 'Municipal_Electricity_Bill.pdf', size: '820 KB', verified: true, uploadedAt: '10 Jan 2026' },
      fireNoc: { name: 'Fire_Safety_NOC_SmashPoint.pdf', size: '1.8 MB', verified: true, uploadedAt: '12 Jan 2026' },
    },
    payoutBank: {
      bankName: 'HDFC Bank',
      accountHolderName: 'Smash Point Sports LLP',
      maskedAccountNumber: '••••••••4812',
      ifscCode: 'HDFC0000240',
      branch: 'Baner, Pune',
      payoutSchedule: 'Weekly (Every Monday)',
    },
    venues: [
      { id: 'VN-801', name: 'Smash Point Turf & Badminton Hub', area: 'Baner, Pune', sports: ['Badminton', 'Pickleball'], courtsCount: 4, rating: 4.8 },
      { id: 'VN-805', name: 'Smash Point Box Arena', area: 'Wakad, Pune', sports: ['Box Cricket', 'Football'], courtsCount: 2, rating: 4.6 },
    ],
    financials: {
      totalRevenueGenerated: '₹2,48,900',
      netEarningsDisbursed: '₹2,00,400',
      pendingPayoutBalance: '₹48,500',
      totalBookingsFulfilled: 312,
      completionRate: '98.5%',
    },
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
  },
  {
    id: 'OWN-202',
    name: 'Vikram Joshi',
    email: 'vikram.joshi@skyturf.in',
    phone: '+91 98220 11223',
    city: 'Pune, Maharashtra',
    joinedDate: '10 Aug 2026',
    status: 'active',
    verificationStatus: 'verified',
    suspensionReason: null,
    suspendedAt: null,
    suspendedBy: null,
    businessInfo: {
      businessName: 'SkyTurf Box Sports Pvt Ltd',
      legalEntityType: 'Private Limited Company',
      gstNumber: '27AAACG9981K1ZA',
      panNumber: 'AAACG9981K',
      registeredAddress: 'Rooftop Level 5, FC Road Mall, Shivajinagar, Pune 411005',
      contactPerson: 'Vikram Joshi (Director)',
      businessPhone: '+91 98220 11223',
      businessEmail: 'contact@skyturf.in',
    },
    verificationDocuments: {
      gstCertificate: { name: 'SkyTurf_GSTIN_Certificate.pdf', size: '1.4 MB', verified: true, uploadedAt: '10 Aug 2026' },
      idProof: { name: 'Director_Aadhaar_PAN.pdf', size: '780 KB', verified: true, uploadedAt: '10 Aug 2026' },
      addressProof: { name: 'Commercial_Lease_Agreement.pdf', size: '2.4 MB', verified: true, uploadedAt: '10 Aug 2026' },
      fireNoc: { name: 'Structural_Stability_Rooftop_NOC.pdf', size: '3.1 MB', verified: true, uploadedAt: '12 Aug 2026' },
    },
    payoutBank: {
      bankName: 'ICICI Bank',
      accountHolderName: 'SkyTurf Box Sports Private Limited',
      maskedAccountNumber: '••••••••9931',
      ifscCode: 'ICIC0000104',
      branch: 'FC Road, Pune',
      payoutSchedule: 'Weekly (Every Monday)',
    },
    venues: [
      { id: 'VN-802', name: 'SkyTurf Box Arena', area: 'Shivajinagar, Pune', sports: ['Football', 'Box Cricket'], courtsCount: 3, rating: 4.7 },
    ],
    financials: {
      totalRevenueGenerated: '₹1,56,400',
      netEarningsDisbursed: '₹1,34,300',
      pendingPayoutBalance: '₹22,100',
      totalBookingsFulfilled: 184,
      completionRate: '99.1%',
    },
    complaints: [],
  },
  {
    id: 'OWN-203',
    name: 'Amit Kulkarni',
    email: 'amit@primebadminton.in',
    phone: '+91 99220 88771',
    city: 'Pune, Maharashtra',
    joinedDate: '22 Sep 2026',
    status: 'active',
    verificationStatus: 'pending', // Pending Admin Verification
    suspensionReason: null,
    suspendedAt: null,
    suspendedBy: null,
    businessInfo: {
      businessName: 'Prime Badminton Academy & Sports Club',
      legalEntityType: 'Sole Proprietorship',
      gstNumber: '27AABPK5512L1ZQ',
      panNumber: 'AABPK5512L',
      registeredAddress: 'Survey No. 78, Kothrud Industrial Area, Pune 411038',
      contactPerson: 'Amit Kulkarni (Proprietor)',
      businessPhone: '+91 99220 88771',
      businessEmail: 'amit@primebadminton.in',
    },
    verificationDocuments: {
      gstCertificate: { name: 'Prime_GST_Certificate_2026.pdf', size: '1.1 MB', verified: false, uploadedAt: '22 Sep 2026' },
      idProof: { name: 'Amit_Kulkarni_PAN_Card.pdf', size: '512 KB', verified: false, uploadedAt: '22 Sep 2026' },
      addressProof: { name: 'Kothrud_Shop_Act_License.pdf', size: '920 KB', verified: false, uploadedAt: '22 Sep 2026' },
      fireNoc: null,
    },
    payoutBank: {
      bankName: 'State Bank of India',
      accountHolderName: 'Prime Badminton Academy',
      maskedAccountNumber: '••••••••1104',
      ifscCode: 'SBIN0001324',
      branch: 'Kothrud, Pune',
      payoutSchedule: 'Weekly (Every Monday)',
    },
    venues: [
      { id: 'VN-807', name: 'Prime Badminton Academy Hub', area: 'Kothrud, Pune', sports: ['Badminton', 'Table Tennis'], courtsCount: 6, rating: 4.5 },
    ],
    financials: {
      totalRevenueGenerated: '₹0 (New Onboarding)',
      netEarningsDisbursed: '₹0',
      pendingPayoutBalance: '₹0',
      totalBookingsFulfilled: 0,
      completionRate: 'N/A',
    },
    complaints: [
      {
        id: 'TKT-9410',
        category: 'Onboarding & Verification',
        subject: 'KYC documents submitted, awaiting admin approval',
        status: 'Open',
        date: '23 Sep 2026',
        resolution: 'Admin compliance team reviewing Shop Act and GST certificate.',
      },
    ],
  },
  {
    id: 'OWN-204',
    name: 'Nikhil Shinde',
    email: 'nikhil@futsalpark.in',
    phone: '+91 97650 44332',
    city: 'Pune, Maharashtra',
    joinedDate: '01 Sep 2026',
    status: 'suspended', // Suspended
    verificationStatus: 'rejected',
    suspensionReason: 'Expired GSTIN certificate, missing Fire Safety NOC, and multiple player complaints of slot double-booking.',
    suspendedAt: '2026-09-20T16:00:00Z',
    suspendedBy: 'Sarah Connor (ADM-9001)',
    businessInfo: {
      businessName: 'Futsal Park Pune Enterprises',
      legalEntityType: 'Partnership Firm',
      gstNumber: '27AABCF1123M1Z9 (Flagged)',
      panNumber: 'AABCF1123M',
      registeredAddress: 'Plot 19, Magarpatta Sports Complex, Hadapsar, Pune 411028',
      contactPerson: 'Nikhil Shinde (Partner)',
      businessPhone: '+91 97650 44332',
      businessEmail: 'nikhil@futsalpark.in',
    },
    verificationDocuments: {
      gstCertificate: { name: 'GSTIN_Expired_Doc.pdf', size: '890 KB', verified: false, uploadedAt: '01 Sep 2026' },
      idProof: { name: 'Partner_Aadhaar.pdf', size: '610 KB', verified: true, uploadedAt: '01 Sep 2026' },
      addressProof: { name: 'Hadapsar_Address_Lease.pdf', size: '1.5 MB', verified: false, uploadedAt: '01 Sep 2026' },
      fireNoc: null,
    },
    payoutBank: {
      bankName: 'Axis Bank',
      accountHolderName: 'Futsal Park Enterprises',
      maskedAccountNumber: '••••••••6671',
      ifscCode: 'UTIB0000512',
      branch: 'Hadapsar, Pune',
      payoutSchedule: 'Weekly (Every Monday)',
    },
    venues: [
      { id: 'VN-808', name: 'Magarpatta Futsal Park', area: 'Hadapsar, Pune', sports: ['Football'], courtsCount: 2, rating: 3.8 },
    ],
    financials: {
      totalRevenueGenerated: '₹34,200',
      netEarningsDisbursed: '₹34,200',
      pendingPayoutBalance: '₹0 (Frozen)',
      totalBookingsFulfilled: 42,
      completionRate: '84.2%',
    },
    complaints: [
      {
        id: 'TKT-9355',
        category: 'Double Booking Dispute',
        subject: 'Player slot was given to unregistered local team',
        status: 'Resolved',
        date: '18 Sep 2026',
        resolution: 'User refunded by Arena platform. Owner issued severe penalty warning.',
      },
      {
        id: 'TKT-9362',
        category: 'KYC Compliance Failure',
        subject: 'Failed fire safety inspection notice from local municipal corp',
        status: 'Resolved',
        date: '20 Sep 2026',
        resolution: 'Account suspended pending updated fire NOC.',
      },
    ],
  },
  {
    id: 'OWN-205',
    name: 'Priya Malhotra',
    email: 'priya@vimanarena.in',
    phone: '+91 98225 33445',
    city: 'Pune, Maharashtra',
    joinedDate: '15 Feb 2026',
    status: 'active',
    verificationStatus: 'verified',
    suspensionReason: null,
    suspendedAt: null,
    suspendedBy: null,
    businessInfo: {
      businessName: 'Viman Sports Complex LLP',
      legalEntityType: 'Limited Liability Partnership',
      gstNumber: '27AABCV8810N1ZW',
      panNumber: 'AABCV8810N',
      registeredAddress: 'Near Phoenix Market City, Viman Nagar, Pune 411014',
      contactPerson: 'Priya Malhotra (Partner)',
      businessPhone: '+91 98225 33445',
      businessEmail: 'priya@vimanarena.in',
    },
    verificationDocuments: {
      gstCertificate: { name: 'Viman_GST_Certificate.pdf', size: '1.3 MB', verified: true, uploadedAt: '15 Feb 2026' },
      idProof: { name: 'Priya_Malhotra_ID.pdf', size: '600 KB', verified: true, uploadedAt: '15 Feb 2026' },
      addressProof: { name: 'Viman_Nagar_Lease.pdf', size: '2.1 MB', verified: true, uploadedAt: '15 Feb 2026' },
      fireNoc: { name: 'Fire_Dept_Approval_2026.pdf', size: '1.9 MB', verified: true, uploadedAt: '18 Feb 2026' },
    },
    payoutBank: {
      bankName: 'Kotak Mahindra Bank',
      accountHolderName: 'Viman Sports Complex LLP',
      maskedAccountNumber: '••••••••7721',
      ifscCode: 'KKBK0001789',
      branch: 'Viman Nagar, Pune',
      payoutSchedule: 'Weekly (Every Monday)',
    },
    venues: [
      { id: 'VN-804', name: 'Apex Sports Arena & Tennis Club', area: 'Viman Nagar, Pune', sports: ['Tennis', 'Badminton', 'Swimming'], courtsCount: 8, rating: 4.9 },
    ],
    financials: {
      totalRevenueGenerated: '₹3,82,600',
      netEarningsDisbursed: '₹3,20,000',
      pendingPayoutBalance: '₹62,600',
      totalBookingsFulfilled: 480,
      completionRate: '99.4%',
    },
    complaints: [],
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

export const adminOwnerService = {
  /**
   * Load master owners from localStorage
   */
  getStoredOwners() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADMIN_OWNERS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_ADMIN_OWNERS, JSON.stringify(INITIAL_OWNERS_MASTER));
        return INITIAL_OWNERS_MASTER;
      }
      return JSON.parse(raw);
    } catch (e) {
      return INITIAL_OWNERS_MASTER;
    }
  },

  /**
   * Save master owners to localStorage
   */
  saveOwners(owners) {
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_OWNERS, JSON.stringify(owners));
    } catch (e) {
      console.error('Failed to save master owners:', e);
    }
  },

  /**
   * GET /admin/owners
   * Query owners with search, verification status, and account status filters
   */
  async getOwners({ search = '', verificationStatus = 'all', status = 'all' } = {}) {
    await new Promise((r) => setTimeout(r, 300));

    let list = this.getStoredOwners();

    // 1. Verification filter: 'all' | 'pending' | 'verified' | 'rejected'
    if (verificationStatus && verificationStatus !== 'all') {
      list = list.filter((o) => o.verificationStatus === verificationStatus);
    }

    // 2. Account Status filter: 'all' | 'active' | 'suspended'
    if (status && status !== 'all') {
      list = list.filter((o) => o.status === status);
    }

    // 3. Search query: matches owner name, business name, email, phone, city, GST, or ID
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.name.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.businessInfo.businessName.toLowerCase().includes(q) ||
          o.businessInfo.gstNumber.toLowerCase().includes(q) ||
          o.city.toLowerCase().includes(q) ||
          o.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      );
    }

    const allOwners = this.getStoredOwners();

    return {
      success: true,
      total: list.length,
      counts: {
        all: allOwners.length,
        pending: allOwners.filter((o) => o.verificationStatus === 'pending').length,
        verified: allOwners.filter((o) => o.verificationStatus === 'verified' && o.status === 'active').length,
        suspended: allOwners.filter((o) => o.status === 'suspended').length,
      },
      owners: list,
    };
  },

  /**
   * GET /admin/owners/:id
   * Retrieve full details of an owner
   */
  async getOwnerDetails(ownerId) {
    await new Promise((r) => setTimeout(r, 200));

    const list = this.getStoredOwners();
    const owner = list.find((o) => o.id === ownerId);

    if (!owner) {
      throw new Error(`Venue Owner with ID "${ownerId}" not found.`);
    }

    return {
      success: true,
      owner,
    };
  },

  /**
   * POST /admin/owners/:id/verify
   * Verify and approve an owner's business KYC documents
   */
  async verifyOwner(ownerId, adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    if (!ownerId) throw new Error('Owner ID is required.');

    await new Promise((r) => setTimeout(r, 450));

    const list = this.getStoredOwners();
    const index = list.findIndex((o) => o.id === ownerId);

    if (index === -1) {
      throw new Error(`Owner with ID "${ownerId}" not found.`);
    }

    const updatedOwner = {
      ...list[index],
      verificationStatus: 'verified',
      status: 'active',
      suspensionReason: null,
      suspendedAt: null,
      suspendedBy: null,
      verificationDocuments: {
        ...list[index].verificationDocuments,
        gstCertificate: list[index].verificationDocuments.gstCertificate ? { ...list[index].verificationDocuments.gstCertificate, verified: true } : null,
        idProof: list[index].verificationDocuments.idProof ? { ...list[index].verificationDocuments.idProof, verified: true } : null,
        addressProof: list[index].verificationDocuments.addressProof ? { ...list[index].verificationDocuments.addressProof, verified: true } : null,
      },
    };

    list[index] = updatedOwner;
    this.saveOwners(list);

    // Sync verification store
    try {
      const allVerif = JSON.parse(localStorage.getItem(STORAGE_KEY_VERIFICATION) || '{}');
      if (allVerif[ownerId]) {
        allVerif[ownerId].status = 'verified';
        allVerif[ownerId].rejectionReason = null;
        localStorage.setItem(STORAGE_KEY_VERIFICATION, JSON.stringify(allVerif));
      }
    } catch (e) {
      console.error('Failed to sync verification store:', e);
    }

    // Record Security Audit Log
    recordAuditEntry('OWNER_KYC_VERIFIED', {
      ownerId: updatedOwner.id,
      ownerName: updatedOwner.name,
      businessName: updatedOwner.businessInfo.businessName,
      adminId,
      adminName,
    });

    return {
      success: true,
      message: `Owner "${updatedOwner.name}" has been verified and approved.`,
      owner: updatedOwner,
    };
  },

  /**
   * POST /admin/owners/:id/suspend
   * Suspend an owner's account (requires mandatory reason)
   */
  async suspendOwner(ownerId, reason, adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    if (!ownerId) throw new Error('Owner ID is required.');
    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed reason (minimum 5 characters) is required to suspend an owner.');
    }

    await new Promise((r) => setTimeout(r, 450));

    const list = this.getStoredOwners();
    const index = list.findIndex((o) => o.id === ownerId);

    if (index === -1) {
      throw new Error(`Owner with ID "${ownerId}" not found.`);
    }

    const timestamp = new Date().toISOString();
    const updatedOwner = {
      ...list[index],
      status: 'suspended',
      suspensionReason: reason.trim(),
      suspendedAt: timestamp,
      suspendedBy: `${adminName} (${adminId})`,
    };

    list[index] = updatedOwner;
    this.saveOwners(list);

    // Record Security Audit Log
    recordAuditEntry('OWNER_SUSPENDED', {
      ownerId: updatedOwner.id,
      ownerName: updatedOwner.name,
      businessName: updatedOwner.businessInfo.businessName,
      reason: reason.trim(),
      adminId,
      adminName,
    });

    return {
      success: true,
      message: `Owner "${updatedOwner.name}" has been suspended.`,
      owner: updatedOwner,
    };
  },

  /**
   * POST /admin/owners/:id/reactivate
   * Reactivate a suspended owner's account
   */
  async reactivateOwner(ownerId, adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    if (!ownerId) throw new Error('Owner ID is required.');

    await new Promise((r) => setTimeout(r, 450));

    const list = this.getStoredOwners();
    const index = list.findIndex((o) => o.id === ownerId);

    if (index === -1) {
      throw new Error(`Owner with ID "${ownerId}" not found.`);
    }

    const updatedOwner = {
      ...list[index],
      status: 'active',
      suspensionReason: null,
      suspendedAt: null,
      suspendedBy: null,
    };

    list[index] = updatedOwner;
    this.saveOwners(list);

    // Record Security Audit Log
    recordAuditEntry('OWNER_REACTIVATED', {
      ownerId: updatedOwner.id,
      ownerName: updatedOwner.name,
      businessName: updatedOwner.businessInfo.businessName,
      adminId,
      adminName,
    });

    return {
      success: true,
      message: `Owner "${updatedOwner.name}" has been reactivated.`,
      owner: updatedOwner,
    };
  },
};
