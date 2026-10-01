import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  RefreshCw,
  CheckCircle,
  Clock,
  History,
  AlertCircle,
  Lock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { adminCommissionService } from '../services/adminCommissionService';

export default function AdminCommissionScreen({
  adminSession,
  onBackToDashboard,
}) {
  const [commissionConfig, setCommissionConfig] = useState(null);
  const [commissionHistory, setCommissionHistory] = useState([]);
  const [payoutsList, setPayoutsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // Edit Rate Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [newRateInput, setNewRateInput] = useState(10);
  const [editReason, setEditReason] = useState('');
  const [editError, setEditError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeAdmin = adminSession || {
    adminId: 'ADM-9001',
    name: 'Sarah Connor',
    email: 'admin@arena.com',
    role: 'superadmin',
  };

  const loadData = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [commRes, payoutsRes] = await Promise.all([
        adminCommissionService.getCommission(),
        adminCommissionService.getPayouts(),
      ]);

      if (commRes.success) {
        setCommissionConfig(commRes.config);
        setCommissionHistory(commRes.history);
        setNewRateInput(commRes.config.currentRate);
      }
      if (payoutsRes.success) {
        setPayoutsList(payoutsRes.payouts);
      }
    } catch (err) {
      console.error('Failed to load commission data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateCommission = async () => {
    if (!editReason || editReason.trim().length < 5) {
      setEditError('Please provide a specific business reason (minimum 5 characters).');
      return;
    }

    setIsSubmitting(true);
    setEditError('');

    try {
      const res = await adminCommissionService.updateCommission(
        newRateInput,
        editReason.trim(),
        activeAdmin.adminId,
        activeAdmin.name
      );

      if (res.success) {
        setActionNotice(res.message);
        setTimeout(() => setActionNotice(''), 4000);
        setShowEditModal(false);
        setEditReason('');
        loadData(true);
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update commission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-commission-screen fade-in">
      {actionNotice && (
        <div className="admin-action-toast fade-in">
          <CheckCircle2 size={16} color="#10B981" />
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice('')} className="toast-close-btn">✕</button>
        </div>
      )}

      {/* Header Card */}
      <div className="admin-content-card">
        <div className="card-header-row">
          <div className="card-header-title-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="admin-title-icon-box" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <DollarSign size={20} />
              </div>
              <div>
                <h2 className="admin-section-heading" style={{ margin: 0 }}>Payment & Commission Governance</h2>
                <p className="admin-subtext" style={{ margin: 0 }}>
                  Standard platform take rates, weekly settlement payouts & Razorpay reconciliation
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="admin-refresh-btn"
            onClick={() => loadData(true)}
            title="Refresh Data"
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
          </button>
        </div>

        {/* Current Commission Hero Banner */}
        {commissionConfig && (
          <div className="user-kpi-summary-strip" style={{ marginTop: '1rem' }}>
            <div className="user-kpi-pill active-pill" style={{ padding: '0.85rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="pill-lbl">Current Platform Commission</span>
                  <span className="pill-val" style={{ fontSize: '1.6rem', color: '#059669' }}>
                    {commissionConfig.currentRate}%
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#059669', display: 'block', marginTop: '0.2rem' }}>
                    + 18% GST on platform service fee
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowEditModal(true)}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                >
                  Edit Commission %
                </button>
              </div>
            </div>

            <div className="user-kpi-pill">
              <span className="pill-lbl">Settlement Schedule</span>
              <span className="pill-val" style={{ fontSize: '1.1rem' }}>Weekly (Mondays)</span>
              <span style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.2rem' }}>Automatic NEFT batch release</span>
            </div>

            <div className="user-kpi-pill">
              <span className="pill-lbl">Gateway Integration</span>
              <span className="pill-val" style={{ fontSize: '1.1rem', color: '#2563EB' }}>Razorpay v2</span>
              <span style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '0.2rem' }}>✓ Webhooks Active (0 lost)</span>
            </div>
          </div>
        )}

        {/* Commission Change History */}
        <div className="user-info-section-group" style={{ marginTop: '1.25rem' }}>
          <h4 className="info-group-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <History size={16} color="#64748B" /> Commission Revision History (Audit Trail)
          </h4>
          <div className="user-complaints-list" style={{ marginTop: '0.5rem' }}>
            {commissionHistory.map((h) => (
              <div key={h.id} className="user-complaint-card">
                <div className="complaint-card-header">
                  <span className="complaint-id-tag">
                    Rate Shift: <strong>{h.previousRate}% → {h.newRate}%</strong>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{h.effectiveDate}</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#334155', margin: '0.25rem 0' }}>"{h.reason}"</p>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Enforced by: {h.changedBy}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payout Logs Table */}
        <div className="user-info-section-group" style={{ marginTop: '1.5rem' }}>
          <h4 className="info-group-title">Weekly Owner Payout Settlement Logs</h4>
          <div className="admin-table-responsive" style={{ marginTop: '0.5rem' }}>
            <table className="admin-user-table">
              <thead>
                <tr>
                  <th>Payout ID</th>
                  <th>Partner Entity</th>
                  <th>Period</th>
                  <th>Gross Volume</th>
                  <th>Arena Cut (10%)</th>
                  <th>Net Disbursed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payoutsList.map((p) => (
                  <tr key={p.payoutId} className="user-table-row">
                    <td><span className="ledger-id-tag">{p.payoutId}</span></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '0.82rem', color: '#0F172A' }}>{p.businessName}</strong>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{p.bankAccount}</span>
                      </div>
                    </td>
                    <td><span style={{ fontSize: '0.75rem', color: '#475569' }}>{p.period}</span></td>
                    <td><strong style={{ fontSize: '0.8rem', color: '#0F172A' }}>{p.grossBookingsAmount}</strong></td>
                    <td><span style={{ fontSize: '0.75rem', color: '#2563EB' }}>{p.platformCommission}</span></td>
                    <td><strong style={{ fontSize: '0.82rem', color: '#059669' }}>{p.netPayoutAmount}</strong></td>
                    <td>
                      <span className={`status-badge-sm ${p.status === 'Processed' ? 'active' : p.status === 'On Hold' ? 'blocked' : 'pending'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT COMMISSION MODAL */}
      {showEditModal && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 130 }}>
          <div className="modal-container" style={{ maxWidth: '400px' }}>
            <div className="modal-icon-header" style={{ background: '#ECFDF5', color: '#10B981' }}>
              <DollarSign size={26} />
            </div>
            <h3 className="modal-title">Update Standard Commission</h3>
            <p className="modal-description">
              New rate applies exclusively to <strong>future new bookings</strong>. Existing confirmed reservations maintain their original commission rate.
            </p>

            <div style={{ marginTop: '1rem' }}>
              <label className="input-label">Commission Percentage (0% – 100%) *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input-field"
                  value={newRateInput}
                  onChange={(e) => setNewRateInput(e.target.value)}
                  style={{ width: '100px', fontSize: '1.1rem', fontWeight: 700 }}
                />
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#64748B' }}>%</span>
              </div>

              <label className="input-label" style={{ marginTop: '0.75rem' }}>
                Reason for Revision * (Mandatory & Audited)
              </label>
              <textarea
                className="reason-textarea"
                rows={3}
                placeholder="Explain the business rationale for rate adjustment..."
                value={editReason}
                onChange={(e) => { setEditReason(e.target.value); setEditError(''); }}
                style={{ width: '100%', marginTop: '0.3rem' }}
              />
              {editError && <span className="input-error-msg" style={{ display: 'block' }}>{editError}</span>}
            </div>

            <div className="modal-actions-row" style={{ marginTop: '1.25rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleUpdateCommission}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Confirm Rate Revision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
