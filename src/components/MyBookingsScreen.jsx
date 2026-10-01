import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  ChevronRight,
  RotateCcw,
  Star,
  Phone,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  X,
  Home,
  User,
  ShieldCheck,
  CreditCard,
  Layers,
  Sparkles,
  Info,
  Users,
} from 'lucide-react';
import { AVAILABLE_SPORTS, PUNE_VENUES } from '../data/mockVenues';
import RatingReviewModal from './RatingReviewModal';

export default function MyBookingsScreen({
  bookings = [],
  onSelectBooking,
  onCancelBooking,
  onRescheduleBooking,
  onRateBooking,
  onBookAgain,
  onNavigateTab,
  onExploreVenues,
}) {
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of schedule');
  const [customReason, setCustomReason] = useState('');
  const [refundDestination, setRefundDestination] = useState('wallet'); // 'wallet' | 'original'

  const [rescheduleModalBooking, setRescheduleModalBooking] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('2026-09-17');
  const [rescheduleSlot, setRescheduleSlot] = useState('7:00 PM – 8:00 PM');

  const [rateModalBooking, setRateModalBooking] = useState(null);

  const [contactModalBooking, setContactModalBooking] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Group and count bookings
  const upcomingBookings = bookings.filter(
    (b) => b.category === 'upcoming' || b.status === 'confirmed' || b.status === 'rescheduled'
  );
  const pastBookings = bookings.filter(
    (b) => b.category === 'past' || b.status === 'completed'
  );
  const cancelledBookings = bookings.filter(
    (b) => b.category === 'cancelled' || b.status === 'cancelled'
  );

  const getActiveList = () => {
    if (activeTab === 'upcoming') return upcomingBookings;
    if (activeTab === 'past') return pastBookings;
    return cancelledBookings;
  };

  // Filter list by search query
  const filteredList = getActiveList().filter((b) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.venueName?.toLowerCase().includes(query) ||
      b.sport?.toLowerCase().includes(query) ||
      b.bookingId?.toLowerCase().includes(query) ||
      b.courtName?.toLowerCase().includes(query) ||
      b.venueLocation?.toLowerCase().includes(query)
    );
  });

  // Handle Cancellation Action
  const handleConfirmCancel = () => {
    if (!cancelModalBooking) return;
    const finalReason = cancelReason === 'Other' ? customReason || 'Personal reasons' : cancelReason;
    if (onCancelBooking) {
      onCancelBooking(cancelModalBooking.id, finalReason, refundDestination);
    }
    showToast(
      refundDestination === 'wallet'
        ? `₹${cancelModalBooking.finalPayable} refunded instantly to Arena Wallet!`
        : `Booking cancelled. Refund of ₹${cancelModalBooking.finalPayable} initiated!`
    );
    setCancelModalBooking(null);
    setCancelReason('Change of schedule');
    setCustomReason('');
    setActiveTab('cancelled');
  };

  // Handle Reschedule Action
  const handleConfirmReschedule = () => {
    if (!rescheduleModalBooking) return;
    if (onRescheduleBooking) {
      onRescheduleBooking(rescheduleModalBooking.id, rescheduleDate, rescheduleSlot);
    }
    showToast(`Booking rescheduled to ${rescheduleDate} (${rescheduleSlot})`);
    setRescheduleModalBooking(null);
  };



  const getStatusBadge = (status) => {
    switch (status) {
      case 'partially_paid':
        return (
          <span className="booking-status-badge badge-partially-paid" style={{
            background: '#EFF6FF',
            color: '#1D4ED8',
            border: '1px solid #BFDBFE',
          }}>
            <Users size={12} />
            <span>Split Active</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="booking-status-badge badge-confirmed">
            <CheckCircle2 size={12} />
            <span>Confirmed</span>
          </span>
        );
      case 'rescheduled':
        return (
          <span className="booking-status-badge badge-rescheduled">
            <RotateCcw size={12} />
            <span>Rescheduled</span>
          </span>
        );
      case 'completed':
        return (
          <span className="booking-status-badge badge-completed">
            <CheckCircle2 size={12} />
            <span>Completed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="booking-status-badge badge-cancelled">
            <XCircle size={12} />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="booking-status-badge badge-confirmed">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="my-bookings-container fade-in">
      {/* HEADER */}
      <header className="my-bookings-header">
        <div className="bookings-header-row">
          <div>
            <h1 className="bookings-page-title">My Bookings</h1>
            <p className="bookings-page-subtitle">Manage matches, passes & court receipts</p>
          </div>
          <div className="bookings-count-pill">
            <Layers size={14} />
            <span>{bookings.length} Total</span>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="bookings-search-box">
          <Search size={16} className="bookings-search-icon" />
          <input
            type="text"
            className="bookings-search-input"
            placeholder="Search venue, sport, or #ARN ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="bookings-search-clear"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* TABS SEGMENT */}
        <div className="bookings-tabs-segment" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'upcoming'}
            className={`booking-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <span>Upcoming</span>
            <span className="tab-count-badge">{upcomingBookings.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'past'}
            className={`booking-tab-btn ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            <span>Past</span>
            <span className="tab-count-badge">{pastBookings.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cancelled'}
            className={`booking-tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            <span>Cancelled</span>
            <span className="tab-count-badge">{cancelledBookings.length}</span>
          </button>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="booking-toast-alert fade-in">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BOOKINGS LIST SCROLLER */}
      <div className="bookings-list-content">
        {filteredList.length === 0 ? (
          <div className="bookings-empty-state fade-in">
            <div className="empty-icon-wrap">
              {activeTab === 'upcoming' && <Calendar size={32} />}
              {activeTab === 'past' && <Clock size={32} />}
              {activeTab === 'cancelled' && <ShieldCheck size={32} />}
            </div>

            {searchQuery ? (
              <>
                <h3 className="empty-title">No bookings found</h3>
                <p className="empty-desc">
                  No matches found for "{searchQuery}" in {activeTab} bookings.
                </p>
                <button
                  type="button"
                  className="btn-empty-action"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                {activeTab === 'upcoming' && (
                  <>
                    <h3 className="empty-title">No Upcoming Matches</h3>
                    <p className="empty-desc">
                      You don't have any court bookings scheduled. Book your favorite sport and hit the turf!
                    </p>
                    <button
                      type="button"
                      className="btn-empty-action"
                      onClick={() => (onExploreVenues ? onExploreVenues() : onNavigateTab && onNavigateTab('home'))}
                    >
                      <span>Explore Venues</span>
                      <ArrowRight size={16} />
                    </button>
                  </>
                )}

                {activeTab === 'past' && (
                  <>
                    <h3 className="empty-title">No Past Match History</h3>
                    <p className="empty-desc">
                      Your completed court passes, game summaries, and invoices will be saved here.
                    </p>
                    <button
                      type="button"
                      className="btn-empty-action"
                      onClick={() => (onExploreVenues ? onExploreVenues() : onNavigateTab && onNavigateTab('home'))}
                    >
                      <span>Book a Court</span>
                      <ArrowRight size={16} />
                    </button>
                  </>
                )}

                {activeTab === 'cancelled' && (
                  <>
                    <h3 className="empty-title">No Cancelled Bookings</h3>
                    <p className="empty-desc">
                      Zero cancellations recorded. All your bookings are smooth and on schedule!
                    </p>
                    <button
                      type="button"
                      className="btn-empty-action"
                      onClick={() => setActiveTab('upcoming')}
                    >
                      <span>View Upcoming Games</span>
                      <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="bookings-cards-grid">
            {filteredList.map((booking) => (
              <div
                key={booking.id}
                className="booking-card-item fade-in"
                onClick={() => onSelectBooking && onSelectBooking(booking)}
              >
                {/* CARD TOP META */}
                <div className="booking-card-header">
                  <div className="sport-tag-pill">
                    <span className="sport-dot" />
                    <span>{booking.sport}</span>
                  </div>
                  <div className="header-right-meta">
                    <span className="booking-id-tag">{booking.bookingId}</span>
                    {getStatusBadge(booking.status)}
                  </div>
                </div>

                {/* VENUE & COURT SUMMARY */}
                <div className="booking-venue-row">
                  <div className="booking-venue-thumb-wrap">
                    <img
                      src={booking.venueImage || PUNE_VENUES[0].photos[0]}
                      alt={booking.venueName}
                      className="booking-venue-thumb"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="booking-venue-info">
                    <h2 className="booking-venue-name">{booking.venueName}</h2>
                    <div className="booking-court-line">
                      <span className="court-bullet">•</span>
                      <span>{booking.courtName}</span>
                    </div>
                    <div className="booking-location-line">
                      <MapPin size={12} />
                      <span className="truncate">{booking.venueLocation}</span>
                    </div>
                  </div>
                </div>

                {/* DATE & TIME INFO STRIP */}
                <div className="booking-schedule-strip">
                  <div className="schedule-item">
                    <Calendar size={13} className="strip-icon" />
                    <span className="schedule-text">{booking.dateFormatted || booking.date}</span>
                  </div>
                  <div className="schedule-divider">•</div>
                  <div className="schedule-item">
                    <Clock size={13} className="strip-icon" />
                    <span className="schedule-text">{booking.time}</span>
                  </div>
                </div>

                {/* GROUP SPLIT STATUS CHIP */}
                {booking.isGroupBooking && (
                  <div className="group-split-card-chip fade-in" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '8px',
                    padding: '0.35rem 0.6rem',
                    margin: '0.45rem 0',
                    fontSize: '0.71875rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1E40AF', fontWeight: 700 }}>
                      <Users size={13} color="#2563EB" />
                      <span>Group Booking ({booking.groupParticipantsCount || 4} Players)</span>
                    </div>
                    <span style={{ color: booking.status === 'confirmed' ? '#059669' : '#2563EB', fontWeight: 800 }}>
                      {booking.status === 'confirmed' ? '100% Settled ✓' : 'Split Active'}
                    </span>
                  </div>
                )}

                {/* CANCELLED REFUND STATUS BANNER */}
                {booking.status === 'cancelled' && booking.cancellationDetails && (
                  <div className="booking-refund-banner">
                    <Info size={13} className="refund-icon" />
                    <div className="refund-text-col">
                      <span className="refund-head">
                        ₹{booking.cancellationDetails.refundAmount || booking.finalPayable} Refund Processed
                      </span>
                      <span className="refund-sub">
                        {booking.cancellationDetails.refundStatus} • Ref: {booking.cancellationDetails.refundTxnId}
                      </span>
                    </div>
                  </div>
                )}

                {/* PAST USER REVIEW BANNER */}
                {booking.status === 'completed' && booking.userReview && (
                  <div className="booking-reviewed-banner">
                    <Star size={13} className="star-filled" />
                    <span className="review-snippet">
                      Rated {booking.userReview.rating}.0 ★ — "{booking.userReview.comment}"
                    </span>
                  </div>
                )}

                {/* CARD BOTTOM PRICE & ACTIONS */}
                <div className="booking-card-footer">
                  <div className="footer-amount-col">
                    <span className="footer-amount-lbl">Total Paid</span>
                    <span className="footer-amount-val">₹{booking.finalPayable}</span>
                  </div>

                  {/* TAB SPECIFIC BUTTON ACTIONS */}
                  <div
                    className="footer-actions-group"
                    onClick={(e) => e.stopPropagation()} // Prevent card navigation when clicking sub buttons
                  >
                    {activeTab === 'upcoming' && (
                      <>
                        <button
                          type="button"
                          className="btn-card-icon"
                          title="Contact Venue"
                          onClick={() => setContactModalBooking(booking)}
                        >
                          <Phone size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn-card-outline"
                          onClick={() => setRescheduleModalBooking(booking)}
                        >
                          <span>Reschedule</span>
                        </button>

                        <button
                          type="button"
                          className="btn-card-danger"
                          onClick={() => setCancelModalBooking(booking)}
                        >
                          <span>Cancel</span>
                        </button>

                        <button
                          type="button"
                          className="btn-card-primary"
                          onClick={() => onSelectBooking && onSelectBooking(booking)}
                        >
                          <span>Pass</span>
                          <ChevronRight size={14} />
                        </button>
                      </>
                    )}

                    {activeTab === 'past' && (
                      <>
                        <button
                          type="button"
                          className="btn-card-outline"
                          onClick={() => {
                            setRateModalBooking(booking);
                            if (booking.userReview) {
                              setSelectedRating(booking.userReview.rating);
                              setSelectedTags(booking.userReview.tags || []);
                              setReviewComment(booking.userReview.comment || '');
                            }
                          }}
                        >
                          <Star size={13} className={booking.userReview ? 'star-filled' : ''} />
                          <span>{booking.userReview ? 'Edit Review' : 'Rate'}</span>
                        </button>

                        <button
                          type="button"
                          className="btn-card-primary"
                          onClick={() => onBookAgain && onBookAgain(booking.venueId || 'venue-1')}
                        >
                          <span>Book Again</span>
                          <RotateCcw size={13} />
                        </button>
                      </>
                    )}

                    {activeTab === 'cancelled' && (
                      <>
                        <button
                          type="button"
                          className="btn-card-outline"
                          onClick={() => onSelectBooking && onSelectBooking(booking)}
                        >
                          <span>Details</span>
                        </button>

                        <button
                          type="button"
                          className="btn-card-primary"
                          onClick={() => onBookAgain && onBookAgain(booking.venueId || 'venue-1')}
                        >
                          <span>Book Again</span>
                          <RotateCcw size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: CANCEL BOOKING MODAL
          ========================================================================= */}
      {cancelModalBooking && (
        <div className="modal-backdrop-overlay fade-in" onClick={() => setCancelModalBooking(null)}>
          <div className="modal-sheet-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-indicator" />
            <div className="modal-header-row">
              <div className="modal-icon-badge danger">
                <AlertCircle size={20} />
              </div>
              <div className="modal-titles">
                <h3 className="modal-title">Cancel Court Booking?</h3>
                <span className="modal-sub">{cancelModalBooking.bookingId} • {cancelModalBooking.venueName}</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setCancelModalBooking(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-content">
              {/* REFUND CALCULATION BANNER */}
              <div className="cancel-refund-preview">
                <div className="refund-calc-row">
                  <span className="calc-lbl">Paid Amount</span>
                  <span className="calc-val">₹{cancelModalBooking.finalPayable}</span>
                </div>
                <div className="refund-calc-row">
                  <span className="calc-lbl">Cancellation Fee</span>
                  <span className="calc-val green">{'₹0 (Free > 4 hrs)'}</span>
                </div>
                <div className="calc-divider" />
                <div className="refund-calc-row total">
                  <span className="calc-lbl">Estimated Refund</span>
                  <span className="calc-val highlight">₹{cancelModalBooking.finalPayable}</span>
                </div>
              </div>

              {/* REFUND DESTINATION SELECTOR */}
              <label className="input-group-label" style={{ marginTop: '0.85rem' }}>
                Refund Destination
              </label>
              <div className="refund-dest-options-list">
                <label className={`refund-dest-option ${refundDestination === 'wallet' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="refund-dest"
                    checked={refundDestination === 'wallet'}
                    onChange={() => setRefundDestination('wallet')}
                  />
                  <div className="dest-opt-text">
                    <span className="dest-opt-title">⚡ Arena Wallet (Instant Credit)</span>
                    <span className="dest-opt-sub">Zero waiting time. Instantly usable for any sports booking.</span>
                  </div>
                </label>

                <label className={`refund-dest-option ${refundDestination === 'original' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="refund-dest"
                    checked={refundDestination === 'original'}
                    onChange={() => setRefundDestination('original')}
                  />
                  <div className="dest-opt-text">
                    <span className="dest-opt-title">🏦 {cancelModalBooking.paymentMethod || 'Original Payment Source'}</span>
                    <span className="dest-opt-sub">Standard gateway processing within 24-48 bank hours.</span>
                  </div>
                </label>
              </div>

              {/* REASON SELECTOR */}
              <label className="input-group-label" style={{ marginTop: '0.85rem' }}>
                Reason for Cancellation
              </label>
              <div className="cancel-reasons-list">
                {[
                  'Change of schedule / plans',
                  'Weather / heavy rain',
                  'Teammates unavailable',
                  'Booked incorrect court or timing',
                  'Other',
                ].map((reason) => (
                  <label
                    key={reason}
                    className={`reason-option-item ${cancelReason === reason ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="cancel-reason"
                      checked={cancelReason === reason}
                      onChange={() => setCancelReason(reason)}
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {cancelReason === 'Other' && (
                <textarea
                  className="modal-text-input"
                  placeholder="Please specify why you are cancelling..."
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
              )}
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-secondary"
                onClick={() => setCancelModalBooking(null)}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="btn-modal-danger"
                onClick={handleConfirmCancel}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: RESCHEDULE BOOKING MODAL
          ========================================================================= */}
      {rescheduleModalBooking && (
        <div className="modal-backdrop-overlay fade-in" onClick={() => setRescheduleModalBooking(null)}>
          <div className="modal-sheet-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-indicator" />
            <div className="modal-header-row">
              <div className="modal-icon-badge primary">
                <RotateCcw size={20} />
              </div>
              <div className="modal-titles">
                <h3 className="modal-title">Reschedule Slot</h3>
                <span className="modal-sub">{rescheduleModalBooking.venueName} • {rescheduleModalBooking.courtName}</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setRescheduleModalBooking(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-content">
              <div className="current-slot-pill">
                <span className="pill-lbl">Current:</span>
                <span className="pill-val">
                  {rescheduleModalBooking.dateFormatted || rescheduleModalBooking.date} • {rescheduleModalBooking.time}
                </span>
              </div>

              <label className="input-group-label" style={{ marginTop: '0.85rem' }}>
                Select New Date
              </label>
              <div className="reschedule-dates-row">
                {[
                  { label: 'Wed, 16 Sep', value: '2026-09-16' },
                  { label: 'Thu, 17 Sep', value: '2026-09-17' },
                  { label: 'Fri, 18 Sep', value: '2026-09-18' },
                  { label: 'Sat, 19 Sep', value: '2026-09-19' },
                ].map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    className={`date-chip ${rescheduleDate === d.value ? 'active' : ''}`}
                    onClick={() => setRescheduleDate(d.value)}
                  >
                    <span>{d.label}</span>
                  </button>
                ))}
              </div>

              <label className="input-group-label" style={{ marginTop: '0.85rem' }}>
                Select New Time Slot
              </label>
              <div className="reschedule-slots-grid">
                {[
                  '06:00 AM – 07:00 AM',
                  '07:00 AM – 08:00 AM',
                  '05:00 PM – 06:00 PM',
                  '06:00 PM – 07:00 PM',
                  '07:00 PM – 08:00 PM',
                  '08:00 PM – 09:00 PM',
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`slot-time-chip ${rescheduleSlot === s ? 'active' : ''}`}
                    onClick={() => setRescheduleSlot(s)}
                  >
                    <span>{s}</span>
                  </button>
                ))}
              </div>

              <div className="reschedule-policy-note">
                <ShieldCheck size={14} className="policy-icon" />
                <span>Free 1-time rescheduling allowed up to 2 hours before the game.</span>
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-secondary"
                onClick={() => setRescheduleModalBooking(null)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-modal-primary"
                onClick={handleConfirmReschedule}
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: RATE & REVIEW MODAL
          ========================================================================= */}
      <RatingReviewModal
        isOpen={Boolean(rateModalBooking)}
        booking={rateModalBooking}
        onClose={() => setRateModalBooking(null)}
        onSubmit={async (bookingId, reviewData) => {
          if (onRateBooking) {
            const res = await onRateBooking(bookingId, reviewData);
            if (res && res.success) {
              showToast(
                rateModalBooking?.userReview
                  ? `Review updated for ${rateModalBooking.venueName}!`
                  : `Review submitted for ${rateModalBooking.venueName}! Thank you.`
              );
              setRateModalBooking(null);
            }
            return res;
          }
          return { success: true };
        }}
      />

      {/* =========================================================================
          MODAL 4: CONTACT VENUE MODAL
          ========================================================================= */}
      {contactModalBooking && (
        <div className="modal-backdrop-overlay fade-in" onClick={() => setContactModalBooking(null)}>
          <div className="modal-sheet-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-indicator" />
            <div className="modal-header-row">
              <div className="modal-icon-badge primary">
                <Phone size={20} />
              </div>
              <div className="modal-titles">
                <h3 className="modal-title">Contact Venue</h3>
                <span className="modal-sub">{contactModalBooking.venueName}</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setContactModalBooking(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-content">
              <div className="contact-venue-card">
                <div className="contact-row">
                  <Phone size={16} className="contact-icon" />
                  <div className="contact-text-col">
                    <span className="contact-lbl">Front Desk & Manager</span>
                    <span className="contact-val">{contactModalBooking.venuePhone || '+91 98220 12345'}</span>
                  </div>
                  <a
                    href={`tel:${contactModalBooking.venuePhone || '9822012345'}`}
                    className="btn-contact-action"
                  >
                    Call Now
                  </a>
                </div>

                <div className="contact-divider" />

                <div className="contact-row">
                  <MessageSquare size={16} className="contact-icon green" />
                  <div className="contact-text-col">
                    <span className="contact-lbl">WhatsApp Support</span>
                    <span className="contact-val">Instant booking inquiries & gear rental</span>
                  </div>
                  <button
                    type="button"
                    className="btn-contact-action green"
                    onClick={() => {
                      showToast('Opening WhatsApp Chat with Turf Manager...');
                      setContactModalBooking(null);
                    }}
                  >
                    Chat
                  </button>
                </div>

                <div className="contact-divider" />

                <div className="contact-row">
                  <MapPin size={16} className="contact-icon" />
                  <div className="contact-text-col">
                    <span className="contact-lbl">Venue Location</span>
                    <span className="contact-val">{contactModalBooking.venueLocation}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-contact-action"
                    onClick={() => {
                      showToast('Opening Google Maps Directions...');
                      setContactModalBooking(null);
                    }}
                  >
                    Directions
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-primary"
                style={{ width: '100%' }}
                onClick={() => setContactModalBooking(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="bottom-nav-bar" aria-label="Main Navigation">
        <button
          type="button"
          className="nav-item"
          onClick={() => onNavigateTab && onNavigateTab('home')}
        >
          <Home size={20} />
          <span>Home</span>
        </button>

        <button
          type="button"
          className="nav-item active"
          onClick={() => {}}
        >
          <Calendar size={20} />
          <span>Bookings</span>
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={() => onNavigateTab && onNavigateTab('profile')}
        >
          <User size={20} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
