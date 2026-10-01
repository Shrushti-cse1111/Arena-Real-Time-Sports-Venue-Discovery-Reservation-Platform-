import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Check,
  ArrowRight,
  ShieldCheck,
  Building2,
  Info,
  Lock,
  AlertTriangle,
} from 'lucide-react';

export default function SlotCalendarScreen({
  venue,
  court,
  slotsData,
  upcomingDates = [],
  onContinueBooking,
  onSimulateConflict,
}) {
  const [selectedDate, setSelectedDate] = useState(upcomingDates[2] || upcomingDates[0] || null);
  const [selectedSlot, setSelectedSlot] = useState(null); // { id, time, period }
  const [simulateConflictNext, setSimulateConflictNext] = useState(false);

  const courtPrice = court ? court.price : (venue.pricePerHour || 500);

  const activeSlots = slotsData || {
    morning: [],
    afternoon: [],
    evening: [],
  };

  const handleSelectSlot = (slot, period) => {
    if (slot.status === 'booked' || slot.status === 'reserved') return;
    setSelectedSlot({ ...slot, period });
  };

  // Render individual slot button adhering strictly to the Visual Status System
  const renderSlotButton = (slot, period) => {
    const isSelected = selectedSlot && selectedSlot.id === slot.id;
    const isBooked = slot.status === 'booked';
    const isReserved = slot.status === 'reserved';
    const isAvailable = slot.status === 'available' && !isSelected;

    let stateClass = 'available';
    if (isSelected) stateClass = 'selected';
    else if (isReserved) stateClass = 'reserved';
    else if (isBooked) stateClass = 'unavailable';

    return (
      <button
        key={slot.id}
        type="button"
        className={`time-slot-btn ${stateClass}`}
        disabled={isBooked || isReserved}
        onClick={() => handleSelectSlot(slot, period)}
        title={
          isBooked
            ? 'Slot booked'
            : isReserved
            ? 'Slot temporarily held by another player'
            : 'Click to select slot'
        }
      >
        <div className="slot-btn-content">
          <span className="slot-time-text">{slot.time}</span>
          {isSelected && (
            <Check size={13} strokeWidth={3} className="slot-check-icon" />
          )}
          {isReserved && (
            <span className="reserved-pill-tag">
              <Lock size={10} /> Held
            </span>
          )}
          {isBooked && <span className="booked-label">Booked</span>}
        </div>
      </button>
    );
  };

  const handleContinue = () => {
    if (!selectedSlot) return;

    if (simulateConflictNext) {
      if (onSimulateConflict) {
        onSimulateConflict({
          venue,
          court,
          date: selectedDate,
          slot: selectedSlot,
          price: courtPrice,
        });
      }
      return;
    }

    onContinueBooking({
      venue,
      court,
      date: selectedDate,
      slot: selectedSlot,
      price: courtPrice,
    });
  };

  return (
    <div className="slot-calendar-container fade-in">
      {/* COMPACT VENUE SUMMARY AT TOP */}
      <div className="calendar-venue-strip">
        <div className="strip-icon-box">
          <Building2 size={18} color="#2563EB" />
        </div>
        <div className="strip-info-col">
          <span className="strip-venue-name">{venue.name}</span>
          <span className="strip-court-name">
            {court ? court.name : 'Badminton Court 1'} • {venue.location}
          </span>
        </div>
        <div className="strip-price-badge">
          <span>₹{courtPrice}/hr</span>
        </div>
      </div>

      {/* SCROLLABLE MAIN BODY */}
      <div className="calendar-scroll-content">
        {/* DATE SELECTOR */}
        <div className="date-selector-section">
          <div className="section-label-row" style={{ marginBottom: '0.65rem' }}>
            <span className="calendar-section-title">Select Date</span>
            <span className="date-hint-text">
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="dates-horizontal-strip">
            {upcomingDates.map((item) => {
              const isSelected = selectedDate && selectedDate.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`date-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedDate(item);
                    setSelectedSlot(null);
                  }}
                >
                  <span className="date-chip-day">{item.day}</span>
                  <span className="date-chip-num">{item.date.split(' ')[0]}</span>
                  <span className="date-chip-month">{item.date.split(' ')[1]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TIME SLOTS SECTION WITH 4-STATE VISUAL SYSTEM */}
        <div className="time-slots-section">
          <div className="section-label-row" style={{ marginBottom: '0.75rem' }}>
            <span className="calendar-section-title">Available Slots</span>
            <div className="slots-legend-grid">
              <span className="legend-item">
                <span className="legend-dot available" /> Available
              </span>
              <span className="legend-item">
                <span className="legend-dot selected" /> Selected
              </span>
              <span className="legend-item">
                <span className="legend-dot reserved" /> Held
              </span>
              <span className="legend-item">
                <span className="legend-dot booked" /> Booked
              </span>
            </div>
          </div>

          {/* Morning Period */}
          <div className="slot-period-block">
            <span className="period-title">Morning</span>
            <div className="slots-vertical-list">
              {activeSlots.morning.map((slot) =>
                renderSlotButton(slot, 'Morning')
              )}
            </div>
          </div>

          {/* Afternoon Period */}
          <div className="slot-period-block">
            <span className="period-title">Afternoon</span>
            <div className="slots-vertical-list">
              {activeSlots.afternoon.map((slot) =>
                renderSlotButton(slot, 'Afternoon')
              )}
            </div>
          </div>

          {/* Evening Period */}
          <div className="slot-period-block">
            <span className="period-title">Evening</span>
            <div className="slots-vertical-list">
              {activeSlots.evening.map((slot) =>
                renderSlotButton(slot, 'Evening')
              )}
            </div>
          </div>
        </div>

        {/* SELECTED SLOT SUMMARY BOX */}
        {selectedSlot ? (
          <div className="selected-slot-summary-card fade-in">
            <div className="summary-left">
              <span className="summary-headline">Selected Slot</span>
              <span className="summary-date-time">
                {selectedDate.fullDate}
              </span>
              <span className="summary-court-meta">
                {selectedSlot.time} • {court ? court.name : 'Badminton Court 1'}
              </span>
            </div>
            <div className="summary-price-col">
              <span className="summary-amount">₹{courtPrice}</span>
              <span className="summary-period">1 Hour</span>
            </div>
          </div>
        ) : (
          <div className="no-slot-selected-tip">
            <Info size={15} color="#64748B" />
            <span>Select an available slot to temporarily lock and proceed</span>
          </div>
        )}

        {/* PROTOTYPE DEMO TOOLBAR: Simulate Conflict Toggle */}
        <div className="prototype-demo-strip">
          <label className="conflict-toggle-label">
            <input
              type="checkbox"
              checked={simulateConflictNext}
              onChange={(e) => setSimulateConflictNext(e.target.checked)}
            />
            <span className="toggle-text">
              ⚡ Demo test: Simulate double-booking conflict
            </span>
          </label>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="calendar-bottom-bar">
        <button
          type="button"
          className="btn-primary continue-booking-btn"
          disabled={!selectedSlot}
          onClick={handleContinue}
        >
          <span>Continue to Booking</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
