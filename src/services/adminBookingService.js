/**
 * ARENA — ADMIN BOOKING & DISPUTE MANAGEMENT SERVICE
 * Handles comprehensive platform booking records, payment breakdown,
 * cancellation/refund tracking, and dispute resolutions with immutable audit trail.
 * 
 * Endpoints:
 *   GET   /admin/bookings
 *   GET   /admin/bookings/:id
 *   GET   /admin/bookings/:id/dispute
 *   PATCH /admin/bookings/:id/dispute
 */

const STORAGE_KEY_ADMIN_BOOKINGS = 'arena_admin_bookings_master';
const STORAGE_KEY_ADMIN_AUDIT = 'arena_admin_audit_log';

// Rich Master Bookings Record
const INITIAL_BOOKINGS_MASTER = [
  {
    id: 'BK-1081',
    customer: {
      id: 'USR-1001',
      name: 'Rahul Mehta',
      phone: '+91 98221 44551',
      email: 'rahul.mehta@example.com',
    },
    owner: {
      id: 'OWN-201',
      name: 'Rajesh Nair',
      businessName: 'Smash Point Sports & Leisure LLP',
      phone: '+91 98123 45678',
    },
    venue: 'Deccan Sports Arena',
    venueId: 'VN-801',
    court: 'Synthetic Court 1 (Badminton)',
    sport: 'Badminton',
    date: '01 Oct 2026',
    time: '6:00 PM – 7:00 PM',
    amount: 650,
    platformCommission: 65, // 10%
    ownerPayout: 585,
    commissionRate: 10,
    payment: {
      method: 'UPI (Google Pay)',
      transactionId: 'TXN-UPI-98210492',
      gateway: 'Razorpay PG',
      status: 'Captured',
      paidAt: '01 Oct 2026, 17:45',
    },
    status: 'upcoming', // 'upcoming' | 'completed' | 'cancelled' | 'disputed'
    cancellation: null,
    refund: null,
    dispute: null,
  },
  {
    id: 'BK-1082',
    customer: {
      id: 'USR-1002',
      name: 'Priya Singh',
      phone: '+91 97632 11990',
      email: 'priya.singh@example.com',
    },
    owner: {
      id: 'OWN-205',
      name: 'Priya Malhotra',
      businessName: 'Viman Sports Complex LLP',
      phone: '+91 98225 33445',
    },
    venue: 'Apex Sports Arena & Tennis Club',
    venueId: 'VN-804',
    court: 'Clay Tennis Court A',
    sport: 'Tennis',
    date: '01 Oct 2026',
    time: '7:00 AM – 8:00 AM',
    amount: 1100,
    platformCommission: 110,
    ownerPayout: 990,
    commissionRate: 10,
    payment: {
      method: 'Credit Card (HDFC Bank)',
      transactionId: 'TXN-CC-84910214',
      gateway: 'Razorpay PG',
      status: 'Captured',
      paidAt: '30 Sep 2026, 21:15',
    },
    status: 'completed',
    cancellation: null,
    refund: null,
    dispute: null,
  },
  {
    id: 'BK-1077',
    customer: {
      id: 'USR-1005',
      name: 'Sneha Rao',
      phone: '+91 97651 88990',
      email: 'sneha.rao@example.com',
    },
    owner: {
      id: 'OWN-205',
      name: 'Priya Malhotra',
      businessName: 'Viman Sports Complex LLP',
      phone: '+91 98225 33445',
    },
    venue: 'Apex Sports Arena & Tennis Club',
    venueId: 'VN-804',
    court: 'Synthetic Court 3 (Badminton)',
    sport: 'Badminton',
    date: '29 Sep 2026',
    time: '8:00 PM – 9:00 PM',
    amount: 700,
    platformCommission: 70,
    ownerPayout: 630,
    commissionRate: 10,
    payment: {
      method: 'UPI (PhonePe)',
      transactionId: 'TXN-UPI-77192019',
      gateway: 'Razorpay PG',
      status: 'Captured',
      paidAt: '29 Sep 2026, 19:30',
    },
    status: 'disputed',
    cancellation: null,
    refund: null,
    dispute: {
      id: 'DSP-401',
      ticketId: 'TKT-9403',
      filedBy: 'Sneha Rao (Customer)',
      reason: 'Court was occupied by walk-in player during confirmed reserved slot',
      status: 'open', // 'open' | 'investigating' | 'resolved'
      filedAt: '2026-09-29T20:30:00Z',
      customerClaim: 'Slot occupied by offline walk-in team. Venue manager refused to vacate court.',
      ownerResponse: 'Staff miscommunication at entry desk. Offered alternate slot next day.',
      resolution: null,
      resolvedAt: null,
      resolvedBy: null,
      actionTaken: null,
    },
  },
  {
    id: 'BK-1075',
    customer: {
      id: 'USR-1001',
      name: 'Rahul Mehta',
      phone: '+91 98221 44551',
      email: 'rahul.mehta@example.com',
    },
    owner: {
      id: 'OWN-201',
      name: 'Rajesh Nair',
      businessName: 'Smash Point Sports & Leisure LLP',
      phone: '+91 98123 45678',
    },
    venue: 'Smash Point Turf & Badminton Hub',
    venueId: 'VN-801',
    court: 'Synthetic Court 2',
    sport: 'Badminton',
    date: '28 Sep 2026',
    time: '6:00 PM – 7:00 PM',
    amount: 700,
    platformCommission: 70,
    ownerPayout: 630,
    commissionRate: 10,
    payment: {
      method: 'UPI (Google Pay)',
      transactionId: 'TXN-UPI-11928401',
      gateway: 'Razorpay PG',
      status: 'Captured',
      paidAt: '28 Sep 2026, 17:10',
    },
    status: 'completed',
    cancellation: null,
    refund: null,
    dispute: null,
  },
  {
    id: 'BK-1065',
    customer: {
      id: 'USR-1007',
      name: 'Aditya Roy',
      phone: '+91 99231 11223',
      email: 'aditya.roy@example.com',
    },
    owner: {
      id: 'OWN-202',
      name: 'Vikram Joshi',
      businessName: 'SkyTurf Box Sports Pvt Ltd',
      phone: '+91 98220 11223',
    },
    venue: 'SkyTurf Box Arena',
    venueId: 'VN-802',
    court: 'FIFA Pro Box Turf A',
    sport: 'Football',
    date: '26 Sep 2026',
    time: '9:00 PM – 10:00 PM',
    amount: 1400,
    platformCommission: 140,
    ownerPayout: 1260,
    commissionRate: 10,
    payment: {
      method: 'Net Banking (HDFC)',
      transactionId: 'TXN-NB-55210984',
      gateway: 'Razorpay PG',
      status: 'Refunded',
      paidAt: '25 Sep 2026, 14:00',
    },
    status: 'cancelled',
    cancellation: {
      cancelledBy: 'Customer',
      cancelledAt: '26 Sep 2026, 10:00 AM (11 hrs before slot)',
      reason: 'Personal medical emergency',
      feeDeducted: 0,
    },
    refund: {
      id: 'RFD-901',
      amount: 1400,
      mode: 'Arena Wallet',
      processedAt: '26 Sep 2026, 10:05 AM',
      status: 'Completed',
    },
    dispute: null,
  },
  {
    id: 'BK-1049',
    customer: {
      id: 'USR-1003',
      name: 'Karan Mehra',
      phone: '+91 98230 44556',
      email: 'karan.mehra@example.com',
    },
    owner: {
      id: 'OWN-202',
      name: 'Vikram Joshi',
      businessName: 'SkyTurf Box Sports Pvt Ltd',
      phone: '+91 98220 11223',
    },
    venue: 'SkyTurf Box Arena',
    venueId: 'VN-802',
    court: 'FIFA 5-a-side Turf 1',
    sport: 'Football',
    date: '27 Sep 2026',
    time: '8:00 PM – 9:00 PM',
    amount: 1400,
    platformCommission: 140,
    ownerPayout: 1260,
    commissionRate: 10,
    payment: {
      method: 'Paytm UPI',
      transactionId: 'TXN-UPI-99481023',
      gateway: 'Razorpay PG',
      status: 'Captured',
      paidAt: '27 Sep 2026, 18:20',
    },
    status: 'disputed',
    cancellation: null,
    refund: null,
    dispute: {
      id: 'DSP-402',
      ticketId: 'TKT-9388',
      filedBy: 'Bank Chargeback Desk',
      reason: 'Customer filed unauthorized chargeback via bank after game played',
      status: 'investigating',
      filedAt: '2026-09-28T14:30:00Z',
      customerClaim: 'Customer claimed unauthorized credit card transaction.',
      ownerResponse: 'CCTV footage confirmed customer and 9 teammates played full 60 mins.',
      resolution: 'Chargeback contested with bank submitting digital check-in log and CCTV evidence.',
      resolvedAt: '2026-09-29T11:00:00Z',
      resolvedBy: 'Sarah Connor (ADM-9001)',
      actionTaken: 'Chargeback won. User flagged & blocked.',
    },
  },
];

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

