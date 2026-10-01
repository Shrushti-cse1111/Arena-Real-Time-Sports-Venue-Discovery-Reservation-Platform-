import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  HelpCircle,
  MessageSquare,
  Ticket,
  Search,
  Send,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  User,
  Paperclip,
  RotateCcw,
} from 'lucide-react';
import { supportService } from '../data/supportService';

export default function SupportCenterScreen({
  playerData,
  onBack,
  bookingContext = null,
  initialTab = 'faqs',
  onSelectBooking,
}) {
  const userId = playerData?.id || 'user-1';
  const userName = playerData?.fullName || 'Player';
  const userContact = playerData?.phoneNumber || playerData?.email || '';

  const [activeTab, setActiveTab] = useState(initialTab); // 'faqs' | 'tickets' | 'chat'
  
  // FAQ State
  const [faqCategory, setFaqCategory] = useState('all');
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState(null);
  const [votedFaqs, setVotedFaqs] = useState(new Set());

  // Ticket State
  const [tickets, setTickets] = useState(() => supportService.getUserTickets(userId));
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [ticketCategory, setTicketCategory] = useState(bookingContext ? 'Booking Cancellation' : 'General Inquiry');
  const [ticketSubject, setTicketSubject] = useState(bookingContext ? `Issue with booking ${bookingContext.bookingId || bookingContext.id}` : '');
  const [ticketDescription, setTicketDescription] = useState('');
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Live Chat State
  const [chatSession, setChatSession] = useState(() => supportService.getLiveChat(userId, bookingContext));
  const [chatInput, setChatInput] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const chatBottomRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, chatSession?.messages, isAgentTyping]);

  const faqsList = supportService.getFAQs(faqCategory, faqSearchQuery);

  const handleFAQVote = (faqId) => {
    if (votedFaqs.has(faqId)) return;
    supportService.incrementFAQHelpful(faqId);
    setVotedFaqs((prev) => new Set([...prev, faqId]));
    showToast('Thank you for your feedback!');
  };

  const handleCreateTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      showToast('Please fill in both subject and description.');
      return;
    }

    const result = supportService.createTicket({
      userId,
      userName,
      userContact,
      category: ticketCategory,
      subject: ticketSubject.trim(),
      description: ticketDescription.trim(),
      relatedBooking: bookingContext
        ? {
            bookingId: bookingContext.bookingId || bookingContext.id,
            venueName: bookingContext.venueName,
            courtName: bookingContext.courtName,
            date: bookingContext.dateFormatted || bookingContext.date,
            amount: bookingContext.finalPayable,
          }
        : null,
    });

    if (result.success) {
      setTickets(supportService.getUserTickets(userId));
      setShowCreateTicketModal(false);
      setTicketSubject('');
      setTicketDescription('');
      setActiveTab('tickets');
      showToast(`Support Ticket ${result.ticket.id} created successfully!`);
    } else {
      showToast(result.error || 'Failed to create ticket.');
    }
  };

  const handleTicketReplySubmit = (ticketId) => {
    if (!replyMessage.trim()) return;
    const res = supportService.addTicketReply(ticketId, userId, replyMessage);
    if (res.success) {
      setTickets(supportService.getUserTickets(userId));
      setReplyMessage('');
      showToast('Reply added to ticket thread.');
    }
  };

  const handleSendChat = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const text = chatInput;
    setChatInput('');

    supportService.sendChatMessage(
      userId,
      text,
      bookingContext,
      (typing) => setIsAgentTyping(typing),
      () => setChatSession({ ...supportService.getLiveChat(userId, bookingContext) })
    );

    setChatSession({ ...supportService.getLiveChat(userId, bookingContext) });
  };

  return (
    <div className="profile-container fade-in">
      {/* HEADER */}
      <header className="profile-header">
        <div className="profile-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button type="button" className="icon-btn" onClick={onBack} title="Back">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="profile-page-title">Help & Support</h1>
              <p className="profile-page-subtitle">24/7 Assistance, FAQs & Live Chat</p>
            </div>
          </div>
          <span className="default-pill" style={{ background: '#ECFDF5', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
            24/7 Live
          </span>
        </div>

        {/* TAB SEGMENTS */}
        <div className="bookings-tabs-segment" style={{ marginTop: '0.65rem' }}>
          <button
            type="button"
            className={`booking-tab-btn ${activeTab === 'faqs' ? 'active' : ''}`}
            onClick={() => setActiveTab('faqs')}
          >
            <HelpCircle size={14} />
            <span>FAQs</span>
          </button>

          <button
            type="button"
            className={`booking-tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <Ticket size={14} />
            <span>My Tickets ({tickets.length})</span>
          </button>

          <button
            type="button"
            className={`booking-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={14} />
            <span>Live Chat</span>
          </button>
        </div>
      </header>

      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="booking-toast-alert fade-in">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SCROLLABLE CONTENT */}
      <div className="profile-scroll-content">
        {/* =========================================================================
            TAB 1: FAQS & KNOWLEDGE BASE
            ========================================================================= */}
        {activeTab === 'faqs' && (
          <div className="fade-in">
            {/* SEARCH BAR */}
            <div className="input-wrapper" style={{ marginBottom: '0.85rem' }}>
              <Search size={16} className="input-icon" style={{ left: '12px' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '2.4rem', paddingRight: '2rem' }}
                placeholder="Search FAQs (e.g. refund, cancel, shoes)..."
                value={faqSearchQuery}
                onChange={(e) => setFaqSearchQuery(e.target.value)}
              />
              {faqSearchQuery && (
                <button
                  type="button"
                  onClick={() => setFaqSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* CATEGORY CHIPS */}
            <div className="sport-chips-scroll" style={{ marginBottom: '1rem' }}>
              {[
                { id: 'all', label: 'All FAQs' },
                { id: 'bookings', label: 'Bookings' },
                { id: 'payments', label: 'Payments & Refunds' },
                { id: 'venues', label: 'Venues & Rules' },
                { id: 'wallet', label: 'Account & Wallet' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`sport-chip ${faqCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setFaqCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* FAQ LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {faqsList.length === 0 ? (
                <div className="profile-section-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <HelpCircle size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                  <p style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>No matching FAQs found</p>
                  <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Try searching with another keyword or chat live with our team!
                  </p>
                </div>
              ) : (
                faqsList.map((faq) => {
                  const isExpanded = expandedFaqId === faq.id;
                  const hasVoted = votedFaqs.has(faq.id);
                  return (
                    <div key={faq.id} className="profile-section-card" style={{ padding: '0.85rem 1rem' }}>
                      <button
                        type="button"
                        className="card-header-line-split"
                        onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <HelpCircle size={16} style={{ color: 'var(--action-blue)', marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                            {faq.question}
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      {isExpanded && (
                        <div className="fade-in" style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)' }}>
                          <p style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.5 }}>
                            {faq.answer}
                          </p>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                            <span className="default-pill" style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.6875rem' }}>
                              {faq.categoryLabel}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleFAQVote(faq.id)}
                              className={`btn-set-default ${hasVoted ? 'default' : ''}`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.71875rem' }}
                            >
                              <ThumbsUp size={13} fill={hasVoted ? 'currentColor' : 'none'} />
                              <span>{hasVoted ? 'Helpful!' : `Helpful (${faq.helpfulCount})`}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* STILL NEED HELP BANNER */}
            <div className="profile-section-card wallet-profile-banner" style={{ marginTop: '1.25rem' }}>
              <div className="wallet-profile-left">
                <div className="wallet-profile-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                  <MessageSquare size={20} />
                </div>
                <div className="wallet-profile-details">
                  <span className="wallet-profile-title">Still have questions?</span>
                  <span className="wallet-profile-sub">Chat live with our 24/7 Arena Support Specialist</span>
                </div>
              </div>
              <button type="button" className="btn-rate-game-action" onClick={() => setActiveTab('chat')}>
                <span>Start Chat</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: SUPPORT TICKETS
            ========================================================================= */}
        {activeTab === 'tickets' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h2 className="section-title-text">My Support Tickets</h2>
              <button
                type="button"
                className="btn-add-payment-pill"
                onClick={() => setShowCreateTicketModal(true)}
              >
                <Plus size={14} />
                <span>Raise Ticket</span>
              </button>
            </div>

            {/* TICKETS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tickets.length === 0 ? (
                <div className="profile-section-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <Ticket size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                  <p style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>No support tickets created yet</p>
                  <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Need help with a booking or refund? Create a ticket and our team will assist you!
                  </p>
                </div>
              ) : (
                tickets.map((tkt) => {
                  const isExpanded = expandedTicketId === tkt.id;
                  return (
                    <div key={tkt.id} className="profile-section-card" style={{ padding: '0.95rem' }}>
                      <div className="card-header-line-split">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--action-blue)' }}>
                              {tkt.id}
                            </span>
                            <span className={`status-pill ${tkt.status.toLowerCase().replace(' ', '-')}`}>
                              {tkt.status}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                            {tkt.subject}
                          </h3>
                        </div>

                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setExpandedTicketId(isExpanded ? null : tkt.id)}
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        Category: {tkt.category} • Created: {tkt.createdAt}
                      </div>

                      {/* RELATED BOOKING BADGE */}
                      {tkt.relatedBooking && (
                        <div
                          style={{
                            marginTop: '0.5rem',
                            padding: '0.45rem 0.65rem',
                            background: '#F8FAFC',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.75rem',
                            color: '#334155',
                          }}
                        >
                          <strong>Linked Booking:</strong> {tkt.relatedBooking.venueName} ({tkt.relatedBooking.bookingId}) • ₹{tkt.relatedBooking.amount}
                        </div>
                      )}

                      {/* EXPANDABLE THREAD */}
                      {isExpanded && (
                        <div className="fade-in" style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
                          <h4 style={{ fontSize: '0.78125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary-navy)' }}>
                            Conversation Thread
                          </h4>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.85rem' }}>
                            {tkt.responses.map((resp) => (
                              <div
                                key={resp.id}
                                style={{
                                  padding: '0.65rem 0.85rem',
                                  borderRadius: '10px',
                                  background: resp.sender === 'user' ? '#EFF6FF' : '#F8FAFC',
                                  border: resp.sender === 'user' ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                                  alignSelf: resp.sender === 'user' ? 'flex-end' : 'flex-start',
                                  maxWidth: '90%',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                                  <strong>{resp.senderName}</strong>
                                  <span>{resp.timestamp}</span>
                                </div>
                                <p style={{ fontSize: '0.8125rem', color: '#0F172A', lineHeight: 1.4 }}>
                                  {resp.message}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* TICKET REPLY INPUT */}
                          {tkt.status !== 'Closed' && (
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <input
                                type="text"
                                className="modal-text-input"
                                placeholder="Write a reply..."
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                              />
                              <button
                                type="button"
                                className="btn-primary"
                                style={{ padding: '0 0.85rem', borderRadius: '8px' }}
                                onClick={() => handleTicketReplySubmit(tkt.id)}
                              >
                                <Send size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: 24/7 LIVE CHAT
            ========================================================================= */}
        {activeTab === 'chat' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: '450px' }}>
            {/* AGENT STATUS HEADER */}
            <div className="profile-section-card" style={{ padding: '0.65rem 0.85rem', marginBottom: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div className="avatar-circle" style={{ width: '34px', height: '34px', fontSize: '0.78125rem', background: '#2563EB' }}>
                  <span>{chatSession.agent.avatar}</span>
                </div>
                <div>
                  <strong style={{ fontSize: '0.8125rem', color: 'var(--primary-navy)' }}>{chatSession.agent.name}</strong>
                  <span style={{ fontSize: '0.6875rem', color: '#059669', display: 'block', fontWeight: 600 }}>
                    ● {chatSession.agent.role} (Online)
                  </span>
                </div>
              </div>
              <span className="default-pill" style={{ fontSize: '0.6875rem' }}>Avg Reply &lt; 2m</span>
            </div>

            {/* CHAT MESSAGES CONTAINER */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0.5rem 0.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              {chatSession.messages.map((msg) => {
                if (msg.sender === 'system') {
                  return (
                    <div key={msg.id} style={{ textAlign: 'center', margin: '0.4rem 0' }}>
                      <span className="default-pill" style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.71875rem' }}>
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '82%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        background: isUser ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : '#FFFFFF',
                        color: isUser ? '#FFFFFF' : '#0F172A',
                        border: isUser ? 'none' : '1px solid var(--border-color)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        fontSize: '0.8125rem',
                        lineHeight: 1.45,
                      }}
                    >
                      {msg.text}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem', padding: '0 0.2rem' }}>
                      {msg.timestamp} {isUser && '✓'}
                    </span>
                  </div>
                );
              })}

              {/* TYPING INDICATOR */}
              {isAgentTyping && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.85rem', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '16px 16px 16px 2px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rohan is typing...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* SUGGESTION CHIPS */}
            <div className="sport-chips-scroll" style={{ padding: '0.4rem 0' }}>
              {['Where is my refund?', 'Reschedule my match', 'Footwear rules', 'Equipment rentals'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="sport-chip"
                  style={{ fontSize: '0.71875rem', padding: '0.3rem 0.65rem' }}
                  onClick={() => {
                    setChatInput(chip);
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* CHAT INPUT BAR */}
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '0.4rem', paddingTop: '0.35rem' }}>
              <input
                type="text"
                className="modal-text-input"
                placeholder="Type your message to support..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '0 1rem', borderRadius: '12px' }}
                disabled={!chatInput.trim()}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: CREATE SUPPORT TICKET
          ========================================================================= */}
      {showCreateTicketModal && (
        <div className="modal-backdrop-overlay fade-in" onClick={() => setShowCreateTicketModal(false)}>
          <div className="modal-sheet-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-indicator" />
            <div className="modal-header-row">
              <div className="modal-icon-badge primary">
                <Ticket size={20} />
              </div>
              <div className="modal-titles">
                <h3 className="modal-title">Raise Support Ticket</h3>
                <span className="modal-sub">Assigned to Arena Specialist</span>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowCreateTicketModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="modal-body-content">
              {/* BOOKING CONTEXT BANNER */}
              {bookingContext && (
                <div style={{ padding: '0.65rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
                  <strong>Linked Booking:</strong> {bookingContext.venueName} ({bookingContext.bookingId || bookingContext.id}) • {bookingContext.courtName}
                </div>
              )}

              <div className="input-group">
                <label className="input-group-label" htmlFor="ticket-category">Category *</label>
                <select
                  id="ticket-category"
                  className="modal-text-input"
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                >
                  <option value="Payments & Refunds">Payments & Refunds</option>
                  <option value="Booking Cancellation">Booking Cancellation</option>
                  <option value="Venue Amenities">Venue Amenities & Equipment</option>
                  <option value="Account & Profile">Account & Profile</option>
                  <option value="General Inquiry">General Inquiry</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-group-label" htmlFor="ticket-subject">Subject *</label>
                <input
                  id="ticket-subject"
                  type="text"
                  className="modal-text-input"
                  placeholder="e.g. Refund pending for cancelled slot"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-group-label" htmlFor="ticket-description">Description *</label>
                <textarea
                  id="ticket-description"
                  className="modal-text-input"
                  style={{ minHeight: '80px', fontFamily: 'inherit' }}
                  placeholder="Describe your issue in detail..."
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer-actions">
                <button type="submit" className="btn-modal-submit primary">
                  <Ticket size={16} />
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
