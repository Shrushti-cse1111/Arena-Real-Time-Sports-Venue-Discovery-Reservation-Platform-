/**
 * ARENA — ADMIN VENUE APPROVAL & KYC SERVICE
 * Implements the Venue Approval Queue API endpoints:
 *   GET  /admin/venues
 *   GET  /admin/venues/:id
 *   POST /admin/venues/:id/approve
 *   POST /admin/venues/:id/reject
 * 
 * Rules:
 *   - Reject requires a mandatory reason.
 *   - Approved venues become active & visible to players in the venue catalog.
 *   - Rejected venues remain hidden with rejection reason preserved.
 *   - Records Admin ID + timestamp + action in security audit trail.
 */

const STORAGE_KEY_ADMIN_VENUES = 'arena_admin_venues_master';
const STORAGE_KEY_OWNER_VENUES = 'arena_owner_venues';
const STORAGE_KEY_ADMIN_AUDIT = 'arena_admin_audit_log';

// Rich Master Venue KYC Queue Database
const INITIAL_VENUE_KYC_MASTER = [
  {
    id: 'VEN-KYC-101',
    name: 'SkyTurf Arena & Sports Complex',
    description: 'Premier multi-sport turf facility featuring FIFA-grade 5-a-side AstroTurf pitches and automated floodlight tracking.',
    sports: ['Football', 'Box Cricket'],
    primarySport: 'Football',
    courtsCount: 3,
    courts: [
      { name: 'FIFA AstroTurf Pitch 1', type: 'Synthetic Grass (5-a-side)', basePrice: 850, peakPrice: 1200 },
      { name: 'FIFA AstroTurf Pitch 2', type: 'Synthetic Grass (5-a-side)', basePrice: 850, peakPrice: 1200 },
      { name: 'Box Cricket Arena', type: 'High Density Turf', basePrice: 750, peakPrice: 1000 },
    ],
    pricing: {
      baseHourlyRate: 850,
      peakHourlyRate: 1200,
      weekendRate: 1350,
      currency: 'INR (₹)',
    },
    location: {
      address: 'Survey No. 42, Near Paud Road Flyover, Kothrud',
      area: 'Kothrud',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
      coordinates: { lat: 18.5074, lng: 73.8077 },
    },
    owner: {
      id: 'OWN-9822',
      name: 'Vikram Joshi',
      businessName: 'SkyTurf Sports Pvt. Ltd.',
      email: 'vikram.joshi@skyturf.in',
      phone: '+91 98220 11223',
      alternatePhone: '+91 98220 99881',
      joinedDate: '2026-08-10',
    },
    photos: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1529900240051-06c3960f7038?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: ['Floodlights', 'Dressing Room', 'Parking (30+ Cars)', 'First Aid Station', 'Cafeteria', 'Clean Washrooms'],
    documents: [
      {
        id: 'DOC-GST',
        type: 'GST Registration Certificate',
        number: '27AABCS1429B1ZX',
        fileName: 'SkyTurf_GSTIN_Certificate_2026.pdf',
        size: '1.4 MB',
        verified: true,
      },
      {
        id: 'DOC-PAN',
        type: 'Business PAN Card',
        number: 'AABCS1429B',
        fileName: 'Company_PAN_SkyTurf.pdf',
        size: '620 KB',
        verified: true,
      },
      {
        id: 'DOC-NOC',
        type: 'Municipal Corporation Sports NOC',
        number: 'PMC/NOC/2026/9021',
        fileName: 'PMC_FireSafety_NOC.pdf',
        size: '2.1 MB',
        verified: true,
      },
      {
        id: 'DOC-BANK',
        type: 'Bank Mandate & Cancelled Cheque',
        number: 'HDFC Bank (••••4812)',
        fileName: 'HDFC_Cancelled_Cheque.jpg',
        size: '840 KB',
        verified: true,
      },
    ],
    payoutBank: {
      accountHolder: 'SkyTurf Sports Pvt Ltd',
      bankName: 'HDFC Bank',
      branch: 'Kothrud Branch, Pune',
      accountNumber: '••••••••4812',
      ifscCode: 'HDFC0000240',
    },
    status: 'pending', // 'pending' | 'approved' | 'rejected'
    submittedAt: 'Today, 10:30 AM',
    submittedTimestamp: '2026-09-30T10:30:00Z',
    rejectionReason: null,
    reviewHistory: [],
  },
  {
    id: 'VEN-KYC-102',
    name: 'SmashPro Badminton Hub & Academy',
    description: 'International tournament-grade indoor badminton facility with 4 BWF certified synthetic rubber mats and LED glare-free lighting.',
    sports: ['Badminton', 'Pickleball'],
    primarySport: 'Badminton',
    courtsCount: 4,
    courts: [
      { name: 'Synthetic Court 1 (BWF Mat)', type: 'BWF Synthetic Rubber', basePrice: 600, peakPrice: 800 },
      { name: 'Synthetic Court 2 (BWF Mat)', type: 'BWF Synthetic Rubber', basePrice: 600, peakPrice: 800 },
      { name: 'Synthetic Court 3 (Teak Wood)', type: 'Teak Wood Cushion', basePrice: 650, peakPrice: 850 },
      { name: 'Pickleball Court A', type: 'Acrylic Cushion', basePrice: 500, peakPrice: 700 },
    ],
    pricing: {
      baseHourlyRate: 600,
      peakHourlyRate: 800,
      weekendRate: 900,
      currency: 'INR (₹)',
    },
    location: {
      address: 'Plot 18, Near Ganraj Chowk, Baner Road',
      area: 'Baner',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      coordinates: { lat: 18.559, lng: 73.7868 },
    },
    owner: {
      id: 'OWN-9845',
      name: 'Ananya Deshmukh',
      businessName: 'SmashPro Sports Enterprises',
      email: 'ananya@smashpro.in',
      phone: '+91 98450 44556',
      alternatePhone: '+91 98450 11223',
      joinedDate: '2026-08-22',
    },
    photos: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: ['Non-Marking Shoes Mandatory', 'Equipment Racket Rental', 'Changing Rooms', 'Drinking Water', 'Parking'],
    documents: [
      {
        id: 'DOC-GST',
        type: 'GST Registration Certificate',
        number: '27BAPPD9012K1Z9',
        fileName: 'SmashPro_GST_Doc.pdf',
        size: '1.1 MB',
        verified: true,
      },
      {
        id: 'DOC-PAN',
        type: 'Business PAN Card',
        number: 'BAPPD9012K',
        fileName: 'PAN_Ananya_Deshmukh.pdf',
        size: '480 KB',
        verified: true,
      },
      {
        id: 'DOC-UTIL',
        type: 'Commercial Electricity Connection Bill',
        number: 'MSEDCL/BN/2026/812',
        fileName: 'Commercial_Electricity_Bill.pdf',
        size: '790 KB',
        verified: true,
      },
    ],
    payoutBank: {
      accountHolder: 'SmashPro Sports Enterprises',
      bankName: 'ICICI Bank',
      branch: 'Baner Main Branch',
      accountNumber: '••••••••9031',
      ifscCode: 'ICIC0000104',
    },
    status: 'pending',
    submittedAt: 'Yesterday, 04:15 PM',
    submittedTimestamp: '2026-09-29T16:15:00Z',
    rejectionReason: null,
    reviewHistory: [],
  },
  {
    id: 'VEN-KYC-103',
    name: 'Velocity Tennis & Squash Club',
    description: 'Pro tennis courts and glass squash courts with coaching academies and pro equipment shop on site.',
    sports: ['Tennis', 'Squash'],
    primarySport: 'Tennis',
    courtsCount: 2,
    courts: [
      { name: 'Acrylic Hard Court 1', type: 'US Open Acrylic Surface', basePrice: 1100, peakPrice: 1500 },
      { name: 'Glass Backed Squash Court', type: 'ASB Squash Court', basePrice: 900, peakPrice: 1200 },
    ],
    pricing: {
      baseHourlyRate: 1100,
      peakHourlyRate: 1500,
      weekendRate: 1600,
      currency: 'INR (₹)',
    },
    location: {
      address: 'Lane 7, Behind Joggers Park, Kalyani Nagar',
      area: 'Kalyani Nagar',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411006',
      coordinates: { lat: 18.5482, lng: 73.9034 },
    },
    owner: {
      id: 'OWN-9890',
      name: 'Sameer Kulkarni',
      businessName: 'Velocity Sports & Fitness Club',
      email: 'sameer@velocitysports.com',
      phone: '+91 98901 22334',
      alternatePhone: null,
      joinedDate: '2026-07-15',
    },
    photos: [
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: ['Showers', 'Coaching Staff', 'Pro Shop', 'Floodlights', 'Valet Parking'],
    documents: [
      {
        id: 'DOC-REG',
        type: 'Club Registration Certificate',
        number: 'MH/PUN/2026/REG401',
        fileName: 'Velocity_Club_Registration.pdf',
        size: '2.8 MB',
        verified: true,
      },
      {
        id: 'DOC-ID',
        type: 'Government ID Proof (Aadhaar/Passport)',
        number: '••••••••8912',
        fileName: 'Owner_Aadhaar_Verified.pdf',
        size: '450 KB',
        verified: true,
      },
    ],
    payoutBank: {
      accountHolder: 'Velocity Sports and Fitness',
      bankName: 'Kotak Mahindra Bank',
      branch: 'Kalyani Nagar Branch',
      accountNumber: '••••••••1154',
      ifscCode: 'KKBK0001789',
    },
    status: 'pending',
    submittedAt: '28 Sep 2026',
    submittedTimestamp: '2026-09-28T11:00:00Z',
    rejectionReason: null,
    reviewHistory: [],
  },
  {
    id: 'VEN-KYC-104',
    name: 'Arena Sports Club - FC Road',
    description: 'Comprehensive sports facility with 4 badminton courts, tennis and net cricket.',
    sports: ['Badminton', 'Tennis', 'Cricket'],
    primarySport: 'Badminton',
    courtsCount: 4,
    courts: [
      { name: 'Court 1', type: 'Synthetic', basePrice: 650, peakPrice: 850 },
      { name: 'Court 2', type: 'Synthetic', basePrice: 650, peakPrice: 850 },
    ],
    pricing: {
      baseHourlyRate: 650,
      peakHourlyRate: 850,
      weekendRate: 950,
      currency: 'INR (₹)',
    },
    location: {
      address: 'FC Road, Shivaji Nagar, Pune',
      area: 'FC Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411005',
      coordinates: { lat: 18.5204, lng: 73.8567 },
    },
    owner: {
      id: 'OWN-101',
      name: 'Rajesh Nair',
      businessName: 'Apex Arena Ltd',
      email: 'partner@arena.com',
      phone: '+91 98765 43210',
      alternatePhone: null,
      joinedDate: '2026-01-10',
    },
    photos: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: ['Parking', 'Locker Room', 'Floodlights', 'Drinking Water'],
    documents: [
      { id: 'DOC-GST', type: 'GST Certificate', number: '27AABCS9999Z1ZX', fileName: 'GSTIN_Verified.pdf', size: '1.2 MB', verified: true },
    ],
    payoutBank: {
      accountHolder: 'Apex Arena Ltd',
      bankName: 'HDFC Bank',
      branch: 'Shivaji Nagar',
      accountNumber: '••••••••9901',
      ifscCode: 'HDFC0000240',
    },
    status: 'approved',
    submittedAt: '15 Sep 2026',
    submittedTimestamp: '2026-09-15T09:00:00Z',
    rejectionReason: null,
    reviewHistory: [
      {
        adminId: 'ADM-9001',
        adminName: 'Sarah Connor',
        action: 'APPROVED',
        timestamp: '2026-09-15T14:30:00Z',
        note: 'All GST and Fire safety documents verified.',
      },
    ],
  },
  {
    id: 'VEN-KYC-105',
    name: 'Pune Futsal & Cricket Park - Aundh',
    description: 'Outdoor AstroTurf ground with net enclosures for football & box cricket.',
    sports: ['Football', 'Cricket'],
    primarySport: 'Football',
    courtsCount: 1,
    courts: [
      { name: 'Ground A', type: 'AstroTurf', basePrice: 900, peakPrice: 1200 },
    ],
    pricing: {
      baseHourlyRate: 900,
      peakHourlyRate: 1200,
      weekendRate: 1300,
      currency: 'INR (₹)',
    },
    location: {
      address: 'DP Road, Near Brehmen Circle, Aundh',
      area: 'Aundh',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411007',
      coordinates: { lat: 18.558, lng: 73.807 },
    },
    owner: {
      id: 'OWN-9765',
      name: 'Nikhil Shinde',
      businessName: 'Shinde Sports Infrastructure',
      email: 'nikhil@futsalpark.in',
      phone: '+91 97650 44332',
      alternatePhone: null,
      joinedDate: '2026-09-01',
    },
    photos: [
      'https://images.unsplash.com/photo-1529900240051-06c3960f7038?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: ['Floodlights', 'Parking'],
    documents: [
      { id: 'DOC-GST', type: 'GST Certificate', number: '27AABCS0000Z1ZX', fileName: 'GST_Expired.pdf', size: '950 KB', verified: false },
    ],
    payoutBank: {
      accountHolder: 'Nikhil Shinde',
      bankName: 'State Bank of India',
      branch: 'Aundh Branch',
      accountNumber: '••••••••3312',
      ifscCode: 'SBIN0001324',
    },
    status: 'rejected',
    submittedAt: '20 Sep 2026',
    submittedTimestamp: '2026-09-20T10:00:00Z',
    rejectionReason: 'GST registration certificate provided is expired and Municipal Fire Safety NOC is missing.',
    reviewHistory: [
      {
        adminId: 'ADM-9001',
        adminName: 'Sarah Connor',
        action: 'REJECTED',
        timestamp: '2026-09-20T16:00:00Z',
        note: 'GST registration certificate provided is expired and Municipal Fire Safety NOC is missing.',
      },
    ],
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

export const adminVenueService = {
  /**
   * Internal loader for venue master datastore
   */
  getStoredMasterVenues() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADMIN_VENUES);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_ADMIN_VENUES, JSON.stringify(INITIAL_VENUE_KYC_MASTER));
        return INITIAL_VENUE_KYC_MASTER;
      }
      return JSON.parse(raw);
    } catch (e) {
      return INITIAL_VENUE_KYC_MASTER;
    }
  },

  /**
   * Save venue master list to localStorage
   */
  saveMasterVenues(venues) {
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_VENUES, JSON.stringify(venues));
    } catch (e) {
      console.error('Failed to save master venues:', e);
    }
  },

  /**
   * GET /admin/venues
   * Query all venue approvals with search, status filter, and sport filter
   * @param {Object} query - { search, status, sport }
   * @returns {Promise<Array>}
   */
  async getVenues({ search = '', status = 'all', sport = 'all' } = {}) {
    await new Promise((r) => setTimeout(r, 350));

    let list = this.getStoredMasterVenues();

    // 1. Filter by status: 'all' | 'pending' | 'approved' | 'rejected'
    if (status && status !== 'all') {
      const targetStatus = status.toLowerCase();
      list = list.filter((v) => {
        if (targetStatus === 'approved') return v.status === 'approved' || v.status === 'verified';
        return v.status.toLowerCase() === targetStatus;
      });
    }

    // 2. Filter by sport: 'all' | 'Badminton' | 'Football' | 'Cricket' | etc.
    if (sport && sport !== 'all') {
      list = list.filter((v) =>
        v.sports?.some((s) => s.toLowerCase() === sport.toLowerCase()) ||
        (v.primarySport && v.primarySport.toLowerCase() === sport.toLowerCase())
      );
    }

    // 3. Search query: matches venue name, owner name, area, GSTIN, or ID
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((v) =>
        v.id.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.owner.name.toLowerCase().includes(q) ||
        v.owner.businessName?.toLowerCase().includes(q) ||
        v.location.area.toLowerCase().includes(q) ||
        v.location.city.toLowerCase().includes(q) ||
        v.documents?.some((d) => d.number?.toLowerCase().includes(q))
      );
    }

    return {
      success: true,
      total: list.length,
      counts: {
        all: this.getStoredMasterVenues().length,
        pending: this.getStoredMasterVenues().filter((v) => v.status === 'pending').length,
        approved: this.getStoredMasterVenues().filter((v) => v.status === 'approved' || v.status === 'verified').length,
        rejected: this.getStoredMasterVenues().filter((v) => v.status === 'rejected').length,
      },
      venues: list,
    };
  },

  /**
   * GET /admin/venues/:id
   * Retrieve full details of a specific venue submission
   * @param {string} venueId
   * @returns {Promise<Object>}
   */
  async getVenueDetails(venueId) {
    await new Promise((r) => setTimeout(r, 250));

    const list = this.getStoredMasterVenues();
    const venue = list.find((v) => v.id === venueId);

    if (!venue) {
      throw new Error(`Venue with ID "${venueId}" was not found.`);
    }

    return {
      success: true,
      venue,
    };
  },

  /**
   * POST /admin/venues/:id/approve
   * Approves a venue KYC submission. Makes venue visible to players in search/listings.
   * @param {string} venueId
   * @param {string} adminId
   * @param {string} adminName
   * @param {string} adminNote
   * @returns {Promise<Object>}
   */
  async approveVenue(venueId, adminId = 'ADM-9001', adminName = 'Sarah Connor', adminNote = '') {
    if (!venueId) {
      throw new Error('Venue ID is required to approve.');
    }

    await new Promise((r) => setTimeout(r, 550));

    const list = this.getStoredMasterVenues();
    const index = list.findIndex((v) => v.id === venueId);

    if (index === -1) {
      throw new Error(`Venue with ID "${venueId}" was not found.`);
    }

    const timestamp = new Date().toISOString();

    const updatedVenue = {
      ...list[index],
      status: 'approved',
      rejectionReason: null,
      reviewedAt: timestamp,
      reviewedBy: { adminId, adminName },
      reviewHistory: [
        {
          adminId,
          adminName,
          action: 'APPROVED',
          timestamp,
          note: adminNote || 'All compliance documents verified. Venue published to public catalog.',
        },
        ...(list[index].reviewHistory || []),
      ],
    };

    list[index] = updatedVenue;
    this.saveMasterVenues(list);

    // Sync with Owner & Player Venues catalog so players can discover and book it immediately!
    this.syncWithPlayerCatalog(updatedVenue);

    // Record Immutable Security Audit Log
    recordAuditEntry('VENUE_APPROVED', {
      venueId: updatedVenue.id,
      venueName: updatedVenue.name,
      ownerName: updatedVenue.owner.name,
      adminId,
      adminName,
      status: 'approved',
    });

    return {
      success: true,
      message: `Venue "${updatedVenue.name}" has been approved and published to player search.`,
      venue: updatedVenue,
    };
  },

  /**
   * POST /admin/venues/:id/reject
   * Rejects a venue KYC submission. Mandatory reason required. Venue remains hidden.
   * @param {string} venueId
   * @param {string} reason
   * @param {string} adminId
   * @param {string} adminName
   * @returns {Promise<Object>}
   */
  async rejectVenue(venueId, reason, adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    if (!venueId) {
      throw new Error('Venue ID is required to reject.');
    }

    // MANDATORY RULE: Reject requires a reason
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      throw new Error('A valid rejection reason (minimum 5 characters) is mandatory to reject a venue submission.');
    }

    await new Promise((r) => setTimeout(r, 550));

    const list = this.getStoredMasterVenues();
    const index = list.findIndex((v) => v.id === venueId);

    if (index === -1) {
      throw new Error(`Venue with ID "${venueId}" was not found.`);
    }

    const timestamp = new Date().toISOString();
    const cleanReason = reason.trim();

    const updatedVenue = {
      ...list[index],
      status: 'rejected',
      rejectionReason: cleanReason,
      reviewedAt: timestamp,
      reviewedBy: { adminId, adminName },
      reviewHistory: [
        {
          adminId,
          adminName,
          action: 'REJECTED',
          timestamp,
          note: cleanReason,
        },
        ...(list[index].reviewHistory || []),
      ],
    };

    list[index] = updatedVenue;
    this.saveMasterVenues(list);

    // Hide / Remove from active player catalog
    this.removeFromPlayerCatalog(updatedVenue.id);

    // Record Immutable Security Audit Log
    recordAuditEntry('VENUE_REJECTED', {
      venueId: updatedVenue.id,
      venueName: updatedVenue.name,
      ownerName: updatedVenue.owner.name,
      adminId,
      adminName,
      reason: cleanReason,
      status: 'rejected',
    });

    return {
      success: true,
      message: `Venue "${updatedVenue.name}" has been rejected. Reason logged for partner review.`,
      venue: updatedVenue,
    };
  },

  /**
   * Helper: Push approved venue into player-visible catalog in localStorage
   */
  syncWithPlayerCatalog(venue) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_OWNER_VENUES);
      let ownerVenues = raw ? JSON.parse(raw) : [];

      const playerVenueRecord = {
        id: venue.id,
        name: venue.name,
        sports: venue.sports,
        primarySport: venue.primarySport,
        address: venue.location.address,
        location: `${venue.location.area}, ${venue.location.city}`,
        latitude: venue.location.coordinates?.lat || 18.5204,
        longitude: venue.location.coordinates?.lng || 73.8567,
        photos: venue.photos,
        amenities: venue.amenities,
        ownerId: venue.owner.id,
        status: 'active',
        rating: 4.9,
        reviewsCount: 1,
        courtsCount: venue.courtsCount,
        courts: venue.courts,
        createdAt: venue.submittedTimestamp || new Date().toISOString(),
      };

      // Upsert
      const existingIdx = ownerVenues.findIndex((v) => v.id === venue.id);
      if (existingIdx >= 0) {
        ownerVenues[existingIdx] = playerVenueRecord;
      } else {
        ownerVenues = [playerVenueRecord, ...ownerVenues];
      }

      localStorage.setItem(STORAGE_KEY_OWNER_VENUES, JSON.stringify(ownerVenues));
    } catch (e) {
      console.error('Failed to sync approved venue to player catalog:', e);
    }
  },

  /**
   * Helper: Remove / deactivate rejected venue from player-visible catalog
   */
  removeFromPlayerCatalog(venueId) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_OWNER_VENUES);
      if (!raw) return;
      let ownerVenues = JSON.parse(raw);
      ownerVenues = ownerVenues.map((v) => (v.id === venueId ? { ...v, status: 'rejected' } : v));
      localStorage.setItem(STORAGE_KEY_OWNER_VENUES, JSON.stringify(ownerVenues));
    } catch (e) {
      console.error('Failed to update rejected venue status in catalog:', e);
    }
  },
};
