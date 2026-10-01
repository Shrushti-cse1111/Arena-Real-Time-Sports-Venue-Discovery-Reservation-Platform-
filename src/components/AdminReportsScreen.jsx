import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Users,
  Building2,
  FileText,
  RefreshCw,
  ArrowUpRight,
  PieChart
} from 'lucide-react';
import { adminReportsService } from '../services/adminReportsService';

export default function AdminReportsScreen({
  adminSession,
  onBackToDashboard,
}) {
  const [dateRange, setDateRange] = useState('30d');
  const [revenueReport, setRevenueReport] = useState(null);
  const [bookingsReport, setBookingsReport] = useState(null);
  const [growthReport, setGrowthReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const [revRes, bkRes, grRes] = await Promise.all([
        adminReportsService.getRevenueReport(dateRange),
        adminReportsService.getBookingsReport(dateRange),
        adminReportsService.getGrowthReport(dateRange),
      ]);

      if (revRes.success) setRevenueReport(revRes);
      if (bkRes.success) setBookingsReport(bkRes);
      if (grRes.success) setGrowthReport(grRes);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const handleExport = async (type) => {
    setIsExporting(true);
    try {
      await adminReportsService.exportReportCSV(type);
    } catch (err) {
      alert('Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="admin-reports-screen fade-in">
      <div className="admin-content-card">
        <div className="card-header-row">
          <div className="card-header-title-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="admin-title-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <h2 className="admin-section-heading" style={{ margin: 0 }}>Financial Reports & Platform Analytics</h2>
                <p className="admin-subtext" style={{ margin: 0 }}>
                  Consolidated GMV breakdown, booking velocity, growth curves & spreadsheet exports
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="range-pills-row">
              {['7d', '30d', '90d', '1y'].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`range-pill-btn ${dateRange === r ? 'active' : ''}`}
                  onClick={() => setDateRange(r)}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => handleExport('revenue')}
              disabled={isExporting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem' }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Growth KPIs */}
        {growthReport && (
          <div className="user-kpi-summary-strip" style={{ marginTop: '1rem' }}>
            <div className="user-kpi-pill">
              <span className="pill-lbl">Active Players Growth</span>
              <span className="pill-val" style={{ color: '#2563EB' }}>{growthReport.userGrowth.current.toLocaleString()}</span>
              <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>{growthReport.userGrowth.growthRate} vs prior</span>
            </div>
            <div className="user-kpi-pill">
              <span className="pill-lbl">Venue Network Growth</span>
              <span className="pill-val" style={{ color: '#D97706' }}>{growthReport.venueGrowth.current} Venues</span>
              <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>{growthReport.venueGrowth.growthRate} vs prior</span>
            </div>
            <div className="user-kpi-pill">
              <span className="pill-lbl">Monthly Order Volume</span>
              <span className="pill-val" style={{ color: '#7C3AED' }}>{growthReport.bookingGrowth.current} Bookings</span>
              <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>{growthReport.bookingGrowth.growthRate} vs prior</span>
            </div>
          </div>
        )}

        {/* Monthly Revenue Table */}
        {revenueReport && (
          <div className="user-info-section-group" style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 className="info-group-title" style={{ margin: 0 }}>Monthly Financial Statement (GMV & Net Cut)</h4>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>Average Order: {revenueReport.averageOrderValue}</span>
            </div>

            <div className="admin-table-responsive" style={{ marginTop: '0.5rem' }}>
              <table className="admin-user-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Bookings Volume</th>
                    <th>Gross Volume (GMV)</th>
                    <th>Platform Fee (10%)</th>
                    <th>Net Owner Payouts</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueReport.monthlyBreakdown.map((m, i) => (
                    <tr key={i} className="user-table-row">
                      <td><strong>{m.month}</strong></td>
                      <td>{m.bookings.toLocaleString()} orders</td>
                      <td><strong>₹{m.gross.toLocaleString('en-IN')}</strong></td>
                      <td><span style={{ color: '#2563EB', fontWeight: 700 }}>₹{m.commission.toLocaleString('en-IN')}</span></td>
                      <td><strong style={{ color: '#059669' }}>₹{(m.gross - m.commission).toLocaleString('en-IN')}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Category Contribution */}
        {bookingsReport && (
          <div className="user-info-section-group" style={{ marginTop: '1.25rem' }}>
            <h4 className="info-group-title">Booking Velocity by Sport Category</h4>
            <div className="info-two-col-grid" style={{ marginTop: '0.5rem' }}>
              {bookingsReport.sportsBreakdown.map((s, i) => (
                <div key={i} className="info-detail-cell">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="cell-lbl">{s.sport}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB' }}>{s.percentage}%</span>
                  </div>
                  <span className="cell-val">{s.bookings} Bookings</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
