import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Eye,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  X,
  Check,
  Image as ImageIcon,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { adminVenueService } from '../services/adminVenueService';

export default function AdminVenueApprovalScreen({
  adminSession,
  onBackToDashboard,
  initialFilter = 'all',
}) {
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter); // 'all' | 'pending' | 'approved' | 'rejected'
  const [sportFilter, setSportFilter] = useState('all');

  // Data states
  const [venues, setVenues] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Actions
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectVenueTarget, setRejectVenueTarget] = useState(null);
  const [rejectError, setRejectError] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Active admin info
  const activeAdmin = adminSession || {
    adminId: 'ADM-9001',
    name: 'Sarah Connor',
  };

  // Load venues from API
  const fetchVenues = async () => {
    setIsLoading(true);
    try {
      const res = await adminVenueService.getVenues({
        search: searchQuery,
        status: statusFilter,
        sport: sportFilter,
      });

      setVenues(res.venues || []);
      setCounts(res.counts || { all: 0, pending: 0, approved: 0, rejected: 0 });

      // If a venue modal is open, keep its details updated
      if (selectedVenue) {
        const refreshed = (res.venues || []).find((v) => v.id === selectedVenue.id);
        if (refreshed) setSelectedVenue(refreshed);
      }
    } catch (err) {
      console.error('Failed to load venue queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [searchQuery, statusFilter, sportFilter]);

  // Handle Approve Action
  const handleApprove = async (venue) => {
    setIsSubmittingAction(true);
    try {
      const res = await adminVenueService.approveVenue(
        venue.id,
        activeAdmin.adminId || 'ADM-9001',
        activeAdmin.name || 'Sarah Connor',
        'Verified by Superadmin. All compliance documents in order.'
      );

      if (res.success) {
        setToastMessage(`✓ "${venue.name}" approved! Venue is now active and visible to players.`);
        setTimeout(() => setToastMessage(''), 5000);
        await fetchVenues();
      }
    } catch (err) {
      alert(err.message || 'Failed to approve venue.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Open Reject Modal
  const handleOpenRejectModal = (venue) => {
    setRejectVenueTarget(venue);
    setRejectReason('');
    setRejectError('');
    setShowRejectModal(true);
  };

  // Submit Reject Action (Requires Reason)
  const handleConfirmReject = async (e) => {
    if (e) e.preventDefault();
    setRejectError('');

    if (!rejectReason || rejectReason.trim().length < 5) {
      setRejectError('Please enter a specific reason for rejection (minimum 5 characters).');
      return;
    }

    setIsSubmittingAction(true);

    try {
      const res = await adminVenueService.rejectVenue(
        rejectVenueTarget.id,
        rejectReason.trim(),
        activeAdmin.adminId || 'ADM-9001',
        activeAdmin.name || 'Sarah Connor'
      );

      if (res.success) {
        setShowRejectModal(false);
        setRejectVenueTarget(null);
        setRejectReason('');
        setToastMessage(`✕ "${rejectVenueTarget.name}" rejected. Reason recorded for partner.`);
        setTimeout(() => setToastMessage(''), 5000);
        await fetchVenues();
      }
    } catch (err) {
      setRejectError(err.message || 'Failed to reject venue.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="screen-body fade-in admin-venue-approval-screen" style={{ paddingBottom: '3.5rem' }}>
      {/* Toast Notice */}
      {toastMessage && (
        <div className="admin-action-toast fade-in">
          <CheckCircle2 size={16} color="#10B981" />
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage('')} className="toast-close-btn">✕</button>
        </div>
      )}

      {/* Screen Header */}
      <div className="venue-queue-header">
        <div className="queue-title-row">
          {onBackToDashboard && (
            <button
              type="button"
              className="admin-back-btn"
              onClick={onBackToDashboard}
              title="Return to Dashboard Overview"
            >
              <ArrowLeft size={16} />
              <span>Dashboard</span>
            </button>
          )}

          <div className="queue-heading-group">
            <h1 className="queue-main-title">Venue Approval Queue</h1>
            <p className="queue-sub-title">Review KYC documentation, court pricing, and list approved turfs</p>
          </div>
        </div>

        <div className="pending-counter-pill">
          <Clock size={14} color="#D97706" />
          <span><strong>{counts.pending}</strong> pending reviews</span>
        </div>
      </div>

      {/* Search & Sport Filter Bar */}
      <div className="venue-filter-controls-card">
        {/* Search Field */}
        <div className="input-wrapper" style={{ flex: 1 }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search by venue name, owner, area, GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ height: '38px', fontSize: '0.84rem' }}
          />
          <span className="input-icon-right">
            <Search size={16} color="#94A3B8" />
          </span>
        </div>

        {/* Sport Filter */}
        <select
          className="filter-select"
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          style={{ height: '38px' }}
        >
          <option value="all">All Sports</option>
          <option value="Badminton">Badminton</option>
          <option value="Football">Football</option>
          <option value="Cricket">Cricket</option>
          <option value="Tennis">Tennis</option>
          <option value="Pickleball">Pickleball</option>
          <option value="Squash">Squash</option>
        </select>
      </div>

      {/* Status Segment Tabs: Pending / Approved / Rejected / All */}
      <div className="queue-status-segments">
        {[
          { id: 'all', label: 'All Venues', count: counts.all },
          { id: 'pending', label: 'Pending', count: counts.pending, badgeColor: 'amber' },
          { id: 'approved', label: 'Approved', count: counts.approved, badgeColor: 'green' },
          { id: 'rejected', label: 'Rejected', count: counts.rejected, badgeColor: 'red' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`status-segment-btn ${statusFilter === tab.id ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab.id)}
          >
            <span>{tab.label}</span>
            <span className={`segment-count-badge ${tab.badgeColor || 'default'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Venue Approval Queue Table & Cards */}
      <div className="venue-queue-table-container">
        {isLoading ? (
          <div className="queue-loading-box">
            <span className="admin-spinner" style={{ borderColor: '#2563EB', borderTopColor: 'transparent' }} />
            <span>Loading venue approval records...</span>
          </div>
        ) : venues.length === 0 ? (
          <div className="queue-empty-box">
            <Building2 size={36} color="#94A3B8" />
            <h3 className="empty-title">No Venues Found</h3>
            <p className="empty-sub">
              {searchQuery || statusFilter !== 'all' || sportFilter !== 'all'
                ? 'No venue registrations match your filter criteria.'
                : 'There are currently no venue KYC records in this queue.'}
            </p>
          </div>
        ) : (
          <div className="venue-rows-list">
            {venues.map((venue) => {
              const isPending = venue.status === 'pending';
              const isApproved = venue.status === 'approved' || venue.status === 'verified';
              const isRejected = venue.status === 'rejected';

              return (
                <div key={venue.id} className={`venue-queue-card status-${venue.status}`}>
                  {/* Card Header */}
                  <div className="queue-card-top-bar">
                    <div className="venue-name-group">
                      <div className="venue-code-badge">{venue.id}</div>
                      <h3 className="venue-title-text">{venue.name}</h3>
                    </div>

                    <span className={`queue-status-tag ${venue.status}`}>
                      {isApproved ? '✓ Approved' : isRejected ? '✕ Rejected' : '⏳ Pending Review'}
                    </span>
                  </div>

                  {/* Card Body: Owner, Location, Sports, Pricing */}
                  <div className="queue-card-grid">
                    <div className="grid-cell">
                      <span className="cell-label">Owner</span>
                      <span className="cell-val">
                        <strong>{venue.owner.name}</strong>
                      </span>
                      <span className="cell-sub">{venue.owner.phone}</span>
                    </div>

                    <div className="grid-cell">
                      <span className="cell-label">Sports & Courts</span>
                      <span className="cell-val">{venue.sports.join(', ')}</span>
                      <span className="cell-sub">{venue.courtsCount} Court(s) registered</span>
                    </div>

                    <div className="grid-cell">
                      <span className="cell-label">Location</span>
                      <span className="cell-val">{venue.location.area}, {venue.location.city}</span>
                      <span className="cell-sub">{venue.location.pincode}</span>
                    </div>

                    <div className="grid-cell">
                      <span className="cell-label">Pricing</span>
                      <span className="cell-val">₹{venue.pricing?.baseHourlyRate || 650}/hr</span>
                      <span className="cell-sub">Peak: ₹{venue.pricing?.peakHourlyRate || 900}/hr</span>
                    </div>
                  </div>

                  {/* Documents Verified Row */}
                  <div className="queue-docs-bar">
                    <span className="docs-bar-label">KYC Documents ({venue.documents?.length || 0}):</span>
                    <div className="docs-badges-wrap">
                      {venue.documents?.map((doc, idx) => (
                        <span key={idx} className="doc-item-pill" title={doc.number || doc.fileName}>
                          <FileText size={12} color="#2563EB" />
                          <span>{doc.type.split(' ')[0]}</span>
                        </span>
                      ))}
                    </div>
                    <span className="submitted-time-tag">
                      <Calendar size={11} /> {venue.submittedAt}
                    </span>
                  </div>

                  {/* Rejection Reason if applicable */}
                  {isRejected && venue.rejectionReason && (
                    <div className="rejection-notice-box">
                      <AlertTriangle size={13} color="#DC2626" />
                      <span><strong>Rejection Reason:</strong> {venue.rejectionReason}</span>
                    </div>
                  )}

                  {/* Card Action Row */}
                  <div className="queue-action-row">
                    <button
                      type="button"
                      className="btn-view-details"
                      onClick={() => setSelectedVenue(venue)}
                    >
                      <Eye size={14} />
                      <span>View Full Dossier</span>
                    </button>

                    {isPending && (
                      <div className="approval-btn-group">
                        <button
                          type="button"
                          className="btn-approve-action"
                          onClick={() => handleApprove(venue)}
                          disabled={isSubmittingAction}
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          className="btn-reject-action"
                          onClick={() => handleOpenRejectModal(venue)}
                          disabled={isSubmittingAction}
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FULL VENUE DETAILS MODAL / DOSSIER */}
      {selectedVenue && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 110 }}>
          <div className="modal-container venue-dossier-modal">
            {/* Modal Header */}
            <div className="dossier-header-bar">
              <div className="dossier-title-col">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building2 size={20} color="#2563EB" />
                  <h2 className="dossier-venue-title">{selectedVenue.name}</h2>
                </div>
                <span className="dossier-venue-code">{selectedVenue.id} • {selectedVenue.location.area}, {selectedVenue.location.city}</span>
              </div>

              <button
                type="button"
                className="close-notice-btn"
                onClick={() => setSelectedVenue(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="dossier-content-body">
              {/* Status Header */}
              <div className={`dossier-status-banner status-${selectedVenue.status}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {selectedVenue.status === 'approved' || selectedVenue.status === 'verified' ? (
                    <CheckCircle2 size={16} color="#10B981" />
                  ) : selectedVenue.status === 'rejected' ? (
                    <XCircle size={16} color="#DC2626" />
                  ) : (
                    <Clock size={16} color="#D97706" />
                  )}
                  <span>
                    Status:{' '}
                    <strong>
                      {selectedVenue.status === 'approved' || selectedVenue.status === 'verified'
                        ? 'Approved & Live in Player Search'
                        : selectedVenue.status === 'rejected'
                        ? 'Rejected (Hidden from Public Search)'
                        : 'Pending Compliance Review'}
                    </strong>
                  </span>
                </div>
                <span className="dossier-timestamp">Submitted: {selectedVenue.submittedAt}</span>
              </div>

              {/* Rejection Note if exists */}
              {selectedVenue.status === 'rejected' && selectedVenue.rejectionReason && (
                <div className="dossier-rejection-alert">
                  <AlertTriangle size={15} color="#DC2626" />
                  <div>
                    <strong>Mandatory Rejection Reason:</strong>
                    <p style={{ margin: 0, marginTop: '2px' }}>{selectedVenue.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Section 1: Venue Information & Description */}
              <div className="dossier-section">
                <h3 className="section-title">1. Venue Information</h3>
                <p className="dossier-desc-text">{selectedVenue.description}</p>
                <div className="dossier-amenities-row">
                  {selectedVenue.amenities?.map((am, i) => (
                    <span key={i} className="amenity-chip">✓ {am}</span>
                  ))}
                </div>
              </div>

              {/* Section 2: Owner Information */}
              <div className="dossier-section">
                <h3 className="section-title">2. Owner & Entity Profile</h3>
                <div className="dossier-info-grid">
                  <div className="info-cell">
                    <span className="cell-lbl">Owner Full Name</span>
                    <span className="cell-val"><strong>{selectedVenue.owner.name}</strong></span>
                  </div>
                  <div className="info-cell">
                    <span className="cell-lbl">Registered Business Entity</span>
                    <span className="cell-val">{selectedVenue.owner.businessName || 'Sports Business'}</span>
                  </div>
                  <div className="info-cell">
                    <span className="cell-lbl">Direct Mobile</span>
                    <span className="cell-val">{selectedVenue.owner.phone}</span>
                  </div>
                  <div className="info-cell">
                    <span className="cell-lbl">Official Email</span>
                    <span className="cell-val">{selectedVenue.owner.email}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Sports, Courts & Pricing */}
              <div className="dossier-section">
                <h3 className="section-title">3. Sports, Courts & Hourly Pricing</h3>
                <div className="dossier-courts-list">
                  {selectedVenue.courts?.map((court, cIdx) => (
                    <div key={cIdx} className="dossier-court-row">
                      <div className="court-details-col">
                        <span className="court-name"><strong>{court.name}</strong></span>
                        <span className="court-surface-type">{court.type}</span>
                      </div>
                      <div className="court-pricing-col">
                        <span className="court-base-price">Base: ₹{court.basePrice}/hr</span>
                        <span className="court-peak-price">Peak: ₹{court.peakPrice}/hr</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Address & Location */}
              <div className="dossier-section">
                <h3 className="section-title">4. Location & Address</h3>
                <div className="dossier-address-box">
                  <MapPin size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span className="full-address-text">{selectedVenue.location.address}</span>
                    <span className="address-sub">{selectedVenue.location.area}, {selectedVenue.location.city}, {selectedVenue.location.state} - {selectedVenue.location.pincode}</span>
                  </div>
                </div>
              </div>

              {/* Section 5: Photos */}
              <div className="dossier-section">
                <h3 className="section-title">5. Venue Photos Gallery ({selectedVenue.photos?.length || 0})</h3>
                <div className="dossier-photos-grid">
                  {selectedVenue.photos?.map((photo, pIdx) => (
                    <img key={pIdx} src={photo} alt={`Venue Court ${pIdx + 1}`} className="dossier-photo-img" />
                  ))}
                </div>
              </div>

              {/* Section 6: GST, ID & Compliance Documents */}
              <div className="dossier-section">
                <h3 className="section-title">6. Tax, Bank & Compliance Documents</h3>
                <div className="dossier-docs-list">
                  {selectedVenue.documents?.map((doc, dIdx) => (
                    <div key={dIdx} className="dossier-doc-card">
                      <div className="doc-icon-col">
                        <FileText size={20} color="#2563EB" />
                      </div>
                      <div className="doc-info-col">
                        <div className="doc-type-title">{doc.type}</div>
                        <div className="doc-meta-sub">
                          Ref / ID: <code>{doc.number}</code> • {doc.fileName} ({doc.size})
                        </div>
                      </div>
                      <span className="doc-verified-check">✓ File Valid</span>
                    </div>
                  ))}
                </div>

                {/* Bank Account Info */}
                {selectedVenue.payoutBank && (
                  <div className="dossier-bank-box" style={{ marginTop: '0.65rem' }}>
                    <DollarSign size={16} color="#10B981" />
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>
                        Payout Bank: {selectedVenue.payoutBank.bankName} ({selectedVenue.payoutBank.branch})
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>
                        A/C: {selectedVenue.payoutBank.accountNumber} • IFSC: {selectedVenue.payoutBank.ifscCode}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 7: Audit History */}
              {selectedVenue.reviewHistory && selectedVenue.reviewHistory.length > 0 && (
                <div className="dossier-section">
                  <h3 className="section-title">7. Administrative Review Trail</h3>
                  <div className="dossier-audit-trail">
                    {selectedVenue.reviewHistory.map((hist, hIdx) => (
                      <div key={hIdx} className="audit-trail-item">
                        <div className="trail-top">
                          <span className={`action-pill ${hist.action.toLowerCase()}`}>{hist.action}</span>
                          <span className="trail-time">{new Date(hist.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="trail-admin">Reviewed by: <strong>{hist.adminName} ({hist.adminId})</strong></div>
                        <div className="trail-note">"{hist.note}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="dossier-footer-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedVenue(null)}
              >
                Close Dossier
              </button>

              {selectedVenue.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => {
                      setSelectedVenue(null);
                      handleOpenRejectModal(selectedVenue);
                    }}
                    style={{ flex: 1 }}
                  >
                    Reject with Reason
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={async () => {
                      await handleApprove(selectedVenue);
                      setSelectedVenue(null);
                    }}
                    style={{ flex: 1.5, background: '#10B981', borderColor: '#10B981' }}
                  >
                    Approve & Publish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT VENUE MODAL (MANDATORY REASON REQUIREMENT) */}
      {showRejectModal && rejectVenueTarget && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 120 }}>
          <div className="modal-container" style={{ maxWidth: '390px' }}>
            <div className="modal-icon-header" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              <AlertTriangle size={24} />
            </div>

            <h3 className="modal-title">Reject Venue Listing</h3>
            <p className="modal-description">
              You are rejecting <strong>"{rejectVenueTarget.name}"</strong>. Please provide a clear and actionable reason for the partner.
            </p>

            <form onSubmit={handleConfirmReject} style={{ marginTop: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="rejection-reason-input">
                  Reason for Rejection (Mandatory) *
                </label>
                <textarea
                  id="rejection-reason-input"
                  className={`input-field ${rejectError ? 'has-error' : ''}`}
                  rows={3}
                  placeholder="e.g. GSTIN certificate is expired / Fire Safety NOC not attached / Business address mismatch..."
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (rejectError) setRejectError('');
                  }}
                  style={{ height: '80px', padding: '0.5rem', resize: 'vertical' }}
                  required
                />
              </div>

              {rejectError && (
                <span className="error-text" style={{ display: 'block', margin: '0.35rem 0' }}>
                  {rejectError}
                </span>
              )}

              <div className="quick-reasons-row" style={{ margin: '0.5rem 0' }}>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>
                  Quick Templates:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {[
                    'GSTIN certificate expired',
                    'Missing Municipal Fire NOC',
                    'Address proof mismatch',
                    'Low resolution court photos',
                  ].map((tpl, tIdx) => (
                    <button
                      key={tIdx}
                      type="button"
                      className="demo-chip-btn"
                      onClick={() => setRejectReason(tpl)}
                      style={{ fontSize: '0.6875rem', padding: '0.2rem 0.4rem' }}
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions-row" style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectVenueTarget(null);
                  }}
                  disabled={isSubmittingAction}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-danger"
                  disabled={isSubmittingAction || !rejectReason.trim()}
                  style={{ background: '#DC2626', color: '#FFFFFF' }}
                >
                  {isSubmittingAction ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
