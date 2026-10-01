import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Filter,
  CheckCircle,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Ban,
  Unlock,
  Eye,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  HelpCircle,
  RefreshCw,
  X,
  ChevronRight,
  TrendingUp,
  DollarSign,
  UserX,
  BadgeAlert,
  CheckCircle2
} from 'lucide-react';
import { adminOwnerService } from '../services/adminOwnerService';

export default function AdminOwnerManagementScreen({
  adminSession,
  onBackToDashboard,
  initialFilter = 'all',
}) {
  const [statusFilter, setStatusFilter] = useState(initialFilter); // 'all' | 'pending' | 'verified' | 'suspended'
  const [searchQuery, setSearchQuery] = useState('');
  const [ownersList, setOwnersList] = useState([]);
  const [ownerCounts, setOwnerCounts] = useState({ all: 0, pending: 0, verified: 0, suspended: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // Modal states
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerModalTab, setOwnerModalTab] = useState('overview'); // 'overview' | 'documents' | 'venues' | 'financials' | 'complaints'
  
  // Suspend Modal state
  const [suspendModalOwner, setSuspendModalOwner] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspendError, setSuspendError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const QUICK_SUSPENSION_REASONS = [
    'Expired GSTIN certificate or invalid Shop Act registration',
    'Missing Municipal Fire Safety & structural NOC compliance',
    'Multiple player complaints of unauthorized double booking',
    'Repeated failure to honour confirmed player reservations',
    'Breach of platform fee settlement & payout agreements',
  ];

  const activeAdmin = adminSession || {
    adminId: 'ADM-9001',
    name: 'Sarah Connor',
    email: 'admin@arena.com',
    role: 'superadmin',
  };

  const fetchOwners = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const verifStatus = statusFilter === 'pending' ? 'pending' : statusFilter === 'verified' ? 'verified' : 'all';
      const accStatus = statusFilter === 'suspended' ? 'suspended' : 'all';

      const res = await adminOwnerService.getOwners({
        search: searchQuery,
        verificationStatus: verifStatus,
        status: accStatus,
      });

      if (res.success) {
        setOwnersList(res.owners);
        setOwnerCounts(res.counts);
      }
    } catch (err) {
      console.error('Failed to fetch owners:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, [statusFilter, searchQuery]);

  const handleVerify = async (owner) => {
    if (!window.confirm(`Verify and approve business KYC documents for "${owner.name}" (${owner.businessInfo.businessName})?`)) return;

    setIsSubmitting(true);
    try {
      const res = await adminOwnerService.verifyOwner(owner.id, activeAdmin.adminId, activeAdmin.name);
      if (res.success) {
        setActionNotice(`Owner "${owner.name}" has been verified.`);
        setTimeout(() => setActionNotice(''), 4000);
        if (selectedOwner?.id === owner.id) setSelectedOwner(res.owner);
        fetchOwners(true);
      }
    } catch (err) {
      alert(err.message || 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSuspend = async () => {
    if (!suspensionReason || suspensionReason.trim().length < 5) {
      setSuspendError('A detailed reason (min 5 characters) is required to suspend an owner.');
      return;
    }

    setIsSubmitting(true);
    setSuspendError('');

    try {
      const res = await adminOwnerService.suspendOwner(
        suspendModalOwner.id,
        suspensionReason.trim(),
        activeAdmin.adminId,
        activeAdmin.name
      );

      if (res.success) {
        setActionNotice(`Owner "${res.owner.name}" has been suspended.`);
        setTimeout(() => setActionNotice(''), 4000);
        setSuspendModalOwner(null);
        setSuspensionReason('');
        if (selectedOwner?.id === res.owner.id) setSelectedOwner(res.owner);
        fetchOwners(true);
      }
    } catch (err) {
      setSuspendError(err.message || 'Failed to suspend owner.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivate = async (owner) => {
    if (!window.confirm(`Reactivate account for "${owner.name}"? They will regain venue listing and payout access.`)) return;

    setIsSubmitting(true);
    try {
      const res = await adminOwnerService.reactivateOwner(owner.id, activeAdmin.adminId, activeAdmin.name);
      if (res.success) {
        setActionNotice(`Owner "${owner.name}" reactivated successfully.`);
        setTimeout(() => setActionNotice(''), 4000);
        if (selectedOwner?.id === owner.id) setSelectedOwner(res.owner);
        fetchOwners(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to reactivate owner.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-owner-mgmt-container fade-in">
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
              <div className="admin-title-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="admin-section-heading" style={{ margin: 0 }}>Venue Owner & Partner Management</h2>
                <p className="admin-subtext" style={{ margin: 0 }}>
                  Manage venue operators, business KYC verification, suspension compliance & settlements
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="admin-refresh-btn"
            onClick={() => fetchOwners(true)}
            title="Refresh List"
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
          </button>
        </div>

        {/* Counts Strip */}
        <div className="user-kpi-summary-strip" style={{ marginTop: '1rem' }}>
          <div className="user-kpi-pill">
            <span className="pill-val">{ownerCounts.all}</span>
            <span className="pill-lbl">Total Partners</span>
          </div>
          <div className="user-kpi-pill active-pill">
            <span className="pill-val">{ownerCounts.verified}</span>
            <span className="pill-lbl">KYC Verified & Active</span>
          </div>
          <div className="user-kpi-pill" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
            <span className="pill-val" style={{ color: '#D97706' }}>{ownerCounts.pending}</span>
            <span className="pill-lbl">Pending Review</span>
          </div>
          <div className="user-kpi-pill blocked-pill">
            <span className="pill-val">{ownerCounts.suspended}</span>
            <span className="pill-lbl">Suspended</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="user-mgmt-filter-bar" style={{ marginTop: '1rem' }}>
          <div className="input-wrapper user-search-wrapper" style={{ flex: 1 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search by owner, business entity, GSTIN, phone, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: '38px', fontSize: '0.85rem' }}
            />
            {searchQuery ? (
              <button type="button" className="input-icon-right-btn" onClick={() => setSearchQuery('')}>
                <X size={14} color="#94A3B8" />
              </button>
            ) : (
              <span className="input-icon-right"><Search size={15} color="#94A3B8" /></span>
            )}
          </div>

          <div className="user-status-segmented-control">
            {[
              { id: 'all', label: 'All Partners', count: ownerCounts.all },
              { id: 'pending', label: 'Pending KYC', count: ownerCounts.pending },
              { id: 'verified', label: 'Verified', count: ownerCounts.verified },
              { id: 'suspended', label: 'Suspended', count: ownerCounts.suspended },
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

        {/* Owners Table */}
        {isLoading ? (
          <div className="admin-loading-container" style={{ padding: '2.5rem 0', textAlign: 'center' }}>
            <RefreshCw size={24} className="spin-icon" color="#2563EB" />
            <p style={{ marginTop: '0.5rem', color: '#64748B', fontSize: '0.85rem' }}>Loading partner records...</p>
          </div>
        ) : ownersList.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
            <UserX size={36} color="#94A3B8" style={{ margin: '0 auto 0.5rem' }} />
            <h4 style={{ margin: 0, color: '#1E293B', fontSize: '0.95rem' }}>No Venue Owners Found</h4>
            <p style={{ color: '#64748B', fontSize: '0.8125rem', marginTop: '0.25rem' }}>No records match the current filter.</p>
          </div>
        ) : (
          <div className="admin-table-responsive" style={{ marginTop: '1rem' }}>
            <table className="admin-user-table">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Business Entity</th>
                  <th>Venues</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {ownersList.map((owner) => {
                  const isSuspended = owner.status === 'suspended';
                  const isVerified = owner.verificationStatus === 'verified';
                  const isPending = owner.verificationStatus === 'pending';

                  return (
                    <tr key={owner.id} className={`user-table-row ${isSuspended ? 'row-blocked' : ''}`}>
                      {/* 1. Owner */}
                      <td>
                        <div className="user-cell-identity">
                          <div className={`user-avatar-circle ${isSuspended ? 'avatar-blocked' : ''}`} style={{ background: '#FEF3C7', color: '#B45309' }}>
                            {owner.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-identity-text">
                            <span className="user-full-name">{owner.name}</span>
                            <span className="user-id-sub">{owner.id} • {owner.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Business */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ fontSize: '0.82rem', color: '#0F172A' }}>{owner.businessInfo.businessName}</strong>
                          <span style={{ fontSize: '0.7rem', color: '#64748B' }}>GSTIN: {owner.businessInfo.gstNumber}</span>
                        </div>
                      </td>

                      {/* 3. Venues */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>
                            {owner.venues.length} Managed {owner.venues.length === 1 ? 'Venue' : 'Venues'}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                            {owner.venues.map((v) => v.name).join(', ').slice(0, 30)}...
                          </span>
                        </div>
                      </td>

                      {/* 4. Verification */}
                      <td>
                        {isVerified ? (
                          <span className="status-badge-sm active"><ShieldCheck size={12} /> Verified</span>
                        ) : isPending ? (
                          <span className="status-badge-sm" style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                            <AlertTriangle size={12} /> Pending Review
                          </span>
                        ) : (
                          <span className="status-badge-sm blocked"><Ban size={12} /> Rejected</span>
                        )}
                      </td>

                      {/* 5. Status */}
                      <td>
                        {isSuspended ? (
                          <span className="status-badge-sm blocked"><Ban size={12} /> Suspended</span>
                        ) : (
                          <span className="status-badge-sm active"><CheckCircle size={12} /> Active</span>
                        )}
                      </td>

                      {/* 6. Action */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="user-actions-cell">
                          <button
                            type="button"
                            className="btn-action-sm btn-view-user"
                            onClick={() => { setSelectedOwner(owner); setOwnerModalTab('overview'); }}
                            title="View Owner Dossier"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>

                          {isPending && (
                            <button
                              type="button"
                              className="btn-action-sm btn-unblock-user"
                              onClick={() => handleVerify(owner)}
                              title="Verify KYC"
                              disabled={isSubmitting}
                            >
                              <ShieldCheck size={13} />
                              <span>Verify</span>
                            </button>
                          )}

                          {isSuspended ? (
                            <button
                              type="button"
                              className="btn-action-sm btn-unblock-user"
                              onClick={() => handleReactivate(owner)}
                              title="Reactivate Owner"
                              disabled={isSubmitting}
                            >
                              <Unlock size={13} />
                              <span>Reactivate</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-action-sm btn-block-user"
                              onClick={() => {
                                setSuspendModalOwner(owner);
                                setSuspensionReason('');
                                setSuspendError('');
                              }}
                              title="Suspend Owner"
                              disabled={isSubmitting}
                            >
                              <Ban size={13} />
                              <span>Suspend</span>
                            </button>
                          )}
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

      {/* OWNER DOSSIER MODAL */}
      {selectedOwner && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 120 }}>
          <div className="modal-container user-details-modal-container">
            <div className="user-modal-header">
              <div className="user-modal-identity-row">
                <div className={`modal-user-avatar ${selectedOwner.status === 'suspended' ? 'blocked' : ''}`} style={{ background: '#FEF3C7', color: '#B45309' }}>
                  {selectedOwner.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <h3 className="modal-user-name" style={{ margin: 0 }}>{selectedOwner.name}</h3>
                    <span className="user-role-badge owner">Venue Operator</span>
                    <span className={`status-badge-sm ${selectedOwner.status === 'suspended' ? 'blocked' : 'active'}`}>
                      {selectedOwner.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="modal-user-sub">{selectedOwner.id} • {selectedOwner.businessInfo.businessName}</span>
                </div>
              </div>
              <button type="button" className="close-notice-btn" onClick={() => setSelectedOwner(null)}>✕</button>
            </div>

            {/* Modal Tabs */}
            <div className="user-modal-nav-tabs">
              {[
                { id: 'overview', label: 'Business Profile' },
                { id: 'documents', label: 'KYC Documents' },
                { id: 'venues', label: `Venues (${selectedOwner.venues.length})` },
                { id: 'financials', label: 'Earnings & Payouts' },
                { id: 'complaints', label: `Disputes (${selectedOwner.complaints.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`user-modal-tab-btn ${ownerModalTab === tab.id ? 'active' : ''}`}
                  onClick={() => setOwnerModalTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: Business Profile */}
            {ownerModalTab === 'overview' && (
              <div className="user-modal-tab-content fade-in">
                {selectedOwner.status === 'suspended' && (
                  <div className="user-blocked-banner">
                    <Ban size={18} color="#EF4444" />
                    <div>
                      <strong style={{ color: '#991B1B' }}>Partner Account Suspended</strong>
                      <p style={{ margin: '0.2rem 0 0', color: '#7F1D1D', fontSize: '0.8125rem' }}>
                        {selectedOwner.suspensionReason}
                      </p>
                      {selectedOwner.suspendedBy && (
                        <span className="blocked-meta-sub">Enforced by {selectedOwner.suspendedBy} on {new Date(selectedOwner.suspendedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="info-two-col-grid">
                  <div className="info-detail-cell">
                    <span className="cell-lbl">Legal Entity</span>
                    <span className="cell-val">{selectedOwner.businessInfo.businessName} ({selectedOwner.businessInfo.legalEntityType})</span>
                  </div>
                  <div className="info-detail-cell">
                    <span className="cell-lbl">GSTIN & PAN</span>
                    <span className="cell-val">{selectedOwner.businessInfo.gstNumber} • {selectedOwner.businessInfo.panNumber}</span>
                  </div>
                  <div className="info-detail-cell">
                    <span className="cell-lbl">Contact Phone & Email</span>
                    <span className="cell-val">{selectedOwner.phone} • {selectedOwner.email}</span>
                  </div>
                  <div className="info-detail-cell">
                    <span className="cell-lbl">Registered Address</span>
                    <span className="cell-val">{selectedOwner.businessInfo.registeredAddress}</span>
                  </div>
                </div>

                {/* Bank details */}
                <div className="user-info-section-group" style={{ marginTop: '0.85rem' }}>
                  <h4 className="info-group-title">Payout Bank Account</h4>
                  <div className="info-two-col-grid">
                    <div className="info-detail-cell">
                      <span className="cell-lbl">Bank & Account</span>
                      <span className="cell-val">{selectedOwner.payoutBank.bankName} ({selectedOwner.payoutBank.maskedAccountNumber})</span>
                    </div>
                    <div className="info-detail-cell">
                      <span className="cell-lbl">IFSC & Branch</span>
                      <span className="cell-val">{selectedOwner.payoutBank.ifscCode} • {selectedOwner.payoutBank.branch}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Documents */}
            {ownerModalTab === 'documents' && (
              <div className="user-modal-tab-content fade-in">
                <div className="user-complaints-list">
                  {Object.entries(selectedOwner.verificationDocuments).map(([docKey, docVal]) => (
                    <div key={docKey} className="user-complaint-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: '#0F172A', textTransform: 'capitalize' }}>
                          {docKey.replace(/([A-Z])/g, ' $1')}
                        </strong>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                          {docVal ? `${docVal.name} (${docVal.size})` : 'Document not uploaded'}
                        </p>
                      </div>
                      {docVal ? (
                        docVal.verified ? (
                          <span className="status-badge-sm active"><ShieldCheck size={12} /> Verified</span>
                        ) : (
                          <span className="status-badge-sm" style={{ background: '#FEF3C7', color: '#B45309' }}>Pending</span>
                        )
                      ) : (
                        <span className="status-badge-sm blocked">Missing</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Venues */}
            {ownerModalTab === 'venues' && (
              <div className="user-modal-tab-content fade-in">
                <div className="user-complaints-list">
                  {selectedOwner.venues.map((v) => (
                    <div key={v.id} className="user-complaint-card">
                      <div className="complaint-card-header">
                        <span className="complaint-id-tag">{v.id}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706' }}>⭐ {v.rating}</span>
                      </div>
                      <h5 className="complaint-subject">{v.name}</h5>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '0.2rem' }}>
                        📍 {v.area} • {v.courtsCount} Courts ({v.sports.join(', ')})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Financials */}
            {ownerModalTab === 'financials' && (
              <div className="user-modal-tab-content fade-in">
                <div className="user-stats-3col-grid">
                  <div className="user-stat-card">
                    <span className="stat-lbl">Gross Revenue</span>
                    <span className="stat-val">{selectedOwner.financials.totalRevenueGenerated}</span>
                  </div>
                  <div className="user-stat-card">
                    <span className="stat-lbl">Net Disbursed</span>
                    <span className="stat-val">{selectedOwner.financials.netEarningsDisbursed}</span>
                  </div>
                  <div className="user-stat-card">
                    <span className="stat-lbl">Pending Payout</span>
                    <span className="stat-val" style={{ color: '#D97706' }}>{selectedOwner.financials.pendingPayoutBalance}</span>
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', background: '#F8FAFC', padding: '0.65rem', borderRadius: '6px', fontSize: '0.8rem', color: '#475569' }}>
                  Total Orders: <strong>{selectedOwner.financials.totalBookingsFulfilled}</strong> • Completion Rate: <strong>{selectedOwner.financials.completionRate}</strong>
                </div>
              </div>
            )}

            {/* TAB 5: Complaints */}
            {ownerModalTab === 'complaints' && (
              <div className="user-modal-tab-content fade-in">
                {selectedOwner.complaints.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#64748B', fontSize: '0.85rem', padding: '1rem' }}>No open customer complaints for this partner.</p>
                ) : (
                  <div className="user-complaints-list">
                    {selectedOwner.complaints.map((c) => (
                      <div key={c.id} className="user-complaint-card">
                        <div className="complaint-card-header">
                          <span className="complaint-id-tag">{c.id} • {c.category}</span>
                          <span className="ticket-status-tag">{c.status}</span>
                        </div>
                        <h5 className="complaint-subject">{c.subject}</h5>
                        <p style={{ fontSize: '0.75rem', color: '#475569', margin: '0.3rem 0' }}>{c.resolution}</p>
                        <span className="complaint-date-sub">{c.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="user-modal-actions-footer">
              <button type="button" className="btn-secondary" onClick={() => setSelectedOwner(null)}>Close</button>
              {selectedOwner.verificationStatus === 'pending' && (
                <button type="button" className="btn-action-sm btn-unblock-user" onClick={() => handleVerify(selectedOwner)}>
                  <ShieldCheck size={14} /> Verify KYC
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUSPENSION MODAL */}
      {suspendModalOwner && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 130 }}>
          <div className="modal-container" style={{ maxWidth: '420px' }}>
            <div className="modal-icon-header" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              <ShieldAlert size={26} />
            </div>
            <h3 className="modal-title" style={{ color: '#991B1B' }}>Suspend Venue Owner?</h3>
            <p className="modal-description">
              You are suspending <strong>{suspendModalOwner.name}</strong> ({suspendModalOwner.businessInfo.businessName}).
              Their venues will be hidden from search and payout batches frozen.
            </p>

            <div className="block-reason-container" style={{ marginTop: '1rem' }}>
              <label className="input-label">Suspension Reason <span style={{ color: '#EF4444' }}>* (Mandatory & Audited)</span></label>
              <textarea
                className="reason-textarea"
                rows={3}
                placeholder="Explain the reason for suspension..."
                value={suspensionReason}
                onChange={(e) => { setSuspensionReason(e.target.value); setSuspendError(''); }}
                style={{ width: '100%', marginTop: '0.35rem' }}
              />
              {suspendError && <span className="input-error-msg" style={{ display: 'block' }}>{suspendError}</span>}

              <div className="quick-reasons-strip" style={{ marginTop: '0.5rem' }}>
                <div className="reason-chips-row">
                  {QUICK_SUSPENSION_REASONS.map((r, i) => (
                    <button key={i} type="button" className="reason-chip-btn" onClick={() => { setSuspensionReason(r); setSuspendError(''); }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions-row" style={{ marginTop: '1.25rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setSuspendModalOwner(null)}>Cancel</button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmSuspend}
                disabled={isSubmitting}
                style={{ background: '#DC2626', color: '#FFFFFF', border: 'none' }}
              >
                {isSubmitting ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
