import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Receipt,
  UserCheck,
} from 'lucide-react';

import BookingConfirmationScreen from './BookingConfirmationScreen';

/* ==========================================================================
   SCREEN 5A: BOOKING CONFIRMED (Supports Solo & Group Split Booking Flows)
   ========================================================================== */
export function BookingConfirmedScreen({
  bookingData,
  userName,
  onViewBookings,
  onBackToHome,
}) {
  return (
    <BookingConfirmationScreen
      bookingData={bookingData}
      userName={userName}
      onViewBookings={onViewBookings}
      onReturnHome={onBackToHome}
    />
  );
}

/* ==========================================================================
   SCREEN 5B: PAYMENT FAILED / CANCELLED (CALM, PROFESSIONAL STYLE)
   ========================================================================== */
export function BookingFailedScreen({
  bookingData,
  onTryAnotherSlot,
  onBackToVenue,
}) {
  const { venue, court, date, slot } = bookingData || {};

  return (
    <div className="screen-body fade-in confirmation-screen-body">
      {/* CALM STATUS HEADER */}
      <div className="confirmation-header">
        <div className="neutral-icon-circle">
          <RotateCcw size={32} color="#64748B" strokeWidth={2} />
        </div>
        <h1 className="confirm-title" style={{ color: '#102A43' }}>
          Booking Not Completed
        </h1>
        <p className="confirm-subtitle">
          Your reservation has been released and the slot is now available for booking.
        </p>
      </div>

      {/* RELEASED DETAILS CARD */}
      <div className="receipt-card" style={{ borderColor: '#E2E8F0' }}>
        <div className="receipt-top-row">
          <div>
            <span className="receipt-booking-tag">SLOT RELEASED</span>
            <span className="receipt-id-number" style={{ color: '#64748B' }}>
              Hold Expired / Cancelled
            </span>
          </div>
          <span
            className="receipt-status-pill"
            style={{ background: '#F1F5F9', color: '#475569' }}
          >
            Available Now
          </span>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-field-row">
          <div className="receipt-field-icon" style={{ background: '#F1F5F9' }}>
            <Building2 size={18} color="#64748B" />
          </div>
          <div className="receipt-field-info">
            <span className="field-title">{venue?.name || 'Arena Sports Club'}</span>
            <span className="field-subtitle">{court?.name || 'Badminton Court 1'}</span>
          </div>
        </div>

        <div className="receipt-field-row">
          <div className="receipt-field-icon" style={{ background: '#F1F5F9' }}>
            <Calendar size={18} color="#64748B" />
          </div>
          <div className="receipt-field-info">
            <span className="field-title">{date?.fullDate || '17 September 2026'}</span>
            <span className="field-subtitle">{slot?.time || '7:00 PM – 8:00 PM'}</span>
          </div>
        </div>

        <div className="details-release-notice">
          <span>No charges were debited from your account.</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="bottom-action-container" style={{ marginTop: 'auto' }}>
        <button
          type="button"
          className="btn-primary"
          onClick={onTryAnotherSlot}
        >
          <span>Try Another Slot</span>
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          className="btn-secondary-cancel"
          onClick={onBackToVenue}
        >
          <span>Back to Venue</span>
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   SIMULATED CONFLICT / DOUBLE-BOOKING SCREEN
   ========================================================================== */
export function SlotConflictScreen({
  bookingData,
  onChooseAnotherSlot,
}) {
  const { venue, court, slot, date } = bookingData || {};

  return (
    <div className="screen-body fade-in confirmation-screen-body">
      {/* CONFLICT HEADER */}
      <div className="confirmation-header">
        <div className="conflict-icon-circle">
          <AlertCircle size={34} color="#D97706" strokeWidth={2.2} />
        </div>
        <h1 className="confirm-title" style={{ color: '#102A43' }}>
          Slot Unavailable
        </h1>
        <p className="confirm-subtitle" style={{ color: '#92400E', fontWeight: 600 }}>
          Sorry, this slot was just booked by another player.
        </p>
      </div>

      {/* EXPLANATION CARD */}
      <div className="receipt-card" style={{ borderColor: '#FDE68A', background: '#FFFBEB' }}>
        <div className="conflict-explainer-row">
          <UserCheck size={18} color="#B45309" />
          <div className="explainer-text">
            <span className="explainer-title">Real-Time Lock Notice</span>
            <p className="explainer-p">
              Another player completed payment a moment before your hold finalized. To prevent double-booking, the court has been assigned to them.
            </p>
          </div>
        </div>

        <div className="receipt-divider" style={{ borderColor: '#FDE68A' }} />

        <div className="receipt-field-row">
          <div className="receipt-field-icon" style={{ background: '#FEF3C7' }}>
            <Building2 size={18} color="#B45309" />
          </div>
          <div className="receipt-field-info">
            <span className="field-title">{venue?.name || 'Arena Sports Club'}</span>
            <span className="field-subtitle">
              {court?.name || 'Badminton Court 1'} • {slot?.time || '7:00 PM – 8:00 PM'}
            </span>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="bottom-action-container" style={{ marginTop: 'auto' }}>
        <button
          type="button"
          className="btn-primary"
          onClick={onChooseAnotherSlot}
        >
          <span>Choose Another Slot</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
