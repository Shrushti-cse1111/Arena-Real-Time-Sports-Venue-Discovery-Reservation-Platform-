/**
 * ownerDashboardService.js
 * Provides mock GET /owner/dashboard/summary and today schedule.
 * Includes simulated real-time event subscription (mimics Socket.io).
 */

function formatCurrency(n) {
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
}

const INITIAL_SCHEDULE = [
  { id: 'bk-001', time: '7:00 AM', sortKey: 7, court: 'Court A', customer: 'Rahul Mehta', sport: 'Badminton', status: 'completed', duration: '1 hr' },
  { id: 'bk-002', time: '9:00 AM', sortKey: 9, court: 'Court B', customer: 'Priya Singh', sport: 'Tennis', status: 'completed', duration: '1 hr' },
  { id: 'bk-003', time: '11:00 AM', sortKey: 11, court: 'Court A', customer: 'Amit Kulkarni', sport: 'Badminton', status: 'upcoming', duration: '2 hrs' },
  { id: 'bk-004', time: '1:00 PM', sortKey: 13, court: 'Court C', customer: 'Sneha Patil', sport: 'Squash', status: 'upcoming', duration: '1 hr' },
  { id: 'bk-005', time: '3:00 PM', sortKey: 15, court: 'Court B', customer: 'Vikram Joshi', sport: 'Tennis', status: 'no-show', duration: '1 hr' },
  { id: 'bk-006', time: '5:00 PM', sortKey: 17, court: 'Court A', customer: 'Ritu Sharma', sport: 'Badminton', status: 'cancelled', duration: '1 hr' },
];

const UPCOMING_DAYS_SCHEDULE = [
  { day: 'Tomorrow', date: 'Tomorrow, Oct 1', bookings: [
    { id: 'up-101', time: '8:00 AM', court: 'Court A', customer: 'Devansh Roy', sport: 'Badminton', status: 'upcoming', duration: '1 hr' },
    { id: 'up-102', time: '10:00 AM', court: 'Court B', customer: 'Ananya Sen', sport: 'Tennis', status: 'upcoming', duration: '2 hrs' },
    { id: 'up-103', time: '4:00 PM', court: 'Court C', customer: 'Saurabh Nair', sport: 'Squash', status: 'upcoming', duration: '1 hr' },
    { id: 'up-104', time: '7:00 PM', court: 'Court A', customer: 'Kunal Kapoor', sport: 'Badminton', status: 'upcoming', duration: '1 hr' },
  ]},
  { day: 'Day After', date: 'Friday, Oct 2', bookings: [
    { id: 'up-201', time: '7:30 AM', court: 'Court B', customer: 'Pooja Hegde', sport: 'Tennis', status: 'upcoming', duration: '1 hr' },
    { id: 'up-202', time: '11:00 AM', court: 'Court A', customer: 'Rohan Verma', sport: 'Badminton', status: 'upcoming', duration: '1 hr' },
    { id: 'up-203', time: '5:30 PM', court: 'Court A', customer: 'Tanmay Bhatia', sport: 'Badminton', status: 'upcoming', duration: '2 hrs' },
  ]}
];

let _schedule = [...INITIAL_SCHEDULE];
let _listeners = [];

function _computeSummary() {
  const completed = _schedule.filter((b) => b.status === 'completed').length;
  const upcoming = _schedule.filter((b) => b.status === 'upcoming').length;
  const cancelled = _schedule.filter((b) => b.status === 'cancelled').length;
  const noShow = _schedule.filter((b) => b.status === 'no-show').length;
  const todayBookings = completed + upcoming + noShow;
  const todayRevenue = (completed * 650) + (upcoming * 650);
  const occupiedSlots = completed + upcoming + noShow;
  const totalSlots = Math.max(_schedule.length, 1);
  const occupancyRate = _schedule.length > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;
  return {
    todayBookings,
    todayRevenue,
    occupancyRate,
    cancellations: cancelled,
    bookingDelta: _schedule.length === 0 ? 0 : +8,
    revenueDelta: _schedule.length === 0 ? 0 : +12,
    occupancyDelta: _schedule.length === 0 ? 0 : +5,
    cancellationDelta: _schedule.length === 0 ? 0 : -2
  };
}

export async function fetchDashboardSummary() {
  await new Promise((r) => setTimeout(r, 600));
  return { success: true, data: _computeSummary() };
}

export async function fetchTodaySchedule() {
  await new Promise((r) => setTimeout(r, 700));
  return { success: true, data: [..._schedule].sort((a, b) => a.sortKey - b.sortKey) };
}

export async function fetchUpcomingDaysSchedule() {
  await new Promise((r) => setTimeout(r, 300));
  return { success: true, data: UPCOMING_DAYS_SCHEDULE };
}

