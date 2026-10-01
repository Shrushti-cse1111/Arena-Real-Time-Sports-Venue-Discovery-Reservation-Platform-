import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
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
  UserCheck,
  UserX,
  Clock,
  ArrowUpRight,
  Shield,
  Activity,
  DollarSign
} from 'lucide-react';
import { adminUserService } from '../services/adminUserService';

export default function AdminUserManagementScreen({
  adminSession,
  onBackToDashboard,
  initialFilter = 'all',
}) {
  // Filter and search states
  const [statusFilter, setStatusFilter] = useState(initialFilter); // 'all' | 'active' | 'blocked'
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'player' | 'owner'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [usersList, setUsersList] = useState([]);
  const [userCounts, setUserCounts] = useState({
    all: 0,
    active: 0,
    blocked: 0,
    players: 0,
    owners: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // Modal / Drawer states
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsTab, setUserDetailsTab] = useState('overview'); // 'overview' | 'bookings' | 'complaints' | 'security'
  const [userComplaints, setUserComplaints] = useState([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);

  // Block Modal state
  const [blockModalUser, setBlockModalUser] = useState(null);
  const [blockingReason, setBlockingReason] = useState('');
  const [blockReasonError, setBlockReasonError] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Quick Block Reasons
  const QUICK_BLOCK_REASONS = [
    'Repeated no-show and abusive late cancellations',
    'Fraudulent chargeback & payment dispute filed',
    'Breach of venue community code of conduct',
    'Failed business KYC verification / invalid GSTIN',
    'Suspicious automated bot booking activity',
  ];

  const activeAdmin = adminSession || {
    adminId: 'ADM-9001',
    name: 'Sarah Connor',
    email: 'admin@arena.com',
    role: 'superadmin',
  };

  // 1. Fetch Users from API (GET /admin/users)
  const fetchUsers = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await adminUserService.getUsers({
        search: searchQuery,
        status: statusFilter,
        role: roleFilter,
      });

      if (res.success) {
        setUsersList(res.users);
        setUserCounts(res.counts);
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter, roleFilter, searchQuery]);

  // 2. Fetch User Details & Complaints (GET /admin/users/:id & GET /admin/users/:id/complaints)
  const handleOpenUserDetails = async (user) => {
    try {
      setSelectedUser(user);
      setUserDetailsTab('overview');
      setIsLoadingComplaints(true);
      const res = await adminUserService.getUserComplaints(user.id);
      if (res.success) {
        setUserComplaints(res.complaints);
      }
    } catch (err) {
      console.error('Failed to fetch user complaints:', err);
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  // 3. Handle Status Update (PATCH /admin/users/:id/status)
  const handleConfirmBlock = async () => {
    if (!blockingReason || blockingReason.trim().length < 5) {
      setBlockReasonError('Please provide a specific reason (min 5 characters) for blocking.');
      return;
    }

    setIsSubmittingStatus(true);
    setBlockReasonError('');

    try {
      const res = await adminUserService.updateUserStatus(
        blockModalUser.id,
        'blocked',
        blockingReason.trim(),
        activeAdmin.adminId || 'ADM-9001',
        activeAdmin.name || 'Sarah Connor'
      );

      if (res.success) {
        setActionNotice(`User "${res.user.name}" has been blocked.`);
        setTimeout(() => setActionNotice(''), 4000);
        setBlockModalUser(null);
        setBlockingReason('');
        
        // Refresh local view
        if (selectedUser?.id === res.user.id) {
          setSelectedUser(res.user);
        }
        fetchUsers(true);
      }
    } catch (err) {
      setBlockReasonError(err.message || 'Failed to update user status.');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleUnblockUser = async (user) => {
    if (!window.confirm(`Are you sure you want to unblock "${user.name}"? They will regain full booking and account access.`)) {
      return;
    }

    setIsSubmittingStatus(true);
    try {
      const res = await adminUserService.updateUserStatus(
        user.id,
        'active',
        '',
        activeAdmin.adminId || 'ADM-9001',
        activeAdmin.name || 'Sarah Connor'
      );

      if (res.success) {
        setActionNotice(`User "${res.user.name}" has been unblocked successfully.`);
        setTimeout(() => setActionNotice(''), 4000);

        if (selectedUser?.id === res.user.id) {
          setSelectedUser(res.user);
        }
        fetchUsers(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to unblock user.');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  return (
    <div className="admin-user-mgmt-container fade-in">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="admin-action-toast fade-in">
          <CheckCircle size={16} color="#10B981" />
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice('')} className="toast-close-btn">✕</button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="admin-content-card">
        <div className="card-header-row">
          <div className="card-header-title-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="admin-title-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <Users size={20} />
              </div>
              <div>
                <h2 className="admin-section-heading" style={{ margin: 0 }}>Platform User Management</h2>
                <p className="admin-subtext" style={{ margin: 0 }}>
                  Manage registered players, turf partners, account compliance & complaint history
                </p>
              </div>
            </div>
          </div>

          <div className="admin-header-actions-row">
            <button
              type="button"
              className="admin-refresh-btn"
              onClick={() => fetchUsers(true)}
              title="Refresh User List"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="user-kpi-summary-strip" style={{ marginTop: '1rem' }}>
          <div className="user-kpi-pill">
            <span className="pill-val">{userCounts.all}</span>
            <span className="pill-lbl">Total Registered</span>
          </div>
          <div className="user-kpi-pill active-pill">
            <span className="pill-val">{userCounts.active}</span>
            <span className="pill-lbl">Active & Good Standing</span>
          </div>
          <div className="user-kpi-pill blocked-pill">
            <span className="pill-val">{userCounts.blocked}</span>
            <span className="pill-lbl">Blocked / Suspended</span>
          </div>
          <div className="user-kpi-pill">
            <span className="pill-val">{userCounts.players}</span>
            <span className="pill-lbl">Players</span>
          </div>
          <div className="user-kpi-pill">
            <span className="pill-val">{userCounts.owners}</span>
            <span className="pill-lbl">Venue Partners</span>
          </div>
        </div>

        {/* Search & Status Filter Controls */}
        <div className="user-mgmt-filter-bar" style={{ marginTop: '1rem' }}>
          {/* Search Input */}
          <div className="input-wrapper user-search-wrapper" style={{ flex: 1 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search by name, mobile, email, city, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: '38px', fontSize: '0.85rem' }}
            />
            {searchQuery ? (
              <button
                type="button"
                className="input-icon-right-btn"
                onClick={() => setSearchQuery('')}
                title="Clear Search"
              >
                <X size={14} color="#94A3B8" />
              </button>
            ) : (
              <span className="input-icon-right">
                <Search size={15} color="#94A3B8" />
              </span>
            )}
          </div>

          {/* Status Tabs: All / Active / Blocked */}
          <div className="user-status-segmented-control">
            {[
              { id: 'all', label: 'All Users', count: userCounts.all },
              { id: 'active', label: 'Active', count: userCounts.active },
              { id: 'blocked', label: 'Blocked', count: userCounts.blocked },
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

          {/* Role Filter */}
          <select
            className="filter-select role-filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ height: '38px' }}
          >
            <option value="all">All Roles</option>
            <option value="player">Players Only</option>
            <option value="owner">Venue Partners Only</option>
          </select>
        </div>

        {/* Main Users Table / List */}
        {isLoading ? (
          <div className="admin-loading-container" style={{ padding: '2.5rem 0', textAlign: 'center' }}>
            <RefreshCw size={24} className="spin-icon" color="#2563EB" />
            <p style={{ marginTop: '0.5rem', color: '#64748B', fontSize: '0.85rem' }}>Loading user registry...</p>
          </div>
        ) : usersList.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
            <UserX size={36} color="#94A3B8" style={{ margin: '0 auto 0.5rem' }} />
            <h4 style={{ margin: 0, color: '#1E293B', fontSize: '0.95rem' }}>No Users Found</h4>
            <p style={{ color: '#64748B', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
              No accounts match the current search query or filter criteria.
            </p>
          </div>
        ) : (
          <div className="admin-table-responsive" style={{ marginTop: '1rem' }}>
            <table className="admin-user-table">
              <thead>
                <tr>
                  <th>Name & Identity</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Bookings / Turnover</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((user) => {
                  const isBlocked = user.status === 'blocked';
                  return (
                    <tr key={user.id} className={`user-table-row ${isBlocked ? 'row-blocked' : ''}`}>
                      {/* 1. Name & Identity */}
                      <td>
                        <div className="user-cell-identity">
                          <div className={`user-avatar-circle ${isBlocked ? 'avatar-blocked' : ''}`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-identity-text">
                            <div className="user-name-line">
                              <span className="user-full-name">{user.name}</span>
                              <span className={`user-role-badge ${user.role}`}>
                                {user.role === 'owner' ? 'Venue Partner' : 'Player'}
                              </span>
                            </div>
                            <span className="user-id-sub">{user.id} • {user.city}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Mobile */}
                      <td>
                        <div className="user-cell-contact">
                          <Phone size={13} color="#64748B" />
                          <span>{user.mobile}</span>
                        </div>
                      </td>

                      {/* 3. Email */}
                      <td>
                        <div className="user-cell-contact">
                          <Mail size={13} color="#64748B" />
                          <span className="user-email-text">{user.email}</span>
                        </div>
                      </td>

                      {/* 4. Bookings / Turnover */}
                      <td>
                        <div className="user-cell-bookings">
                          <span className="bookings-count-val">
                            <strong>{user.bookingsCount}</strong> {user.role === 'owner' ? 'orders fulfilled' : 'slots booked'}
                          </span>
                          <span className="turnover-val">{user.totalSpent}</span>
                        </div>
                      </td>

                      {/* 5. Joined */}
                      <td>
                        <div className="user-cell-joined">
                          <Calendar size={13} color="#64748B" />
                          <span>{user.joinedDate}</span>
                        </div>
                      </td>

                      {/* 6. Status */}
                      <td>
                        <div className="user-cell-status">
                          {isBlocked ? (
                            <div className="status-badge-container" title={user.blockingReason || 'Account suspended'}>
                              <span className="status-badge-sm blocked">
                                <Ban size={11} /> Blocked
                              </span>
                              {user.blockingReason && (
                                <span className="status-reason-micro" title={user.blockingReason}>
                                  {user.blockingReason.length > 25
                                    ? user.blockingReason.slice(0, 25) + '...'
                                    : user.blockingReason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="status-badge-sm active">
                              <CheckCircle size={11} /> Active
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Action */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="user-actions-cell">
                          <button
                            type="button"
                            className="btn-action-sm btn-view-user"
                            onClick={() => handleOpenUserDetails(user)}
                            title="View Full User Dossier"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>

                          {isBlocked ? (
                            <button
                              type="button"
                              className="btn-action-sm btn-unblock-user"
                              onClick={() => handleUnblockUser(user)}
                              title="Unblock User Access"
                              disabled={isSubmittingStatus}
                            >
                              <Unlock size={13} />
                              <span>Unblock</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-action-sm btn-block-user"
                              onClick={() => {
                                setBlockModalUser(user);
                                setBlockingReason('');
                                setBlockReasonError('');
                              }}
                              title="Block / Suspend User"
                              disabled={isSubmittingStatus}
                            >
                              <Ban size={13} />
                              <span>Block</span>
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

      {/* USER DETAILS DOSSIER MODAL */}
      {selectedUser && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 120 }}>
          <div className="modal-container user-details-modal-container">
            {/* Modal Header */}
            <div className="user-modal-header">
              <div className="user-modal-identity-row">
                <div className={`modal-user-avatar ${selectedUser.status === 'blocked' ? 'blocked' : ''}`}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <h3 className="modal-user-name" style={{ margin: 0 }}>{selectedUser.name}</h3>
                    <span className={`user-role-badge ${selectedUser.role}`}>
                      {selectedUser.role === 'owner' ? 'Venue Partner' : 'Player'}
                    </span>
                    <span className={`status-badge-sm ${selectedUser.status}`}>
                      {selectedUser.status === 'blocked' ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                  <span className="modal-user-sub">{selectedUser.id} • Registered {selectedUser.joinedDate}</span>
                </div>
              </div>
              <button
                type="button"
                className="close-notice-btn"
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="user-modal-nav-tabs">
              {[
                { id: 'overview', label: 'Overview & Profile', icon: UserCheck },
                { id: 'bookings', label: `Bookings (${selectedUser.recentBookings?.length || selectedUser.bookingsCount})`, icon: Calendar },
                { id: 'complaints', label: `Complaints (${selectedUser.complaints?.length || 0})`, icon: HelpCircle },
                { id: 'security', label: 'Security & Methods', icon: Shield },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`user-modal-tab-btn ${userDetailsTab === tab.id ? 'active' : ''}`}
                    onClick={() => setUserDetailsTab(tab.id)}
                  >
                    <TabIcon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OVERVIEW & PROFILE */}
            {userDetailsTab === 'overview' && (
              <div className="user-modal-tab-content fade-in">
                {/* Block status alert banner if blocked */}
                {selectedUser.status === 'blocked' && (
                  <div className="user-blocked-banner">
                    <div className="blocked-banner-icon">
                      <Ban size={18} color="#EF4444" />
                    </div>
                    <div className="blocked-banner-text">
                      <strong style={{ color: '#991B1B' }}>Account Suspended & Blocked</strong>
                      <p style={{ margin: '0.2rem 0 0', color: '#7F1D1D', fontSize: '0.8125rem' }}>
                        <strong>Reason:</strong> {selectedUser.blockingReason || 'Violation of platform policies'}
                      </p>
                      {selectedUser.blockedBy && (
                        <span className="blocked-meta-sub">
                          Enforced by {selectedUser.blockedBy} on {new Date(selectedUser.blockedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Profile Key Stats */}
                <div className="user-stats-3col-grid">
                  <div className="user-stat-card">
                    <span className="stat-lbl">Total Bookings</span>
                    <span className="stat-val">{selectedUser.bookingsCount}</span>
                  </div>
                  <div className="user-stat-card">
                    <span className="stat-lbl">Total Volume</span>
                    <span className="stat-val">{selectedUser.totalSpent}</span>
                  </div>
                  <div className="user-stat-card">
                    <span className="stat-lbl">Wallet Balance</span>
                    <span className="stat-val" style={{ color: '#10B981' }}>{selectedUser.walletBalance}</span>
                  </div>
                </div>

                {/* Contact & Location Details */}
                <div className="user-info-section-group" style={{ marginTop: '1rem' }}>
                  <h4 className="info-group-title">Contact & Location</h4>
                  <div className="info-two-col-grid">
                    <div className="info-detail-cell">
                      <span className="cell-lbl">Email Address</span>
                      <span className="cell-val">{selectedUser.email}</span>
                    </div>
                    <div className="info-detail-cell">
                      <span className="cell-lbl">Mobile Number</span>
                      <span className="cell-val">{selectedUser.mobile}</span>
                    </div>
                    <div className="info-detail-cell">
                      <span className="cell-lbl">City / Region</span>
                      <span className="cell-val">{selectedUser.city}</span>
                    </div>
                    <div className="info-detail-cell">
                      <span className="cell-lbl">Preferred Sports</span>
                      <span className="cell-val">
                        {selectedUser.preferredSports?.join(', ') || 'None specified'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BOOKINGS LEDGER */}
            {userDetailsTab === 'bookings' && (
              <div className="user-modal-tab-content fade-in">
                <div className="user-info-section-group">
                  <h4 className="info-group-title">Booking Activity & History</h4>
                  {(!selectedUser.recentBookings || selectedUser.recentBookings.length === 0) ? (
                    <p style={{ color: '#64748B', fontSize: '0.8125rem', padding: '1rem', textAlign: 'center' }}>
                      No direct recent booking orders found for this account.
                    </p>
                  ) : (
                    <div className="user-bookings-ledger-list">
                      {selectedUser.recentBookings.map((b) => (
                        <div key={b.id} className="ledger-item-row">
                          <div className="ledger-left">
                            <span className="ledger-id-tag">{b.id}</span>
                            <div className="ledger-venue-info">
                              <span className="ledger-venue-name">{b.venue}</span>
                              <span className="ledger-court-sub">{b.court} • {b.date}</span>
                            </div>
                          </div>
                          <div className="ledger-right">
                            <span className="ledger-amount">₹{b.amount}</span>
                            <span className={`status-badge-sm ${b.status}`}>{b.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: COMPLAINTS & DISPUTES */}
            {userDetailsTab === 'complaints' && (
              <div className="user-modal-tab-content fade-in">
                <div className="user-info-section-group">
                  <h4 className="info-group-title">Complaints & Dispute Tickets</h4>
                  {isLoadingComplaints ? (
                    <p style={{ color: '#64748B', fontSize: '0.8125rem' }}>Loading complaints history...</p>
                  ) : userComplaints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748B' }}>
                      <CheckCircle size={24} color="#10B981" style={{ margin: '0 auto 0.25rem' }} />
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>No complaints filed against or by this account.</p>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Account has a 100% clean dispute rating.</span>
                    </div>
                  ) : (
                    <div className="user-complaints-list">
                      {userComplaints.map((c) => (
                        <div key={c.id} className="user-complaint-card">
                          <div className="complaint-card-header">
                            <div className="complaint-id-tag">
                              <span>{c.id}</span>
                              <span className="complaint-cat-chip">{c.category}</span>
                            </div>
                            <span className={`ticket-status-tag ${c.status.toLowerCase().replace(' ', '-')}`}>
                              {c.status}
                            </span>
                          </div>
                          <h5 className="complaint-subject">{c.subject}</h5>
                          <div className="complaint-resolution-box">
                            <span className="res-lbl">Resolution & Notes:</span>
                            <p className="res-text">{c.resolution}</p>
                          </div>
                          <span className="complaint-date-sub">Reported on {c.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: SECURITY & PAYMENT CREDENTIALS (MASKED - NO RAW PAYMENT DATA) */}
            {userDetailsTab === 'security' && (
              <div className="user-modal-tab-content fade-in">
                {/* Security Status Box */}
                <div className="user-info-section-group">
                  <h4 className="info-group-title">Account Security & Compliance</h4>
                  <div className="security-status-grid">
                    <div className="sec-check-item">
                      <ShieldCheck size={16} color="#10B981" />
                      <span>Phone OTP Verified (+91-98XXX)</span>
                    </div>
                    <div className="sec-check-item">
                      <ShieldCheck size={16} color="#10B981" />
                      <span>Email Delivery Confirmed</span>
                    </div>
                    <div className="sec-check-item">
                      <ShieldCheck size={16} color="#10B981" />
                      <span>PCI-DSS Tokenized Storage Active</span>
                    </div>
                  </div>
                </div>

                {/* Masked Saved Payment Methods (Security Compliant) */}
                <div className="user-info-section-group" style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 className="info-group-title" style={{ margin: 0 }}>Linked Payment Methods (Masked)</h4>
                    <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 600 }}>🔒 Zero Raw Payment Exposure</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.25rem 0 0.75rem' }}>
                    Card numbers & UPI handles are tokenized at payment gateway level and masked per PCI-DSS guidelines.
                  </p>

                  {(!selectedUser.savedPaymentMethods || selectedUser.savedPaymentMethods.length === 0) ? (
                    <p style={{ color: '#64748B', fontSize: '0.8125rem' }}>No saved payment instruments.</p>
                  ) : (
                    <div className="masked-payment-methods-list">
                      {selectedUser.savedPaymentMethods.map((pm, idx) => (
                        <div key={idx} className="masked-pm-item">
                          <div className="pm-left">
                            <CreditCard size={15} color="#2563EB" />
                            <span className="pm-label">{pm.label}</span>
                          </div>
                          {pm.isDefault && <span className="pm-default-badge">Default</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="user-modal-actions-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedUser(null)}
              >
                Close Dossier
              </button>

              {selectedUser.status === 'blocked' ? (
                <button
                  type="button"
                  className="btn-action-sm btn-unblock-user"
                  onClick={() => handleUnblockUser(selectedUser)}
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                  disabled={isSubmittingStatus}
                >
                  <Unlock size={14} />
                  <span>Unblock Account</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-action-sm btn-block-user"
                  onClick={() => {
                    setBlockModalUser(selectedUser);
                    setBlockingReason('');
                    setBlockReasonError('');
                  }}
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                  disabled={isSubmittingStatus}
                >
                  <Ban size={14} />
                  <span>Block / Suspend Account</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BLOCK USER CONFIRMATION & REASON MODAL */}
      {blockModalUser && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 130 }}>
          <div className="modal-container" style={{ maxWidth: '420px' }}>
            <div className="modal-icon-header" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              <ShieldAlert size={26} />
            </div>
            <h3 className="modal-title" style={{ color: '#991B1B' }}>Block User Account?</h3>
            <p className="modal-description">
              You are about to suspend <strong>{blockModalUser.name}</strong> ({blockModalUser.id}).
              They will be prevented from booking courts, joining games, or receiving payouts.
            </p>

            {/* Mandatory Reason Input */}
            <div className="block-reason-container" style={{ marginTop: '1rem' }}>
              <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>
                Blocking Reason <span style={{ color: '#EF4444' }}>* (Mandatory & Audited)</span>
              </label>
              <textarea
                className="reason-textarea"
                rows={3}
                placeholder="Explain the reason for suspension (e.g. fraudulent chargeback, repeated no-shows, KYC failure)..."
                value={blockingReason}
                onChange={(e) => {
                  setBlockingReason(e.target.value);
                  if (blockReasonError) setBlockReasonError('');
                }}
                style={{ width: '100%', marginTop: '0.35rem' }}
              />

              {blockReasonError && (
                <span className="input-error-msg" style={{ display: 'block', marginTop: '0.25rem' }}>
                  {blockReasonError}
                </span>
              )}

              {/* Quick Template Chips */}
              <div className="quick-reasons-strip" style={{ marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.3rem' }}>
                  Quick Templates:
                </span>
                <div className="reason-chips-row">
                  {QUICK_BLOCK_REASONS.map((reason, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="reason-chip-btn"
                      onClick={() => {
                        setBlockingReason(reason);
                        setBlockReasonError('');
                      }}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions-row" style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setBlockModalUser(null)}
                disabled={isSubmittingStatus}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmBlock}
                disabled={isSubmittingStatus}
                style={{ background: '#DC2626', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {isSubmittingStatus ? (
                  <>
                    <RefreshCw size={14} className="spin-icon" />
                    <span>Blocking...</span>
                  </>
                ) : (
                  <>
                    <Ban size={14} />
                    <span>Confirm Block</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
