import React, { useState } from 'react';
import {
  ChevronLeft,
  Share2,
  Download,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Phone,
  MessageSquare,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  AlertCircle,
  Star,
  Info,
  Package,
  Users,
  CreditCard,
  Navigation,
  FileText,
  CalendarPlus,
  Maximize2,
  Lock,
  ExternalLink,
  X,
  Sparkles,
  Send,
  Plus,
} from 'lucide-react';
import { PUNE_VENUES, INITIAL_TIME_SLOTS } from '../data/mockVenues';
import RatingReviewModal from './RatingReviewModal';
import { groupBookingService } from '../data/groupBookingService';

export default function BookingDetailScreen({
  booking,
  onBack,
  onCancelBooking,
  onRescheduleBooking,
  onRateBooking,
  onBookAgain,
  onOpenSupport,
  onUpdateBooking,
}) {
  const [copiedId, setCopiedId] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Group Booking Split State
  const [groupBookingState, setGroupBookingState] = useState(() => {
    if (!booking) return null;
    return groupBookingService.getGroupBooking(booking.groupBookingId || booking.id) || null;
  });
  const [showAddTeammateModal, setShowAddTeammateModal] = useState(false);
  const [teammateName, setTeammateName] = useState('');
  const [teammatePhone, setTeammatePhone] = useState('');
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);

  // Modals state
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of schedule');
  const [customReason, setCustomReason] = useState('');
  const [refundDestination, setRefundDestination] = useState('wallet'); // 'wallet' | 'original'

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('2026-09-17');
  const [rescheduleSlot, setRescheduleSlot] = useState('7:00 PM – 8:00 PM');
  const [rescheduleLocking, setRescheduleLocking] = useState(false);

  const [showRateModal, setShowRateModal] = useState(false);

  // Synchronize group booking state if booking prop updates
  React.useEffect(() => {
    if (booking?.isGroupBooking || booking?.groupBookingId) {
      const data = groupBookingService.getGroupBooking(booking.groupBookingId || booking.id);
      if (data) setGroupBookingState(data);
    }
  }, [booking?.id, booking?.groupBookingId]);

  if (!booking) {
    return (
      <div className="booking-details-container fade-in">
        <header className="details-header-bar">
          <button type="button" className="btn-back-header" onClick={onBack}>
            <ChevronLeft size={20} />
          </button>
          <span className="details-header-title">Booking Details</span>
        </header>
        <div className="bookings-empty-state">
          <p>No booking selected.</p>
          <button type="button" className="btn-primary" onClick={onBack}>
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleCopyId = () => {
    navigator.clipboard?.writeText(booking.bookingId || booking.id);
    setCopiedId(true);
    showToast('Booking ID copied to clipboard!');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDownloadInvoice = () => {
    showToast(`Invoice for ${booking.bookingId} downloaded!`);
  };

  const handleSharePass = () => {
    if (navigator.share) {
      navigator.share({
        title: `Match Pass - ${booking.venueName}`,
        text: `Hey! I booked ${booking.sport} at ${booking.venueName} on ${booking.dateFormatted || booking.date} at ${booking.time}. Match ID: ${booking.bookingId}`,
      }).catch(() => {});
    } else {
      showToast('Match pass link copied to share with squad!');
    }
  };

  const handleAddToCalendar = () => {
    const title = encodeURIComponent(`${booking.sport} Match @ ${booking.venueName}`);
    const details = encodeURIComponent(
      `Match Booking ID: ${booking.bookingId}\nCourt: ${booking.courtName}\nVenue: ${booking.venueLocation}\nPlayers: ${booking.playersCount || 2}`
    );
    const location = encodeURIComponent(booking.venueLocation || 'Pune');
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    
    // Open in new tab or trigger calendar
    window.open(gCalUrl, '_blank');
    showToast('Added match to Calendar!');
  };

  const handleConfirmCancel = () => {
    const finalReason = cancelReason === 'Other' ? customReason || 'Personal reasons' : cancelReason;
    if (onCancelBooking) {
      onCancelBooking(booking.id, finalReason, refundDestination);
    }
    showToast(
      refundDestination === 'wallet'
        ? `₹${booking.finalPayable} instantly credited to Arena Wallet!`
        : `Booking ${booking.bookingId} cancelled. Refund initiated!`
    );
    setShowCancelModal(false);
  };

  const handleConfirmReschedule = () => {
    setRescheduleLocking(true);
    setTimeout(() => {
      setRescheduleLocking(false);
      if (onRescheduleBooking) {
        onRescheduleBooking(booking.id, rescheduleDate, rescheduleSlot);
      }
      showToast(`Slot locked & rescheduled to ${rescheduleDate} (${rescheduleSlot})`);
      setShowRescheduleModal(false);
    }, 700);
  };



  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="booking-status-badge badge-confirmed">
            <CheckCircle2 size={13} />
            <span>Confirmed</span>
          </span>
        );
      case 'rescheduled':
        return (
          <span className="booking-status-badge badge-rescheduled">
            <RotateCcw size={13} />
            <span>Rescheduled</span>
          </span>
        );
      case 'completed':
        return (
          <span className="booking-status-badge badge-completed">
            <CheckCircle2 size={13} />
            <span>Completed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="booking-status-badge badge-cancelled">
            <XCircle size={13} />
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
    <div className="booking-details-container fade-in">
      {/* TOP HEADER */}
      <header className="details-header-bar">
        <button
          type="button"
          className="btn-back-header"
          onClick={onBack}
          aria-label="Back"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="details-header-center">
          <span className="details-header-title">Booking Details</span>
          <span className="details-header-sub">{booking.bookingId}</span>
        </div>
        <div className="details-header-actions">
          <button
            type="button"
            className="btn-header-icon"
            onClick={handleSharePass}
            title="Share Pass"
          >
            <Share2 size={18} />
          </button>
          <button
            type="button"
            className="btn-header-icon"
            onClick={handleDownloadInvoice}
            title="Download Invoice"
          >
            <Download size={18} />
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

      {/* SCROLLABLE PASS & DETAILS */}
      <div className="booking-details-scrollable">
        {/* DIGITAL MATCH TICKET CARD */}
        <div className="digital-ticket-card">
          {/* TICKET TOP HEADER */}
          <div className="ticket-top-row">
            <div className="ticket-sport-chip">
              <span className="sport-dot" />
              <span>{booking.sport}</span>
            </div>
            {getStatusBadge(booking.status)}
          </div>

          {/* VENUE HERO INFO */}
          <div className="ticket-venue-hero">
            <h2 className="ticket-venue-name">{booking.venueName}</h2>
            <div className="ticket-location-row">
              <MapPin size={13} className="loc-icon" />
              <span>{booking.venueLocation}</span>
            </div>
          </div>

          <div className="ticket-perforated-divider">
            <div className="notch-left" />
            <div className="dashed-line" />
            <div className="notch-right" />
          </div>

          {/* QR CODE & ENTRY SCANNER */}
          <div
            className="ticket-qr-section"
            onClick={() => setShowQrModal(true)}
            role="button"
            tabIndex={0}
            title="Tap to enlarge QR Code"
          >
            <div className="qr-box-wrap">
              <svg
                viewBox="0 0 100 100"
                className="ticket-qr-svg"
                aria-label="Booking QR code"
              >
                <rect width="100" height="100" fill="#FFFFFF" rx="6" />
                <rect x="8" y="8" width="28" height="28" fill="#0F172A" rx="3" />
                <rect x="13" y="13" width="18" height="18" fill="#FFFFFF" rx="2" />
                <rect x="17" y="17" width="10" height="10" fill="#0F172A" rx="1.5" />
                <rect x="64" y="8" width="28" height="28" fill="#0F172A" rx="3" />
                <rect x="69" y="13" width="18" height="18" fill="#FFFFFF" rx="2" />
                <rect x="73" y="17" width="10" height="10" fill="#0F172A" rx="1.5" />
                <rect x="8" y="64" width="28" height="28" fill="#0F172A" rx="3" />
                <rect x="13" y="69" width="18" height="18" fill="#FFFFFF" rx="2" />
                <rect x="17" y="73" width="10" height="10" fill="#0F172A" rx="1.5" />
                <rect x="42" y="10" width="6" height="6" fill="#0F172A" />
                <rect x="52" y="10" width="6" height="6" fill="#0F172A" />
                <rect x="42" y="22" width="6" height="6" fill="#0F172A" />
                <rect x="52" y="28" width="6" height="6" fill="#0F172A" />
                <rect x="10" y="44" width="6" height="6" fill="#0F172A" />
                <rect x="22" y="44" width="6" height="6" fill="#0F172A" />
                <rect x="34" y="44" width="6" height="6" fill="#0F172A" />
                <rect x="46" y="44" width="6" height="6" fill="#0F172A" />
                <rect x="58" y="44" width="6" height="6" fill="#0F172A" />
                <rect x="70" y="44" width="6" height="6" fill="#0F172A" />
                <rect x="82" y="44" width="6" height="6" fill="#0F172A" />
                <rect x="42" y="56" width="6" height="6" fill="#0F172A" />
                <rect x="52" y="62" width="6" height="6" fill="#0F172A" />
                <rect x="64" y="56" width="6" height="6" fill="#0F172A" />
                <rect x="76" y="62" width="6" height="6" fill="#0F172A" />
                <rect x="42" y="76" width="6" height="6" fill="#0F172A" />
                <rect x="52" y="82" width="6" height="6" fill="#0F172A" />
                <rect x="64" y="76" width="6" height="6" fill="#0F172A" />
                <rect x="76" y="82" width="6" height="6" fill="#0F172A" />
                <rect x="86" y="76" width="6" height="6" fill="#0F172A" />
              </svg>
            </div>

            <div className="qr-meta-col">
              <div className="qr-header-tag">
                <span className="qr-scan-label">Check-in QR Code</span>
                <Maximize2 size={12} className="qr-expand-icon" />
              </div>
              <div
                className="booking-id-copy-row"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyId();
                }}
              >
                <span className="id-code-val">{booking.bookingId}</span>
                <button
                  type="button"
                  className="btn-copy-id"
                  title="Copy Booking ID"
                >
                  {copiedId ? <Check size={14} className="copied" /> : <Copy size={14} />}
                </button>
              </div>
              <span className="booked-timestamp">Tap to enlarge for front-desk check-in</span>
            </div>
          </div>

          <div className="ticket-perforated-divider">
            <div className="notch-left" />
            <div className="dashed-line" />
            <div className="notch-right" />
          </div>

          {/* MATCH DETAILS GRID */}
          <div className="ticket-specs-grid">
            <div className="spec-cell">
              <span className="spec-lbl">Date</span>
              <div className="spec-val-row">
                <Calendar size={14} className="spec-icon" />
                <span className="spec-val">{booking.dateFormatted || booking.date}</span>
              </div>
            </div>

            <div className="spec-cell">
              <span className="spec-lbl">Slot & Duration</span>
              <div className="spec-val-row">
                <Clock size={14} className="spec-icon" />
                <span className="spec-val">{booking.time}</span>
              </div>
            </div>

            <div className="spec-cell">
              <span className="spec-lbl">Court / Turf</span>
              <span className="spec-val highlight">{booking.courtName}</span>
            </div>

            <div className="spec-cell">
              <span className="spec-lbl">Players Squad</span>
              <div className="spec-val-row">
                <Users size={14} className="spec-icon" />
                <span className="spec-val">{booking.playersCount || 2} Players</span>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK CALENDAR ACTION FOR UPCOMING */}
        {(booking.status === 'confirmed' || booking.status === 'rescheduled') && (
          <button
            type="button"
            className="btn-add-calendar-card fade-in"
            onClick={handleAddToCalendar}
          >
            <CalendarPlus size={18} className="cal-icon" />
            <div className="cal-text-col">
              <span className="cal-title">Add Match to Calendar</span>
              <span className="cal-sub">Get timely reminders 1 hour before your slot</span>
            </div>
            <ExternalLink size={15} className="cal-arrow" />
          </button>
        )}

        {/* GROUP BOOKING & SPLIT PAYMENT DASHBOARD */}
        {(booking.isGroupBooking || booking.groupBookingId) && (
          <div className="details-section-card fade-in" style={{ border: '1.5px solid #3B82F6', background: '#FFFFFF' }}>
            {(() => {
              const activeGroup = groupBookingState || groupBookingService.getGroupBooking(booking.groupBookingId || booking.id) || {
                totalAmount: booking.originalTotalAmount || booking.finalPayable || 951,
                sharePerPerson: Math.ceil((booking.originalTotalAmount || booking.finalPayable || 951) / (booking.groupParticipantsCount || 4)),
                participantCount: booking.groupParticipantsCount || 4,
                maxCapacity: 6,
                groupStatus: 'partially_paid',
                participants: [
                  { id: 'part-1', name: playerData?.fullName || 'Organizer', role: 'organizer', paymentStatus: 'paid', amountDue: Math.ceil((booking.finalPayable || 900) / 4), amountPaid: Math.ceil((booking.finalPayable || 900) / 4) },
                  { id: 'part-2', name: 'Teammate 1', role: 'participant', paymentStatus: 'paid', amountDue: Math.ceil((booking.finalPayable || 900) / 4), amountPaid: Math.ceil((booking.finalPayable || 900) / 4) },
                  { id: 'part-3', name: 'Teammate 2', role: 'participant', paymentStatus: 'pending', amountDue: Math.ceil((booking.finalPayable || 900) / 4), amountPaid: 0 },
                ],
              };

              const paidParticipants = activeGroup.participants.filter((p) => p.paymentStatus === 'paid');
              const collectedAmount = paidParticipants.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
              const progressPct = Math.min(100, Math.round((collectedAmount / activeGroup.totalAmount) * 100));
              const allPaid = activeGroup.participants.every((p) => p.paymentStatus === 'paid');
              const inviteLink = `https://arena.app/split/${activeGroup.groupBookingId || booking.groupBookingId || booking.id}`;

              const handleShareWhatsApp = () => {
                const text = encodeURIComponent(
                  `Hey teammates! 🎾 I've locked our slot for ${booking.sport} at ${booking.venueName} (${booking.time}, ${booking.dateFormatted || booking.date}).\n\n` +
                  `Your split share is ₹${activeGroup.sharePerPerson}. Pay directly here: ${inviteLink}`
                );
                window.open(`https://wa.me/?text=${text}`, '_blank');
              };

              const handleCopyLink = () => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(inviteLink);
                }
                setCopiedInviteLink(true);
                showToast('Invite link copied! Share with friends 📋');
                setTimeout(() => setCopiedInviteLink(false), 2500);
              };

              const handleRemindTeammate = (part) => {
                const text = encodeURIComponent(
                  `Hey ${part.name}! Friendly reminder to pay your ₹${part.amountDue} split share for our match at ${booking.venueName}. Pay here: ${inviteLink}`
                );
                window.open(`https://wa.me/?text=${text}`, '_blank');
              };

              const handleRemoveTeammate = (partId, partName) => {
                const res = groupBookingService.removeParticipant(activeGroup.groupBookingId || booking.groupBookingId || booking.id, partId);
                if (res.success) {
                  setGroupBookingState({ ...res.group });
                  showToast(`${partName} removed from split. Shares updated!`);
                } else {
                  showToast(res.error || 'Could not remove participant.');
                }
              };

              const handleSimulatePayment = () => {
                const unpaid = activeGroup.participants.find((p) => p.paymentStatus !== 'paid');
                if (unpaid) {
                  const res = groupBookingService.recordParticipantPayment(
                    activeGroup.groupBookingId || booking.groupBookingId || booking.id,
                    unpaid.id,
                    'UPI (PhonePe)'
                  );
                  if (res.success) {
                    setGroupBookingState({ ...res.group });
                    showToast(`Simulated payment for ${unpaid.name} (₹${unpaid.amountDue})!`);
                    if (res.allPaid) {
                      if (onUpdateBooking) {
                        onUpdateBooking({ ...booking, status: 'confirmed', groupStatus: 'confirmed' });
                      }
                      showToast('🎉 All teammate split shares paid! Match booking is now 100% Confirmed!');
                    }
                  } else {
                    showToast(res.error || 'Payment simulation failed.');
                  }
                }
              };

              return (
                <div>
                  <div className="card-header-line-split" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Users size={18} color="#2563EB" />
                      <h3 className="section-card-title" style={{ margin: 0 }}>Group Booking & Split</h3>
                    </div>
                    <span className="status-pill" style={{
                      background: allPaid ? '#ECFDF5' : '#EFF6FF',
                      color: allPaid ? '#059669' : '#1D4ED8',
                      fontWeight: 800,
                      fontSize: '0.71875rem',
                      padding: '0.2rem 0.6rem',
                    }}>
                      {allPaid ? '100% Fully Settled ✓' : `Split Active (${paidParticipants.length}/${activeGroup.participants.length} Paid)`}
                    </span>
                  </div>

                  {/* PROGRESS HEADER */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, margin: '0.4rem 0 0.3rem' }}>
                    <span style={{ color: 'var(--primary-navy)' }}>
                      ₹{collectedAmount} of ₹{activeGroup.totalAmount} Collected
                    </span>
                    <span style={{ color: '#2563EB' }}>
                      {progressPct}% Settled
                    </span>
                  </div>

                  {/* PROGRESS BAR */}
                  <div style={{ height: '8px', width: '100%', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.65rem' }}>
                    <div style={{
                      height: '100%',
                      width: `${progressPct}%`,
                      background: allPaid ? '#10B981' : 'linear-gradient(90deg, #2563EB, #10B981)',
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>

                  {/* SLOT PROTECTION NOTICE */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: '#F8FAFC',
                    border: '1px dashed #CBD5E1',
                    borderRadius: '8px',
                    padding: '0.45rem 0.65rem',
                    marginBottom: '0.75rem',
                    fontSize: '0.71875rem',
                    color: 'var(--text-muted)',
                  }}>
                    <ShieldCheck size={14} color="#2563EB" style={{ flexShrink: 0 }} />
                    <span>Slot is protected & locked for your group until match start time.</span>
                  </div>

                  {/* SHARE / INVITE BUTTONS */}
                  <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.85rem' }}>
                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        background: '#25D366',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem 0.4rem',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      <MessageSquare size={14} />
                      <span>WhatsApp Invite</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        background: '#EFF6FF',
                        color: '#2563EB',
                        border: '1px solid #BFDBFE',
                        borderRadius: '8px',
                        padding: '0.5rem 0.65rem',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {copiedInviteLink ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                      <span>{copiedInviteLink ? 'Copied' : 'Copy Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAddTeammateModal(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        background: '#F1F5F9',
                        color: 'var(--primary-navy)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '0.5rem 0.65rem',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                      title="Add Teammate"
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* PARTICIPANTS LIST */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {activeGroup.participants.map((part) => (
                      <div
                        key={part.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.45rem 0.65rem',
                          background: part.paymentStatus === 'paid' ? '#F0FDF4' : '#F8FAFC',
                          borderRadius: '8px',
                          border: part.paymentStatus === 'paid' ? '1px solid #BBF7D0' : '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div
                            className="avatar-circle"
                            style={{
                              width: '28px',
                              height: '28px',
                              fontSize: '0.71875rem',
                              background: part.role === 'organizer' ? '#2563EB' : '#64748B',
                              color: '#fff',
                            }}
                          >
                            {part.name ? part.name.slice(0, 2).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                              {part.name} {part.role === 'organizer' ? '(Organizer)' : ''}
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>
                              Share: ₹{part.amountDue} {part.phone ? `• ${part.phone.slice(-4).padStart(10, '•')}` : ''}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className={`status-pill ${part.paymentStatus}`} style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '9999px',
                            background: part.paymentStatus === 'paid' ? '#DCFCE7' : '#FEF3C7',
                            color: part.paymentStatus === 'paid' ? '#15803D' : '#B45309',
                          }}>
                            {part.paymentStatus === 'paid' ? 'Paid ✓' : 'Pending'}
                          </span>

                          {/* ACTION BUTTONS FOR UNPAID PARTICIPANTS */}
                          {part.paymentStatus !== 'paid' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRemindTeammate(part)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#25D366',
                                  cursor: 'pointer',
                                  padding: '0.2rem',
                                  display: 'flex',
                                }}
                                title="Remind via WhatsApp"
                              >
                                <Send size={13} />
                              </button>
                              {part.role !== 'organizer' && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTeammate(part.id, part.name)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#EF4444',
                                    cursor: 'pointer',
                                    padding: '0.2rem',
                                    display: 'flex',
                                  }}
                                  title="Remove player"
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ACTION: SIMULATE TEAMMATE PAYMENT */}
                  {!allPaid && (
                    <button
                      type="button"
                      className="btn-set-default"
                      style={{
                        width: '100%',
                        marginTop: '0.75rem',
                        justifyContent: 'center',
                        background: '#EFF6FF',
                        color: '#2563EB',
                        border: '1px solid #BFDBFE',
                        fontWeight: 700,
                        fontSize: '0.78125rem',
                        padding: '0.55rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                      onClick={handleSimulatePayment}
                    >
                      <span>⚡ Simulate Next Teammate Payment (Test Split)</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* CANCELLED REFUND CARD (If status === cancelled) */}
        {booking.status === 'cancelled' && (
          <div className="details-section-card cancelled-notice-card">
            <div className="card-header-line">
              <XCircle size={18} className="danger-icon" />
              <h3 className="section-card-title">Cancellation & Refund Details</h3>
            </div>
            <div className="cancel-details-body">
              <div className="cancel-meta-row">
                <span className="cancel-meta-lbl">Cancelled On</span>
                <span className="cancel-meta-val">
                  {booking.cancellationDetails?.cancelledAt || '13 Sep 2026, 02:45 PM'}
                </span>
              </div>
              <div className="cancel-meta-row">
                <span className="cancel-meta-lbl">Reason</span>
                <span className="cancel-meta-val">
                  {booking.cancellationDetails?.reason || 'Change of schedule'}
                </span>
              </div>
              <div className="cancel-meta-row">
                <span className="cancel-meta-lbl">Refund Status</span>
                <span className="cancel-meta-val green">
                  {booking.cancellationDetails?.refundStatus || 'Refund Initiated to Original Payment Source'}
                </span>
              </div>
              <div className="cancel-meta-row">
                <span className="cancel-meta-lbl">Refund Ref ARN</span>
                <span className="cancel-meta-val highlight">
                  {booking.cancellationDetails?.refundTxnId || 'ARN-RFND-98214'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PAST USER REVIEW CARD (If reviewed) */}
        {booking.status === 'completed' && booking.userReview && (
          <div className="details-section-card review-display-card">
            <div className="card-header-line">
              <Star size={18} className="star-filled" />
              <h3 className="section-card-title">Your Rating & Feedback</h3>
            </div>
            <div className="review-display-body">
              <div className="review-stars-row">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    className={s <= booking.userReview.rating ? 'star-filled' : 'star-empty'}
                  />
                ))}
                <span className="review-stars-score">{booking.userReview.rating}.0 / 5.0</span>
              </div>
              {booking.userReview.tags && booking.userReview.tags.length > 0 && (
                <div className="review-tags-list">
                  {booking.userReview.tags.map((t) => (
                    <span key={t} className="review-tag-badge">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {booking.userReview.comment && (
                <p className="review-text-quote">"{booking.userReview.comment}"</p>
              )}
            </div>
          </div>
        )}

        {/* EQUIPMENT & ADD-ONS SUMMARY */}
        {booking.addOns && booking.addOns.length > 0 && (
          <div className="details-section-card">
            <div className="card-header-line">
              <Package size={18} className="section-icon" />
              <h3 className="section-card-title">Rental Gear & Add-ons</h3>
            </div>
            <div className="addons-summary-list">
              {booking.addOns.map((item) => (
                <div key={item.id} className="addon-summary-item">
                  <div className="addon-item-left">
                    <span className="addon-item-name">{item.name}</span>
                    <span className="addon-item-qty">Qty: {item.quantity}</span>
                  </div>
                  <span className="addon-item-price">₹{item.total || item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAYMENT & INVOICE BREAKDOWN */}
        <div className="details-section-card">
          <div className="card-header-line">
            <CreditCard size={18} className="section-icon" />
            <h3 className="section-card-title">Payment & Invoice Breakdown</h3>
          </div>

          <div className="price-breakdown-table">
            <div className="breakdown-row">
              <span className="breakdown-lbl">Court Slot Base Price</span>
              <span className="breakdown-val">₹{booking.basePrice}</span>
            </div>

            {booking.addOnsTotal > 0 && (
              <div className="breakdown-row">
                <span className="breakdown-lbl">Equipment Add-ons ({booking.addOns?.length} items)</span>
                <span className="breakdown-val">₹{booking.addOnsTotal}</span>
              </div>
            )}

            {booking.couponDiscount > 0 && (
              <div className="breakdown-row discount">
                <span className="breakdown-lbl">Coupon Discount ({booking.couponCode})</span>
                <span className="breakdown-val">-₹{booking.couponDiscount}</span>
              </div>
            )}

            <div className="breakdown-row">
              <span className="breakdown-lbl">Platform Convenience Fee</span>
              <span className="breakdown-val">₹{booking.platformFee || 20}</span>
            </div>

            <div className="breakdown-row">
              <span className="breakdown-lbl">Applicable GST & Sports Cess (18%)</span>
              <span className="breakdown-val">₹{booking.gst || 25}</span>
            </div>

            <div className="breakdown-divider" />

            <div className="breakdown-row total">
              <span className="breakdown-lbl">Total Amount Paid</span>
              <span className="breakdown-val highlight">₹{booking.finalPayable}</span>
            </div>

            <div className="payment-method-strip">
              <ShieldCheck size={14} className="pay-shield" />
              <span>{booking.paymentMethod || 'Paid via UPI'} • Ref ID: {booking.paymentTxnId || 'TXN-98274102'}</span>
            </div>
          </div>
        </div>

        {/* HELP & SUPPORT FOR THIS BOOKING */}
        <div className="details-section-card support-shortcut-card fade-in" style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              background: '#EFF6FF',
              color: '#2563EB',
              borderRadius: '10px',
              padding: '0.55rem',
              display: 'flex',
              flexShrink: 0,
            }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.84375rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                Need Help with this Booking?
              </div>
              <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                Instant assistance with slots, refunds or turf rules
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-card-outline"
            style={{
              fontSize: '0.75rem',
              padding: '0.45rem 0.75rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              flexShrink: 0,
            }}
            onClick={() => onOpenSupport && onOpenSupport(booking)}
          >
            <span>Get Support</span>
            <ChevronRight size={13} />
          </button>
        </div>

        {/* VENUE CONTACT & GUIDELINES */}
        <div className="details-section-card">
          <div className="card-header-line">
            <Navigation size={18} className="section-icon" />
            <h3 className="section-card-title">Venue Rules & Directions</h3>
          </div>

          <div className="venue-guidelines-list">
            <div className="guideline-item">
              <span className="guideline-dot">•</span>
              <span>Non-marking badminton / turf shoes are strictly mandatory for court entry.</span>
            </div>
            <div className="guideline-item">
              <span className="guideline-dot">•</span>
              <span>Please report 10 minutes prior to your slot time for check-in.</span>
            </div>
            <div className="guideline-item">
              <span className="guideline-dot">•</span>
              <span>Rented rackets and balls must be handed back at the reception post match.</span>
            </div>
          </div>

          <div className="contact-venue-actions-row">
            <a
              href={`tel:${booking.venuePhone || '9822012345'}`}
              className="btn-venue-contact"
            >
              <Phone size={15} />
              <span>Call Front Desk</span>
            </a>

            <button
              type="button"
              className="btn-venue-contact green"
              onClick={() => showToast('Opening WhatsApp Chat with Turf Manager...')}
            >
              <MessageSquare size={15} />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM STICKY ACTION BAR */}
      <div className="details-bottom-bar">
        {booking.status === 'confirmed' || booking.status === 'rescheduled' ? (
          <div className="details-bottom-actions">
            <button
              type="button"
              className="btn-bottom-action danger"
              onClick={() => setShowCancelModal(true)}
            >
              Cancel Booking
            </button>

            <button
              type="button"
              className="btn-bottom-action outline"
              onClick={() => setShowRescheduleModal(true)}
            >
              Reschedule
            </button>

            <button
              type="button"
              className="btn-bottom-action primary"
              onClick={() => showToast('Opening Google Maps navigation...')}
            >
              <Navigation size={15} />
              <span>Directions</span>
            </button>
          </div>
        ) : booking.status === 'completed' ? (
          <div className="details-bottom-actions">
            <button
              type="button"
              className="btn-bottom-action outline"
              onClick={() => setShowRateModal(true)}
            >
              <Star size={15} />
              <span>{booking.userReview ? 'Edit Review' : 'Rate Venue'}</span>
            </button>

            <button
              type="button"
              className="btn-bottom-action primary"
              onClick={() => onBookAgain && onBookAgain(booking.venueId || 'venue-1')}
            >
              <RotateCcw size={15} />
              <span>Book Again</span>
            </button>
          </div>
        ) : (
          <div className="details-bottom-actions">
            <button
              type="button"
              className="btn-bottom-action outline"
              onClick={() => {
                if (onOpenSupport) {
                  onOpenSupport(booking);
                } else {
                  showToast('Opening 24/7 Arena Support Center...');
                }
              }}
            >
              Help & Support
            </button>

            <button
              type="button"
              className="btn-bottom-action primary"
              onClick={() => onBookAgain && onBookAgain(booking.venueId || 'venue-1')}
            >
              <RotateCcw size={15} />
              <span>Book Again</span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: FULLSCREEN QR CHECK-IN PASS
          ========================================================================= */}
      {showQrModal && (
        <div className="modal-backdrop-overlay fade-in" onClick={() => setShowQrModal(false)}>
          <div className="modal-sheet-dialog qr-pass-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-indicator" />
            <div className="modal-header-row">
              <div className="modal-icon-badge primary">
                <QrCode size={20} />
              </div>
              <div className="modal-titles">
                <h3 className="modal-title">Venue Check-in Pass</h3>
                <span className="modal-sub">Scan at front desk scanner on arrival</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowQrModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-content" style={{ alignItems: 'center', textAlign: 'center' }}>
              <div className="large-qr-container">
                <svg
                  viewBox="0 0 100 100"
                  className="large-qr-svg"
                  aria-label="Enlarged QR Code"
                >
                  <rect width="100" height="100" fill="#FFFFFF" rx="8" />
                  <rect x="8" y="8" width="28" height="28" fill="#0F172A" rx="3" />
                  <rect x="13" y="13" width="18" height="18" fill="#FFFFFF" rx="2" />
                  <rect x="17" y="17" width="10" height="10" fill="#0F172A" rx="1.5" />
                  <rect x="64" y="8" width="28" height="28" fill="#0F172A" rx="3" />
                  <rect x="69" y="13" width="18" height="18" fill="#FFFFFF" rx="2" />
                  <rect x="73" y="17" width="10" height="10" fill="#0F172A" rx="1.5" />
                  <rect x="8" y="64" width="28" height="28" fill="#0F172A" rx="3" />
                  <rect x="13" y="69" width="18" height="18" fill="#FFFFFF" rx="2" />
                  <rect x="17" y="73" width="10" height="10" fill="#0F172A" rx="1.5" />
                  <rect x="42" y="10" width="6" height="6" fill="#0F172A" />
                  <rect x="52" y="10" width="6" height="6" fill="#0F172A" />
                  <rect x="42" y="22" width="6" height="6" fill="#0F172A" />
                  <rect x="52" y="28" width="6" height="6" fill="#0F172A" />
                  <rect x="10" y="44" width="6" height="6" fill="#0F172A" />
                  <rect x="22" y="44" width="6" height="6" fill="#0F172A" />
                  <rect x="34" y="44" width="6" height="6" fill="#0F172A" />
                  <rect x="46" y="44" width="6" height="6" fill="#0F172A" />
                  <rect x="58" y="44" width="6" height="6" fill="#0F172A" />
                  <rect x="70" y="44" width="6" height="6" fill="#0F172A" />
                  <rect x="82" y="44" width="6" height="6" fill="#0F172A" />
                  <rect x="42" y="56" width="6" height="6" fill="#0F172A" />
                  <rect x="52" y="62" width="6" height="6" fill="#0F172A" />
                  <rect x="64" y="56" width="6" height="6" fill="#0F172A" />
                  <rect x="76" y="62" width="6" height="6" fill="#0F172A" />
                  <rect x="42" y="76" width="6" height="6" fill="#0F172A" />
                  <rect x="52" y="82" width="6" height="6" fill="#0F172A" />
                  <rect x="64" y="76" width="6" height="6" fill="#0F172A" />
                  <rect x="76" y="82" width="6" height="6" fill="#0F172A" />
                  <rect x="86" y="76" width="6" height="6" fill="#0F172A" />
                </svg>
              </div>

              <div className="large-pass-id-pill">
                <span>{booking.bookingId}</span>
              </div>
              <span className="large-pass-venue">{booking.venueName} • {booking.courtName}</span>
              <span className="large-pass-time">{booking.dateFormatted || booking.date} • {booking.time}</span>
              <p className="large-pass-note">
                💡 Turn up your screen brightness for instant optical barcode verification.
              </p>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-primary"
                style={{ width: '100%' }}
                onClick={() => setShowQrModal(false)}
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CANCEL BOOKING
          ========================================================================= */}
      {showCancelModal && (
        <div className="modal-backdrop-overlay fade-in" onClick={() => setShowCancelModal(false)}>
          <div className="modal-sheet-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-indicator" />
            <div className="modal-header-row">
              <div className="modal-icon-badge danger">
                <AlertCircle size={20} />
              </div>
              <div className="modal-titles">
                <h3 className="modal-title">Cancel Court Booking?</h3>
                <span className="modal-sub">{booking.bookingId} • {booking.venueName}</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCancelModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-content">
              <div className="cancel-refund-preview">
                <div className="refund-calc-row">
                  <span className="calc-lbl">Paid Amount</span>
                  <span className="calc-val">₹{booking.finalPayable}</span>
                </div>
                <div className="refund-calc-row">
                  <span className="calc-lbl">Cancellation Fee</span>
                  <span className="calc-val green">{'₹0 (Free > 4 hrs)'}</span>
                </div>
                <div className="calc-divider" />
                <div className="refund-calc-row total">
                  <span className="calc-lbl">Estimated Refund</span>
                  <span className="calc-val highlight">₹{booking.finalPayable}</span>
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
                    name="detail-refund-dest"
                    checked={refundDestination === 'wallet'}
                    onChange={() => setRefundDestination('wallet')}
                  />
                  <div className="refund-dest-info">
                    <span className="refund-dest-title">⚡ Arena Wallet — Instant Credit</span>
                    <span className="refund-dest-sub">Refund in seconds. Use for next booking.</span>
                  </div>
                </label>
                <label className={`refund-dest-option ${refundDestination === 'original' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="detail-refund-dest"
                    checked={refundDestination === 'original'}
                    onChange={() => setRefundDestination('original')}
                  />
                  <div className="refund-dest-info">
                    <span className="refund-dest-title">🏦 {booking.paymentMethod || 'Original Payment Source'}</span>
                    <span className="refund-dest-sub">Standard bank refund — 24-48 business hours.</span>
                  </div>
                </label>
              </div>

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
                      name="cancel-reason-detail"
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
                onClick={() => setShowCancelModal(false)}
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
          MODAL: RESCHEDULE WITH AVAILABILITY & LOCKING
          ========================================================================= */}
      {showRescheduleModal && (
        <div className="modal-backdrop-overlay fade-in" onClick={() => !rescheduleLocking && setShowRescheduleModal(false)}>
          <div className="modal-sheet-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-indicator" />
            <div className="modal-header-row">
              <div className="modal-icon-badge primary">
                <RotateCcw size={20} />
              </div>
              <div className="modal-titles">
                <h3 className="modal-title">Reschedule Slot</h3>
                <span className="modal-sub">{booking.venueName} • {booking.courtName}</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                disabled={rescheduleLocking}
                onClick={() => setShowRescheduleModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-content">
              <div className="current-slot-pill">
                <span className="pill-lbl">Current:</span>
                <span className="pill-val">
                  {booking.dateFormatted || booking.date} • {booking.time}
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
                Available Court Slots (Slot Lock on Select)
              </label>
              <div className="reschedule-slots-grid">
                {[
                  { time: '06:00 AM – 07:00 AM', status: 'available' },
                  { time: '07:00 AM – 08:00 AM', status: 'available' },
                  { time: '05:00 PM – 06:00 PM', status: 'available' },
                  { time: '06:00 PM – 07:00 PM', status: 'available' },
                  { time: '07:00 PM – 08:00 PM', status: 'available' },
                  { time: '08:00 PM – 09:00 PM', status: 'available' },
                ].map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    className={`slot-time-chip ${rescheduleSlot === s.time ? 'active' : ''}`}
                    onClick={() => setRescheduleSlot(s.time)}
                  >
                    <span>{s.time}</span>
                  </button>
                ))}
              </div>

              <div className="reschedule-policy-note">
                <ShieldCheck size={14} className="policy-icon" />
                <span>Selected slot is temporarily held. Previous slot is automatically released upon confirmation.</span>
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-secondary"
                disabled={rescheduleLocking}
                onClick={() => setShowRescheduleModal(false)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-modal-primary"
                disabled={rescheduleLocking}
                onClick={handleConfirmReschedule}
              >
                {rescheduleLocking ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                    <Lock size={14} /> Locking Slot...
                  </span>
                ) : (
                  'Confirm Reschedule'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RATE VENUE
          ========================================================================= */}
      <RatingReviewModal
        isOpen={showRateModal}
        booking={booking}
        onClose={() => setShowRateModal(false)}
        onSubmit={async (bookingId, reviewData) => {
          if (onRateBooking) {
            const res = await onRateBooking(bookingId, reviewData);
            if (res && res.success) {
              showToast(
                booking?.userReview
                  ? `Review updated for ${booking.venueName}!`
                  : `Review submitted for ${booking.venueName}! Thank you.`
              );
              setShowRateModal(false);
            }
            return res;
          }
          return { success: true };
        }}
      />

      {/* =========================================================================
          MODAL: ADD TEAMMATE TO GROUP SPLIT
          ========================================================================= */}
      {showAddTeammateModal && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 1100 }}>
          <div className="reschedule-modal-card" style={{ maxWidth: '340px' }}>
            <div className="modal-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Users size={18} color="#2563EB" />
                <h3 className="modal-title">Add Teammate</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowAddTeammateModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.35rem 0 0.85rem', lineHeight: 1.4 }}>
              Enter your friend's details. They will be added to the split and shares will be recalculated.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!teammateName.trim()) {
                  showToast('Please enter teammate name.');
                  return;
                }
                const res = groupBookingService.addParticipant(
                  booking.groupBookingId || booking.id,
                  {
                    name: teammateName.trim(),
                    phone: teammatePhone.trim() || `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
                  }
                );
                if (res.success) {
                  setGroupBookingState({ ...res.group });
                  setShowAddTeammateModal(false);
                  setTeammateName('');
                  setTeammatePhone('');
                  showToast(`${teammateName.trim()} added to split! Shares updated.`);
                } else {
                  showToast(res.error || 'Could not add teammate.');
                }
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="input-group-label" style={{ marginBottom: '0.3rem', display: 'block' }}>
                    Teammate Full Name *
                  </label>
                  <input
                    type="text"
                    className="custom-form-input"
                    placeholder="e.g. Rohit Sharma"
                    value={teammateName}
                    onChange={(e) => setTeammateName(e.target.value)}
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label className="input-group-label" style={{ marginBottom: '0.3rem', display: 'block' }}>
                    Mobile Number (for WhatsApp invite)
                  </label>
                  <input
                    type="tel"
                    className="custom-form-input"
                    placeholder="e.g. 98220 12345"
                    value={teammatePhone}
                    onChange={(e) => setTeammatePhone(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-modal-secondary"
                  onClick={() => setShowAddTeammateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-primary"
                >
                  Add to Split
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
