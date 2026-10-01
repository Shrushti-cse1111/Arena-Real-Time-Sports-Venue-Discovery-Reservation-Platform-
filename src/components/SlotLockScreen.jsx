import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export default function SlotLockScreen({
  bookingData,
  timeRemaining = 600, // in seconds (10:00)
  onProceedToSummary,
  onCancelReservation,
}) {
  const [isChecking, setIsChecking] = useState(true);

  // Simulate short availability check (600ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  const { venue, court, date, slot, price } = bookingData || {};

  // Format countdown mm:ss
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes < 10 ? `0${minutes}` : minutes}:${
    seconds < 10 ? `0${seconds}` : seconds
  }`;

  if (isChecking) {
    return (
      <div className="screen-body fade-in checking-availability-state">
        <div className="subtle-spinner-wrap">
          <div className="subtle-spinner" />
        </div>
        <h2 className="checking-headline">Checking slot availability...</h2>
        <p className="checking-subtext">Verifying real-time court status with facility</p>
      </div>
    );
  }

  return (
    <div className="screen-body fade-in slot-lock-screen-body">
      {/* HEADER STATUS BADGE */}
      <div className="slot-reserved-header">
        <div className="reserved-icon-badge">
          <CheckCircle2 size={32} color="#10B981" strokeWidth={2.5} />
        </div>
        <h1 className="screen-title" style={{ marginBottom: '0.25rem' }}>
          Slot Reserved
        </h1>
        <p className="screen-subtitle" style={{ maxWidth: '290px' }}>
          This slot is being held while you complete your booking.
        </p>
      </div>

      {/* COUNTDOWN TIMER CARD */}
      <div className="countdown-timer-card">
        <div className="timer-icon-col">
          <Clock size={20} color="#2563EB" />
        </div>
        <div className="timer-info-col">
          <span className="timer-caption">Time remaining to book</span>
          <span className="timer-digits">{formattedTime}</span>
        </div>
        <div className="timer-status-pill">
          <span className="pulsing-live-dot" />
          <span>Held</span>
        </div>
      </div>

      {/* RESERVED DETAILS CARD */}
      <div className="reserved-booking-card">
        <div className="card-section-header">
          <span className="card-header-label">Selected Booking Details</span>
          <span className="court-badge-tag">{venue?.primarySport || 'Badminton'}</span>
        </div>

        <div className="details-table">
          <div className="details-row">
            <span className="details-label">Venue</span>
            <span className="details-value-bold">{venue?.name || 'Arena Sports Club'}</span>
          </div>

          <div className="details-row">
            <span className="details-label">Court</span>
            <span className="details-value">{court?.name || 'Badminton Court 1'}</span>
          </div>

          <div className="details-row">
            <span className="details-label">Date</span>
            <span className="details-value">{date?.fullDate || '17 September 2026'}</span>
          </div>

          <div className="details-row">
            <span className="details-label">Time</span>
            <span className="details-value">{slot?.time || '7:00 PM – 8:00 PM'}</span>
          </div>

          <div className="details-divider" />

          <div className="details-row price-highlight-row">
            <span className="details-label">Slot Fee</span>
            <span className="details-price">₹{price || 500}</span>
          </div>
        </div>

        <div className="hold-protection-note">
          <ShieldCheck size={14} color="#059669" />
          <span>Protected: Other players cannot select this slot during your hold.</span>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="bottom-action-container" style={{ marginTop: 'auto' }}>
        <button
          type="button"
          className="btn-primary"
          onClick={onProceedToSummary}
        >
          <span>Proceed to Payment</span>
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          className="btn-secondary-cancel"
          onClick={onCancelReservation}
        >
          <span>Cancel Reservation</span>
        </button>
      </div>
    </div>
  );
}
