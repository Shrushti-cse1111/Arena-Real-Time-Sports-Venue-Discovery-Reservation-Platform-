import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Info,
  Calendar,
  Clock,
  MapPin,
  Check,
  RotateCcw,
  X,
  AlertCircle,
} from 'lucide-react';

export default function PaymentProcessingScreen({
  bookingData,
  playerData,
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentConflict,
  onCancelPayment,
}) {
  const savedPaymentMethods = playerData?.savedPaymentMethods || [];
  const savedCards = savedPaymentMethods.filter((pm) => pm.type === 'card');
  const savedUpiIds = savedPaymentMethods.filter((pm) => pm.type === 'upi');
  const hasSavedMethods = savedCards.length > 0 || savedUpiIds.length > 0;

  const [selectedMethod, setSelectedMethod] = useState(hasSavedMethods ? 'saved' : 'upi'); // 'saved' | 'upi' | 'card' | 'netbanking' | 'wallet' | 'venue'
  
  // Saved methods state
  const [selectedSavedCard, setSelectedSavedCard] = useState(savedCards.length > 0 ? savedCards[0].id : null);
  const [savedCardCvv, setSavedCardCvv] = useState('');
  const [selectedSavedUpi, setSelectedSavedUpi] = useState(savedUpiIds.length > 0 ? savedUpiIds[0].id : null);

  // New UPI state
  const [upiApp, setUpiApp] = useState('gpay');
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');

  // New Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState(playerData?.fullName || '');
  const [saveCardForFuture, setSaveCardForFuture] = useState(true);
  const [cardError, setCardError] = useState('');

  // Net banking & wallet state
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [selectedWallet, setSelectedWallet] = useState('paytm');

  // Gateway processing simulation state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('initiating'); // 'initiating' | 'authorizing' | 'confirming'
  const [showSimControls, setShowSimControls] = useState(false);

  const {
    venue,
    court,
    date,
    slot,
    price,
    finalPayable,
    totalAmount: passedTotal,
    addOns,
    playersCount,
    appliedCoupon,
    discountAmount,
  } = bookingData || {};

  const totalAmount = finalPayable !== undefined ? finalPayable : (passedTotal || price || 0);
  const addOnsCount = addOns ? Object.values(addOns).reduce((a, b) => a + b, 0) : 0;

  // Format Card Number (adds space every 4 digits)
  const handleCardNumberChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = rawVal.match(/.{1,4}/g)?.join(' ') || rawVal;
    setCardNumber(formatted);
    setCardError('');
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e) => {
    let rawVal = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (rawVal.length >= 3) {
      rawVal = `${rawVal.slice(0, 2)}/${rawVal.slice(2, 4)}`;
    }
    setCardExpiry(rawVal);
    setCardError('');
  };

  // Detect card network
  const getCardBrand = (num) => {
    const clean = num.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (clean.startsWith('5')) return 'Mastercard';
    if (clean.startsWith('6')) return 'RuPay';
    return 'Card';
  };

  // Validate and Initiate Payment
  const handleInitiatePayment = (simulationType = 'normal') => {
    // Basic validation
    if (selectedMethod === 'upi' && !upiId.trim() && !upiApp) {
      setUpiError('Please select a UPI app or enter a valid UPI ID');
      return;
    }
    if (selectedMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 15) {
        setCardError('Please enter a valid 16-digit card number');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setCardError('Please enter card expiry (MM/YY)');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setCardError('Please enter a 3-digit CVV');
        return;
      }
    }

    setIsProcessing(true);
    setProcessingStage('initiating');

    // Stage 1: Connecting to Gateway
    setTimeout(() => {
      setProcessingStage('authorizing');
    }, 600);

    // Stage 2: Authorizing with Bank
    setTimeout(() => {
      setProcessingStage('confirming');
    }, 1200);

    // Stage 3: Outcome Execution
    setTimeout(() => {
      setIsProcessing(false);
      if (simulationType === 'failure') {
        if (onPaymentFailure) onPaymentFailure();
      } else if (simulationType === 'conflict') {
        if (onPaymentConflict) onPaymentConflict();
      } else {
        // Success
        const generatedBookingId = `#ARN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const paymentPayload = {
          ...bookingData,
          bookingId: generatedBookingId,
          finalPayable: totalAmount,
          paymentMethod: selectedMethod,
          paidAt: new Date().toLocaleTimeString(),
        };
        if (onPaymentSuccess) onPaymentSuccess(paymentPayload);
      }
    }, 1800);
  };

  return (
    <div className="screen-body fade-in payment-processing-body">
      {/* PROCESSING GATEWAY MODAL OVERLAY */}
      {isProcessing && (
        <div className="payment-gateway-overlay fade-in">
          <div className="gateway-modal-card">
            <div className="gateway-header-strip">
              <div className="gateway-lock-icon">
                <Lock size={16} color="#2563EB" />
              </div>
              <span className="gateway-name">Arena Secure Payment Gateway</span>
            </div>

            <div className="gateway-spinner-wrap">
              <div className="gateway-animated-spinner" />
            </div>

            <h3 className="gateway-stage-title">
              {processingStage === 'initiating' && 'Connecting to Bank Gateway...'}
              {processingStage === 'authorizing' && `Authorizing ₹${totalAmount}...`}
              {processingStage === 'confirming' && 'Securing Court Reservation...'}
            </h3>

            <p className="gateway-stage-sub">
              {processingStage === 'initiating' && 'Establishing 256-bit encrypted SSL handshake'}
              {processingStage === 'authorizing' && 'Please do not press back or refresh this page'}
              {processingStage === 'confirming' && 'Generating instant digital booking pass'}
            </p>

            <div className="gateway-security-badge">
              <ShieldCheck size={14} color="#059669" />
              <span>PCI-DSS Level 1 Certified • 100% Encrypted</span>
            </div>

            <button
              type="button"
              className="gateway-cancel-btn"
              onClick={() => {
                setIsProcessing(false);
                if (onCancelPayment) onCancelPayment();
              }}
            >
              Cancel Transaction
            </button>
          </div>
        </div>
      )}

      {/* SCREEN HEADER */}
      <div style={{ marginBottom: '0.85rem' }}>
        <h1 className="screen-title" style={{ marginBottom: '0.2rem' }}>
          Payment & Checkout
        </h1>
        <p className="screen-subtitle" style={{ marginBottom: '0.65rem' }}>
          Choose your payment method to confirm reservation
        </p>
      </div>

      {/* GROUP BOOKING SPLIT BANNER */}
      {bookingData?.isGroupBooking && (
        <div className="group-split-pay-banner fade-in" style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          border: '1px solid #93C5FD',
          borderRadius: '12px',
          padding: '0.65rem 0.85rem',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
        }}>
          <div style={{ background: '#2563EB', borderRadius: '50%', padding: '0.35rem', color: '#fff', display: 'flex', flexShrink: 0 }}>
            <Sparkles size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#1E3A8A' }}>
              Group Split • Organizer Share (1 of {bookingData.groupParticipantsCount} Players)
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#1E40AF', marginTop: '0.15rem', lineHeight: 1.4 }}>
              Paying ₹{totalAmount} locks this court slot immediately. Teammates will receive an invite to pay their share of ₹{bookingData.splitInfo?.participantShare || totalAmount}.
            </div>
          </div>
        </div>
      )}

      {/* QUICK ORDER SUMMARY CARD */}
      <div className="payment-amount-tile">
        <div className="amount-info">
          <span className="amount-label">{bookingData?.isGroupBooking ? 'Your Share to Pay' : 'Total Payable'}</span>
          <span className="amount-val">₹{totalAmount}</span>
          {bookingData?.isGroupBooking && bookingData.originalTotalAmount && (
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.15rem' }}>
              Court Total: ₹{bookingData.originalTotalAmount}
            </span>
          )}
        </div>
        <div className="amount-venue-tag">
          <span className="venue-tag-text">{venue?.name || 'Arena Sports Club'}</span>
          <span className="court-tag-text">
            {slot?.time || '7:00 PM – 8:00 PM'} • {court?.name ? court.name.split(' ')[0] : 'Court 1'}
            {addOnsCount > 0 ? ` • +${addOnsCount} gear` : ''}
          </span>
        </div>
      </div>

      {/* PAYMENT METHODS CONTAINER */}
      <div className="payment-methods-container">
        {/* OPTION 1: SAVED PAYMENT METHODS */}
        <div className={`payment-method-card ${selectedMethod === 'saved' ? 'selected' : ''}`}>
          <div
            className="method-card-header"
            onClick={() => setSelectedMethod('saved')}
            role="button"
            tabIndex={0}
          >
            <div className="method-header-left">
              <div className="method-icon-circle" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <Sparkles size={18} />
              </div>
              <div>
                <span className="method-title">Saved Cards & Fast UPI</span>
                <span className="method-subtitle">Quick 1-tap checkout</span>
              </div>
            </div>
            <div className="radio-checkmark">
              {selectedMethod === 'saved' && <div className="radio-dot" />}
            </div>
          </div>

          {selectedMethod === 'saved' && (
            <div className="method-expanded-content fade-in">
              <span className="section-mini-heading">Saved Cards</span>
              <div className="saved-cards-list">
                {savedCards.length > 0 ? (
                  savedCards.map((card) => {
                    const isCardSelected = selectedSavedCard === card.id;
                    const brand = (card.cardBrand || card.brand || 'Card').toUpperCase();
                    const bank = card.bankName || card.bank || 'Bank';
                    return (
                      <div
                        key={card.id}
                        className={`saved-card-item ${isCardSelected ? 'active' : ''}`}
                        onClick={() => setSelectedSavedCard(card.id)}
                      >
                        <div className="saved-card-left">
                          <div className="card-brand-badge">{brand}</div>
                          <div className="saved-card-info">
                            <span className="saved-card-title">
                              {bank} {card.type || 'Card'}
                            </span>
                            <span className="saved-card-num">•••• •••• •••• {card.last4} (Exp {card.expiry})</span>
                          </div>
                        </div>

                        {isCardSelected && (
                          <div className="saved-card-cvv-box" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="password"
                              placeholder="CVV"
                              maxLength={4}
                              className="mini-cvv-input"
                              value={savedCardCvv}
                              onChange={(e) => setSavedCardCvv(e.target.value.replace(/\D/g, ''))}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '0.5rem 0', fontSize: '0.78125rem', color: '#64748B' }}>
                    No saved cards on this profile.
                  </div>
                )}
              </div>

              <span className="section-mini-heading" style={{ marginTop: '0.75rem' }}>
                Saved UPI VPAs
              </span>
              <div className="saved-upi-list">
                {savedUpiIds.length > 0 ? (
                  savedUpiIds.map((item) => (
                    <div
                      key={item.id}
                      className={`saved-upi-item ${selectedSavedUpi === item.id ? 'active' : ''}`}
                      onClick={() => setSelectedSavedUpi(item.id)}
                    >
                      <div className="upi-dot" style={{ background: item.color || '#2563EB' }} />
                      <span className="saved-vpa-text">{item.vpa}</span>
                      <span className="saved-vpa-app">{item.app || 'UPI App'}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '0.5rem 0', fontSize: '0.78125rem', color: '#64748B' }}>
                    No saved UPI VPAs on this profile.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* OPTION 2: UPI INSTANT PAY */}
        <div className={`payment-method-card ${selectedMethod === 'upi' ? 'selected' : ''}`}>
          <div
            className="method-card-header"
            onClick={() => setSelectedMethod('upi')}
            role="button"
            tabIndex={0}
          >
            <div className="method-header-left">
              <div className="method-icon-circle">
                <Smartphone size={18} color="#2563EB" />
              </div>
              <div>
                <span className="method-title">UPI Instant Pay</span>
                <span className="method-subtitle">Google Pay, PhonePe, Paytm, BHIM, Cred</span>
              </div>
            </div>
            <div className="radio-checkmark">
              {selectedMethod === 'upi' && <div className="radio-dot" />}
            </div>
          </div>

          {selectedMethod === 'upi' && (
            <div className="method-expanded-content fade-in">
              <span className="section-mini-heading">Pay via App</span>
              <div className="upi-apps-row">
                {[
                  { id: 'gpay', name: 'GPay', color: '#4285F4' },
                  { id: 'phonepe', name: 'PhonePe', color: '#5F259F' },
                  { id: 'paytm', name: 'Paytm', color: '#00B9F1' },
                  { id: 'cred', name: 'CRED', color: '#111827' },
                ].map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    className={`upi-app-btn ${upiApp === app.id ? 'active' : ''}`}
                    onClick={() => {
                      setUpiApp(app.id);
                      setUpiError('');
                    }}
                  >
                    <span className="app-dot" style={{ background: app.color }} />
                    <span className="app-name">{app.name}</span>
                  </button>
                ))}
              </div>

              <div className="upi-id-input-wrap">
                <span className="input-hint">Or Enter UPI ID / VPA</span>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. mobile@upi or username@okhdfcbank"
                    value={upiId}
                    onChange={(e) => {
                      setUpiId(e.target.value.toLowerCase());
                      setUpiError('');
                    }}
                  />
                </div>
                {upiError && (
                  <span className="error-text" style={{ display: 'block', marginTop: '0.25rem' }}>
                    {upiError}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* OPTION 3: CREDIT / DEBIT CARDS */}
        <div className={`payment-method-card ${selectedMethod === 'card' ? 'selected' : ''}`}>
          <div
            className="method-card-header"
            onClick={() => setSelectedMethod('card')}
            role="button"
            tabIndex={0}
          >
            <div className="method-header-left">
              <div className="method-icon-circle">
                <CreditCard size={18} color="#2563EB" />
              </div>
              <div>
                <span className="method-title">Credit / Debit Card</span>
                <span className="method-subtitle">Visa, MasterCard, RuPay, Maestro</span>
              </div>
            </div>
            <div className="radio-checkmark">
              {selectedMethod === 'card' && <div className="radio-dot" />}
            </div>
          </div>

          {selectedMethod === 'card' && (
            <div className="method-expanded-content fade-in">
              <div className="form-group" style={{ marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Card Number</label>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#2563EB' }}>
                    {getCardBrand(cardNumber)}
                  </span>
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="4111 2222 3333 4444"
                  maxLength={19}
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.65rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Valid Thru</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">CVV</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="•••"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '0.65rem' }}>
                <label className="form-label">Cardholder Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Name on card"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </div>

              <label className="save-card-checkbox-label">
                <input
                  type="checkbox"
                  checked={saveCardForFuture}
                  onChange={(e) => setSaveCardForFuture(e.target.checked)}
                />
                <span>Save card securely according to RBI guidelines</span>
              </label>

              {cardError && (
                <span className="error-text" style={{ display: 'block', marginTop: '0.35rem' }}>
                  {cardError}
                </span>
              )}
            </div>
          )}
        </div>

        {/* OPTION 4: NET BANKING */}
        <div className={`payment-method-card ${selectedMethod === 'netbanking' ? 'selected' : ''}`}>
          <div
            className="method-card-header"
            onClick={() => setSelectedMethod('netbanking')}
            role="button"
            tabIndex={0}
          >
            <div className="method-header-left">
              <div className="method-icon-circle">
                <Building2 size={18} color="#2563EB" />
              </div>
              <div>
                <span className="method-title">Net Banking</span>
                <span className="method-subtitle">HDFC, ICICI, SBI, Axis, Kotak & 30+ banks</span>
              </div>
            </div>
            <div className="radio-checkmark">
              {selectedMethod === 'netbanking' && <div className="radio-dot" />}
            </div>
          </div>

          {selectedMethod === 'netbanking' && (
            <div className="method-expanded-content fade-in">
              <span className="section-mini-heading">Popular Banks</span>
              <div className="bank-chips-grid">
                {['HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak', 'PNB'].map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    className={`bank-chip ${selectedBank === bank ? 'active' : ''}`}
                    onClick={() => setSelectedBank(bank)}
                  >
                    <span>{bank}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* OPTION 5: WALLETS & PAY AT TURF */}
        <div className={`payment-method-card ${selectedMethod === 'venue' ? 'selected' : ''}`}>
          <div
            className="method-card-header"
            onClick={() => setSelectedMethod('venue')}
            role="button"
            tabIndex={0}
          >
            <div className="method-header-left">
              <div className="method-icon-circle">
                <Wallet size={18} color="#2563EB" />
              </div>
              <div>
                <span className="method-title">Pay at Turf / Cash</span>
                <span className="method-subtitle">Pay directly to venue manager on arrival</span>
              </div>
            </div>
            <div className="radio-checkmark">
              {selectedMethod === 'venue' && <div className="radio-dot" />}
            </div>
          </div>
        </div>
      </div>

      {/* SIMULATOR TEST BAR TOGGLE */}
      <div style={{ marginTop: '0.85rem', textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => setShowSimControls(!showSimControls)}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748B',
            fontSize: '0.71875rem',
            fontWeight: 700,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {showSimControls ? 'Hide Gateway Testing Tools ▲' : '⚡ Payment Gateway & Failure Simulator ▼'}
        </button>
      </div>

      {/* GATEWAY FAILURE & CONFLICT SIMULATOR */}
      {showSimControls && (
        <div className="hackathon-demo-card fade-in" style={{ marginTop: '0.5rem' }}>
          <div className="demo-card-header">
            <ShieldCheck size={14} color="#2563EB" />
            <span>Simulate Gateway Responses</span>
          </div>
          <div className="demo-actions-grid" style={{ marginTop: '0.45rem' }}>
            <button
              type="button"
              className="demo-action-btn failure-btn"
              disabled={isProcessing}
              onClick={() => handleInitiatePayment('failure')}
            >
              <XCircle size={15} color="#DC2626" />
              <div className="btn-text-block">
                <span className="btn-main-title">Simulate Payment Failure / Bank Decline</span>
                <span className="btn-sub-note">Tests slot release on transaction failure</span>
              </div>
            </button>
            <button
              type="button"
              className="demo-action-btn conflict-btn"
              disabled={isProcessing}
              onClick={() => handleInitiatePayment('conflict')}
            >
              <AlertTriangle size={15} color="#D97706" />
              <div className="btn-text-block">
                <span className="btn-main-title">Simulate Concurrent Double-Booking Conflict</span>
                <span className="btn-sub-note">Tests real-time locking conflict resolution</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* PRIMARY PAY BUTTON */}
      <div className="bottom-action-container" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
        <button
          type="button"
          className="btn-primary"
          disabled={isProcessing}
          onClick={() => handleInitiatePayment('normal')}
        >
          <span>Pay ₹{totalAmount} & Confirm Booking</span>
          <ArrowRight size={18} />
        </button>

        <div className="payment-security-footer" style={{ marginTop: '0.65rem' }}>
          <Lock size={12} color="#64748B" />
          <span>256-bit SSL encrypted • Instant SMS & Email Pass</span>
        </div>
      </div>
    </div>
  );
}
