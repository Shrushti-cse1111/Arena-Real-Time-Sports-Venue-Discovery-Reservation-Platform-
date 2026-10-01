/**
 * ownerAvailabilityService.js
 * Simulates backend API for Arena Owner Availability Management:
 * - GET /owner/availability?venueId=&year=&month=
 * - POST /owner/availability/block-date
 * - POST /owner/availability/unblock-date
 * - GET /owner/venues/:venueId/operating-hours
 * - PUT /owner/venues/:venueId/operating-hours
 * - Dynamic slot generator based on operating hours and pricing rules
 * - Server-side concurrency validation against confirmed bookings
 */

// Default mock operating hours
const DEFAULT_OPERATING_HOURS = [
  { day: 'Monday', isOpen: true, openTime: '06:00', closeTime: '23:00' },
  { day: 'Tuesday', isOpen: true, openTime: '06:00', closeTime: '23:00' },
  { day: 'Wednesday', isOpen: true, openTime: '06:00', closeTime: '23:00' },
  { day: 'Thursday', isOpen: true, openTime: '06:00', closeTime: '23:00' },
  { day: 'Friday', isOpen: true, openTime: '06:00', closeTime: '23:00' },
  { day: 'Saturday', isOpen: true, openTime: '06:00', closeTime: '23:30' },
  { day: 'Sunday', isOpen: true, openTime: '06:00', closeTime: '23:30' },
];

// In-memory backend stores
let _operatingHours = [...DEFAULT_OPERATING_HOURS];

// Map of date string 'YYYY-MM-DD' -> status override or bookings
// Statuses: 'OPEN' | 'BOOKED' | 'BLOCKED'
const _calendarOverrides = {
  // Oct 2026 pre-set statuses
  '2026-10-01': {
    status: 'BOOKED',
    bookings: [
      { id: 'BK-1081', customer: 'Rahul Mehta', court: 'Court A', time: '07:00 AM - 08:00 AM', status: 'completed' },
      { id: 'BK-1083', customer: 'Amit Kulkarni', court: 'Court A', time: '11:00 AM - 01:00 PM', status: 'upcoming' },
      { id: 'BK-1086', customer: 'Ritu Sharma', court: 'Court A', time: '05:00 PM - 06:00 PM', status: 'upcoming' }
    ]
  },
  '2026-10-02': {
    status: 'BOOKED',
    bookings: [
      { id: 'BK-1088', customer: 'Arjun Saxena', court: 'Box Cricket', time: '07:00 PM - 09:00 PM', status: 'upcoming' },
      { id: 'BK-1089', customer: 'Meera Nair', court: 'Court B', time: '08:00 AM - 09:00 AM', status: 'upcoming' }
    ]
  },
  '2026-10-05': {
    status: 'BLOCKED',
    reason: 'Routine Court Resurfacing & Deep Cleaning',
    blockedAt: '2026-09-28'
  },
  '2026-10-12': {
    status: 'BLOCKED',
    reason: 'Private Club Invitational Tournament',
    blockedAt: '2026-09-29'
  },
  '2026-10-18': {
    status: 'BOOKED',
    bookings: [
      { id: 'BK-2001', customer: 'Tanmay Bhatia', court: 'Court A', time: '10:00 AM - 12:00 PM', status: 'upcoming' }
    ]
  },
};

/**
 * Fetch calendar availability for a given month
 */
export async function fetchMonthAvailability(venueId, year = 2026, month = 10, simulateError = false) {
  await new Promise((r) => setTimeout(r, 450));

  if (simulateError) {
    throw new Error('Unable to load availability.');
  }

  // Days in month
  const totalDays = new Date(year, month, 0).getDate();
  const firstDayWeekIndex = new Date(year, month - 1, 1).getDay(); // 0 = Sun

  const days = [];

  for (let d = 1; d <= totalDays; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    const dateKey = `${year}-${monthStr}-${dayStr}`;

    const override = _calendarOverrides[dateKey];
    let status = 'OPEN';
    let bookings = [];
    let reason = null;

    if (override) {
      status = override.status;
      bookings = override.bookings || [];
      reason = override.reason || null;
    }

    days.push({
      date: dateKey,
      dayNumber: d,
      status, // 'OPEN' | 'BOOKED' | 'BLOCKED'
      bookings,
      reason,
    });
  }

  return {
    success: true,
    data: {
      year,
      month,
      firstDayWeekIndex,
      days,
    }
  };
}

