import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Clock, AlertCircle, CheckCircle2, Ban, Lock,
  RefreshCw, X, ArrowLeft, Save, Sparkles, Check
} from 'lucide-react';
import {
  fetchMonthAvailability,
  blockDate,
  unblockDate,
  fetchOperatingHours,
  saveOperatingHours,
  generateSlotsFromHours,
} from '../services/ownerAvailabilityService';
import OwnerBottomNav from './OwnerBottomNav';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function OwnerAvailabilityScreen({
  venue = { id: 'v-owner-demo', name: 'Deccan Sports Arena' },
  onBack = () => {},
  onNavigateTab = () => {},
}) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(10); // Oct 2026
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Operating Hours State
  const [operatingHours, setOperatingHours] = useState([]);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [editedHours, setEditedHours] = useState([]);
  const [hoursLoading, setHoursLoading] = useState(true);
  const [hoursError, setHoursError] = useState(null);
  const [selectedPreviewDay, setSelectedPreviewDay] = useState('Monday');

  // Modals & Confirmation States
  const [blockPromptDay, setBlockPromptDay] = useState(null); // Open day to block
  const [blockReason, setBlockReason] = useState('Routine Maintenance');
  const [unblockPromptDay, setUnblockPromptDay] = useState(null); // Blocked day to unblock
  const [bookedDetailDay, setBookedDetailDay] = useState(null); // Booked day details
  const [toastMessage, setToastMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // ── Load Availability ────────────────────────────────────────
  const loadAvailability = useCallback(async (simulateErr = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMonthAvailability(venue.id, year, month, simulateErr);
      if (res.success) {
        setCalendarData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Unable to load availability.');
    } finally {
      setLoading(false);
    }
  }, [venue.id, year, month]);

  // ── Load Operating Hours ─────────────────────────────────────
  const loadHours = useCallback(async () => {
    try {
      setHoursLoading(true);
      const res = await fetchOperatingHours(venue.id);
      if (res.success) {
        setOperatingHours(res.data);
        setEditedHours(JSON.parse(JSON.stringify(res.data)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHoursLoading(false);
    }
  }, [venue.id]);

  useEffect(() => {
    loadAvailability();
    loadHours();
  }, [loadAvailability, loadHours]);

  // ── Month Navigation ─────────────────────────────────────────
  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  // ── Day Click Handler ────────────────────────────────────────
  const handleDayClick = (dayObj) => {
    if (!dayObj) return;

    if (dayObj.status === 'OPEN') {
      setActionError(null);
      setBlockPromptDay(dayObj);
    } else if (dayObj.status === 'BLOCKED') {
      setActionError(null);
      setUnblockPromptDay(dayObj);
    } else if (dayObj.status === 'BOOKED') {
      setBookedDetailDay(dayObj);
    }
  };

  // ── Block Day Confirmation ───────────────────────────────────
  const handleConfirmBlock = async () => {
    if (!blockPromptDay) return;
    try {
      const res = await blockDate({
        venueId: venue.id,
        date: blockPromptDay.date,
        reason: blockReason,
      });

      if (res.success) {
        showToast(`Day blocked: ${blockPromptDay.date}`);
        setBlockPromptDay(null);
        loadAvailability();
      } else {
        setActionError(res.error || 'Cannot block this day.');
      }
    } catch (err) {
      setActionError(err.message);
    }
  };

  // ── Unblock Day Confirmation ─────────────────────────────────
  const handleConfirmUnblock = async () => {
    if (!unblockPromptDay) return;
    try {
      const res = await unblockDate({
        venueId: venue.id,
        date: unblockPromptDay.date,
      });

      if (res.success) {
        showToast(`Day unblocked: ${unblockPromptDay.date}`);
        setUnblockPromptDay(null);
        loadAvailability();
      } else {
        setActionError(res.error || 'Cannot unblock day.');
      }
    } catch (err) {
      setActionError(err.message);
    }
  };

  // ── Save Operating Hours ─────────────────────────────────────
  const handleSaveHours = async () => {
    setHoursError(null);
    try {
      const res = await saveOperatingHours(venue.id, editedHours);
      if (res.success) {
        setOperatingHours(res.data);
        setIsEditingHours(false);
        showToast('Operating hours updated successfully!');
      } else {
        setHoursError(res.error || 'Failed to save hours.');
      }
    } catch (err) {
      setHoursError(err.message || 'Unable to update hours.');
    }
  };

  const handleHourChange = (idx, field, value) => {
    setEditedHours((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  // Month string representation
  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

  // Generate dynamic slots for selected day preview
  const previewSlots = generateSlotsFromHours(operatingHours, selectedPreviewDay);

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

      {/* ── Block Day Inline Confirmation Modal ── */}
      {blockPromptDay && (
        <div className="owner-modal-backdrop" onClick={() => setBlockPromptDay(null)}>
          <div className="owner-modal-card" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="owner-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ban size={16} />
                </div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Block this day?
                </h3>
              </div>
              <button type="button" onClick={() => setBlockPromptDay(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div className="owner-modal-body">
              <p style={{ margin: 0, fontSize: '0.84375rem', color: '#1E293B', fontWeight: 600 }}>
                Do you want to block <strong>{blockPromptDay.date}</strong> from player bookings?
              </p>
              {actionError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '0.65rem', fontSize: '0.75rem', color: '#991B1B' }}>
                  {actionError}
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.71875rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                  Reason for closure
                </label>
                <select
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.8125rem', background: '#FFF' }}
                >
                  <option value="Routine Maintenance">Routine Maintenance</option>
                  <option value="Facility Upgrade">Facility Upgrade</option>
                  <option value="Private Club Event">Private Club Event</option>
                  <option value="Public Holiday Closure">Public Holiday Closure</option>
                </select>
              </div>
            </div>
            <div className="owner-modal-footer">
              <button
                type="button"
                onClick={() => setBlockPromptDay(null)}
                style={{ padding: '0.5rem 0.85rem', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                style={{ padding: '0.5rem 1.1rem', borderRadius: 8, border: 'none', background: '#DC2626', color: '#FFF', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Yes, Block Day
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unblock Day Inline Confirmation Modal ── */}
      {unblockPromptDay && (
        <div className="owner-modal-backdrop" onClick={() => setUnblockPromptDay(null)}>
          <div className="owner-modal-card" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="owner-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={16} />
                </div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Unblock this day?
                </h3>
              </div>
              <button type="button" onClick={() => setUnblockPromptDay(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div className="owner-modal-body">
              <p style={{ margin: 0, fontSize: '0.84375rem', color: '#1E293B', fontWeight: 600 }}>
                Restore <strong>{unblockPromptDay.date}</strong> to OPEN status so players can book slots?
              </p>
              {unblockPromptDay.reason && (
                <div style={{ fontSize: '0.75rem', color: '#64748B', background: '#F8FAFC', padding: '0.5rem', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  Previous block reason: {unblockPromptDay.reason}
                </div>
              )}
            </div>
            <div className="owner-modal-footer">
              <button
                type="button"
                onClick={() => setUnblockPromptDay(null)}
                style={{ padding: '0.5rem 0.85rem', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnblock}
                style={{ padding: '0.5rem 1.1rem', borderRadius: 8, border: 'none', background: '#059669', color: '#FFF', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Yes, Unblock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Booked Day Detail Modal (Non-destructive protection) ── */}
      {bookedDetailDay && (
        <div className="owner-modal-backdrop" onClick={() => setBookedDetailDay(null)}>
          <div className="owner-modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="owner-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    Booked Date: {bookedDetailDay.date}
                  </h3>
                  <span style={{ fontSize: '0.6875rem', color: '#1D4ED8', fontWeight: 700 }}>
                    Active Player Reservations
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setBookedDetailDay(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div className="owner-modal-body">
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.65rem 0.85rem', borderRadius: 8, fontSize: '0.75rem', color: '#1E40AF' }}>
                ⚠️ <strong>Booking Protection Active:</strong> Destructive blocking is disabled because this day contains confirmed player bookings.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {bookedDetailDay.bookings && bookedDetailDay.bookings.length > 0 ? (
                  bookedDetailDay.bookings.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        padding: '0.65rem 0.85rem',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>
                          {b.customer} • {b.court}
                        </div>
                        <div style={{ fontSize: '0.71875rem', color: '#64748B' }}>
                          Time: {b.time}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: '#ECFDF5', color: '#065F46', padding: '0.2rem 0.5rem', borderRadius: 9999 }}>
                        {b.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#64748B', fontSize: '0.78125rem' }}>
                    Slots booked on this day.
                  </div>
                )}
              </div>
            </div>
            <div className="owner-modal-footer">
              <button
                type="button"
                onClick={() => setBookedDetailDay(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: '#2563EB', color: '#FFF', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Screen Header ── */}
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
              Availability Calendar
            </h1>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>
          Manage court opening, scheduled blocks, and operating hours.
        </p>
      </div>

      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        {/* ── ERROR STATE ── */}
        {error ? (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '1.25rem', textAlign: 'center', marginBottom: '1.25rem' }}>
            <AlertCircle size={24} color="#DC2626" style={{ marginBottom: '0.4rem' }} />
            <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#991B1B', marginBottom: '0.5rem' }}>
              {error}
            </div>
            <button
              type="button"
              onClick={() => loadAvailability(false)}
              style={{ padding: '0.45rem 1rem', borderRadius: 6, background: '#DC2626', color: '#FFF', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        ) : (
          /* ── 7-COLUMN CALENDAR CARD ── */
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: '1rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {/* Month Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CalendarIcon size={18} color="#2563EB" />
                <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  {monthName} {year}
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <ChevronLeft size={16} color="#475569" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <ChevronRight size={16} color="#475569" />
                </button>
              </div>
            </div>

            {/* Calendar Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '0.85rem', fontSize: '0.6875rem', fontWeight: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ECFDF5', border: '1px solid #059669' }} />
                <span style={{ color: '#065F46' }}>OPEN</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#EFF6FF', border: '1px solid #2563EB' }} />
                <span style={{ color: '#1D4ED8' }}>BOOKED</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#FEF2F2', border: '1px solid #DC2626' }} />
                <span style={{ color: '#991B1B' }}>BLOCKED</span>
              </div>
            </div>

            {/* Weekday headers (7 columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem', textAlign: 'center', marginBottom: '0.35rem' }}>
              {WEEKDAYS.map((wd) => (
                <div key={wd} style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', padding: '0.2rem 0' }}>
                  {wd}
                </div>
              ))}
            </div>

            {/* 7-Column Day Grid */}
            {loading || !calendarData ? (
              /* Calendar skeleton */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className="owner-skeleton"
                    style={{ aspectRatio: '1', borderRadius: 8 }}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
                {/* Out of month / offset padding cells */}
                {Array.from({ length: calendarData.firstDayWeekIndex }).map((_, i) => (
                  <div
                    key={`offset-${i}`}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 8,
                      opacity: 0.25,
                      pointerEvents: 'none',
                      background: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      color: '#94A3B8',
                    }}
                  >
                    •
                  </div>
                ))}

                {/* Actual Days */}
                {calendarData.days.map((dayObj) => {
                  let bg = '#ECFDF5';
                  let textColor = '#065F46';
                  let strike = false;

                  if (dayObj.status === 'BOOKED') {
                    bg = '#EFF6FF';
                    textColor = '#1D4ED8';
                  } else if (dayObj.status === 'BLOCKED') {
                    bg = '#FEF2F2';
                    textColor = '#991B1B';
                    strike = true;
                  }

                  return (
                    <button
                      key={dayObj.date}
                      type="button"
                      onClick={() => handleDayClick(dayObj)}
                      title={`${dayObj.date} (${dayObj.status}) - Tap to toggle block/unblock`}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 8,
                        background: bg,
                        color: textColor,
                        border: '1px solid rgba(0,0,0,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        transition: 'transform 0.1s ease',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 800,
                          textDecoration: strike ? 'line-through' : 'none',
                        }}
                      >
                        {dayObj.dayNumber}
                      </span>
                      <span style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.85, textDecoration: strike ? 'line-through' : 'none' }}>
                        {dayObj.status.slice(0, 3)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── OPERATING HOURS CARD ── */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: '1rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={16} color="#2563EB" />
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Operating Hours
              </h2>
            </div>
            {!isEditingHours ? (
              <button
                type="button"
                onClick={() => setIsEditingHours(true)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  background: 'transparent',
                  color: '#2563EB',
                  fontSize: '0.71875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Edit hours
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditedHours(JSON.parse(JSON.stringify(operatingHours)));
                    setIsEditingHours(false);
                  }}
                  style={{
                    padding: '0.35rem 0.6rem',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    background: '#FFF',
                    color: '#64748B',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveHours}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: 6,
                    border: 'none',
                    background: '#2563EB',
                    color: '#FFF',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                  }}
                >
                  <Save size={12} />
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>

          {hoursError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '0.6rem', fontSize: '0.71875rem', color: '#991B1B', marginBottom: '0.75rem' }}>
              {hoursError}
            </div>
          )}

          {hoursLoading ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#64748B', fontSize: '0.75rem' }}>
              Loading operating schedule...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(isEditingHours ? editedHours : operatingHours).map((row, idx) => (
                <div
                  key={row.day}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.65rem',
                    borderRadius: 8,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <span style={{ fontSize: '0.78125rem', fontWeight: 700, color: '#0F172A', width: 90 }}>
                    {row.day}
                  </span>

                  {isEditingHours ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.6875rem', color: '#475569' }}>
                        <input
                          type="checkbox"
                          checked={row.isOpen}
                          onChange={(e) => handleHourChange(idx, 'isOpen', e.target.checked)}
                        />
                        Open
                      </label>

                      {row.isOpen ? (
                        <>
                          <input
                            type="time"
                            value={row.openTime}
                            onChange={(e) => handleHourChange(idx, 'openTime', e.target.value)}
                            style={{ padding: '0.25rem 0.35rem', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: '0.71875rem', background: '#FFF' }}
                          />
                          <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>to</span>
                          <input
                            type="time"
                            value={row.closeTime}
                            onChange={(e) => handleHourChange(idx, 'closeTime', e.target.value)}
                            style={{ padding: '0.25rem 0.35rem', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: '0.71875rem', background: '#FFF' }}
                          />
                        </>
                      ) : (
                        <span style={{ fontSize: '0.71875rem', color: '#DC2626', fontWeight: 700 }}>
                          Closed All Day
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      {row.isOpen ? (
                        <span style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600 }}>
                          {row.openTime} – {row.closeTime}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.71875rem', color: '#DC2626', fontWeight: 700, background: '#FEF2F2', padding: '0.15rem 0.45rem', borderRadius: 4 }}>
                          Closed
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── DYNAMIC SLOT GENERATION PREVIEW ── */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: '1rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={16} color="#8B5CF6" />
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Generated Slots Preview
              </h2>
            </div>
            <select
              value={selectedPreviewDay}
              onChange={(e) => setSelectedPreviewDay(e.target.value)}
              style={{ padding: '0.25rem 0.5rem', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.71875rem', background: '#FFF' }}
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <p style={{ margin: 0, fontSize: '0.71875rem', color: '#64748B', marginBottom: '0.75rem' }}>
            Slots are calculated dynamically from operating hours + pricing rules (off-peak vs peak rates).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
            {previewSlots.length > 0 ? (
              previewSlots.slice(0, 8).map((slot, i) => (
                <div
                  key={i}
                  style={{
                    padding: '0.5rem',
                    background: '#F8FAFC',
                    borderRadius: 6,
                    border: '1px solid #E2E8F0',
                    fontSize: '0.6875rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{slot.time}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                    <span style={{ color: slot.isPeak ? '#B45309' : '#059669', fontWeight: 700 }}>
                      {slot.isPeak ? 'Peak' : 'Off-peak'}
                    </span>
                    <span style={{ fontWeight: 800, color: '#0F172A' }}>₹{slot.rate}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '1rem', color: '#64748B', fontSize: '0.75rem' }}>
                Venue is closed on {selectedPreviewDay}. No slots generated.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Owner Bottom Navigation Bar */}
      <OwnerBottomNav activeTab="availability" onNavigate={onNavigateTab} />
    </div>
  );
}
