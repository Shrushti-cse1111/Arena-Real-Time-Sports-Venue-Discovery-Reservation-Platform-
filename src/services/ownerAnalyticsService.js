/**
 * ownerAnalyticsService.js
 * Backend analytics simulation for Arena Owner Analytics:
 * - GET /owner/analytics/summary?venueId=&range=7d|30d|90d|custom
 * - GET /owner/analytics/bookings?venueId=&range=7d|30d|90d
 * - Server-side aggregations for Average Booking Value, Repeat Customers,
 *   7-day CSS chart, 48-cell heat strip, Occupancy, Cancellations.
 */

// Simulated analytics database by venue
const ANALYTICS_DATA_BY_VENUE = {
  'venue-101': {
    hasUsableData: true,
    '7d': {
      totalBookings: 142,
      totalRevenue: 110760,
      averageBookingValue: 780,
      repeatCustomerPct: 68,
      occupancyRate: 84.5,
      cancellationRate: 4.2,
      weeklyBookings: [
        { day: 'Mon', date: '2026-09-24', count: 18, revenue: 14040 },
        { day: 'Tue', date: '2026-09-25', count: 15, revenue: 11700 },
        { day: 'Wed', date: '2026-09-26', count: 21, revenue: 16380 },
        { day: 'Thu', date: '2026-09-27', count: 19, revenue: 14820 },
        { day: 'Fri', date: '2026-09-28', count: 26, revenue: 20280 },
        { day: 'Sat', date: '2026-09-29', count: 24, revenue: 18720 },
        { day: 'Sun', date: '2026-09-30', count: 19, revenue: 14820 },
      ],
      // 48 half-hour slots (00:00 to 23:30)
      peakHours: generate48SlotHeatmap([
        { startIdx: 12, endIdx: 19, base: 0.65 }, // 6:00 AM - 10:00 AM (Morning rush)
        { startIdx: 20, endIdx: 31, base: 0.25 }, // 10:00 AM - 4:00 PM (Midday moderate)
        { startIdx: 32, endIdx: 45, base: 0.95 }, // 4:00 PM - 11:00 PM (Evening prime peak)
        { startIdx: 46, endIdx: 47, base: 0.15 }, // 11:00 PM - 12:00 AM
      ]),
    },
    '30d': {
      totalBookings: 580,
      totalRevenue: 452400,
      averageBookingValue: 780,
      repeatCustomerPct: 71,
      occupancyRate: 82.0,
      cancellationRate: 3.8,
      weeklyBookings: [
        { day: 'W1', label: 'Sep 1-7', count: 135, revenue: 105300 },
        { day: 'W2', label: 'Sep 8-14', count: 148, revenue: 115440 },
        { day: 'W3', label: 'Sep 15-21', count: 155, revenue: 120900 },
        { day: 'W4', label: 'Sep 22-28', count: 142, revenue: 110760 },
      ],
      peakHours: generate48SlotHeatmap([
        { startIdx: 12, endIdx: 19, base: 0.7 },
        { startIdx: 20, endIdx: 31, base: 0.3 },
        { startIdx: 32, endIdx: 45, base: 0.92 },
      ]),
    },
    '90d': {
      totalBookings: 1740,
      totalRevenue: 1357200,
      averageBookingValue: 780,
      repeatCustomerPct: 74,
      occupancyRate: 80.5,
      cancellationRate: 3.5,
      weeklyBookings: [
        { day: 'Jul', label: 'July 2026', count: 540, revenue: 421200 },
        { day: 'Aug', label: 'August 2026', count: 620, revenue: 483600 },
        { day: 'Sep', label: 'September 2026', count: 580, revenue: 452400 },
      ],
      peakHours: generate48SlotHeatmap([
        { startIdx: 12, endIdx: 19, base: 0.68 },
        { startIdx: 20, endIdx: 31, base: 0.28 },
        { startIdx: 32, endIdx: 45, base: 0.94 },
      ]),
    },
  },
  'venue-102': {
    hasUsableData: true,
    '7d': {
      totalBookings: 98,
      totalRevenue: 63700,
      averageBookingValue: 650,
      repeatCustomerPct: 54,
      occupancyRate: 72.0,
      cancellationRate: 5.1,
      weeklyBookings: [
        { day: 'Mon', date: '2026-09-24', count: 11, revenue: 7150 },
        { day: 'Tue', date: '2026-09-25', count: 13, revenue: 8450 },
        { day: 'Wed', date: '2026-09-26', count: 14, revenue: 9100 },
        { day: 'Thu', date: '2026-09-27', count: 12, revenue: 7800 },
        { day: 'Fri', date: '2026-09-28', count: 18, revenue: 11700 },
        { day: 'Sat', date: '2026-09-29', count: 17, revenue: 11050 },
        { day: 'Sun', date: '2026-09-30', count: 13, revenue: 8450 },
      ],
      peakHours: generate48SlotHeatmap([
        { startIdx: 14, endIdx: 18, base: 0.5 },
        { startIdx: 34, endIdx: 44, base: 0.8 },
      ]),
    },
    '30d': {
      totalBookings: 390,
      totalRevenue: 253500,
      averageBookingValue: 650,
      repeatCustomerPct: 56,
      occupancyRate: 70.5,
      cancellationRate: 4.8,
      weeklyBookings: [
        { day: 'W1', label: 'Sep 1-7', count: 90, revenue: 58500 },
        { day: 'W2', label: 'Sep 8-14', count: 95, revenue: 61750 },
        { day: 'W3', label: 'Sep 15-21', count: 107, revenue: 69550 },
        { day: 'W4', label: 'Sep 22-28', count: 98, revenue: 63700 },
      ],
      peakHours: generate48SlotHeatmap([
        { startIdx: 14, endIdx: 18, base: 0.55 },
        { startIdx: 34, endIdx: 44, base: 0.82 },
      ]),
    },
    '90d': {
      totalBookings: 1120,
      totalRevenue: 728000,
      averageBookingValue: 650,
      repeatCustomerPct: 58,
      occupancyRate: 69.0,
      cancellationRate: 4.5,
      weeklyBookings: [
        { day: 'Jul', label: 'July 2026', count: 340, revenue: 221000 },
        { day: 'Aug', label: 'August 2026', count: 390, revenue: 253500 },
        { day: 'Sep', label: 'September 2026', count: 390, revenue: 253500 },
      ],
      peakHours: generate48SlotHeatmap([
        { startIdx: 14, endIdx: 18, base: 0.52 },
        { startIdx: 34, endIdx: 44, base: 0.81 },
      ]),
    },
  },
  'venue-103': {
    // New / pending venue — fewer than 7 days of usable history
    hasUsableData: false,
    reason: 'New venue onboarding in progress. Fewer than 7 days of activity recorded.',
    '7d': null,
    '30d': null,
    '90d': null,
  },
};