export const adminBookingService = {
  getStoredBookings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADMIN_BOOKINGS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_ADMIN_BOOKINGS, JSON.stringify(INITIAL_BOOKINGS_MASTER));
        return INITIAL_BOOKINGS_MASTER;
      }
      return JSON.parse(raw);
    } catch (e) {
      return INITIAL_BOOKINGS_MASTER;
    }
  },

  saveBookings(bookings) {
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_BOOKINGS, JSON.stringify(bookings));
    } catch (e) {
      console.error('Failed to save master bookings:', e);
    }
  },

  /**
   * GET /admin/bookings
   * Filters: search, dateRange, status, venue, paymentMethod
   */
  async getBookings({
    search = '',
    status = 'all',
    venue = 'all',
    paymentMethod = 'all',
    date = 'all',
  } = {}) {
    await new Promise((r) => setTimeout(r, 300));

    let list = this.getStoredBookings();

    // 1. Status Filter
    if (status && status !== 'all') {
      list = list.filter((b) => b.status === status);
    }

    // 2. Venue Filter
    if (venue && venue !== 'all') {
      list = list.filter((b) => b.venue.toLowerCase().includes(venue.toLowerCase()) || b.venueId === venue);
    }

    // 3. Payment Filter
    if (paymentMethod && paymentMethod !== 'all') {
      list = list.filter((b) => b.payment.method.toLowerCase().includes(paymentMethod.toLowerCase()));
    }

    // 4. Search Filter (Booking ID, Customer Name, Phone, Venue)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.customer.name.toLowerCase().includes(q) ||
          b.customer.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
          b.venue.toLowerCase().includes(q) ||
          b.court.toLowerCase().includes(q) ||
          b.payment.transactionId.toLowerCase().includes(q)
      );
    }

    const all = this.getStoredBookings();

    return {
      success: true,
      total: list.length,
      counts: {
        all: all.length,
        upcoming: all.filter((b) => b.status === 'upcoming').length,
        completed: all.filter((b) => b.status === 'completed').length,
        cancelled: all.filter((b) => b.status === 'cancelled').length,
        disputed: all.filter((b) => b.status === 'disputed').length,
      },
      bookings: list,
    };
  },

  /**
   * GET /admin/bookings/:id
   */
  async getBookingDetails(bookingId) {
    await new Promise((r) => setTimeout(r, 200));

    const list = this.getStoredBookings();
    const booking = list.find((b) => b.id === bookingId);

    if (!booking) {
      throw new Error(`Booking with ID "${bookingId}" not found.`);
    }

    return {
      success: true,
      booking,
    };
  },

  /**
   * GET /admin/bookings/:id/dispute
   */
  async getBookingDispute(bookingId) {
    await new Promise((r) => setTimeout(r, 200));

    const list = this.getStoredBookings();
    const booking = list.find((b) => b.id === bookingId);

    if (!booking) {
      throw new Error(`Booking with ID "${bookingId}" not found.`);
    }

    return {
      success: true,
      bookingId,
      dispute: booking.dispute,
    };
  },

  /**
   * PATCH /admin/bookings/:id/dispute
   * Resolves a booking dispute with resolution notes, action taken, and immutable audit log.
   */
  async resolveBookingDispute(bookingId, { resolution, actionTaken, refundAmount = 0 }, adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    if (!bookingId) throw new Error('Booking ID is required.');
    if (!resolution || resolution.trim().length < 5) {
      throw new Error('Please provide resolution details (minimum 5 characters).');
    }

    await new Promise((r) => setTimeout(r, 500));

    const list = this.getStoredBookings();
    const index = list.findIndex((b) => b.id === bookingId);

    if (index === -1) {
      throw new Error(`Booking with ID "${bookingId}" not found.`);
    }

    const booking = list[index];
    const timestamp = new Date().toISOString();

    const updatedDispute = {
      ...(booking.dispute || { id: `DSP-${Date.now()}` }),
      status: 'resolved',
      resolution: resolution.trim(),
      actionTaken: actionTaken || 'Resolution finalized by admin',
      resolvedAt: timestamp,
      resolvedBy: `${adminName} (${adminId})`,
    };

    let updatedStatus = booking.status;
    let updatedRefund = booking.refund;

    if (refundAmount > 0) {
      updatedRefund = {
        id: `RFD-${Date.now()}`,
        amount: refundAmount,
        mode: 'Arena Wallet Credit',
        processedAt: timestamp,
        status: 'Completed',
      };
      updatedStatus = 'cancelled';
    } else {
      updatedStatus = 'completed';
    }

    const updatedBooking = {
      ...booking,
      status: updatedStatus,
      dispute: updatedDispute,
      refund: updatedRefund,
    };

    list[index] = updatedBooking;
    this.saveBookings(list);

    // Record Security Audit
    recordAuditEntry('BOOKING_DISPUTE_RESOLVED', {
      bookingId,
      customerName: booking.customer.name,
      venue: booking.venue,
      resolution: resolution.trim(),
      refundIssued: refundAmount,
      adminId,
      adminName,
    });

    return {
      success: true,
      message: `Dispute for Booking ${bookingId} has been resolved.`,
      booking: updatedBooking,
    };
  },
};
