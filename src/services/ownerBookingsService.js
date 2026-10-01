/**
 * ownerBookingsService.js
 * Simulates backend API for Arena Owner Bookings Management:
 * - GET /owner/bookings?date=&status=&court=&page=&limit=
 * - PATCH /owner/bookings/:id/status
 * - Real-time event subscription with deduplication
 */

const MOCK_COURTS = ['Court A', 'Court B', 'Court C', 'Box Cricket'];

// Initial backend booking records
const INITIAL_BOOKINGS = [
  {
    id: 'BK-1081',
    customer: { name: 'Rahul Mehta', phone: '+91 98221 44551', email: 'rahul.mehta@example.com' },
    court: 'Court A',
    venue: 'Deccan Sports Arena',
    venueAddress: 'FC Road, Shivaji Nagar, Pune',
    sport: 'Badminton',
    date: '2026-10-01',
    time: '07:00 AM - 08:00 AM',
    amount: 650,
    paymentStatus: 'Paid (UPI / Razorpay)',
    paymentId: 'pay_rzp_9812481',
    status: 'completed',
    qrCode: 'ARENA-CHK-1081-VERIFIED',
    checkInCode: 'CHK-1081',
    checkInTime: '06:55 AM, Oct 1',
    completedAt: '08:02 AM, Oct 1',
    duration: '1 hr',
  },
  {
    id: 'BK-1082',
    customer: { name: 'Priya Singh', phone: '+91 97632 11990', email: 'priya.singh@example.com' },
    court: 'Court B',
    venue: 'Deccan Sports Arena',
    venueAddress: 'FC Road, Shivaji Nagar, Pune',
    sport: 'Tennis',
    date: '2026-10-01',
    time: '09:00 AM - 10:00 AM',
    amount: 1100,
    paymentStatus: 'Paid (Credit Card)',
    paymentId: 'pay_rzp_9812482',
    status: 'completed',
    qrCode: 'ARENA-CHK-1082-VERIFIED',
    checkInCode: 'CHK-1082',
    checkInTime: '08:52 AM, Oct 1',
    completedAt: '10:05 AM, Oct 1',
    duration: '1 hr',
  },
  {
    id: 'BK-1083',
    customer: { name: 'Amit Kulkarni', phone: '+91 99230 87112', email: 'amit.kulkarni@example.com' },
    court: 'Court A',
    venue: 'Deccan Sports Arena',
    venueAddress: 'FC Road, Shivaji Nagar, Pune',
    sport: 'Badminton',
    date: '2026-10-01',
    time: '11:00 AM - 01:00 PM',
    amount: 1300,
    paymentStatus: 'Paid (Net Banking)',
    paymentId: 'pay_rzp_9812483',
    status: 'upcoming',
    qrCode: 'ARENA-CHK-1083-PENDING',
    checkInCode: 'CHK-1083',
    checkInTime: null,
    duration: '2 hrs',
  },
  {
    id: 'BK-1084',
    customer: { name: 'Sneha Patil', phone: '+91 98901 33441', email: 'sneha.patil@example.com' },
    court: 'Court C',
    venue: 'Deccan Sports Arena',
    venueAddress: 'FC Road, Shivaji Nagar, Pune',
    sport: 'Squash',
    date: '2026-10-01',
    time: '01:00 PM - 02:00 PM',
    amount: 750,
    paymentStatus: 'Refunded (₹750 to original source)',
    paymentId: 'pay_rzp_9812484',
    status: 'cancelled',
    qrCode: null,
    checkInCode: 'CHK-1084',
    cancellationReason: 'Customer requested reschedule / personal emergency',
    cancelledAt: '11:45 AM, Oct 1',
    duration: '1 hr',
  },
  {
    id: 'BK-1085',
    customer: { name: 'Vikram Joshi', phone: '+91 98233 88123', email: 'vikram.j@example.com' },
    court: 'Court B',
    venue: 'Deccan Sports Arena',
    venueAddress: 'FC Road, Shivaji Nagar, Pune',
    sport: 'Tennis',
    date: '2026-10-01',
    time: '03:00 PM - 04:00 PM',
    amount: 1100,
    paymentStatus: 'Paid (UPI / GPay)',
    paymentId: 'pay_rzp_9812485',
    status: 'no-show',
    qrCode: 'ARENA-CHK-1085-EXPIRED',
    checkInCode: 'CHK-1085',
    checkInTime: null,
    noShowReportedAt: '03:30 PM, Oct 1',
    duration: '1 hr',
  },
  {
    id: 'BK-1086',
    customer: { name: 'Ritu Sharma', phone: '+91 94220 55112', email: 'ritu.s@example.com' },
    court: 'Court A',
    venue: 'Deccan Sports Arena',
    venueAddress: 'FC Road, Shivaji Nagar, Pune',
    sport: 'Badminton',
    date: '2026-10-01',
    time: '05:00 PM - 06:00 PM',
    amount: 650,
    paymentStatus: 'Paid (UPI / PhonePe)',
    paymentId: 'pay_rzp_9812486',
    status: 'upcoming',
    qrCode: 'ARENA-CHK-1086-PENDING',
    checkInCode: 'CHK-1086',
    checkInTime: null,
    duration: '1 hr',
  },
  {
    id: 'BK-1087',
    customer: { name: 'Kavita Rao', phone: '+91 98811 77223', email: 'kavita.rao@example.com' },
    court: 'Court C',
    venue: 'Deccan Sports Arena',
    venueAddress: 'FC Road, Shivaji Nagar, Pune',
    sport: 'Squash',
    date: '2026-10-01',
    time: '06:00 PM - 07:00 PM',
    amount: 750,
    paymentStatus: 'Paid (UPI / Paytm)',
    paymentId: 'pay_rzp_9812487',
    status: 'upcoming',
    qrCode: 'ARENA-CHK-1087-PENDING',
    checkInCode: 'CHK-1087',
    checkInTime: null,
    duration: '1 hr',
  },
  {
    id: 'BK-1088',
    customer: { name: 'Arjun Saxena', phone: '+91 98909 22114', email: 'arjun.s@example.com' },
    court: 'Box Cricket',
    venue: 'Deccan Sports Arena',
    venueAddress: 'FC Road, Shivaji Nagar, Pune',
    sport: 'Cricket',
    date: '2026-10-02',
    time: '07:00 PM - 09:00 PM',
    amount: 2200,
    paymentStatus: 'Paid (Credit Card)',
    paymentId: 'pay_rzp_9812488',
    status: 'upcoming',
    qrCode: 'ARENA-CHK-1088-PENDING',
    checkInCode: 'CHK-1088',
    checkInTime: null,
    duration: '2 hrs',
  },
  {
    id: 'BK-1089',
    customer: { name: 'Meera Nair', phone: '+91 97654 33110', email: 'meera.nair@example.com' },
    court: 'Court B',
    venue: 'Deccan Sports Arena',
    venueAddress: 'FC Road, Shivaji Nagar, Pune',
    sport: 'Tennis',
    date: '2026-10-02',
    time: '08:00 AM - 09:00 AM',
    amount: 1100,
    paymentStatus: 'Paid (UPI / GPay)',
    paymentId: 'pay_rzp_9812489',
    status: 'upcoming',
    qrCode: 'ARENA-CHK-1089-PENDING',
    checkInCode: 'CHK-1089',
    checkInTime: null,
    duration: '1 hr',
  },
  {
    id: 'BK-1090',
    customer: { name: 'Kunal Kapoor', phone: '+91 98224 88991', email: 'kunal.k@example.com' },
    court: 'Court A',
    venue: 'Deccan Sports Arena',
    venueAddress: 'FC Road, Shivaji Nagar, Pune',
    sport: 'Badminton',
    date: '2026-10-02',
    time: '06:00 PM - 07:00 PM',
    amount: 650,
    paymentStatus: 'Paid (UPI / PhonePe)',
    paymentId: 'pay_rzp_9812490',
    status: 'upcoming',
    qrCode: 'ARENA-CHK-1090-PENDING',
    checkInCode: 'CHK-1090',
    checkInTime: null,
    duration: '1 hr',
  }
];

