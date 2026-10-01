import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag, PlusCircle, Pause, Play, CheckCircle2, AlertCircle,
  ArrowLeft, RefreshCw, X, Calendar, Percent, DollarSign,
  ShieldCheck, Calculator, Clock, HelpCircle
} from 'lucide-react';
import {
  fetchOwnerCoupons,
  createCoupon,
  updateCouponStatus,
  validateAndApplyCouponServer,
  computeCouponStatus,
} from '../services/ownerCouponsService';
import OwnerBottomNav from './OwnerBottomNav';

export default function OwnerCouponsScreen({
  venue = { id: 'v-owner-demo', name: 'Deccan Sports Arena' },
  onBack = () => {},
  onNavigateTab = () => {},
}) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State for "Create Coupon Card"
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' | 'fixed'
  const [discountValue, setDiscountValue] = useState('');
  const [validTill, setValidTill] = useState('');
  const [usageLimit, setUsageLimit] = useState('100');

  // Form Validation Errors
  const [codeError, setCodeError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interactive Live Anti-Abuse Test Sandbox
  const [testCode, setTestCode] = useState('');
  const [testAmount, setTestAmount] = useState('1000');
  const [testResult, setTestResult] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // ── Load Coupons ─────────────────────────────────────────────
  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchOwnerCoupons(venue.id);
      if (res.success) {
        setCoupons(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [venue.id]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  // ── Code Input Formatting (Uppercase, Alphanumeric, No spaces) ──
  const handleCodeChange = (e) => {
    const raw = e.target.value;
    // Strip spaces and special symbols, convert to uppercase
    const sanitized = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(sanitized);
    setCodeError('');
    setFormError('');
  };

  // ── Create Coupon Handler ────────────────────────────────────
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCodeError('');
    setFormError('');

    if (!code) {
      setCodeError('Coupon code is required.');
      return;
    }

    if (!discountValue || Number(discountValue) <= 0) {
      setFormError('Discount must be a positive number greater than 0.');
      return;
    }

    if (discountType === 'percentage' && Number(discountValue) > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }

    if (!validTill) {
      setFormError('Expiration date & time is required.');
      return;
    }

    const futureDate = new Date(validTill);
    if (futureDate <= new Date()) {
      setFormError('Valid till must be a future date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createCoupon({
        code,
        type: discountType,
        value: Number(discountValue),
        validTill,
        venueId: venue.id,
        usageLimit: Number(usageLimit) || 100,
      });

      if (res.success) {
        setCoupons((prev) => [res.data, ...prev]);
        showToast(`✓ Coupon ${res.data.code} created successfully!`);
        // Reset form
        setCode('');
        setDiscountValue('');
        setValidTill('');
        setUsageLimit('100');
      } else {
        if (res.field === 'code' || res.error === 'This code already exists') {
          setCodeError('This code already exists');
        } else {
          setFormError(res.error || 'Failed to create coupon.');
        }
      }
    } catch (err) {
      setFormError(err.message || 'Error creating coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Toggle Pause / Resume Status ─────────────────────────────
  const handleToggleStatus = async (coupon) => {
    const computed = computeCouponStatus(coupon);
    if (computed === 'expired') {
      showToast('Cannot pause or resume an expired coupon.');
      return;
    }

    const nextStatus = coupon.status === 'active' ? 'paused' : 'active';
    try {
      const res = await updateCouponStatus(coupon.id, nextStatus);
      if (res.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? res.data : c))
        );
        showToast(`Coupon ${coupon.code} is now ${nextStatus}.`);
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  // ── Anti-Abuse Test Calculation (Server Simulation) ──────────
  const handleTestCalculation = () => {
    if (!testCode) {
      setTestResult({ valid: false, error: 'Please enter a coupon code.' });
      return;
    }
    const res = validateAndApplyCouponServer({
      code: testCode,
      bookingAmount: Number(testAmount) || 0,
      venueId: venue.id,
    });
    setTestResult(res);
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

      {/* Screen Header */}
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
              Promotions &amp; Coupons
            </h1>
          </div>
          <span style={{ fontSize: '0.6875rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '0.2rem 0.5rem', borderRadius: 9999, fontWeight: 700 }}>
            Anti-Abuse Protected
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>
          Create court discounts, manage campaigns, and prevent negative booking abuse.
        </p>
      </div>

      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        {/* ── 1. CREATE COUPON CARD ── */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.1rem', border: '1px solid #E2E8F0', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
            <Tag size={17} color="#2563EB" />
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Create New Promotion Coupon
            </h2>
          </div>

          <form onSubmit={handleCreateCoupon}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Field 1: Coupon Code */}
              <div>
                <label style={{ display: 'block', fontSize: '0.71875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Coupon Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="e.g. MONSOON25"
                  maxLength={16}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 8,
                    border: codeError ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    boxSizing: 'border-box',
                    background: '#FFFFFF',
                  }}
                />
                {/* Inline Danger Text for duplicate code rule */}
                {codeError && (
                  <div style={{ fontSize: '0.71875rem', color: '#DC2626', fontWeight: 700, marginTop: '0.25rem' }}>
                    {codeError}
                  </div>
                )}
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                  Uppercase alphanumeric only, no spaces. Must be unique for this venue.
                </div>
              </div>

              {/* Field 2: Discount (Configurable: % or ₹) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <label style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Discount Value
                  </label>
                  {/* Type switcher */}
                  <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 6, padding: '0.15rem' }}>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percentage')}
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: 4,
                        border: 'none',
                        background: discountType === 'percentage' ? '#2563EB' : 'transparent',
                        color: discountType === 'percentage' ? '#FFF' : '#64748B',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      % Percentage
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: 4,
                        border: 'none',
                        background: discountType === 'fixed' ? '#2563EB' : 'transparent',
                        color: discountType === 'fixed' ? '#FFF' : '#64748B',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ₹ Fixed Amount
                    </button>
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="1"
                    max={discountType === 'percentage' ? '100' : '5000'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'e.g. 20 (for 20% off)' : 'e.g. 150 (for ₹150 off)'}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.8125rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Field 3: Valid Till */}
              <div>
                <label style={{ display: 'block', fontSize: '0.71875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Valid Till (Future Expiration Date &amp; Time)
                </label>
                <input
                  type="datetime-local"
                  value={validTill}
                  onChange={(e) => setValidTill(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8125rem',
                    boxSizing: 'border-box',
                    background: '#FFFFFF',
                  }}
                />
              </div>

              {/* Form Error */}
              {formError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '0.6rem', fontSize: '0.75rem', color: '#991B1B' }}>
                  {formError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{ marginTop: '0.25rem' }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="spinning" />
                    <span>Creating Coupon...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} />
                    <span>Create &amp; Publish Coupon</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── 2. COUPON TABLE CARD ── */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>
              Active &amp; Past Promotions
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
              {coupons.length} total codes
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.75rem' }}>
              <RefreshCw size={20} className="spinning" style={{ marginBottom: '0.5rem' }} />
              <div>Loading coupon directory...</div>
            </div>
          ) : coupons.length === 0 ? (
            /* ── EMPTY STATE ── */
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
              <Tag size={32} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.35rem' }}>
                No coupons created yet.
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                Use the card above to create your first promotion code for players.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="owner-schedule-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Times Used</th>
                    <th>Valid Till</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((cpn) => {
                    const computedStatus = computeCouponStatus(cpn);
                    const isExpired = computedStatus === 'expired';
                    const isPaused = computedStatus === 'paused';
                    const isActive = computedStatus === 'active';

                    const formattedDate = new Date(cpn.validTill).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <tr key={cpn.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 800, color: '#0F172A', background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: 4, letterSpacing: '0.04em' }}>
                            {cpn.code}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 700, color: '#1E293B' }}>
                          {cpn.type === 'percentage' ? `${cpn.value}% OFF` : `₹${cpn.value} OFF`}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#475569' }}>
                          {cpn.timesUsed} / {cpn.usageLimit}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#475569' }}>
                          {formattedDate}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {isExpired ? (
                            /* Expired Rule: neutral-grey "Expired" */
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: '#F1F5F9', color: '#64748B', padding: '0.2rem 0.5rem', borderRadius: 9999 }}>
                              Expired
                            </span>
                          ) : isPaused ? (
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: '#FEF3C7', color: '#B45309', padding: '0.2rem 0.5rem', borderRadius: 9999 }}>
                              Paused
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: '#ECFDF5', color: '#065F46', padding: '0.2rem 0.5rem', borderRadius: 9999 }}>
                              Active
                            </span>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {/* Expired Rule: Do not show pause/resume for expired coupons */}
                          {isExpired ? (
                            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>—</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(cpn)}
                              style={{
                                padding: '0.3rem 0.65rem',
                                borderRadius: 6,
                                background: '#FFF',
                                border: '1px solid #CBD5E1',
                                color: isPaused ? '#059669' : '#DC2626',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              {isPaused ? <Play size={11} /> : <Pause size={11} />}
                              <span>{isPaused ? 'Resume' : 'Pause'}</span>
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
        </div>

        {/* ── 3. ANTI-ABUSE DISCOUNT ENGINE TESTER ── */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: '1rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Calculator size={16} color="#8B5CF6" />
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Server Anti-Abuse Test Sandbox
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.71875rem', color: '#64748B', marginBottom: '0.75rem' }}>
            Demonstrates server-side discount calculation ensuring totals never go negative or exceed booking cost.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <input
              type="text"
              placeholder="Enter Code (e.g. SMASH100)"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              style={{ flex: 1, padding: '0.45rem 0.65rem', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.75rem' }}
            />
            <input
              type="number"
              placeholder="Amount (₹)"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              style={{ width: 90, padding: '0.45rem 0.65rem', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.75rem' }}
            />
            <button
              type="button"
              onClick={handleTestCalculation}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 6,
                background: '#8B5CF6',
                color: '#FFF',
                border: 'none',
                fontSize: '0.71875rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Verify
            </button>
          </div>

          {testResult && (
            <div style={{ background: testResult.valid ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${testResult.valid ? '#A7F3D0' : '#FECACA'}`, borderRadius: 8, padding: '0.65rem 0.85rem' }}>
              {testResult.valid ? (
                <div style={{ fontSize: '0.75rem', color: '#065F46' }}>
                  <div><strong>Valid Coupon:</strong> {testResult.couponCode} ({testResult.type === 'percentage' ? `${testResult.discountValue}%` : `₹${testResult.discountValue}`})</div>
                  <div>Original: ₹{testResult.originalAmount} • Discount: -₹{testResult.discountAmount}</div>
                  <div style={{ fontWeight: 800, marginTop: '0.2rem', color: '#064E3B' }}>
                    Final Payable Total: ₹{testResult.finalPayable} (Never Negative)
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#991B1B', fontWeight: 700 }}>
                  ✗ {testResult.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Owner Bottom Navigation Bar */}
      <OwnerBottomNav activeTab="promotions" onNavigate={onNavigateTab} />
    </div>
  );
}
