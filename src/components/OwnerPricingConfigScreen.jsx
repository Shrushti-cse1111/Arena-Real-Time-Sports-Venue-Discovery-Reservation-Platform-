import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Info,
  Building2,
  Save,
} from 'lucide-react';
import { ownerVenueService } from '../services/ownerVenueService';

const DURATION_OPTIONS = [30, 60, 90, 120];

export default function OwnerPricingConfigScreen({
  venue = {},
  onComplete = () => {},
  onBack = () => {},
}) {
  const venueId = venue.id || 'v-owner-demo';
  const venueTitle = venue.name || 'Your Venue';

  // Rules List State
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Rule Form State
  const [newCourt, setNewCourt] = useState('Court 1 (Badminton)');
  const [newDuration, setNewDuration] = useState(60); // 30, 60, 90, 120 mins
  const [newOffPeakRate, setNewOffPeakRate] = useState('400');
  const [newPeakRate, setNewPeakRate] = useState('600');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Editing State
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [editCourt, setEditCourt] = useState('');
  const [editDuration, setEditDuration] = useState(60);
  const [editOffPeakRate, setEditOffPeakRate] = useState('');
  const [editPeakRate, setEditPeakRate] = useState('');
  const [editError, setEditError] = useState('');

  // Fetch Pricing Rules on Load (GET /owner/venues/:venueId/pricing-rules)
  useEffect(() => {
    fetchPricingRules();
  }, [venueId]);

  const fetchPricingRules = async () => {
    setIsLoading(true);
    try {
      const fetched = await ownerVenueService.getPricingRules(venueId);
      setRules(fetched);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add Rule Handler (POST /owner/venues/:venueId/pricing-rules)
  const handleAddRule = async (e) => {
    e.preventDefault();
    setFormError('');

    const parsedOffPeak = Number(newOffPeakRate);
    const parsedPeak = Number(newPeakRate);

    if (!newCourt.trim()) {
      setFormError('Please specify a court or turf name.');
      return;
    }
    if (![30, 60, 90, 120].includes(Number(newDuration))) {
      setFormError('Duration must be 30, 60, 90, or 120 minutes.');
      return;
    }
    if (isNaN(parsedOffPeak) || parsedOffPeak <= 0) {
      setFormError('Off-peak rate must be greater than ₹0.');
      return;
    }
    if (isNaN(parsedPeak) || parsedPeak <= 0) {
      setFormError('Peak rate must be greater than ₹0.');
      return;
    }
    if (parsedPeak <= parsedOffPeak) {
      setFormError('Peak rate must be strictly higher than off-peak rate.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await ownerVenueService.createPricingRule(venueId, {
        court: newCourt.trim(),
        duration: Number(newDuration),
        offPeakRate: parsedOffPeak,
        peakRate: parsedPeak,
      });

      setRules((prev) => [res.rule, ...prev]);

      // Reset form defaults for next entry
      setNewCourt(`Court ${rules.length + 2} (${venue.sports?.[0] || 'Badminton'})`);
      setNewOffPeakRate('450');
      setNewPeakRate('650');
    } catch (err) {
      setFormError(err.message || 'Failed to add pricing rule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start Inline Edit
  const handleStartEdit = (rule) => {
    setEditingRuleId(rule.id);
    setEditCourt(rule.court);
    setEditDuration(rule.duration);
    setEditOffPeakRate(rule.offPeakRate.toString());
    setEditPeakRate(rule.peakRate.toString());
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setEditError('');
  };

  // Save Inline Edit (PUT /owner/pricing-rules/:id)
  const handleSaveEdit = async (ruleId) => {
    setEditError('');

    const parsedOffPeak = Number(editOffPeakRate);
    const parsedPeak = Number(editPeakRate);

    if (!editCourt.trim()) {
      setEditError('Court name is required.');
      return;
    }
    if (isNaN(parsedOffPeak) || parsedOffPeak <= 0) {
      setEditError('Off-peak rate must be > ₹0.');
      return;
    }
    if (isNaN(parsedPeak) || parsedPeak <= 0) {
      setEditError('Peak rate must be > ₹0.');
      return;
    }
    if (parsedPeak <= parsedOffPeak) {
      setEditError('Peak rate must be > off-peak rate.');
      return;
    }

    try {
      const res = await ownerVenueService.updatePricingRule(ruleId, {
        court: editCourt.trim(),
        duration: Number(editDuration),
        offPeakRate: parsedOffPeak,
        peakRate: parsedPeak,
      });

      setRules((prev) => prev.map((r) => (r.id === ruleId ? res.rule : r)));
      setEditingRuleId(null);
    } catch (err) {
      setEditError(err.message || 'Failed to update rule.');
    }
  };

  // Delete Rule (DELETE /owner/pricing-rules/:id)
  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this pricing rule?')) return;
    try {
      await ownerVenueService.deletePricingRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (err) {
      alert(err.message || 'Failed to delete rule.');
    }
  };

  return (
    <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC', minHeight: '100%' }}>
      {/* Top Header */}
      <div style={{ background: '#102A43', color: '#FFFFFF', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', cursor: 'pointer' }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step 2 of 2 • Pricing Setup
            </span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
              Pricing & Slot Configuration
            </h2>
          </div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DollarSign size={20} color="#38BDF8" />
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>

        {/* Venue Context Header */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '0.85rem 1rem', border: '1px solid #E2E8F0', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>Active Venue</span>
            <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>{venueTitle}</div>
          </div>
          <span style={{ fontSize: '0.71875rem', background: '#ECFDF5', color: '#047857', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 9999 }}>
            Currency: INR (₹)
          </span>
        </div>

        {/* Important Pricing Rule Note */}
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12, padding: '0.75rem 0.9rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
          <Info size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.78125rem', color: '#92400E', lineHeight: 1.4 }}>
            <strong>Pricing Protection Policy:</strong> Future generated slots will immediately use updated rates. Existing confirmed player bookings keep their original locked price.
          </div>
        </div>

        {/* SECTION 1: ADD-RULE FORM */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.85rem' }}>
            <Plus size={18} color="#2563EB" />
            <span>Add Slot Pricing Rule</span>
          </div>

          {formError && (
            <div className="auth-danger-banner" style={{ marginBottom: '0.85rem', padding: '0.45rem 0.65rem', fontSize: '0.75rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddRule} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Field 1: Court / Turf Designation */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                Court / Turf Designation *
              </label>
              <input
                type="text"
                className="auth-field-input"
                placeholder="e.g. Court 1, Court 2, Main Turf A"
                value={newCourt}
                onChange={(e) => {
                  setNewCourt(e.target.value);
                  if (formError) setFormError('');
                }}
              />
            </div>

            {/* Field 2: Duration Selector (30, 60, 90, 120 mins) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Slot Duration *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                {DURATION_OPTIONS.map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setNewDuration(dur)}
                    style={{
                      background: newDuration === dur ? '#2563EB' : '#F8FAFC',
                      color: newDuration === dur ? '#FFFFFF' : '#475569',
                      border: `1px solid ${newDuration === dur ? '#2563EB' : '#CBD5E1'}`,
                      borderRadius: 8,
                      padding: '0.45rem 0.25rem',
                      fontSize: '0.78125rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {dur} min
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3 & 4: Rates Grid (Off-peak & Peak Rates in INR) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>
                  Off-peak Rate (₹ INR) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: 10, fontSize: '0.8125rem', color: '#64748B', fontWeight: 700 }}>₹</span>
                  <input
                    type="number"
                    min="1"
                    className="auth-field-input"
                    style={{ paddingLeft: 24 }}
                    placeholder="400"
                    value={newOffPeakRate}
                    onChange={(e) => {
                      setNewOffPeakRate(e.target.value);
                      if (formError) setFormError('');
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>
                  Peak Rate (₹ INR) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: 10, fontSize: '0.8125rem', color: '#64748B', fontWeight: 700 }}>₹</span>
                  <input
                    type="number"
                    min="1"
                    className="auth-field-input"
                    style={{ paddingLeft: 24 }}
                    placeholder="600"
                    value={newPeakRate}
                    onChange={(e) => {
                      setNewPeakRate(e.target.value);
                      if (formError) setFormError('');
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Add Rule Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '0.65rem',
                fontSize: '0.84375rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                marginTop: '0.35rem',
              }}
            >
              <Plus size={16} />
              <span>Add Pricing Rule</span>
            </button>
          </form>
        </div>

        {/* SECTION 2: EXISTING RULES IN SCROLLABLE TABLE */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Existing Pricing Rules ({rules.length})
            </h3>
            <span style={{ fontSize: '0.71875rem', color: '#64748B' }}>
              INR (₹) Standard
            </span>
          </div>

          {editError && (
            <div className="auth-danger-banner" style={{ marginBottom: '0.75rem', padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}>
              <AlertCircle size={14} />
              <span>{editError}</span>
            </div>
          )}

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B', fontSize: '0.8125rem' }}>
              Loading pricing rules from database...
            </div>
          ) : rules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', color: '#64748B', fontSize: '0.8125rem' }}>
              No pricing rules configured yet. Add your first rule above.
            </div>
          ) : (
            /* Scrollable Table Container */
            <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78125rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', color: '#475569', fontWeight: 700, borderBottom: '1px solid #CBD5E1' }}>
                    <th style={{ padding: '0.55rem 0.65rem' }}>Court</th>
                    <th style={{ padding: '0.55rem 0.65rem' }}>Duration</th>
                    <th style={{ padding: '0.55rem 0.65rem' }}>Off-peak</th>
                    <th style={{ padding: '0.55rem 0.65rem' }}>Peak</th>
                    <th style={{ padding: '0.55rem 0.65rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => {
                    const isEditing = editingRuleId === rule.id;

                    if (isEditing) {
                      return (
                        <tr key={rule.id} style={{ background: '#EFF6FF', borderBottom: '1px solid #BFDBFE' }}>
                          <td style={{ padding: '0.4rem 0.5rem' }}>
                            <input
                              type="text"
                              value={editCourt}
                              onChange={(e) => setEditCourt(e.target.value)}
                              style={{ width: '100%', padding: '0.25rem 0.35rem', borderRadius: 4, border: '1px solid #3B82F6', fontSize: '0.75rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.4rem 0.5rem' }}>
                            <select
                              value={editDuration}
                              onChange={(e) => setEditDuration(Number(e.target.value))}
                              style={{ width: '100%', padding: '0.25rem 0.2rem', borderRadius: 4, border: '1px solid #3B82F6', fontSize: '0.75rem' }}
                            >
                              {DURATION_OPTIONS.map((d) => (
                                <option key={d} value={d}>{d} min</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '0.4rem 0.5rem' }}>
                            <input
                              type="number"
                              value={editOffPeakRate}
                              onChange={(e) => setEditOffPeakRate(e.target.value)}
                              style={{ width: 60, padding: '0.25rem 0.35rem', borderRadius: 4, border: '1px solid #3B82F6', fontSize: '0.75rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.4rem 0.5rem' }}>
                            <input
                              type="number"
                              value={editPeakRate}
                              onChange={(e) => setEditPeakRate(e.target.value)}
                              style={{ width: 60, padding: '0.25rem 0.35rem', borderRadius: 4, border: '1px solid #3B82F6', fontSize: '0.75rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                              <button
                                type="button"
                                title="Save Changes"
                                onClick={() => handleSaveEdit(rule.id)}
                                style={{ background: '#059669', color: '#FFF', border: 'none', borderRadius: 4, padding: '0.25rem 0.45rem', fontSize: '0.71875rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                title="Cancel"
                                onClick={handleCancelEdit}
                                style={{ background: '#64748B', color: '#FFF', border: 'none', borderRadius: 4, padding: '0.25rem 0.45rem', fontSize: '0.71875rem', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={rule.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.55rem 0.65rem', fontWeight: 600, color: '#0F172A' }}>
                          {rule.court}
                        </td>
                        <td style={{ padding: '0.55rem 0.65rem', color: '#475569' }}>
                          {rule.duration} mins
                        </td>
                        <td style={{ padding: '0.55rem 0.65rem', color: '#047857', fontWeight: 700 }}>
                          ₹{rule.offPeakRate}
                        </td>
                        <td style={{ padding: '0.55rem 0.65rem', color: '#B45309', fontWeight: 700 }}>
                          ₹{rule.peakRate}
                        </td>
                        <td style={{ padding: '0.55rem 0.65rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(rule)}
                              style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 4, padding: '0.2rem 0.45rem', fontSize: '0.71875rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            >
                              <Edit2 size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRule(rule.id)}
                              style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 4, padding: '0.2rem 0.45rem', fontSize: '0.71875rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FINISH & SAVE BUTTON */}
        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={onComplete}
            className="auth-primary-btn"
            style={{ width: '100%', height: 48, fontSize: '0.9375rem', fontWeight: 700, background: '#059669' }}
          >
            <CheckCircle2 size={20} />
            <span>Complete Setup & Go to Dashboard</span>
          </button>
        </div>

      </div>
    </div>
  );
}
