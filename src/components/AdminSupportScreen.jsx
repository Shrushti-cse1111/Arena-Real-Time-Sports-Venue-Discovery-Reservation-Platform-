import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Search,
  Filter,
  RefreshCw,
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  User,
  AlertTriangle,
  X
} from 'lucide-react';
import { adminSupportService } from '../services/adminSupportService';

export default function AdminSupportScreen({
  adminSession,
  onBackToDashboard,
}) {
  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState({ all: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // Selected Ticket Drawer
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const activeAdmin = adminSession || {
    adminId: 'ADM-9001',
    name: 'Sarah Connor',
    email: 'admin@arena.com',
    role: 'superadmin',
  };

  const loadTickets = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await adminSupportService.getTickets({
        search: searchQuery,
        status: statusFilter,
        priority: priorityFilter,
      });

      if (res.success) {
        setTickets(res.tickets);
        setCounts(res.counts);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter, searchQuery]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const res = await adminSupportService.addReply(selectedTicket.id, replyText.trim(), activeAdmin.name);
      if (res.success) {
        setSelectedTicket(res.ticket);
        setReplyText('');
        loadTickets(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to send reply.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await adminSupportService.updateTicketStatus(selectedTicket.id, newStatus, activeAdmin.adminId, activeAdmin.name);
      if (res.success) {
        setSelectedTicket(res.ticket);
        setActionNotice(`Ticket ${selectedTicket.id} marked as ${newStatus}.`);
        setTimeout(() => setActionNotice(''), 4000);
        loadTickets(true);
      }
    } catch (err) {
      alert(err.message || 'Status update failed.');
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      const res = await adminSupportService.updateTicketPriority(selectedTicket.id, newPriority);
      if (res.success) {
        setSelectedTicket(res.ticket);
        loadTickets(true);
      }
    } catch (err) {
      alert(err.message || 'Priority update failed.');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!internalNoteText.trim()) return;
    try {
      const res = await adminSupportService.addInternalNote(selectedTicket.id, internalNoteText.trim());
      if (res.success) {
        setSelectedTicket(res.ticket);
        setInternalNoteText('');
      }
    } catch (err) {
      alert(err.message || 'Failed to add internal note.');
    }
  };

  return (
    <div className="admin-support-screen fade-in">
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
              <div className="admin-title-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <HelpCircle size={20} />
              </div>
              <div>
                <h2 className="admin-section-heading" style={{ margin: 0 }}>Support Tickets & Dispute Desk</h2>
                <p className="admin-subtext" style={{ margin: 0 }}>
                  Manage player disputes, booking conflict claims, refund requests & partner inquiries
                </p>
              </div>
            </div>
          </div>

          <button type="button" className="admin-refresh-btn" onClick={() => loadTickets(true)} disabled={isRefreshing}>
            <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
          </button>
        </div>

        {/* Counts */}
        <div className="user-kpi-summary-strip" style={{ marginTop: '1rem' }}>
          <div className="user-kpi-pill">
            <span className="pill-val">{counts.all}</span>
            <span className="pill-lbl">Total Tickets</span>
          </div>
          <div className="user-kpi-pill blocked-pill">
            <span className="pill-val">{counts.open}</span>
            <span className="pill-lbl">Open (Pending Action)</span>
          </div>
          <div className="user-kpi-pill" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
            <span className="pill-val" style={{ color: '#D97706' }}>{counts.inProgress}</span>
            <span className="pill-lbl">In Progress</span>
          </div>
          <div className="user-kpi-pill active-pill">
            <span className="pill-val">{counts.resolved}</span>
            <span className="pill-lbl">Resolved</span>
          </div>
        </div>

        {/* Filters */}
        <div className="user-mgmt-filter-bar" style={{ marginTop: '1rem' }}>
          <div className="input-wrapper user-search-wrapper" style={{ flex: 1 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search by ticket ID, subject, customer, category..."
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
              { id: 'all', label: 'All', count: counts.all },
              { id: 'open', label: 'Open', count: counts.open },
              { id: 'in progress', label: 'In Progress', count: counts.inProgress },
              { id: 'resolved', label: 'Resolved', count: counts.resolved },
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

          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ height: '38px' }}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="admin-loading-container" style={{ padding: '2.5rem 0', textAlign: 'center' }}>
            <RefreshCw size={24} className="spin-icon" color="#2563EB" />
            <p style={{ marginTop: '0.5rem', color: '#64748B', fontSize: '0.85rem' }}>Loading support tickets...</p>
          </div>
        ) : (
          <div className="support-tickets-list" style={{ marginTop: '1rem' }}>
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`ticket-item-card priority-${ticket.priority}`}
                onClick={() => setSelectedTicket(ticket)}
                role="button"
                tabIndex={0}
              >
                <div className="ticket-top-row">
                  <div className="ticket-id-tag">
                    <span>{ticket.id}</span>
                    <span className="complaint-cat-chip">{ticket.category}</span>
                    <span className={`priority-pill ${ticket.priority}`}>{ticket.priority.toUpperCase()}</span>
                  </div>
                  <span className={`ticket-status-tag ${ticket.status.toLowerCase().replace(' ', '-')}`}>
                    {ticket.status}
                  </span>
                </div>

                <h4 className="ticket-subject">{ticket.subject}</h4>

                <div className="ticket-footer-row">
                  <span className="ticket-user-meta">
                    👤 {ticket.user.name} ({ticket.user.role}) • {ticket.user.phone}
                  </span>
                  <span className="ticket-time">{ticket.createdAt}</span>
                </div>

                {ticket.relatedBookingId && (
                  <div className="ticket-booking-ref" style={{ marginTop: '0.35rem' }}>
                    <span>Linked Booking: <strong>{ticket.relatedBookingId}</strong> ({ticket.amount})</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TICKET DETAIL & REPLY DRAWER MODAL */}
      {selectedTicket && (
        <div className="modal-backdrop fade-in" style={{ zIndex: 120 }}>
          <div className="modal-container user-details-modal-container" style={{ maxWidth: '560px' }}>
            <div className="user-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="ledger-id-tag">{selectedTicket.id}</span>
                  <span className={`priority-pill ${selectedTicket.priority}`}>{selectedTicket.priority.toUpperCase()}</span>
                  <span className={`status-badge-sm ${selectedTicket.status.toLowerCase()}`}>{selectedTicket.status}</span>
                </div>
                <h4 style={{ margin: '0.3rem 0 0', fontSize: '0.95rem', color: '#0F172A' }}>{selectedTicket.subject}</h4>
              </div>
              <button type="button" className="close-notice-btn" onClick={() => setSelectedTicket(null)}>✕</button>
            </div>

            <div className="user-modal-tab-content">
              {/* User meta banner */}
              <div style={{ background: '#F8FAFC', padding: '0.65rem', borderRadius: '6px', fontSize: '0.78rem', color: '#475569' }}>
                User: <strong>{selectedTicket.user.name}</strong> ({selectedTicket.user.email}) • Phone: <strong>{selectedTicket.user.phone}</strong>
                {selectedTicket.relatedBookingId && (
                  <span style={{ display: 'block', marginTop: '0.2rem', color: '#2563EB', fontWeight: 600 }}>
                    Associated Booking: {selectedTicket.relatedBookingId} ({selectedTicket.amount})
                  </span>
                )}
              </div>

              {/* Status & Priority Controls */}
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Status:</span>
                {['Open', 'In Progress', 'Resolved', 'Closed'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`segmented-tab-btn ${selectedTicket.status === s ? 'active' : ''}`}
                    onClick={() => handleStatusChange(s)}
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                  >
                    {s}
                  </button>
                ))}

                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginLeft: 'auto' }}>Priority:</span>
                {['low', 'medium', 'high'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`segmented-tab-btn ${selectedTicket.priority === p ? 'active' : ''}`}
                    onClick={() => handlePriorityChange(p)}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', textTransform: 'capitalize' }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Conversation Messages Stream */}
              <div className="user-info-section-group" style={{ marginTop: '0.85rem' }}>
                <h4 className="info-group-title">Message Thread</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto', padding: '0.35rem 0' }}>
                  {selectedTicket.messages.map((m) => {
                    const isAdmin = m.senderType === 'admin';
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          background: isAdmin ? '#EFF6FF' : '#F1F5F9',
                          border: `1px solid ${isAdmin ? '#BFDBFE' : '#E2E8F0'}`,
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.6875rem', color: '#64748B', marginBottom: '0.2rem' }}>
                          <strong>{m.sender}</strong>
                          <span>{m.time}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#0F172A' }}>{m.text}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '0.4rem', marginTop: '0.65rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Type official response to user..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn-primary" disabled={isSubmittingReply} style={{ padding: '0 0.85rem' }}>
                    <Send size={14} />
                  </button>
                </form>
              </div>

              {/* Internal Notes */}
              <div className="user-info-section-group" style={{ marginTop: '0.85rem' }}>
                <h4 className="info-group-title">Internal Admin Notes (Private)</h4>
                {selectedTicket.internalNotes?.map((n, i) => (
                  <p key={i} style={{ margin: '0.25rem 0', fontSize: '0.75rem', color: '#64748B', background: '#FFFBEB', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                    🔒 {n}
                  </p>
                ))}
                <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Add private note for admin team..."
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                    style={{ flex: 1, fontSize: '0.78rem' }}
                  />
                  <button type="submit" className="btn-secondary" style={{ padding: '0 0.65rem', fontSize: '0.75rem' }}>
                    Add Note
                  </button>
                </form>
              </div>
            </div>

            <div className="user-modal-actions-footer">
              <button type="button" className="btn-secondary" onClick={() => setSelectedTicket(null)}>Close Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
