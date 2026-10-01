import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Calendar,
  DollarSign,
  CreditCard,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  X,
  BadgeAlert,
  HelpCircle
} from 'lucide-react';
import { adminBookingService } from '../services/adminBookingService';

export default function AdminBookingManagementScreen({
  adminSession,
  onBackToDashboard,
  initialFilter = 'all',
}) {
  const [statusFilter, setStatusFilter] = useState(initialFilter); // 'all' | 'upcoming' | 'completed' | 'cancelled' | 'disputed'
  const [venueFilter, setVenueFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingsList, setBookingsList] = useState([]);
  const [bookingCounts, setBookingCounts] = useState({ all: 0, upcoming: 0, completed: 0, cancelled: 0, disputed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // Modals
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [disputeModalBooking, setDisputeModalBooking] = useState(null);
  const [disputeResolutionText, setDisputeResolutionText] = useState('');
  const [disputeRefundAmount, setDisputeRefundAmount] = useState(0);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const activeAdmin = adminSession || {
    adminId: 'ADM-9001',
    name: 'Sarah Connor',
    email: 'admin@arena.com',
    role: 'superadmin',
  };

  const fetchBookings = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await adminBookingService.getBookings({
        search: searchQuery,
        status: statusFilter,
        venue: venueFilter,
        paymentMethod: paymentFilter,
      });

      if (res.success) {
        setBookingsList(res.bookings);
        setBookingCounts(res.counts);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, venueFilter, paymentFilter, searchQuery]);

  const handleResolveDispute = async () => {
    if (!disputeResolutionText || disputeResolutionText.trim().length < 5) {
      alert('Please provide detailed resolution notes (minimum 5 characters).');
      return;
    }

    setIsSubmittingDispute(true);
    try {
      const res = await adminBookingService.resolveBookingDispute(
        disputeModalBooking.id,
        {
          resolution: disputeResolutionText.trim(),
          actionTaken: disputeRefundAmount > 0 ? `Refund of ₹${disputeRefundAmount} credited to customer wallet.` : 'Claim dismissed after verifying CCTV & attendance.',
          refundAmount: Number(disputeRefundAmount) || 0,
        },
        activeAdmin.adminId,
        activeAdmin.name
      );

      if (res.success) {
        setActionNotice(res.message);
        setTimeout(() => setActionNotice(''), 4000);
        setDisputeModalBooking(null);
        setDisputeResolutionText('');
        setDisputeRefundAmount(0);
        if (selectedBooking?.id === disputeModalBooking.id) setSelectedBooking(res.booking);
        fetchBookings(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to resolve dispute.');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  return (
    <div className="admin-booking-mgmt-container fade-in">
      {actionNotice && (
        <div className="admin-action-toast fade-in">
          <CheckCircle2 size={16} color="#10B981" />
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice('')} className="toast-close-btn">✕</button>
        </div>
      )}

      {/* Header Card */}
      <div className="admin-content-card">
        <div className="card-header-row">
          <div className="card-header-title-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="admin-title-icon-box" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                <FileText size={20} />
              </div>
              <div>
                <h2 className="admin-section-heading" style={{ margin: 0 }}>Platform Bookings & Transactions</h2>
                <p className="admin-subtext" style={{ margin: 0 }}>
                  Live reservation stream, financial splits, cancellation refunds & dispute resolution
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="admin-refresh-btn"
            onClick={() => fetchBookings(true)}
            title="Refresh Bookings"
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
          </button>
        </div>

        {/* Counts Strip */}
        <div className="user-kpi-summary-strip" style={{ marginTop: '1rem' }}>
          <div className="user-kpi-pill">
            <span className="pill-val">{bookingCounts.all}</span>
            <span className="pill-lbl">Total Bookings</span>
          </div>
          <div className="user-kpi-pill active-pill">
            <span className="pill-val">{bookingCounts.upcoming}</span>
            <span className="pill-lbl">Upcoming Slots</span>
          </div>
          <div className="user-kpi-pill">
            <span className="pill-val" style={{ color: '#059669' }}>{bookingCounts.completed}</span>
            <span className="pill-lbl">Completed</span>
          </div>
          <div className="user-kpi-pill blocked-pill">
            <span className="pill-val">{bookingCounts.cancelled}</span>
            <span className="pill-lbl">Cancelled / Refunded</span>
          </div>
          <div className="user-kpi-pill" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
            <span className="pill-val" style={{ color: '#D97706' }}>{bookingCounts.disputed}</span>
            <span className="pill-lbl">Disputes</span>
          </div>
        </div>

        {/* Filters */}
        <div className="user-mgmt-filter-bar" style={{ marginTop: '1rem' }}>
          <div className="input-wrapper user-search-wrapper" style={{ flex: 1 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search by Booking ID, customer, venue, court, TXN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: '38px', fontSize: '0.85rem' }}
            />
            {searchQuery ? (
              <button type="button" className="input-icon-right-btn" onClick={() => setSearchQuery('')}>
                <X size={14} color="#94A3B8" />
              </button>
            ) : (
              <span className="input-icon-right"><Search size={15} color="#94A3B8" /></span>
            )}
          </div>

          <div className="user-status-segmented-control">
            {[
              { id: 'all', label: 'All', count: bookingCounts.all },
              { id: 'upcoming', label: 'Upcoming', count: bookingCounts.upcoming },
              { id: 'completed', label: 'Completed', count: bookingCounts.completed },
              { id: 'disputed', label: 'Disputed', count: bookingCounts.disputed },
              { id: 'cancelled', label: 'Cancelled', count: bookingCounts.cancelled },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`segmented-tab-btn ${statusFilter === tab.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="tab-pill-count">{tab.count}</span>
              </button>
            ))}
          </div>

          <select
            className="filter-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={{ height: '38px' }}
          >
            <option value="all">All Payments</option>
            <option value="UPI">UPI</option>
            <option value="Card">Cards</option>
            <option value="Net Banking">Net Banking</option>
          </select>
        </div>

        {/* Bookings Table */}
        {isLoading ? (
          <div className="admin-loading-container" style={{ padding: '2.5rem 0', textAlign: 'center' }}>
            <RefreshCw size={24} className="spin-icon" color="#2563EB" />
            <p style={{ marginTop: '0.5rem', color: '#64748B', fontSize: '0.85rem' }}>Loading bookings ledger...</p>
          </div>
        ) : (
          <div className="admin-table-responsive" style={{ marginTop: '1rem' }}>
            <table className="admin-user-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Venue & Court</th>
                  <th>Date & Time</th>
                  <th>Amount & Cut</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookingsList.map((b) => (
                  <tr key={b.id} className="user-table-row">
                    <td>
                      <span className="ledger-id-tag">{b.id}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '0.82rem', color: '#0F172A' }}>{b.customer.name}</strong>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{b.customer.phone}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B' }}>{b.venue}</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{b.court}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F172A' }}>{b.date}</span>
                        <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>{b.time}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>₹{b.amount}</span>
                        <span style={{ fontSize: '0.6875rem', color: '#059669' }}>Fee: ₹{b.platformCommission} (10%)</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', color: '#334155' }}>{b.payment.method}</span>
                        <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{b.payment.transactionId}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge-sm ${b.status === 'disputed' ? 'blocked' : b.status === 'completed' ? 'active' : b.status}`}>
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="user-actions-cell">
                        <button
                          type="button"
                          className="btn-action-sm btn-view-user"
                          onClick={() => setSelectedBooking(b)}
                        >
                          <Eye size={13} /> Details
                        </button>
                        {b.status === 'disputed' && (
                          <button
                            type="button"
                            className="btn-action-sm btn-block-user"
                            onClick={() => {
                              setDisputeModalBooking(b);
                              setDisputeResolutionText('');
                              setDisputeRefundAmount(b.amount);
                            }}
                          >
                            <BadgeAlert size={13} /> Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BOOKING DETAILS MODAL */}
      {selectedBooking && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 120 }}>
          <div className="modal-container user-details-modal-container">
            <div className="user-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="ledger-id-tag" style={{ fontSize: '0.9rem' }}>{selectedBooking.id}</span>
                <span className={`status-badge-sm ${selectedBooking.status}`}>{selectedBooking.status.toUpperCase()}</span>
              </div>
              <button type="button" className="close-notice-btn" onClick={() => setSelectedBooking(null)}>✕</button>
            </div>

            <div className="user-modal-tab-content">
              <div className="info-two-col-grid">
                <div className="info-detail-cell">
                  <span className="cell-lbl">Player / Customer</span>
                  <span className="cell-val">{selectedBooking.customer.name} ({selectedBooking.customer.phone})</span>
                </div>
                <div className="info-detail-cell">
                  <span className="cell-lbl">Venue Operator</span>
                  <span className="cell-val">{selectedBooking.owner.businessName} ({selectedBooking.owner.name})</span>
                </div>
                <div className="info-detail-cell">
                  <span className="cell-lbl">Venue & Court Slot</span>
                  <span className="cell-val">{selectedBooking.venue} • {selectedBooking.court}</span>
                </div>
                <div className="info-detail-cell">
                  <span className="cell-lbl">Scheduled Timing</span>
                  <span className="cell-val">{selectedBooking.date} • {selectedBooking.time}</span>
                </div>
              </div>

              {/* Financial Split */}
              <div className="user-stat-card" style={{ marginTop: '0.75rem', background: '#F0FDF4', borderColor: '#BBF7D0' }}>
                <span className="stat-lbl" style={{ color: '#166534' }}>Financial Calculation Breakdown</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.82rem' }}>
                  <span>Gross Paid: <strong>₹{selectedBooking.amount}</strong></span>
                  <span style={{ color: '#2563EB' }}>Platform Commission (10%): <strong>₹{selectedBooking.platformCommission}</strong></span>
                  <span style={{ color: '#059669' }}>Net Owner Payout: <strong>₹{selectedBooking.ownerPayout}</strong></span>
                </div>
              </div>

              {/* Dispute Box if any */}
              {selectedBooking.dispute && (
                <div className="user-complaint-card" style={{ marginTop: '0.75rem', background: '#FEF2F2', borderColor: '#FECACA' }}>
                  <div className="complaint-card-header">
                    <span className="complaint-id-tag" style={{ color: '#991B1B' }}>Dispute ID: {selectedBooking.dispute.id}</span>
                    <span className={`status-badge-sm ${selectedBooking.dispute.status === 'resolved' ? 'active' : 'blocked'}`}>
                      {selectedBooking.dispute.status.toUpperCase()}
                    </span>
                  </div>
                  <strong style={{ fontSize: '0.82rem', color: '#991B1B' }}>{selectedBooking.dispute.reason}</strong>
                  <p style={{ fontSize: '0.75rem', color: '#7F1D1D', margin: '0.25rem 0' }}>
                    <strong>Claim:</strong> {selectedBooking.dispute.customerClaim}
                  </p>
                  {selectedBooking.dispute.resolution && (
                    <div style={{ marginTop: '0.4rem', background: '#FFFFFF', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', color: '#166534' }}>
                      <strong>Resolution:</strong> {selectedBooking.dispute.resolution}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="user-modal-actions-footer">
              <button type="button" className="btn-secondary" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* DISPUTE RESOLUTION MODAL */}
      {disputeModalBooking && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 130 }}>
          <div className="modal-container" style={{ maxWidth: '420px' }}>
            <div className="modal-icon-header" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <HelpCircle size={26} />
            </div>
            <h3 className="modal-title">Resolve Dispute for {disputeModalBooking.id}</h3>
            <p className="modal-description">
              Customer filed conflict for <strong>{disputeModalBooking.venue}</strong> on {disputeModalBooking.date}.
            </p>

            <div style={{ marginTop: '0.85rem' }}>
              <label className="input-label">Resolution Notes & Findings *</label>
              <textarea
                className="reason-textarea"
                rows={3}
                placeholder="Enter investigation summary, CCTV validation, or compensation notes..."
                value={disputeResolutionText}
                onChange={(e) => setDisputeResolutionText(e.target.value)}
                style={{ width: '100%', marginTop: '0.3rem' }}
              />

              <label className="input-label" style={{ marginTop: '0.65rem' }}>
                Wallet Refund Amount (₹) — 0 if claim rejected
              </label>
              <input
                type="number"
                className="input-field"
                value={disputeRefundAmount}
                onChange={(e) => setDisputeRefundAmount(e.target.value)}
                style={{ width: '100%', marginTop: '0.3rem' }}
              />
            </div>

            <div className="modal-actions-row" style={{ marginTop: '1.25rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setDisputeModalBooking(null)}>Cancel</button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleResolveDispute}
                disabled={isSubmittingDispute}
              >
                {isSubmittingDispute ? 'Finalizing...' : 'Finalize Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