/**
 * Helper to generate 48 thirty-minute slot heat matrix (00:00 to 23:30)
 */
function generate48SlotHeatmap(distribution = []) {
  const slots = [];
  for (let i = 0; i < 48; i++) {
    const totalMinutes = i * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    const timeLabel = `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;

    // Calculate intensity from distribution patterns
    let intensity = 0.05; // Base ambient
    for (const d of distribution) {
      if (i >= d.startIdx && i <= d.endIdx) {
        // Bell-curve modulation
        const mid = (d.startIdx + d.endIdx) / 2;
        const distFromMid = Math.abs(i - mid);
        const factor = 1 - (distFromMid / (d.endIdx - d.startIdx + 1)) * 0.4;
        intensity = Math.max(intensity, Math.min(1.0, d.base * factor + (Math.sin(i) * 0.05)));
      }
    }

    const estimatedBookings = Math.round(intensity * 14);

    slots.push({
      index: i,
      timeLabel,
      hour,
      minute,
      intensity: Number(intensity.toFixed(2)),
      estimatedBookings,
    });
  }
  return slots;
}

export const ownerAnalyticsService = {
  /**
   * Fetch complete Analytics Summary
   * GET /owner/analytics/summary?venueId=&range=7d
   */
  async getAnalyticsSummary(venueId = 'venue-101', range = '7d') {
    // Simulated server delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    const venueAnalytics = ANALYTICS_DATA_BY_VENUE[venueId] || {
      hasUsableData: false,
      reason: 'No analytics history found for this venue.',
    };

    if (!venueAnalytics.hasUsableData) {
      return {
        success: true,
        insufficientData: true,
        message: venueAnalytics.reason || 'Not enough data yet.',
        data: null,
      };
    }

    const rangeData = venueAnalytics[range] || venueAnalytics['7d'];
    if (!rangeData) {
      return {
        success: true,
        insufficientData: true,
        message: 'Not enough data yet for the selected timeframe.',
        data: null,
      };
    }

    return {
      success: true,
      insufficientData: false,
      venueId,
      range,
      data: {
        ...rangeData,
      },
    };
  },

  /**
   * Fetch Weekly / Daily Bookings Chart Data
   * GET /owner/analytics/bookings?venueId=&range=7d
   */
  async getBookingsChart(venueId = 'venue-101', range = '7d') {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const venueAnalytics = ANALYTICS_DATA_BY_VENUE[venueId];

    if (!venueAnalytics || !venueAnalytics.hasUsableData) {
      return {
        success: true,
        insufficientData: true,
        bookings: [],
      };
    }

    const rangeData = venueAnalytics[range] || venueAnalytics['7d'];
    return {
      success: true,
      insufficientData: false,
      bookings: rangeData?.weeklyBookings || [],
    };
  },
};