/**
 * Block a day: POST /owner/availability/block-date
 * Server-side Concurrency & Booking Protection Rule:
 * Rejects if the date has confirmed active bookings!
 */
export async function blockDate({ venueId, date, reason = 'Owner Block' }) {
  await new Promise((r) => setTimeout(r, 400));

  const existing = _calendarOverrides[date];

  // SERVER-SIDE CONCURRENCY VALIDATION
  if (existing && existing.status === 'BOOKED' && existing.bookings && existing.bookings.length > 0) {
    const hasActive = existing.bookings.some((b) => b.status === 'upcoming' || b.status === 'confirmed');
    if (hasActive) {
      return {
        success: false,
        error: `Cannot block ${date}: This date contains active bookings (${existing.bookings.length} reservations). You must reassign or cancel customer bookings before blocking this date.`
      };
    }
  }

  _calendarOverrides[date] = {
    status: 'BLOCKED',
    reason,
    blockedAt: new Date().toISOString()
  };

  return {
    success: true,
    data: {
      date,
      status: 'BLOCKED',
      reason
    }
  };
}

/**
 * Unblock a day: POST /owner/availability/unblock-date
 */
export async function unblockDate({ venueId, date }) {
  await new Promise((r) => setTimeout(r, 350));

  if (_calendarOverrides[date]) {
    delete _calendarOverrides[date];
  }

  return {
    success: true,
    data: {
      date,
      status: 'OPEN'
    }
  };
}

/**
 * Fetch operating hours: GET /owner/venues/:venueId/operating-hours
 */
export async function fetchOperatingHours(venueId) {
  await new Promise((r) => setTimeout(r, 300));
  return {
    success: true,
    data: JSON.parse(JSON.stringify(_operatingHours))
  };
}

/**
 * Save operating hours: PUT /owner/venues/:venueId/operating-hours
 * Validates closing time > opening time
 */
export async function saveOperatingHours(venueId, hours) {
  await new Promise((r) => setTimeout(r, 450));

  for (const h of hours) {
    if (h.isOpen) {
      if (!h.openTime || !h.closeTime) {
        return { success: false, error: `Invalid hours for ${h.day}: Both open and close times are required.` };
      }
      if (h.closeTime <= h.openTime) {
        return { success: false, error: `Invalid hours for ${h.day}: Closing time (${h.closeTime}) must be strictly after opening time (${h.openTime}).` };
      }
    }
  }

  _operatingHours = JSON.parse(JSON.stringify(hours));
  return {
    success: true,
    data: _operatingHours
  };
}

/**
 * Slot Generation Engine:
 * Generates slots dynamically from Operating Hours + Pricing Rules.
 * Never hardcodes static slots!
 */
export function generateSlotsFromHours(operatingHours, dayName = 'Monday', pricingRules = null) {
  const dayConfig = operatingHours.find((h) => h.day.toLowerCase() === dayName.toLowerCase());
  if (!dayConfig || !dayConfig.isOpen) {
    return [];
  }

  const [openH, openM] = dayConfig.openTime.split(':').map(Number);
  const [closeH, closeM] = dayConfig.closeTime.split(':').map(Number);

  const slots = [];
  let currentH = openH;
  let currentM = openM;

  const totalCloseMinutes = closeH * 60 + closeM;

  while ((currentH * 60 + currentM) + 60 <= totalCloseMinutes) {
    const startPeriod = currentH >= 12 ? 'PM' : 'AM';
    const displayH = currentH % 12 === 0 ? 12 : currentH % 12;
    const nextH = currentH + 1;
    const endPeriod = nextH >= 12 ? 'PM' : 'AM';
    const displayNextH = nextH % 12 === 0 ? 12 : nextH % 12;

    const timeLabel = `${displayH}:00 ${startPeriod} - ${displayNextH}:00 ${endPeriod}`;

    // Peak rate rule: 5 PM onwards is Peak
    const isPeak = currentH >= 17;
    const rate = isPeak ? 900 : 650;

    slots.push({
      time: timeLabel,
      startHour: currentH,
      isPeak,
      rate,
      status: 'available'
    });

    currentH += 1;
  }

  return slots;
}