function _emitUpdate(event, payload) {
  _listeners.forEach((cb) => {
    try {
      cb(event, payload);
    } catch (_) {}
  });
}

export function subscribeToDashboardEvents(callback) {
  _listeners.push(callback);
  const t1 = setTimeout(() => {
    const newBooking = {
      id: `bk-rt-${Date.now()}`,
      time: '6:00 PM',
      sortKey: 18,
      court: 'Court B',
      customer: 'Nikhil Desai',
      sport: 'Badminton',
      status: 'upcoming',
      duration: '1 hr'
    };
    _schedule = [..._schedule, newBooking];
    _emitUpdate('NEW_BOOKING', { booking: newBooking, summary: _computeSummary() });
  }, 18000);

  const t2 = setTimeout(() => {
    _schedule = _schedule.map((b) => b.id === 'bk-004' ? { ...b, status: 'cancelled' } : b);
    _emitUpdate('BOOKING_CANCELLED', {
      bookingId: 'bk-004',
      summary: _computeSummary(),
      schedule: [..._schedule].sort((a, b) => a.sortKey - b.sortKey)
    });
  }, 36000);

  return () => {
    _listeners = _listeners.filter((cb) => cb !== callback);
    clearTimeout(t1);
    clearTimeout(t2);
  };
}

/** Add a manual walk-in booking */
export function addWalkInBooking({ time = '4:00 PM', court = 'Court A', customer = 'Walk-in Player', sport = 'Badminton', duration = '1 hr' }) {
  const hourNum = parseInt(time, 10) || 16;
  const isPM = time.toLowerCase().includes('pm') && hourNum !== 12;
  const sortKey = isPM ? hourNum + 12 : hourNum;

  const newBooking = {
    id: `bk-walkin-${Date.now()}`,
    time,
    sortKey,
    court,
    customer,
    sport,
    status: 'upcoming',
    duration
  };

  _schedule = [..._schedule, newBooking];
  const summary = _computeSummary();
  _emitUpdate('NEW_BOOKING', { booking: newBooking, summary });
  return { success: true, booking: newBooking, summary };
}

/** Block a slot for maintenance */
export function blockSlotMaintenance({ court = 'Court A', time = '2:00 PM', reason = 'Court Maintenance' }) {
  const hourNum = parseInt(time, 10) || 14;
  const isPM = time.toLowerCase().includes('pm') && hourNum !== 12;
  const sortKey = isPM ? hourNum + 12 : hourNum;

  const blockItem = {
    id: `bk-maint-${Date.now()}`,
    time,
    sortKey,
    court,
    customer: `Maintenance (${reason})`,
    sport: 'Court Work',
    status: 'cancelled',
    duration: '1 hr'
  };

  _schedule = [..._schedule, blockItem];
  const summary = _computeSummary();
  _emitUpdate('NEW_BOOKING', { booking: blockItem, summary });
  return { success: true, booking: blockItem, summary };
}

/** Clear all schedule items (to test zero / empty state) */
export function clearScheduleForTesting() {
  _schedule = [];
  const summary = _computeSummary();
  _emitUpdate('SCHEDULE_CLEARED', { schedule: [], summary });
  return { success: true, schedule: [], summary };
}

/** Reset to default mock schedule */
export function resetScheduleToDefault() {
  _schedule = [...INITIAL_SCHEDULE];
  const summary = _computeSummary();
  _emitUpdate('SCHEDULE_RESET', { schedule: [..._schedule], summary });
  return { success: true, schedule: [..._schedule], summary };
}

/** Manually trigger a quick real-time simulated booking for testing */
export function triggerRealtimeBooking() {
  const names = ['Kavita Rao', 'Arjun Saxena', 'Farhan Ali', 'Deepak Joshi', 'Meera Nair'];
  const courts = ['Court A', 'Court B', 'Court C'];
  const sports = ['Badminton', 'Tennis', 'Squash'];
  const times = ['4:30 PM', '6:30 PM', '7:30 PM', '8:00 PM'];

  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomCourt = courts[Math.floor(Math.random() * courts.length)];
  const randomSport = sports[Math.floor(Math.random() * sports.length)];
  const randomTime = times[Math.floor(Math.random() * times.length)];

  return addWalkInBooking({
    time: randomTime,
    court: randomCourt,
    customer: randomName,
    sport: randomSport,
    duration: '1 hr'
  });
}

export function formatRevenue(amount) {
  return formatCurrency(amount);
}

export function getStatusMeta(status) {
  switch (status) {
    case 'upcoming':   return { label: 'Upcoming',   bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' };
    case 'completed':  return { label: 'Completed',  bg: '#ECFDF5', color: '#065F46', dot: '#10B981' };
    case 'no-show':    return { label: 'No-show',    bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' };
    case 'cancelled':  return { label: 'Cancelled',  bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' };
    default:           return { label: status,       bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' };
  }
}
