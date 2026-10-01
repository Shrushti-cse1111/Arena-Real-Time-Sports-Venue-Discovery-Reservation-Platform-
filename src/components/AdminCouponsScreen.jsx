import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  Pause,
  Play,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { adminCouponService } from '../services/adminCouponService';

export default function AdminCouponsScreen({
  adminSession,
  onBackToDashboard,
}) {
  const [couponsList, setCouponsList] = useState([]);
  const [couponCounts, setCouponCounts] = useState({ all: 0, active: 0, paused: 0, expired: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'Percentage',
    discountValue: 20,
    minBookingAmount: 500,
    maxDiscount: 200,
    validFrom: new Date().toISOString().slice(0, 10),
    validTill: '2026-12-31',
    usageLimit: 1000,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeAdmin = adminSession || {
    adminId: 'ADM-9001',
    name: 'Sarah Connor',
    email: 'admin@arena.com',
    role: 'superadmin',
  };

  const loadCoupons = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await adminCouponService.getCoupons({
        search: searchQuery,
        status: statusFilter,
      });

      if (res.success) {
        setCouponsList(res.coupons);
        setCouponCounts(res.counts);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [statusFilter, searchQuery]);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await adminCouponService.createCoupon(formData, activeAdmin.adminId, activeAdmin.name);
      if (res.success) {
        setActionNotice(res.message);
        setTimeout(() => setActionNotice(''), 4000);
        setShowCreateModal(false);
        setFormData({
          code: '',
          description: '',
          discountType: 'Percentage',
          discountValue: 20,
          minBookingAmount: 500,
          maxDiscount: 200,
          validFrom: new Date().toISOString().slice(0, 10),
          validTill: '2026-12-31',
          usageLimit: 1000,
        });
        loadCoupons(true);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (coupon) => {
    const nextStatus = coupon.status === 'active' ? 'paused' : 'active';
    try {
      const res = await adminCouponService.updateCouponStatus(coupon.id, nextStatus, activeAdmin.adminId, activeAdmin.name);
      if (res.success) {
        setActionNotice(res.message);
        setTimeout(() => setActionNotice(''), 4000);
        loadCoupons(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle status.');
    }
  };

  return (
    <div className="admin-coupons-screen fade-in">
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
              <div className="admin-title-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <Tag size={20} />
              </div>
              <div>
                <h2 className="admin-section-heading" style={{ margin: 0 }}>Platform Coupons & Promotions</h2>
                <p className="admin-subtext" style={{ margin: 0 }}>
                  Manage discount codes, campaign eligibility & automated server-side discount evaluation
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem' }}
            >
              <Plus size={15} /> Create Coupon
            </button>
            <button
              type="button"
              className="admin-refresh-btn"
              onClick={() => loadCoupons(true)}
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
            </button>
          </div>
        </div>

        {/* Counts Strip */}
        <div className="user-kpi-summary-strip" style={{ marginTop: '1rem' }}>
          <div className="user-kpi-pill">
            <span className="pill-val">{couponCounts.all}</span>
            <span className="pill-lbl">Total Campaigns</span>
          </div>
          <div className="user-kpi-pill active-pill">
            <span className="pill-val">{couponCounts.active}</span>
            <span className="pill-lbl">Active & Live</span>
          </div>
          <div className="user-kpi-pill" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
            <span className="pill-val" style={{ color: '#D97706' }}>{couponCounts.paused}</span>
            <span className="pill-lbl">Paused</span>
          </div>
          <div className="user-kpi-pill blocked-pill">
            <span className="pill-val">{couponCounts.expired}</span>
            <span className="pill-lbl">Expired</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="user-mgmt-filter-bar" style={{ marginTop: '1rem' }}>
          <div className="input-wrapper user-search-wrapper" style={{ flex: 1 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search coupon code or campaign description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: '38px', fontSize: '0.85rem' }}
            />
            {searchQuery && (
              <button type="button" className="input-icon-right-btn" onClick={() => setSearchQuery('')}>
                <X size={14} color="#94A3B8" />
              </button>
            )}
          </div>

          <div className="user-status-segmented-control">
            {[
              { id: 'all', label: 'All Coupons', count: couponCounts.all },
              { id: 'active', label: 'Active', count: couponCounts.active },
              { id: 'paused', label: 'Paused', count: couponCounts.paused },
              { id: 'expired', label: 'Expired', count: couponCounts.expired },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`segmented-tab-btn ${statusFilter === tab.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="tab-pill-count">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Coupons Table */}
        {isLoading ? (
          <div className="admin-loading-container" style={{ padding: '2.5rem 0', textAlign: 'center' }}>
            <RefreshCw size={24} className="spin-icon" color="#2563EB" />
            <p style={{ marginTop: '0.5rem', color: '#64748B', fontSize: '0.85rem' }}>Loading campaigns...</p>
          </div>
        ) : (
          <div className="admin-table-responsive" style={{ marginTop: '1rem' }}>
            <table className="admin-user-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount Rule</th>
                  <th>Min Order / Max Cap</th>
                  <th>Validity Window</th>
                  <th>Usage (Redeemed / Limit)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {couponsList.map((c) => (
                  <tr key={c.id} className="user-table-row">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="ledger-id-tag" style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '0.82rem', fontWeight: 800 }}>
                          {c.code}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginTop: '0.15rem' }}>
                        {c.description}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.82rem', color: '#0F172A' }}>
                        {c.discountType === 'Percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                      </strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: '#334155' }}>
                        Min: ₹{c.minBookingAmount} • Cap: ₹{c.maxDiscount}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                        {c.validFrom} to {c.validTill}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                          {c.timesUsed} / {c.usageLimit}
                        </span>
                        <div style={{ width: '100px', height: '5px', background: '#E2E8F0', borderRadius: '3px', marginTop: '0.2rem' }}>
                          <div
                            style={{
                              width: `${Math.min(100, Math.round((c.timesUsed / c.usageLimit) * 100))}%`,
                              height: '100%',
                              background: '#2563EB',
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge-sm ${c.status}`}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {c.status !== 'expired' && (
                        <button
                          type="button"
                          className={`btn-action-sm ${c.status === 'active' ? 'btn-block-user' : 'btn-unblock-user'}`}
                          onClick={() => handleToggleStatus(c)}
                          title={c.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
                        >
                          {c.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE COUPON MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 130 }}>
          <div className="modal-container user-details-modal-container" style={{ maxWidth: '480px' }}>
            <div className="user-modal-header">
              <h3 className="modal-title" style={{ margin: 0 }}>Create Platform Promo Coupon</h3>
              <button type="button" className="close-notice-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateCoupon} style={{ marginTop: '1rem' }}>
              <div className="info-two-col-grid">
                <div>
                  <label className="input-label">Coupon Code (Uppercase Alphanumeric) *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. ARENA2026"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label className="input-label">Discount Type *</label>
                  <select
                    className="filter-select"
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    style={{ width: '100%', marginTop: '0.25rem', height: '36px' }}
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="info-two-col-grid" style={{ marginTop: '0.65rem' }}>
                <div>
                  <label className="input-label">Discount Value ({formData.discountType === 'Percentage' ? '%' : '₹'}) *</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    required
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label className="input-label">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div className="info-two-col-grid" style={{ marginTop: '0.65rem' }}>
                <div>
                  <label className="input-label">Min Booking Amount (₹)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.minBookingAmount}
                    onChange={(e) => setFormData({ ...formData, minBookingAmount: e.target.value })}
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label className="input-label">Usage Limit (Max Redemptions) *</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    required
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div className="info-two-col-grid" style={{ marginTop: '0.65rem' }}>
                <div>
                  <label className="input-label">Valid From *</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label className="input-label">Valid Till *</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.validTill}
                    onChange={(e) => setFormData({ ...formData, validTill: e.target.value })}
                    required
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '0.65rem' }}>
                <label className="input-label">Campaign Description</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Festival weekend promotional discount"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ marginTop: '0.25rem' }}
                />
              </div>

              {formError && <span className="input-error-msg" style={{ display: 'block', marginTop: '0.5rem' }}>{formError}</span>}

              <div className="modal-actions-row" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Publishing...' : 'Launch Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
