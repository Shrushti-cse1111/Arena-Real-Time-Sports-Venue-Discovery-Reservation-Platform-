import React, { useState, useEffect } from 'react';
import {
  Settings,
  DollarSign,
  Clock,
  Shield,
  Save,
  CheckCircle2,
  RefreshCw,
  Sliders,
  History
} from 'lucide-react';
import { adminSettingsService } from '../services/adminSettingsService';

export default function AdminSettingsScreen({
  adminSession,
  onBackToDashboard,
}) {
  const [settings, setSettings] = useState(null);
  const [commissionRate, setCommissionRate] = useState(10);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [payoutCycle, setPayoutCycle] = useState(7);
  const [cancellationTiers, setCancellationTiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const activeAdmin = adminSession || {
    adminId: 'ADM-9001',
    name: 'Sarah Connor',
    email: 'admin@arena.com',
    role: 'superadmin',
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await adminSettingsService.getSettings();
      if (res.success) {
        setSettings(res.settings);
        setCommissionRate(res.settings.commission.defaultCommissionRate);
        setGstPercentage(res.settings.commission.gstPercentage);
        setPayoutCycle(res.settings.commission.payoutCycleDays);
        setCancellationTiers(res.settings.cancellationTiers);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveCommission = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await adminSettingsService.updateCommissionSettings(
        { rate: commissionRate, gst: gstPercentage, payoutCycle, minThreshold: 1000 },
        activeAdmin.adminId,
        activeAdmin.name
      );
      if (res.success) {
        setActionNotice('Commission & settlement rules updated.');
        setTimeout(() => setActionNotice(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCancellationTiers = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await adminSettingsService.updateCancellationTiers(cancellationTiers, activeAdmin.adminId, activeAdmin.name);
      if (res.success) {
        setActionNotice('Cancellation refund policy tiers updated.');
        setTimeout(() => setActionNotice(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Failed to save cancellation policy.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTierChange = (index, field, value) => {
    const updated = [...cancellationTiers];
    updated[index][field] = Number(value);
    if (field === 'refundPercentage') {
      updated[index]['cancellationFee'] = Math.max(0, 100 - Number(value));
    }
    setCancellationTiers(updated);
  };

  return (
    <div className="admin-settings-screen fade-in">
      {actionNotice && (
        <div className="admin-action-toast fade-in">
          <CheckCircle2 size={16} color="#10B981" />
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice('')} className="toast-close-btn">✕</button>
        </div>
      )}

      <div className="admin-content-card">
        <div className="card-header-row">
          <div className="card-header-title-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="admin-title-icon-box" style={{ background: '#F1F5F9', color: '#334155' }}>
                <Settings size={20} />
              </div>
              <div>
                <h2 className="admin-section-heading" style={{ margin: 0 }}>Platform Configuration & Policies</h2>
                <p className="admin-subtext" style={{ margin: 0 }}>
                  Manage global commission %, cancellation refund tiers & hold duration timers
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: Commission Rules */}
        <form onSubmit={handleSaveCommission} className="user-info-section-group" style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 className="info-group-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <DollarSign size={16} color="#059669" /> 1. Standard Commission & Financial Rules
            </h4>
            <button type="submit" className="btn-primary" disabled={isSaving} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
              <Save size={13} /> Save Commission Rules
            </button>
          </div>

          <div className="info-two-col-grid" style={{ marginTop: '0.65rem' }}>
            <div>
              <label className="input-label">Default Platform Take Rate (0–100%) *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input-field"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  style={{ width: '90px' }}
                />
                <span style={{ fontWeight: 700, color: '#64748B' }}>%</span>
              </div>
            </div>

            <div>
              <label className="input-label">GST on Commission (%)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                <input
                  type="number"
                  className="input-field"
                  value={gstPercentage}
                  onChange={(e) => setGstPercentage(e.target.value)}
                  style={{ width: '90px' }}
                />
                <span style={{ fontWeight: 700, color: '#64748B' }}>%</span>
              </div>
            </div>
          </div>
        </form>

        {/* SECTION 2: Cancellation Policy */}
        <form onSubmit={handleSaveCancellationTiers} className="user-info-section-group" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 className="info-group-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="#2563EB" /> 2. Cancellation & Refund Policy Tiers
            </h4>
            <button type="submit" className="btn-primary" disabled={isSaving} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
              <Save size={13} /> Save Refund Tiers
            </button>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.35rem 0 0.75rem' }}>
            Rules govern automatic wallet refund computation when players cancel reservations.
          </p>

          <div className="user-complaints-list">
            {cancellationTiers.map((tier, idx) => (
              <div key={tier.id} className="user-complaint-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#0F172A' }}>{tier.label}</strong>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Window: {tier.minHoursBefore}+ hours before start</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>Refund:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="input-field"
                      value={tier.refundPercentage}
                      onChange={(e) => handleTierChange(idx, 'refundPercentage', e.target.value)}
                      style={{ width: '65px', height: '30px', fontSize: '0.8rem', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>%</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700 }}>Fee:</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#DC2626' }}>{tier.cancellationFee}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </form>

        {/* SECTION 3: Platform Rules */}
        <div className="user-info-section-group" style={{ marginTop: '1.5rem' }}>
          <h4 className="info-group-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={16} color="#7C3AED" /> 3. Platform Guardrails & Automated Timers
          </h4>
          <div className="security-status-grid" style={{ marginTop: '0.5rem' }}>
            <div className="sec-check-item">
              <CheckCircle2 size={16} color="#10B981" />
              <span>Real-time Slot Hold Lock duration: <strong>10 minutes (600s)</strong> with auto-release</span>
            </div>
            <div className="sec-check-item">
              <CheckCircle2 size={16} color="#10B981" />
              <span>Max Advance Booking Horizon: <strong>14 Days</strong> in advance</span>
            </div>
            <div className="sec-check-item">
              <CheckCircle2 size={16} color="#10B981" />
              <span>Mandatory Partner Business KYC approval prior to player listing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
