import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  LogOut,
  Building2,
  Users,
  Activity,
  CheckCircle,
  Clock,
  KeyRound,
  FileText,
  Search,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  XCircle,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  BadgeAlert,
  Send,
  Sparkles,
  Tag,
  Layers,
  Settings,
  Bell,
  Sliders,
  Menu,
  X
} from 'lucide-react';
import { adminDashboardService } from '../services/adminDashboardService';
import { adminAuthService } from '../services/adminAuthService';
import AdminVenueApprovalScreen from './AdminVenueApprovalScreen';
import AdminUserManagementScreen from './AdminUserManagementScreen';
import AdminOwnerManagementScreen from './AdminOwnerManagementScreen';
import AdminBookingManagementScreen from './AdminBookingManagementScreen';
import AdminCommissionScreen from './AdminCommissionScreen';
import AdminCouponsScreen from './AdminCouponsScreen';
import AdminReportsScreen from './AdminReportsScreen';
import AdminContentScreen from './AdminContentScreen';
import AdminSupportScreen from './AdminSupportScreen';
import AdminSettingsScreen from './AdminSettingsScreen';

export default function AdminDashboardScreen({
  adminSession,
  onLogoutSuccess,
  onNavigateToUserApp,
}) {
  // Navigation: 'overview' | 'venues' | 'users' | 'owners' | 'bookings' | 'commission' | 'coupons' | 'reports' | 'content' | 'support' | 'settings' | 'security'
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [chartMetric, setChartMetric] = useState('revenue');
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // Data states
  const [summaryData, setSummaryData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [pendingVenues, setPendingVenues] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');

  // UI Modals
  const [selectedBookingModal, setSelectedBookingModal] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const loadDashboardData = async (range = dateRange, isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [summaryRes, revenueRes, bookingsRes] = await Promise.all([
        adminDashboardService.getDashboardSummary(range),
        adminDashboardService.getRevenueOverview(range),
        adminDashboardService.getRecentBookings({ limit: 10 }),
      ]);

      setSummaryData(summaryRes);
      setRevenueData(revenueRes);
      setRecentBookings(bookingsRes.bookings || []);

      setPendingVenues(adminDashboardService.getStoredPendingVenues());
      setSupportTickets(adminDashboardService.getStoredSupportTickets());
      setAuditLogs(adminAuthService.getAuditLogs());
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData(dateRange);
  }, [dateRange]);

  const handleSignOut = async () => {
    await adminAuthService.logout();
    setShowLogoutConfirm(false);
    onLogoutSuccess();
  };

  const activeAdmin = adminSession || {
    name: 'Sarah Connor',
    email: 'admin@arena.com',
    role: 'superadmin',
    token: 'adm_sess_9001',
  };

  const pendingApprovalsCount = pendingVenues.filter((v) => v.status === 'pending').length;
  const openTicketsCount = supportTickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;

  const NAV_SECTIONS = [
    { id: 'overview', label: 'Dashboard', icon: Activity },
    { id: 'venues', label: 'Venue Approvals', icon: Building2, badge: pendingApprovalsCount, badgeColor: 'amber' },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'owners', label: 'Owners', icon: Building2 },
    { id: 'bookings', label: 'Bookings', icon: FileText },
    { id: 'commission', label: 'Payments & Commission', icon: DollarSign },
    { id: 'coupons', label: 'Coupons & Promotions', icon: Tag },
    { id: 'reports', label: 'Reports & Analytics', icon: TrendingUp },
    { id: 'content', label: 'Content', icon: Layers },
    { id: 'support', label: 'Support Tickets', icon: HelpCircle, badge: openTicketsCount, badgeColor: 'blue' },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'security', label: 'Security & 2FA', icon: KeyRound },
  ];

  const getPageTitle = () => {
    const item = NAV_SECTIONS.find((s) => s.id === activeTab);
    return item ? item.label : 'Admin Portal';
  };

  return (
    <div className="screen-body fade-in admin-dashboard-screen" style={{ paddingBottom: '3.5rem' }}>
      {/* Toast Notice */}
      {actionNotice && (
        <div className="admin-action-toast fade-in">
          <CheckCircle2 size={16} color="#10B981" />
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice('')} className="toast-close-btn">✕</button>
        </div>
      )}

      {/* Top Admin Header Bar */}
      <div className="admin-dash-header">
        <div className="admin-user-profile-row">
          <button
            type="button"
            className="admin-mobile-nav-toggle"
            onClick={() => setShowMobileNav(!showMobileNav)}
            title="Toggle Menu"
          >
            {showMobileNav ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="admin-avatar-box">
            <span className="avatar-initials">
              {activeAdmin.name ? activeAdmin.name.charAt(0) : 'A'}
            </span>
            <div className="admin-verified-badge" title="2FA Level 2 Verified">
              <ShieldCheck size={12} color="#FFFFFF" />
            </div>
          </div>
          <div className="admin-identity-col">
            <div className="admin-name-row">
              <span className="admin-full-name">{activeAdmin.name}</span>
              <span className="superadmin-pill">
                {activeAdmin.role ? activeAdmin.role.toUpperCase() : 'SUPERADMIN'}
              </span>
            </div>
            <span className="admin-email-tag">{activeAdmin.email}</span>
          </div>
        </div>

        <div className="admin-header-actions-row">
          <div className="admin-page-title-badge">
            <span>{getPageTitle()}</span>
          </div>

          <button
            type="button"
            className="admin-refresh-btn"
            onClick={() => loadDashboardData(dateRange, true)}
            title="Refresh Live Data"
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
          </button>

          <button
            type="button"
            className="admin-logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
            title="Sign Out"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Horizontal & Responsive Navigation Strip */}
      <div className={`admin-nav-tabs-wrapper ${showMobileNav ? 'mobile-open' : ''}`}>
        <div className="admin-nav-tabs scrollable-nav-tabs">
          {NAV_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                className={`admin-nav-tab ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(sec.id);
                  setShowMobileNav(false);
                }}
              >
                <Icon size={14} />
                <span>{sec.label}</span>
                {sec.badge > 0 && (
                  <span className={`tab-pending-badge ${sec.badgeColor || ''}`}>{sec.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="admin-tab-content fade-in">
          {/* Date Range Selector & 2FA Status Strip */}
          <div className="admin-controls-strip">
            <div className="admin-date-filter-group">
              <span className="filter-label">
                <Calendar size={13} />
                <span>Range:</span>
              </span>
              <div className="range-pills-row">
                {[
                  { id: '7d', label: '7D' },
                  { id: '30d', label: '30D' },
                  { id: '90d', label: '90D' },
                  { id: '1y', label: '1Y' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`range-pill-btn ${dateRange === r.id ? 'active' : ''}`}
                    onClick={() => setDateRange(r.id)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-session-security-pill" title="Hardware 2FA Active">
              <ShieldCheck size={13} color="#10B981" />
              <span>2FA Protected</span>
            </div>
          </div>

          {/* Action Alerts Jump Strip */}
          <div className="admin-alerts-jump-grid">
            <div
              className={`admin-alert-jump-card ${pendingApprovalsCount > 0 ? 'has-pending' : ''}`}
              onClick={() => setActiveTab('venues')}
              role="button"
              tabIndex={0}
            >
              <div className="alert-jump-left">
                <div className="alert-jump-icon-box amber"><Building2 size={18} /></div>
                <div className="alert-jump-text">
                  <span className="alert-jump-title">Pending Venue Approvals</span>
                  <span className="alert-jump-sub">
                    {pendingApprovalsCount > 0 ? `${pendingApprovalsCount} new KYC requests awaiting review` : 'All venues verified'}
                  </span>
                </div>
              </div>
              <div className="alert-jump-action">
                <span className="jump-badge amber">{pendingApprovalsCount}</span>
                <ChevronRight size={16} color="#94A3B8" />
              </div>
            </div>

            <div
              className={`admin-alert-jump-card ${openTicketsCount > 0 ? 'has-tickets' : ''}`}
              onClick={() => setActiveTab('support')}
              role="button"
              tabIndex={0}
            >
              <div className="alert-jump-left">
                <div className="alert-jump-icon-box blue"><HelpCircle size={18} /></div>
                <div className="alert-jump-text">
                  <span className="alert-jump-title">Open Support Tickets</span>
                  <span className="alert-jump-sub">
                    {openTicketsCount > 0 ? `${openTicketsCount} dispute tickets need attention` : 'No open support issues'}
                  </span>
                </div>
              </div>
              <div className="alert-jump-action">
                <span className="jump-badge blue">{openTicketsCount}</span>
                <ChevronRight size={16} color="#94A3B8" />
              </div>
            </div>
          </div>

          {/* Main KPI Overview Cards */}
          {summaryData?.metrics && (
            <div className="admin-kpi-grid">
              <div className="admin-kpi-card clickable" onClick={() => setActiveTab('users')}>
                <div className="kpi-top-row">
                  <div className="kpi-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}><Users size={18} /></div>
                  <span className="kpi-growth-pill positive"><ArrowUpRight size={12} />{summaryData.metrics.totalUsers.growth}</span>
                </div>
                <div className="kpi-value-col">
                  <span className="kpi-num">{summaryData.metrics.totalUsers.formatted}</span>
                  <span className="kpi-label">Total Users</span>
                </div>
                <span className="kpi-subtext">{summaryData.metrics.totalUsers.playersCount} players • {summaryData.metrics.totalUsers.ownersCount} owners</span>
              </div>

              <div className="admin-kpi-card clickable" onClick={() => setActiveTab('venues')}>
                <div className="kpi-top-row">
                  <div className="kpi-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}><Building2 size={18} /></div>
                  <span className="kpi-growth-pill positive"><ArrowUpRight size={12} />{summaryData.metrics.totalVenues.growth}</span>
                </div>
                <div className="kpi-value-col">
                  <span className="kpi-num">{summaryData.metrics.totalVenues.formatted}</span>
                  <span className="kpi-label">Partner Venues</span>
                </div>
                <span className="kpi-subtext">{summaryData.metrics.totalVenues.verifiedCount} active • <strong style={{ color: '#D97706' }}>{pendingApprovalsCount} pending</strong></span>
              </div>

              <div className="admin-kpi-card clickable" onClick={() => setActiveTab('bookings')}>
                <div className="kpi-top-row">
                  <div className="kpi-icon-box" style={{ background: '#F5F3FF', color: '#7C3AED' }}><Calendar size={18} /></div>
                  <span className="kpi-growth-pill positive"><ArrowUpRight size={12} />{summaryData.metrics.totalBookings.growth}</span>
                </div>
                <div className="kpi-value-col">
                  <span className="kpi-num">{summaryData.metrics.totalBookings.formatted}</span>
                  <span className="kpi-label">Total Bookings</span>
                </div>
                <span className="kpi-subtext">{summaryData.metrics.totalBookings.completedRate} completion rate</span>
              </div>

              <div className="admin-kpi-card highlight-revenue clickable" onClick={() => setActiveTab('commission')}>
                <div className="kpi-top-row">
                  <div className="kpi-icon-box" style={{ background: '#ECFDF5', color: '#10B981' }}><DollarSign size={18} /></div>
                  <span className="kpi-growth-pill positive"><ArrowUpRight size={12} />{summaryData.metrics.totalRevenue.growth}</span>
                </div>
                <div className="kpi-value-col">
                  <span className="kpi-num">{summaryData.metrics.totalRevenue.formatted}</span>
                  <span className="kpi-label">Gross Platform Revenue</span>
                </div>
                <span className="kpi-subtext" style={{ color: '#047857', fontWeight: 600 }}>{summaryData.metrics.totalRevenue.platformCutFormatted}</span>
              </div>
            </div>
          )}

          {/* Revenue Overview Interactive Chart Card */}
          {revenueData && (
            <div className="admin-content-card" style={{ marginTop: '1rem' }}>
              <div className="card-header-row">
                <div>
                  <h2 className="admin-section-heading">Revenue Overview Chart</h2>
                  <p className="admin-subtext">{summaryData?.dateRangeLabel || 'Last 30 Days'} • Platform GMV & Booking Volume</p>
                </div>
                <div className="chart-metric-toggle">
                  <button type="button" className={`metric-toggle-btn ${chartMetric === 'revenue' ? 'active' : ''}`} onClick={() => setChartMetric('revenue')}>₹ Revenue</button>
                  <button type="button" className={`metric-toggle-btn ${chartMetric === 'bookings' ? 'active' : ''}`} onClick={() => setChartMetric('bookings')}># Bookings</button>
                </div>
              </div>

              <div className="revenue-visual-chart-container">
                <div className="chart-bars-row">
                  {revenueData.timeline.map((item, idx) => {
                    const maxVal = Math.max(...revenueData.timeline.map((t) => (chartMetric === 'revenue' ? t.revenue : t.bookings)));
                    const currVal = chartMetric === 'revenue' ? item.revenue : item.bookings;
                    const heightPercent = Math.max(18, Math.round((currVal / (maxVal || 1)) * 100));
                    const isHovered = hoveredBarIndex === idx;

                    return (
                      <div key={idx} className="chart-bar-column" onMouseEnter={() => setHoveredBarIndex(idx)} onMouseLeave={() => setHoveredBarIndex(null)}>
                        {isHovered && (
                          <div className="chart-bar-tooltip fade-in">
                            <span className="tooltip-title">{item.label}</span>
                            <span className="tooltip-rev">₹{item.revenue.toLocaleString('en-IN')}</span>
                            <span className="tooltip-sub">{item.bookings} bookings • ₹{item.commission.toLocaleString('en-IN')} cut</span>
                          </div>
                        )}
                        <div className="bar-track">
                          <div
                            className={`bar-fill ${isHovered ? 'hovered' : ''}`}
                            style={{
                              height: `${heightPercent}%`,
                              background: chartMetric === 'revenue' ? 'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)' : 'linear-gradient(180deg, #8B5CF6 0%, #6D28D9 100%)',
                            }}
                          />
                        </div>
                        <span className="bar-label">{item.label.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VENUE APPROVALS QUEUE */}
      {activeTab === 'venues' && (
        <div className="admin-tab-content fade-in">
          <AdminVenueApprovalScreen adminSession={adminSession} onBackToDashboard={() => setActiveTab('overview')} />
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="admin-tab-content fade-in">
          <AdminUserManagementScreen adminSession={adminSession} onBackToDashboard={() => setActiveTab('overview')} />
        </div>
      )}

      {/* TAB 4: OWNER MANAGEMENT */}
      {activeTab === 'owners' && (
        <div className="admin-tab-content fade-in">
          <AdminOwnerManagementScreen adminSession={adminSession} onBackToDashboard={() => setActiveTab('overview')} />
        </div>
      )}

      {/* TAB 5: BOOKINGS MANAGEMENT */}
      {activeTab === 'bookings' && (
        <div className="admin-tab-content fade-in">
          <AdminBookingManagementScreen adminSession={adminSession} onBackToDashboard={() => setActiveTab('overview')} />
        </div>
      )}

      {/* TAB 6: COMMISSION & PAYMENTS */}
      {activeTab === 'commission' && (
        <div className="admin-tab-content fade-in">
          <AdminCommissionScreen adminSession={adminSession} onBackToDashboard={() => setActiveTab('overview')} />
        </div>
      )}

      {/* TAB 7: COUPONS & PROMOTIONS */}
      {activeTab === 'coupons' && (
        <div className="admin-tab-content fade-in">
          <AdminCouponsScreen adminSession={adminSession} onBackToDashboard={() => setActiveTab('overview')} />
        </div>
      )}

      {/* TAB 8: REPORTS & ANALYTICS */}
      {activeTab === 'reports' && (
        <div className="admin-tab-content fade-in">
          <AdminReportsScreen adminSession={adminSession} onBackToDashboard={() => setActiveTab('overview')} />
        </div>
      )}

      {/* TAB 9: CONTENT MANAGEMENT */}
      {activeTab === 'content' && (
        <div className="admin-tab-content fade-in">
          <AdminContentScreen adminSession={adminSession} onBackToDashboard={() => setActiveTab('overview')} />
        </div>
      )}

      {/* TAB 10: SUPPORT TICKETS */}
      {activeTab === 'support' && (
        <div className="admin-tab-content fade-in">
          <AdminSupportScreen adminSession={adminSession} onBackToDashboard={() => setActiveTab('overview')} />
        </div>
      )}

      {/* TAB 11: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="admin-tab-content fade-in">
          <AdminSettingsScreen adminSession={adminSession} onBackToDashboard={() => setActiveTab('overview')} />
        </div>
      )}

      {/* TAB 12: SECURITY AUDIT */}
      {activeTab === 'security' && (
        <div className="admin-tab-content fade-in">
          <div className="admin-content-card">
            <div className="card-header-row">
              <div>
                <h2 className="admin-section-heading">Security & 2FA Audit Trail</h2>
                <p className="admin-subtext">Immutable log of authentication challenges, privileges, and session events</p>
              </div>
              <span className="audit-count-badge">{auditLogs.length} events logged</span>
            </div>

            <div className="audit-search-row" style={{ marginTop: '0.75rem' }}>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Filter by action, email, or IP address..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  style={{ height: '36px', fontSize: '0.8125rem' }}
                />
                <span className="input-icon-right"><Search size={15} color="#94A3B8" /></span>
              </div>
            </div>

            <div className="audit-logs-table" style={{ marginTop: '0.75rem' }}>
              {auditLogs
                .filter((log) => {
                  if (!auditSearch) return true;
                  const q = auditSearch.toLowerCase();
                  return (
                    (log.action && log.action.toLowerCase().includes(q)) ||
                    (log.email && log.email.toLowerCase().includes(q)) ||
                    (log.ipAddress && log.ipAddress.toLowerCase().includes(q))
                  );
                })
                .map((log, idx) => (
                  <div key={log.id || idx} className="audit-log-row">
                    <div className="audit-icon-col">
                      {log.action?.includes('SUCCESS') ? (
                        <CheckCircle size={16} color="#10B981" />
                      ) : log.action?.includes('FAILED') || log.action?.includes('LOCKED') ? (
                        <LogOut size={16} color="#EF4444" />
                      ) : (
                        <KeyRound size={16} color="#2563EB" />
                      )}
                    </div>
                    <div className="audit-content-col">
                      <div className="audit-action-title">
                        <code>{log.action}</code>
                        <span className="audit-time-stamp">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <div className="audit-meta-text">
                        Admin: <strong>{log.email || 'System'}</strong> • IP: {log.ipAddress || '192.168.1.104'}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Switch to Player / Owner App helper link */}
      <div className="admin-footer-actions" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button
          type="button"
          className="link-btn"
          onClick={onNavigateToUserApp}
          style={{ fontSize: '0.85rem', color: '#64748B' }}
        >
          ← Return to Player & Turf Owner Frontends
        </button>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 140 }}>
          <div className="modal-container" style={{ maxWidth: '340px' }}>
            <div className="modal-icon-header" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              <LogOut size={24} />
            </div>
            <h3 className="modal-title">Sign Out of Admin Console?</h3>
            <p className="modal-description">
              Your 2FA session token will be destroyed and active administrative privileges revoked.
            </p>
            <div className="modal-actions-row">
              <button type="button" className="btn-secondary" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleSignOut} style={{ background: '#DC2626', color: '#FFFFFF', border: 'none' }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
