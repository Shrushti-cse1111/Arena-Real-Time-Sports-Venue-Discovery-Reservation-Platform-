import React, { useState } from 'react';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Receipt,
  ArrowRight,
  Share2,
  Users,
  Copy,
  Check,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';

export default function BookingConfirmationScreen({
  bookingData,
  userName = 'Player',
  onReturnHome,
  onViewBookings,
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const {
    venue,
    court,
    date,
    slot,
    price,
    finalPayable,
    originalTotalAmount,
    bookingId,
    id,
    isGroupBooking,
    groupParticipantsCount = 4,
    groupBookingId,
    splitInfo,
  } = bookingData || {};

  const displayBookingId = bookingId || id || 'ARN-2026-8821';
  const totalPaid = finalPayable !== undefined ? finalPayable : (price || 400);
  const remainingSplitAmount = isGroupBooking
    ? Math.max(0, (originalTotalAmount || totalPaid) - totalPaid)
    : 0;

  const inviteDeepLink = `https://arena.app/split/${groupBookingId || displayBookingId.replace('#', '')}`;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteDeepLink);
    }
    setCopiedLink(true);
    showToast('Group invite link copied to clipboard! 📋');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const venueName = venue?.name || 'Arena Sports Club';
    const courtName = court?.name || 'Court 1';
    const matchTime = slot?.time || 'Evening Slot';
    const matchDate = date?.fullDate || 'Upcoming Match';
    const perPerson = splitInfo?.participantShare || Math.ceil((originalTotalAmount || totalPaid) / groupParticipantsCount);

    const shareText = encodeURIComponent(
      `Hey teammates! 🎾 I've locked our court slot at ${venueName} (${courtName}) for ${matchDate} at ${matchTime}.\n\n` +
      `Your split share is ₹${perPerson}. Pay your share to confirm your spot here: ${inviteDeepLink}`
    );

    window.open(`https://wa.me/?text=${shareText}`, '_blank');
  };

  return (
    <div className="screen-body fade-in confirmation-screen-body">
      {toastMsg && (
        <div className="arena-toast-pill fade-in" style={{ position: 'fixed', top: '1.2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SUCCESS BANNER */}
      <div className="confirmation-header">
        <div className="confirm-icon-circle">
          <CheckCircle2 size={36} color="#10B981" strokeWidth={2.5} />
        </div>
        <h1 className="confirm-title">
          {isGroupBooking ? 'Group Slot Reserved! 👥' : 'Slot Reserved! 🎉'}
        </h1>
        <p className="confirm-subtitle">
          {isGroupBooking
            ? `Your organizer share (₹${totalPaid}) is confirmed. Slot is held & locked while teammates pay!`
            : 'Your court booking has been confirmed. Confirmation sent via SMS.'}
        </p>
      </div>

      {/* GROUP BOOKING INVITE CARD (IF GROUP BOOKING) */}
      {isGroupBooking && (
        <div className="group-invite-celebration-card fade-in" style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          border: '1.5px solid #93C5FD',
          borderRadius: '16px',
          padding: '1rem',
          marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="#2563EB" />
              <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#1E3A8A' }}>
                Split Payment Active
              </span>
            </div>
            <span style={{
              background: '#2563EB',
              color: '#FFFFFF',
              fontSize: '0.6875rem',
              fontWeight: 800,
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
            }}>
              1 of {groupParticipantsCount} Paid
            </span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: '#1E40AF', margin: '0 0 0.85rem', lineHeight: 1.5 }}>
            You've paid your <strong>₹{totalPaid}</strong> share. Remaining <strong>₹{remainingSplitAmount}</strong> is split among your {groupParticipantsCount - 1} teammates.
          </p>

          {/* SHARE ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                background: '#25D366',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '0.65rem 0.5rem',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              <MessageSquare size={16} />
              <span>WhatsApp Invite</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                background: '#FFFFFF',
                color: '#1E40AF',
                border: '1.5px solid #93C5FD',
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              {copiedLink ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TICKET / RECEIPT CARD */}
      <div className="receipt-card">
        <div className="receipt-top-row">
          <div>
            <span className="receipt-booking-tag">
              {isGroupBooking ? 'GROUP BOOKING ID' : 'BOOKING ID'}
            </span>
            <span className="receipt-id-number">{displayBookingId}</span>
          </div>
          <span className="receipt-status-pill" style={{
            background: isGroupBooking ? '#FEF3C7' : '#ECFDF5',
            color: isGroupBooking ? '#B45309' : '#059669',
          }}>
            {isGroupBooking ? 'Split Active' : 'Confirmed'}
          </span>
        </div>

        <div className="receipt-divider" />

        {/* Venue & Court */}
        <div className="receipt-field-row">
          <div className="receipt-field-icon">
            <Building2 size={18} color="#2563EB" />
          </div>
          <div className="receipt-field-info">
            <span className="field-title">{venue?.name || 'Arena Sports Club'}</span>
            <span className="field-subtitle">
              {court?.name || 'Court 1'} • {venue?.primarySport || 'Badminton'}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="receipt-field-row">
          <div className="receipt-field-icon">
            <MapPin size={18} color="#2563EB" />
          </div>
          <div className="receipt-field-info">
            <span className="field-title">{venue?.location || 'Koregaon Park, Pune'}</span>
            <span className="field-subtitle">{venue?.distance || '1.2 km away'}</span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="receipt-field-row">
          <div className="receipt-field-icon">
            <Calendar size={18} color="#2563EB" />
          </div>
          <div className="receipt-field-info">
            <span className="field-title">{date?.fullDate || 'Wednesday, 17 September'}</span>
            <span className="field-subtitle">{slot?.time || '07:00 PM'} (1 Hour Session)</span>
          </div>
        </div>

        <div className="receipt-divider" />

        {/* Price Breakdown */}
        <div className="receipt-price-row">
          <span className="price-label">
            {isGroupBooking ? 'Organizer Share Paid' : 'Total Amount Paid'}
          </span>
          <span className="price-val">₹{totalPaid}</span>
        </div>
        {isGroupBooking && originalTotalAmount && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            <span>Full Court Amount</span>
            <span>₹{originalTotalAmount}</span>
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="bottom-action-container" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {onViewBookings && (
          <button
            type="button"
            className="btn-primary"
            onClick={onViewBookings}
          >
            <span>{isGroupBooking ? 'Track Group Split & Pass' : 'View Digital Pass'}</span>
            <ChevronRight size={18} />
          </button>
        )}

        <button
          type="button"
          className={onViewBookings ? 'btn-secondary-cancel' : 'btn-primary'}
          onClick={onReturnHome}
        >
          <span>Back to Home</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