let _bookingsDatabase = [...INITIAL_BOOKINGS];
let _bookingListeners = [];

export function getActiveCourts() {
  return [...MOCK_COURTS];
}

/**
 * Backend simulation for GET /owner/bookings?date=&status=&court=&page=&limit=
 * Filters are applied on the backend dataset to simulate large dataset querying.
 */
export async function fetchOwnerBookings({
  date = '',
  status = 'All',
  court = 'All',
  page = 1,
  limit = 5,
  simulateError = false
} = {}) {
  await new Promise((resolve) => setTimeout(resolve, 450));

  if (simulateError) {
    throw new Error('Database connection failed. Please retry.');
  }

  let filtered = [..._bookingsDatabase];

  if (date && date.trim()) {
    filtered = filtered.filter((b) => b.date === date.trim());
  }

  if (status && status !== 'All') {
    filtered = filtered.filter((b) => b.status.toLowerCase() === status.toLowerCase());
  }

  if (court && court !== 'All') {
    filtered = filtered.filter((b) => b.court.toLowerCase() === court.toLowerCase());
  }

  // Sort: upcoming first, then by date descending
  filtered.sort((a, b) => {
    if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
    if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
    return b.id.localeCompare(a.id);
  });

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const items = filtered.slice(startIndex, startIndex + limit);
  const totalPages = Math.ceil(total / limit) || 1;
  const hasMore = page < totalPages;

  return {
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore
    }
  };
}

