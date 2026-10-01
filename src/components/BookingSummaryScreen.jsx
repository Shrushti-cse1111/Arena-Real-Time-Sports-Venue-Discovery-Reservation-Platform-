import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Tag,
  Plus,
  Minus,
  Sparkles,
  Package,
  X,
  Lock,
  ChevronRight,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { AVAILABLE_COUPONS, SPORT_EQUIPMENT_ADDONS } from '../data/mockVenues';
import { groupBookingService } from '../data/groupBookingService';

export default function BookingSummaryScreen({
  bookingData,
  timeRemaining = 598,
  onProceedToPayment,
  onCancelBooking,
  onChangeSlot,
}) {
  const { venue, court, date, slot, price } = bookingData || {};

  // Default sport determination
  const primarySport = venue?.primarySport || 'Badminton';
  const availableAddonsList =
    SPORT_EQUIPMENT_ADDONS[primarySport] || SPORT_EQUIPMENT_ADDONS.Badminton || [];

  // State
  const [playersCount, setPlayersCount] = useState(bookingData?.playersCount || 2);
  const [selectedAddons, setSelectedAddons] = useState(bookingData?.addOns || {});
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(bookingData?.appliedCoupon || null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccessMsg, setCouponSuccessMsg] = useState('');

  // Group Booking & Split Payment State
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const maxCapacity = groupBookingService.getMaxCapacityForSport(primarySport);
  const [groupParticipantsCount, setGroupParticipantsCount] = useState(
    Math.min(4, maxCapacity)
  );

  // Format countdown mm:ss
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes < 10 ? `0${minutes}` : minutes}:${
    seconds < 10 ? `0${seconds}` : seconds
  }`;

  // Base Court Price
  const baseCourtPrice = price || court?.price || venue?.pricePerHour || 0;

  // Calculate Add-ons subtotal
  const addonsTotal = Object.entries(selectedAddons).reduce((total, [addonId, qty]) => {
    const item = availableAddonsList.find((a) => a.id === addonId);
    return total + (item ? item.price * qty : 0);
  }, 0);

  // Subtotal before coupon
  const subtotal = baseCourtPrice + addonsTotal;

  // Calculate Coupon Discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'flat') {
      discountAmount = Math.min(appliedCoupon.discountValue, subtotal);
    } else if (appliedCoupon.discountType === 'percentage') {
      const calcDiscount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
      discountAmount = appliedCoupon.maxDiscount
        ? Math.min(calcDiscount, appliedCoupon.maxDiscount)
        : calcDiscount;
    }
  }

  // Fees & Taxes
  const platformFee = 20;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxes = Math.round(discountedSubtotal * 0.05); // 5% GST

  // Final Payable dynamically calculated
  const finalPayable = discountedSubtotal + platformFee + taxes;

  // Handlers for Addons
  const handleUpdateAddonQty = (addonId, delta) => {
    setSelectedAddons((prev) => {
      const currentQty = prev[addonId] || 0;
      const newQty = Math.max(0, Math.min(10, currentQty + delta));
      if (newQty === 0) {
        const copy = { ...prev };
        delete copy[addonId];
        return copy;
      }
      return { ...prev, [addonId]: newQty };
    });
  };

  // Handlers for Coupons
  const handleApplyCoupon = (couponCodeToApply) => {
    const code = (couponCodeToApply || couponInput).trim().toUpperCase();
    setCouponError('');
    setCouponSuccessMsg('');

    if (!code) {
      setCouponError('Please enter a valid coupon code.');
      return;
    }

    if (appliedCoupon && appliedCoupon.code === code) {
      setCouponError('This coupon is already applied.');
      return;
    }

    const matchedCoupon = AVAILABLE_COUPONS.find((c) => c.code.toUpperCase() === code);

    if (!matchedCoupon) {
      setCouponError(`Invalid coupon "${code}". Try ARENA50 or FIRSTMATCH.`);
      return;
    }

    if (matchedCoupon.minAmount && subtotal < matchedCoupon.minAmount) {
      setCouponError(
        `Minimum booking amount of ₹${matchedCoupon.minAmount} required for coupon ${matchedCoupon.code}.`
      );
      return;
    }

    const discountVal =
      matchedCoupon.discountType === 'flat'
        ? matchedCoupon.discountValue
        : Math.min(
            Math.round((subtotal * matchedCoupon.discountValue) / 100),
            matchedCoupon.maxDiscount || Infinity
          );

    setAppliedCoupon(matchedCoupon);
    setCouponInput('');
    setCouponSuccessMsg(`Coupon ${matchedCoupon.code} applied! Saved ₹${discountVal}`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccessMsg('');
    setCouponError('');
  };

  const handleProceed = () => {
    // Validation
    if (!venue || !slot) {
      setCouponError('Invalid booking session. Please select a slot.');
      return;
    }
    if (timeRemaining <= 0) {
      setCouponError('Reservation hold expired. Please choose a slot again.');
      return;
    }

    const itemizedAddOnsList = Object.entries(selectedAddons)
      .map(([addonId, qty]) => {
        const item = availableAddonsList.find((a) => a.id === addonId);
        return item ? { ...item, quantity: qty, total: item.price * qty } : null;
      })
      .filter(Boolean);

    const payload = {
      ...bookingData,
      venue,
      court,
      date,
      slot,
      venueId: venue?.id || 'venue-1',
      sportId: primarySport,
      sport: primarySport,
      slotId: slot?.id || 'slot-1',
      startTime: slot?.shortTime || slot?.time?.split('–')[0]?.trim() || '6:00 PM',
      endTime: slot?.time?.split('–')[1]?.trim() || '7:00 PM',
      duration: '1 hour',
      playerCount: playersCount,
      playersCount,
      price: baseCourtPrice,
      courtPrice: baseCourtPrice,
      basePrice: baseCourtPrice,
      addOns: itemizedAddOnsList,
      addOnsTotal: addonsTotal,
      coupon: appliedCoupon ? appliedCoupon.code : null,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      appliedCoupon,
      subtotal,
      discount: discountAmount,
      discountAmount,
      couponDiscount: discountAmount,
      fees: platformFee,
      platformFee,
      taxes,
      gst: taxes,
      totalAmount: finalPayable,
      finalPayable,
    };
    onProceedToPayment(payload);
  };

  return (
    <div className="screen-body fade-in booking-summary-screen-body">
      {/* SCREEN TITLE & SUBTITLE */}
      <div style={{ marginBottom: '0.85rem' }}>
        <h1 className="screen-title" style={{ marginBottom: '0.2rem' }}>
          Booking Summary & Checkout
        </h1>
        <p className="screen-subtitle" style={{ marginBottom: '0.65rem' }}>
          Review your reservation, add gear & apply coupons
        </p>
      </div>

      {/* TEMPORARY HOLD TIMER BAR */}
      <div className="summary-hold-timer-bar">
        <div className="hold-timer-left">
          <Lock size={14} color="#2563EB" />
          <span>
            Slot locked for <strong>{formattedTime}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span className="hold-dot-active" />
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
            Reserved
          </span>
        </div>
      </div>

      {/* 1. VENUE & SLOT DETAILS CARD */}
      <div className="summary-details-card">
        <div className="summary-card-header">
          <div className="summary-venue-icon">
            <Building2 size={20} color="#2563EB" />
          </div>
          <div className="summary-header-text" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 className="summary-venue-name">{venue?.name || 'Arena Sports Club'}</h3>
              <span className="summary-sport-pill">{primarySport}</span>
            </div>
            <span className="summary-court-name">
              {court?.name || 'Synthetic Badminton Court 1'} • {court?.type || 'BWF Synthetic Mat'}
            </span>
          </div>
        </div>

        <div className="summary-card-divider" />

        <div className="summary-items-list">
          {/* Date */}
          <div className="summary-item-row">
            <div className="summary-item-icon">
              <Calendar size={15} color="#64748B" />
            </div>
            <div className="summary-item-content" style={{ flex: 1 }}>
              <span className="item-label">Date</span>
              <span className="item-val">{date?.fullDate || 'Wednesday, 17 September 2026'}</span>
            </div>
          </div>

          {/* Time Slot & Duration */}
          <div className="summary-item-row">
            <div className="summary-item-icon">
              <Clock size={15} color="#64748B" />
            </div>
            <div className="summary-item-content" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="item-label">Time Slot & Duration</span>
                {onChangeSlot && (
                  <button
                    type="button"
                    className="change-slot-link"
                    onClick={onChangeSlot}
                  >
                    Change Slot
                  </button>
                )}
              </div>
              <span className="item-val">
                {slot?.time || '7:00 PM – 8:00 PM'} <strong style={{ color: '#2563EB', fontWeight: 600 }}>(1 Hour)</strong>
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="summary-item-row">
            <div className="summary-item-icon">
              <MapPin size={15} color="#64748B" />
            </div>
            <div className="summary-item-content" style={{ flex: 1 }}>
              <span className="item-label">Venue Location</span>
              <span className="item-val">{venue?.location || 'Koregaon Park, Pune'}</span>
            </div>
          </div>

          {/* Players Count Stepper */}
          <div className="summary-item-row" style={{ alignItems: 'center' }}>
            <div className="summary-item-icon">
              <Users size={15} color="#64748B" />
            </div>
            <div className="summary-item-content" style={{ flex: 1 }}>
              <span className="item-label">Number of Players</span>
              <span className="item-val">{playersCount} Players attending</span>
            </div>
            <div className="player-stepper-control">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => setPlayersCount((c) => Math.max(1, c - 1))}
                disabled={playersCount <= 1}
                aria-label="Decrease players"
              >
                <Minus size={13} />
              </button>
              <span className="stepper-val">{playersCount}</span>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => setPlayersCount((c) => Math.min(12, c + 1))}
                disabled={playersCount >= 12}
                aria-label="Increase players"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. OPTIONAL EQUIPMENT & GEAR ADD-ONS */}
      <div className="summary-details-card">
        <div className="summary-card-header" style={{ marginBottom: '0.4rem' }}>
          <div className="summary-venue-icon" style={{ background: '#FEF3C7' }}>
            <Package size={18} color="#D97706" />
          </div>
          <div className="summary-header-text">
            <h3 className="summary-venue-name" style={{ fontSize: '0.875rem' }}>
              Optional Gear & Equipment
            </h3>
            <span className="summary-court-name">
              Rent verified sports equipment on arrival
            </span>
          </div>
        </div>

        <div className="summary-addons-list">
          {availableAddonsList.map((addon) => {
            const qty = selectedAddons[addon.id] || 0;
            return (
              <div
                key={addon.id}
                className={`addon-item-row ${qty > 0 ? 'selected' : ''}`}
              >
                <div className="addon-info-col">
                  <div className="addon-title-line">
                    <span className="addon-name">{addon.name}</span>
                    <span className="addon-price">₹{addon.price} <small>/{addon.unit}</small></span>
                  </div>
                  <span className="addon-desc">{addon.desc}</span>
                </div>

                <div className="addon-stepper-control">
                  {qty === 0 ? (
                    <button
                      type="button"
                      className="addon-add-btn"
                      onClick={() => handleUpdateAddonQty(addon.id, 1)}
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>
                  ) : (
                    <div className="stepper-group">
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => handleUpdateAddonQty(addon.id, -1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="stepper-val">{qty}</span>
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => handleUpdateAddonQty(addon.id, 1)}
                        disabled={qty >= 6}
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. COUPONS & PROMO CODES */}
      <div className="summary-details-card">
        <div className="summary-card-header" style={{ marginBottom: '0.5rem' }}>
          <div className="summary-venue-icon" style={{ background: '#ECFDF5' }}>
            <Tag size={18} color="#059669" />
          </div>
          <div className="summary-header-text">
            <h3 className="summary-venue-name" style={{ fontSize: '0.875rem' }}>
              Offers & Promo Codes
            </h3>
            <span className="summary-court-name">
              Apply a promo code for instant savings
            </span>
          </div>
        </div>

        {/* Applied Coupon Display */}
        {appliedCoupon ? (
          <div className="applied-coupon-pill-card">
            <div className="applied-coupon-left">
              <CheckCircle2 size={16} color="#059669" />
              <div>
                <span className="applied-code-text">{appliedCoupon.code} Applied</span>
                <span className="applied-discount-text">
                  You saved ₹{discountAmount} on this booking!
                </span>
              </div>
            </div>
            <button
              type="button"
              className="remove-coupon-btn"
              onClick={handleRemoveCoupon}
              title="Remove coupon"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          /* Coupon Input Form */
          <div>
            <div className="coupon-input-box">
              <input
                type="text"
                className="coupon-text-field"
                placeholder="Enter coupon code (e.g. ARENA50)"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase());
                  setCouponError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
              />
              <button
                type="button"
                className="coupon-apply-btn"
                disabled={!couponInput.trim()}
                onClick={() => handleApplyCoupon()}
              >
                Apply
              </button>
            </div>

            {/* Quick Clickable Coupon Chips */}
            <div className="quick-coupons-row">
              <span className="quick-coupon-label">Available:</span>
              {AVAILABLE_COUPONS.map((coupon) => (
                <button
                  key={coupon.code}
                  type="button"
                  className="quick-coupon-chip"
                  onClick={() => handleApplyCoupon(coupon.code)}
                >
                  <Sparkles size={11} color="#2563EB" />
                  <span>{coupon.code}</span>
                  <small>({coupon.discountType === 'flat' ? `₹${coupon.discountValue} OFF` : `${coupon.discountValue}% OFF`})</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Coupon validation messages */}
        {couponError && (
          <div className="coupon-message-box error">
            <AlertCircle size={13} color="#EF4444" />
            <span>{couponError}</span>
          </div>
        )}
        {couponSuccessMsg && (
          <div className="coupon-message-box success">
            <CheckCircle2 size={13} color="#059669" />
            <span>{couponSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* 3B. GROUP BOOKING & SPLIT PAYMENT SELECTOR */}
      <div className="summary-details-card" style={{ border: isGroupBooking ? '1.5px solid #2563EB' : '1px solid var(--border-color)', background: isGroupBooking ? '#F8FAFC' : '#FFFFFF' }}>
        <div className="card-header-line-split" style={{ marginBottom: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users size={18} color="#2563EB" />
            <h3 className="summary-venue-name" style={{ fontSize: '0.875rem' }}>
              Group Booking & Split Payment
            </h3>
          </div>
          <span className="default-pill" style={{ background: isGroupBooking ? '#DBEAFE' : '#F1F5F9', color: isGroupBooking ? '#1E40AF' : '#475569' }}>
            {isGroupBooking ? 'Split Active' : 'Solo Pay'}
          </span>
        </div>

        <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
          Split the total court fee equally with your teammates. You pay your share now to lock the slot, and invite friends to pay their shares!
        </p>

        {/* TOGGLE OPTIONS */}
        <div className="bookings-tabs-segment" style={{ marginBottom: '0.65rem' }}>
          <button
            type="button"
            className={`booking-tab-btn ${!isGroupBooking ? 'active' : ''}`}
            onClick={() => setIsGroupBooking(false)}
          >
            <span>Solo Booking (Pay ₹{finalPayable})</span>
          </button>
          <button
            type="button"
            className={`booking-tab-btn ${isGroupBooking ? 'active' : ''}`}
            onClick={() => setIsGroupBooking(true)}
          >
            <Users size={13} />
            <span>Split with Friends</span>
          </button>
        </div>

        {/* GROUP SPLIT CONTROLS */}
        {isGroupBooking && (
          <div className="fade-in" style={{ padding: '0.75rem', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: 'var(--primary-navy)' }}>
                Total Teammates / Players (Max {maxCapacity} for {primarySport})
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setGroupParticipantsCount((prev) => Math.max(2, prev - 1))}
                  disabled={groupParticipantsCount <= 2}
                  style={{ width: '28px', height: '28px' }}
                >
                  <Minus size={14} />
                </button>
                <strong style={{ fontSize: '0.95rem', color: '#2563EB', width: '20px', textAlign: 'center' }}>
                  {groupParticipantsCount}
                </strong>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setGroupParticipantsCount((prev) => Math.min(maxCapacity, prev + 1))}
                  disabled={groupParticipantsCount >= maxCapacity}
                  style={{ width: '28px', height: '28px' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* SPLIT BREAKDOWN */}
            {(() => {
              const split = groupBookingService.calculateSplit(finalPayable, groupParticipantsCount);
              return (
                <div style={{ background: '#EFF6FF', padding: '0.65rem', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, color: '#1E40AF', marginBottom: '0.2rem' }}>
                    <span>Your Share (Organizer):</span>
                    <span>₹{split.organizerShare}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#3B82F6' }}>
                    <span>Remaining {groupParticipantsCount - 1} Teammates:</span>
                    <span>₹{split.participantShare} / player</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 4. DETAILED PRICE BREAKDOWN */}
      <div className="summary-details-card">
        <h3 className="summary-venue-name" style={{ fontSize: '0.875rem', marginBottom: '0.65rem' }}>
          Price Breakdown
        </h3>

        <div className="summary-pricing-block">
          {/* Base Court Fee */}
          <div className="price-item-line">
            <span className="price-line-title">
              Court Slot Fee ({court?.name ? court.name.split(' ')[0] : 'Court 1'}, 1 hr)
            </span>
            <span className="price-line-num">₹{baseCourtPrice}</span>
          </div>

          {/* Add-ons line items */}
          {Object.entries(selectedAddons).map(([addonId, qty]) => {
            const item = availableAddonsList.find((a) => a.id === addonId);
            if (!item) return null;
            return (
              <div key={addonId} className="price-item-line">
                <span className="price-line-title">
                  {item.name} <small>({qty} × ₹{item.price})</small>
                </span>
                <span className="price-line-num">₹{item.price * qty}</span>
              </div>
            );
          })}

          {/* Coupon Discount */}
          {discountAmount > 0 && (
            <div className="price-item-line discount-line">
              <span className="price-line-title" style={{ color: '#059669', fontWeight: 600 }}>
                Coupon Discount ({appliedCoupon?.code})
              </span>
              <span className="price-line-num" style={{ color: '#059669', fontWeight: 700 }}>
                -₹{discountAmount}
              </span>
            </div>
          )}

          {/* Platform & Convenience Fee */}
          <div className="price-item-line">
            <span className="price-line-title">Convenience & Platform Fee</span>
            <span className="price-line-num">₹{platformFee}</span>
          </div>

          {/* Taxes & GST */}
          <div className="price-item-line">
            <span className="price-line-title">Applicable GST & Sports Cess (5%)</span>
            <span className="price-line-num">₹{taxes}</span>
          </div>

          {/* Total Payable */}
          <div className="price-total-line">
            <div>
              <span className="total-label">{isGroupBooking ? 'Total Booking Fee' : 'Final Payable Amount'}</span>
              <span className="total-subtext">Slot held & guaranteed</span>
            </div>
            <span className="total-amount">₹{finalPayable}</span>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM ACTIONS */}
      <div className="bottom-action-container" style={{ marginTop: '0.5rem' }}>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            const itemizedAddOnsList = Object.entries(selectedAddons)
              .map(([addonId, qty]) => {
                const item = availableAddonsList.find((a) => a.id === addonId);
                return item ? { ...item, quantity: qty, total: item.price * qty } : null;
              })
              .filter(Boolean);

            const splitInfo = isGroupBooking
              ? groupBookingService.calculateSplit(finalPayable, groupParticipantsCount)
              : null;

            const payload = {
              ...bookingData,
              venue,
              court,
              date,
              slot,
              venueId: venue?.id || 'venue-1',
              sportId: primarySport,
              sport: primarySport,
              slotId: slot?.id || 'slot-1',
              duration: '1 hour',
              playerCount: playersCount,
              courtPrice: baseCourtPrice,
              addOns: itemizedAddOnsList,
              addOnsTotal: addonsTotal,
              appliedCoupon,
              couponDiscount: discountAmount,
              couponCode: appliedCoupon?.code || null,
              subtotal,
              platformFee,
              gst: taxes,
              finalPayable: isGroupBooking ? splitInfo.organizerShare : finalPayable,
              originalTotalAmount: finalPayable,
              isGroupBooking,
              groupParticipantsCount: isGroupBooking ? groupParticipantsCount : 1,
              splitInfo,
            };

            onProceedToPayment(payload);
          }}
        >
          <span>
            {isGroupBooking
              ? `Proceed with Group Split (Pay My Share ₹${groupBookingService.calculateSplit(finalPayable, groupParticipantsCount).organizerShare})`
              : `Proceed to Payment (₹${finalPayable})`}
          </span>
          <ArrowRight size={18} />
        </button>

        {onChangeSlot ? (
          <button
            type="button"
            className="btn-secondary-cancel"
            onClick={onChangeSlot}
          >
            <RotateCcw size={15} />
            <span>Change Selected Slot</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-secondary-cancel"
            onClick={onCancelBooking}
          >
            <span>Cancel Booking</span>
          </button>
        )}
      </div>
    </div>
  );
}
