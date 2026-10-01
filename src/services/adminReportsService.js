/**
 * ARENA — ADMIN REPORTS & ANALYTICS SERVICE
 * Aggregates platform financial metrics, booking velocity, growth curves,
 * and handles CSV/XLSX export generation.
 * 
 * Endpoints:
 *   GET /admin/reports/revenue
 *   GET /admin/reports/bookings
 *   GET /admin/reports/growth
 *   GET /admin/reports/commission
 *   GET /admin/reports/export
 */

export const adminReportsService = {
  /**
   * GET /admin/reports/revenue
   */
  async getRevenueReport(dateRange = '30d') {
    await new Promise((r) => setTimeout(r, 300));

    return {
      success: true,
      period: dateRange,
      grossVolume: '₹14,82,450',
      platformCommission: '₹1,48,245',
      gstOnCommission: '₹26,684',
      netPayoutsDisbursed: '₹13,07,521',
      averageOrderValue: '₹845',
      peakDayRevenue: '₹78,400 (Sunday, 27 Sep)',
      monthlyBreakdown: [
        { month: 'May 2026', bookings: 420, gross: 336000, commission: 33600 },
        { month: 'Jun 2026', bookings: 610, gross: 512400, commission: 51240 },
        { month: 'Jul 2026', bookings: 890, gross: 747600, commission: 74760 },
        { month: 'Aug 2026', bookings: 1240, gross: 1041600, commission: 104160 },
        { month: 'Sep 2026', bookings: 1780, gross: 1482450, commission: 148245 },
      ],
    };
  },

  /**
   * GET /admin/reports/bookings
   */
  async getBookingsReport(dateRange = '30d') {
    await new Promise((r) => setTimeout(r, 250));

    return {
      success: true,
      period: dateRange,
      totalBookings: 1780,
      completedBookings: 1712,
      cancelledBookings: 54,
      disputedBookings: 14,
      completionRate: '96.2%',
      cancellationRate: '3.0%',
      disputeRate: '0.8%',
      sportsBreakdown: [
        { sport: 'Badminton', bookings: 780, percentage: 43.8 },
        { sport: 'Football', bookings: 410, percentage: 23.0 },
        { sport: 'Cricket', bookings: 290, percentage: 16.3 },
        { sport: 'Tennis', bookings: 180, percentage: 10.1 },
        { sport: 'Pickleball', bookings: 80, percentage: 4.5 },
        { sport: 'Squash', bookings: 40, percentage: 2.3 },
      ],
    };
  },

  /**
   * GET /admin/reports/growth
   */
  async getGrowthReport(dateRange = '30d') {
    await new Promise((r) => setTimeout(r, 250));

    return {
      success: true,
      period: dateRange,
      userGrowth: { current: 12480, previous: 9800, growthRate: '+27.3%' },
      venueGrowth: { current: 148, previous: 120, growthRate: '+23.3%' },
      ownerGrowth: { current: 94, previous: 81, growthRate: '+16.0%' },
      bookingGrowth: { current: 1780, previous: 1240, growthRate: '+43.5%' },
    };
  },

  /**
   * GET /admin/reports/export
   * Generates downloadable CSV data
   */
  async exportReportCSV(reportType = 'revenue') {
    await new Promise((r) => setTimeout(r, 350));

    let csvContent = '';
    let filename = `Arena_${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`;

    if (reportType === 'revenue') {
      csvContent = `Period,Bookings,Gross Revenue (INR),Platform Commission (INR),Net Owner Payouts (INR)\nMay 2026,420,336000,33600,302400\nJun 2026,610,512400,51240,461160\nJul 2026,890,747600,74760,672840\nAug 2026,1240,1041600,104160,937440\nSep 2026,1780,1482450,148245,1334205\n`;
    } else if (reportType === 'bookings') {
      csvContent = `Sport Category,Bookings Count,Share (%)\nBadminton,780,43.8%\nFootball,410,23.0%\nCricket,290,16.3%\nTennis,180,10.1%\nPickleball,80,4.5%\nSquash,40,2.3%\n`;
    } else {
      csvContent = `Entity,Current Total,Previous Period,Growth Rate\nRegistered Users,12480,9800,+27.3%\nPartner Venues,148,120,+23.3%\nVenue Owners,94,81,+16.0%\nMonthly Bookings,1780,1240,+43.5%\n`;
    }

    // Trigger browser download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      filename,
    };
  },
};
