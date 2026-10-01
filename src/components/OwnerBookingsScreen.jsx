import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar, CheckCircle2, ChevronRight, X, Clock, MapPin,
  Filter, Search, RefreshCw, AlertCircle, ArrowLeft,
  DollarSign, Check, Eye, QrCode, Phone, Mail, User, RotateCcw
} from 'lucide-react';
import {
  fetchOwnerBookings,
  updateBookingStatus,
  subscribeToBookingEvents,
  getActiveCourts,
  simulateIncomingBooking,
} from '../services/ownerBookingsService';
import OwnerBottomNav from './OwnerBottomNav';

/* ── Status Badge ────────────────────────────────────────────── */
function StatusBadge({ status }) {
  let bg = '#F1F5F9';
  let color = '#475569';
  let label = status;

  switch (status.toLowerCase()) {
    case 'upcoming':
      bg = '#EFF6FF';
      color = '#1D4ED8';
      label = 'Upcoming';
      break;
    case 'completed':
      bg = '#ECFDF5';
      color = '#065F46';
      label = 'Completed';
      break;
    case 'no-show':
      bg = '#FEF2F2';
      color = '#991B1B';
      label = 'No-show';
      break;
    case 'cancelled':
      bg = '#F1F5F9';
      color = '#475569';
      label = 'Cancelled';
      break;
    default:
      break;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.55rem',
        borderRadius: 9999,
        fontSize: '0.6875rem',
        fontWeight: 700,
        backgroundColor: bg,
        color: color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

/* ── Confirmation Modal for "Done" ────────────────────────────── */
function DoneConfirmationModal({ isOpen, booking, onConfirm, onCancel }) {
  if (!isOpen || !booking) return null;

  return (
    <div className="owner-modal-backdrop" onClick={onCancel}>
      <div className="owner-modal-card" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="owner-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
            </div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Complete Booking
            </h3>
          </div>
          <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <div className="owner-modal-body">
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1E293B', fontWeight: 600, lineHeight: 1.45 }}>
            Mark this booking as completed?
          </p>
          <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.78125rem', color: '#475569' }}>
            <div><strong>Booking:</strong> {booking.id} • {booking.customer.name}</div>
            <div><strong>Court:</strong> {booking.court} ({booking.sport})</div>
            <div><strong>Time:</strong> {booking.time}</div>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
            This will record the player check-in as fulfilled and prepare payout settlement.
          </p>
        </div>
        <div className="owner-modal-footer">
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '0.5rem 0.85rem', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{ padding: '0.5rem 1.1rem', borderRadius: 8, border: 'none', background: '#059669', color: '#FFF', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Yes, Mark Completed
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Booking Detail Modal for "View" ──────────────────────────── */
function BookingDetailModal({ isOpen, booking, onClose }) {
  if (!isOpen || !booking) return null;

  const isCancelled = booking.status.toLowerCase() === 'cancelled';

  return (
    <div className="owner-modal-backdrop" onClick={onClose}>
      <div className="owner-modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="owner-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Eye size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Booking Details
              </h3>
              <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>ID: {booking.id}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="owner-modal-body" style={{ gap: '0.85rem' }}>
          {/* Status banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Status</span>
            <StatusBadge status={booking.status} />
          </div>

          {/* Customer info */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Customer Details
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
              <User size={15} color="#2563EB" />
              <span>{booking.customer.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
              <Phone size={13} color="#64748B" />
              <span>{booking.customer.phone}</span>
            </div>
            {booking.customer.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
                <Mail size={13} color="#64748B" />
                <span>{booking.customer.email}</span>
              </div>
            )}
          </div>

          {/* Venue & Court */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Venue & Slot
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>
              {booking.venue || 'Deccan Sports Arena'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.35rem' }}>
              {booking.venueAddress || 'Pune'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.71875rem', padding: '0.2rem 0.5rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: 4, fontWeight: 700 }}>
                {booking.court}
              </span>
              <span style={{ fontSize: '0.71875rem', padding: '0.2rem 0.5rem', background: '#F1F5F9', color: '#475569', borderRadius: 4, fontWeight: 600 }}>
                {booking.sport}
              </span>
              <span style={{ fontSize: '0.71875rem', padding: '0.2rem 0.5rem', background: '#F8FAFC', color: '#334155', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                {booking.date} • {booking.time}
              </span>
            </div>
          </div>

          {/* Payment & Amount (Financial immutable requirement) */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '0.75rem', background: '#FAFAFA' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Confirmed Amount
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  ₹{booking.amount}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.71875rem', color: '#059669', fontWeight: 700, background: '#ECFDF5', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                  {booking.paymentStatus || 'Paid'}
                </span>
                {booking.paymentId && (
                  <div style={{ fontSize: '0.625rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                    ID: {booking.paymentId}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QR & Check-in / Cancellation info */}
          {isCancelled ? (
            <div style={{ border: '1px solid #FECACA', background: '#FEF2F2', borderRadius: 8, padding: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991B1B', marginBottom: '0.2rem' }}>
                Cancellation Information
              </div>
              <div style={{ fontSize: '0.71875rem', color: '#7F1D1D' }}>
                <strong>Reason:</strong> {booking.cancellationReason || 'Cancelled by customer'}
              </div>
              {booking.cancelledAt && (
                <div style={{ fontSize: '0.6875rem', color: '#B91C1C', marginTop: '0.2rem' }}>
                  Cancelled on: {booking.cancelledAt}
                </div>
              )}
            </div>
          ) : (
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: '#0F172A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#0F172A' }}>
                  Check-in Pass: #{booking.checkInCode || booking.id.replace('BK-', 'CHK-')}
                </div>
                <div style={{ fontSize: '0.6875rem', color: booking.checkInTime ? '#059669' : '#64748B' }}>
                  {booking.checkInTime ? `Checked in at ${booking.checkInTime}` : 'Awaiting player arrival'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="owner-modal-footer">
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: '#2563EB', color: '#FFF', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component: OwnerBookingsScreen ─────────────────────── */
export default function OwnerBookingsScreen({
  onNavigateTab = () => {},
  onBack = () => {},
}) {
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [courtFilter, setCourtFilter] = useState('All');

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, hasMore: false });

  // Modal states
  const [selectedDoneBooking, setSelectedDoneBooking] = useState(null);
  const [selectedViewBooking, setSelectedViewBooking] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const availableCourts = getActiveCourts();

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // ── Load Bookings (Filtered on Backend) ───────────────────────
  const loadBookings = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      setError(null);

      const res = await fetchOwnerBookings({
        date: dateFilter,
        status: statusFilter,
        court: courtFilter,
        page,
        limit: 5,
      });

      if (res.success) {
        setBookings((prev) => {
          if (append) {
            // Deduplicate records when appending
            const existingIds = new Set(prev.map((b) => b.id));
            const newItems = res.data.filter((b) => !existingIds.has(b.id));
            return [...prev, ...newItems];
          }
          return res.data;
        });
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Unable to load bookings');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter, courtFilter]);

  // Trigger load on filter change
  useEffect(() => {
    loadBookings(1, false);
  }, [loadBookings]);

  // ── Real-Time Listener ───────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToBookingEvents((event, payload) => {
      if (event === 'NEW_BOOKING') {
        setBookings((prev) => {
          // Avoid duplicate records
          if (prev.some((b) => b.id === payload.id)) return prev;
          return [payload, ...prev];
        });
        showToast(`🟢 New booking arrived: ${payload.id} - ${payload.customer.name}`);
      } else if (event === 'STATUS_UPDATED') {
        setBookings((prev) =>
          prev.map((b) => (b.id === payload.id ? { ...b, ...payload } : b))
        );
      }
    });

    return () => unsub();
  }, [showToast]);

  // ── Confirm Done Handler ─────────────────────────────────────
  const handleConfirmDone = async () => {
    if (!selectedDoneBooking) return;
    const bookingId = selectedDoneBooking.id;

    try {
      const res = await updateBookingStatus(bookingId, 'completed');
      if (res.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? res.data : b))
        );
        showToast(`✓ Booking ${bookingId} marked as completed!`);
      }
    } catch (err) {
      showToast(`Error updating status: ${err.message}`);
    } finally {
      setSelectedDoneBooking(null);
    }
  };

  const handleClearFilters = () => {
    setDateFilter('');
    setStatusFilter('All');
    setCourtFilter('All');
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !loading) {
      loadBookings(pagination.page + 1, true);
    }
  };

  return (
    <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#0F172A', color: '#38BDF8', padding: '0.6rem 1rem', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Done Confirmation Modal */}
      <DoneConfirmationModal
        isOpen={Boolean(selectedDoneBooking)}
        booking={selectedDoneBooking}
        onConfirm={handleConfirmDone}
        onCancel={() => setSelectedDoneBooking(null)}
      />

      {/* View Detail Modal */}
      <BookingDetailModal
        isOpen={Boolean(selectedViewBooking)}
        booking={selectedViewBooking}
        onClose={() => setSelectedViewBooking(null)}
      />

      {/* Header */}
      <div style={{ background: '#102A43', color: '#FFFFFF', padding: '1.25rem 1rem 1rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onBack}
              style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: 0, display: 'flex' }}
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              Bookings Management
            </h1>
          </div>
          <button
            type="button"
            onClick={() => simulateIncomingBooking()}
            style={{
              padding: '0.3rem 0.6rem',
              borderRadius: 6,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38BDF8',
              fontSize: '0.6875rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Simulate Booking
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>
          Real-time reservations, check-in completion, and customer details.
        </p>
      </div>

      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        {/* ── FILTER CARD (Full-width, Stacked) ── */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>
              <Filter size={15} color="#2563EB" />
              <span>Filter Bookings</span>
            </div>
            {(dateFilter || statusFilter !== 'All' || courtFilter !== 'All') && (
              <button
                type="button"
                onClick={handleClearFilters}
                style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Reset Filters
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Field 1: Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                1. Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8125rem',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                  color: '#0F172A'
                }}
              />
            </div>

            {/* Field 2: Status */}
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                2. Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8125rem',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                  color: '#0F172A'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="No-show">No-show</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Field 3: Court */}
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                3. Court
              </label>
              <select
                value={courtFilter}
                onChange={(e) => setCourtFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8125rem',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                  color: '#0F172A'
                }}
              >
                <option value="All">All Courts</option>
                {availableCourts.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── ERROR STATE ── */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '1rem', textAlign: 'center', marginBottom: '1.25rem' }}>
            <AlertCircle size={24} color="#DC2626" style={{ marginBottom: '0.35rem' }} />
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#991B1B', marginBottom: '0.5rem' }}>
              {error}
            </div>
            <button
              type="button"
              onClick={() => loadBookings(1, false)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 6,
                background: '#DC2626',
                color: '#FFF',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── TABLE CARD ── */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1rem' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>
              Booking Records
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
              Showing {bookings.length} of {pagination.total}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
              <RefreshCw size={22} className="spinning" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.75rem' }}>Loading verified bookings...</div>
            </div>
          ) : bookings.length === 0 ? (
            /* ── EMPTY FILTER RESULT ── */
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
              <Calendar size={32} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.35rem' }}>
                No bookings match these filters
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, marginBottom: '1rem' }}>
                Try adjusting your selected date, status, or court filter.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 8,
                  background: '#2563EB',
                  color: '#FFF',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="owner-schedule-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Court</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const isUpcoming = b.status.toLowerCase() === 'upcoming';
                    return (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          {b.id}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: '#1E293B' }}>{b.customer.name}</div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>{b.customer.phone}</div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', color: '#475569' }}>
                          {b.court}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', color: '#475569' }}>
                          {b.date}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', color: '#475569' }}>
                          {b.time}
                        </td>
                        <td style={{ fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          ₹{b.amount}
                        </td>
                        <td>
                          <StatusBadge status={b.status} />
                        </td>
                        <td>
                          {isUpcoming ? (
                            <button
                              type="button"
                              onClick={() => setSelectedDoneBooking(b)}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: 6,
                                background: '#2563EB',
                                color: '#FFFFFF',
                                border: 'none',
                                fontSize: '0.71875rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <Check size={12} />
                              <span>Done</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedViewBooking(b)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: 6,
                                background: '#F8FAFC',
                                color: '#334155',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.71875rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── PAGINATION CONTROLS ── */}
          {pagination.hasMore && (
            <div style={{ padding: '0.85rem', textAlign: 'center', borderTop: '1px solid #E2E8F0', background: '#FAFBFD' }}>
              <button
                type="button"
                onClick={handleLoadMore}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#1E293B',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Load More Bookings (Page {pagination.page + 1} of {pagination.totalPages})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Owner Bottom Navigation Bar */}
      <OwnerBottomNav activeTab="bookings" onNavigate={onNavigateTab} />
    </div>
  );
}