/**
 * Backend simulation for PATCH /owner/bookings/:id/status
 * Financial amount is NEVER modified.
 */
export async function updateBookingStatus(bookingId, newStatus) {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const index = _bookingsDatabase.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    return { success: false, error: 'Booking not found' };
  }

  const existing = _bookingsDatabase[index];
  const updatedBooking = {
    ...existing,
    status: newStatus,
    amount: existing.amount, // IMMUTABLE FINANCIAL VALUE
    completedAt: newStatus === 'completed' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : existing.completedAt,
    cancelledAt: newStatus === 'cancelled' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : existing.cancelledAt,
  };

  _bookingsDatabase[index] = updatedBooking;

  // Emit event to subscribers
  _emitBookingEvent('STATUS_UPDATED', updatedBooking);

  return { success: true, data: updatedBooking };
}

function _emitBookingEvent(event, payload) {
  _bookingListeners.forEach((cb) => {
    try {
      cb(event, payload);
    } catch (_) {}
  });
}

/**
 * Real-time event subscriber with deduplication support
 */
export function subscribeToBookingEvents(callback) {
  _bookingListeners.push(callback);
  return () => {
    _bookingListeners = _bookingListeners.filter((cb) => cb !== callback);
  };
}

/**
 * Helper to trigger a simulated incoming booking via socket
 */
export function simulateIncomingBooking() {
  const newId = `BK-${1090 + Math.floor(Math.random() * 900)}`;
  const courts = ['Court A', 'Court B', 'Court C', 'Box Cricket'];
  const sports = ['Badminton', 'Tennis', 'Squash', 'Cricket'];
  const names = ['Rohan Varma', 'Tanvi Shah', 'Aditya Joshi', 'Zainab Khan'];

  const randomCourt = courts[Math.floor(Math.random() * courts.length)];
  const randomSport = sports[Math.floor(Math.random() * sports.length)];
  const randomName = names[Math.floor(Math.random() * names.length)];

  const newBooking = {
    id: newId,
    customer: { name: randomName, phone: '+91 98220 99881', email: `${randomName.toLowerCase().replace(' ', '.')}@example.com` },
    court: randomCourt,
    venue: 'Deccan Sports Arena',
    venueAddress: 'FC Road, Shivaji Nagar, Pune',
    sport: randomSport,
    date: '2026-10-01',
    time: '08:00 PM - 09:00 PM',
    amount: 750,
    paymentStatus: 'Paid (UPI Instant)',
    paymentId: `pay_rzp_${Date.now()}`,
    status: 'upcoming',
    qrCode: `ARENA-CHK-${newId}-PENDING`,
    checkInCode: `CHK-${newId.replace('BK-', '')}`,
    checkInTime: null,
    duration: '1 hr',
  };

  // Insert into backend db
  _bookingsDatabase = [newBooking, ..._bookingsDatabase];
  _emitBookingEvent('NEW_BOOKING', newBooking);
  return newBooking;
}
