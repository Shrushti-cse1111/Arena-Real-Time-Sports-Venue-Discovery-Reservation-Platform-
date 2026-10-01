import React, { useState } from 'react';
import {
  ChevronLeft,
  Gift,
  Copy,
  Share2,
  CheckCircle2,
  Users,
  Wallet,
  Sparkles,
  ArrowRight,
  Send,
  UserCheck,
  Clock,
  ChevronRight,
  ShieldCheck,
  X,
  MessageCircle,
} from 'lucide-react';
import { referralService } from '../data/referralService';

export default function ReferralScreen({ playerData, onBack, onOpenWallet }) {
  const userId = playerData?.id || 'user-1';
  const [summary, setSummary] = useState(() => {
    // Override referral code to reflect actual logged-in user name
    const base = referralService.getReferralSummary(playerData || userId);
    if (playerData?.fullName) {
      const dynamicCode = referralService.getUserReferralCode(playerData);
      return {
        ...base,
        referralCode: dynamicCode,
        referralLink: `https://arena.app/invite/${dynamicCode}`,
      };
    }
    return base;
  });
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'rewarded' | 'registered' | 'invited'
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [inviteChannel, setInviteChannel] = useState('WhatsApp');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(summary.referralCode);
    setCopiedCode(true);
    showToast(`Referral code "${summary.referralCode}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(summary.referralLink);
    setCopiedLink(true);
    showToast('Referral link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareNative = async () => {
    const shareData = {
      title: 'Join me on Arena — Book Sports Venues & Turfs!',
      text: `Hey! Use my referral code ${summary.referralCode} to sign up on Arena and get ₹${summary.refereeReward} off your 1st turf booking!`,
      url: summary.referralLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        referralService.recordInvite(userId, { name: 'Shared Friend' }, 'Native Share');
        setSummary(referralService.getReferralSummary(userId));
      } catch (err) {
        // Fallback to copy link
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSendDirectInvite = (e) => {
    e.preventDefault();
    if (!friendName.trim() || !friendPhone.trim()) {
      showToast('Please enter friend\'s name and phone number.');
      return;
    }

    referralService.recordInvite(
      userId,
      { name: friendName.trim(), phone: friendPhone.trim() },
      inviteChannel
    );

    setSummary(referralService.getReferralSummary(userId));
    setShowInviteModal(false);
    showToast(`Invite link sent to ${friendName.trim()} via ${inviteChannel}!`);
    setFriendName('');
    setFriendPhone('');
  };

  const filteredRecords = summary.records.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

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
              <h1 className="profile-page-title">Refer & Earn</h1>
              <p className="profile-page-subtitle">Invite friends & get ₹150 Arena Wallet cash</p>
            </div>
          </div>
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
        {/* HERO REFERRAL CARD */}
        <div className="post-game-rating-banner fade-in" style={{ padding: '1.25rem' }}>
          <div className="banner-top-row">
            <div className="banner-sparkle-badge">
              <Sparkles size={13} className="sparkle-icon" />
              <span>Invite Friends Program</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#FDE68A', fontWeight: 700 }}>
              ₹150 Per Referral
            </span>
          </div>

          <div className="banner-content-col" style={{ margin: '0.4rem 0' }}>
            <h2 className="banner-headline" style={{ fontSize: '1.15rem' }}>
              Give ₹100, Get ₹150 in Arena Wallet! 🎁
            </h2>
            <p className="banner-subtext" style={{ color: '#BAE6FD' }}>
              Your friends get ₹100 off their first match. When they complete their first game, you instantly receive ₹150 credited to your wallet.
            </p>
          </div>

          {/* CODE & COPY BOX */}
          <div className="referral-code-box">
            <div className="referral-code-info">
              <span className="code-label">YOUR UNIQUE REFERRAL CODE</span>
              <span className="code-text">{summary.referralCode}</span>
            </div>
            <button type="button" className="btn-copy-code" onClick={handleCopyCode}>
              {copiedCode ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* PRIMARY SHARE BUTTONS */}
          <div className="banner-action-row" style={{ paddingTop: '0.85rem' }}>
            <button type="button" className="btn-rate-game-action" onClick={handleShareNative} style={{ flex: 1, justifyContent: 'center' }}>
              <Share2 size={16} />
              <span>Share Invite Link</span>
            </button>
            <button
              type="button"
              className="btn-close-banner"
              onClick={() => setShowInviteModal(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#FFFFFF',
                padding: '0.45rem 0.95rem',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              + Invite Contact
            </button>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          <div className="stat-card">
            <span className="stat-num" style={{ color: '#059669' }}>₹{summary.totalEarned}</span>
            <span className="stat-lbl">Earned</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{summary.totalInvited}</span>
            <span className="stat-lbl">Invited</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{summary.totalRegistered}</span>
            <span className="stat-lbl">Joined</span>
          </div>
          <div className="stat-card">
            <span className="stat-num" style={{ color: '#F59E0B' }}>{summary.totalRewarded}</span>
            <span className="stat-lbl">Rewarded</span>
          </div>
        </div>

        {/* WALLET BANNER INTEGRATION */}
        {summary.totalEarned > 0 && (
          <div
            className="profile-section-card wallet-profile-banner fade-in"
            onClick={onOpenWallet}
            style={{ cursor: 'pointer' }}
          >
            <div className="wallet-profile-left">
              <div className="wallet-profile-icon-wrap" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <Wallet size={20} />
              </div>
              <div className="wallet-profile-details">
                <div className="wallet-profile-head">
                  <span className="wallet-profile-title">₹{summary.totalEarned} Referral Credits Received</span>
                  <span className="default-pill" style={{ background: '#D1FAE5', color: '#065F46' }}>In Wallet</span>
                </div>
                <span className="wallet-profile-sub">
                  Tap to view referral transactions in Arena Wallet
                </span>
              </div>
            </div>
            <div className="wallet-profile-chevron">
              <ChevronRight size={18} />
            </div>
          </div>
        )}

        {/* REFERRAL TRACKING SECTION */}
        <div className="profile-section-card">
          <div className="card-header-line-split">
            <div className="card-header-left">
              <Users size={18} className="section-icon" />
              <h3 className="section-card-title">Referral Tracking & Status</h3>
            </div>
            <span className="section-card-subtitle">{filteredRecords.length} record(s)</span>
          </div>

          {/* STATUS TABS */}
          <div className="bookings-tabs-segment" style={{ margin: '0.65rem 0' }}>
            {['all', 'rewarded', 'registered', 'invited'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`booking-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                style={{ textTransform: 'capitalize' }}
              >
                <span>{tab}</span>
              </button>
            ))}
          </div>

          {/* TRACKING LIST */}
          <div className="saved-methods-list">
            {filteredRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)' }}>
                <Users size={28} style={{ opacity: 0.4, marginBottom: '0.35rem' }} />
                <p style={{ fontSize: '0.8125rem', fontWeight: 600 }}>No referrals found in "{activeTab}"</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Share your code with friends to start earning rewards!</p>
              </div>
            ) : (
              filteredRecords.map((ref) => (
                <div key={ref.id} className="saved-method-row">
                  <div className="method-left-info">
                    <div className="method-icon-box" style={{ background: ref.status === 'rewarded' ? '#ECFDF5' : '#EFF6FF', color: ref.status === 'rewarded' ? '#10B981' : '#2563EB' }}>
                      {ref.status === 'rewarded' ? <Gift size={18} /> : <UserCheck size={18} />}
                    </div>
                    <div className="method-details-col">
                      <div className="method-title-line">
                        <span className="method-name">{ref.referredUser.name}</span>
                        <span className={`status-pill ${ref.status}`}>
                          {ref.status === 'rewarded' && 'Rewarded (+₹150)'}
                          {ref.status === 'registered' && 'Joined App'}
                          {ref.status === 'invited' && 'Invited'}
                        </span>
                      </div>
                      <span className="method-sub">
                        {ref.referredUser.phone} • {ref.channel} • {ref.date}
                      </span>
                      {ref.walletTxnId && (
                        <span className="method-sub" style={{ color: '#059669', fontWeight: 600, marginTop: '0.15rem' }}>
                          Linked Txn: {ref.walletTxnId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="profile-section-card">
          <div className="card-header-line">
            <Gift size={18} className="section-icon" />
            <h3 className="section-card-title">How Arena Referral Works</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div className="step-num-badge">1</div>
              <div>
                <strong style={{ fontSize: '0.8125rem', color: 'var(--primary-navy)' }}>Share Your Referral Link</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Send your code or link to friends via WhatsApp, SMS, or social media.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div className="step-num-badge">2</div>
              <div>
                <strong style={{ fontSize: '0.8125rem', color: 'var(--primary-navy)' }}>Friend Registers & Gets ₹100 Off</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your friend unlocks ₹100 discount on their first turf or court booking.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div className="step-num-badge">3</div>
              <div>
                <strong style={{ fontSize: '0.8125rem', color: 'var(--primary-navy)' }}>You Get ₹150 Wallet Credit</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>When your friend completes their first match, ₹150 is credited to your Arena Wallet!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: DIRECT INVITE CONTACT */}
      {showInviteModal && (
        <div className="modal-backdrop-overlay fade-in" onClick={() => setShowInviteModal(false)}>
          <div className="modal-sheet-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-indicator" />
            <div className="modal-header-row">
              <div className="modal-icon-badge primary">
                <Send size={20} />
              </div>
              <div className="modal-titles">
                <h3 className="modal-title">Invite a Teammate or Friend</h3>
                <span className="modal-sub">Send direct referral link</span>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowInviteModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendDirectInvite} className="modal-body-content">
              <div className="input-group">
                <label className="input-group-label" htmlFor="friend-name">Friend's Name *</label>
                <input
                  id="friend-name"
                  type="text"
                  className="modal-text-input"
                  placeholder="e.g. Rahul Sharma"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-group-label" htmlFor="friend-phone">Mobile Phone Number *</label>
                <input
                  id="friend-phone"
                  type="tel"
                  className="modal-text-input"
                  placeholder="98765 43210"
                  maxLength={10}
                  value={friendPhone}
                  onChange={(e) => setFriendPhone(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-group-label">Sharing Channel</label>
                <div className="skill-selector-grid">
                  {['WhatsApp', 'SMS Messages', 'Direct Copy'].map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      className={`skill-chip ${inviteChannel === ch ? 'active' : ''}`}
                      onClick={() => setInviteChannel(ch)}
                    >
                      <span>{ch}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="submit" className="btn-modal-submit primary">
                  <Send size={16} />
                  <span>Send Referral Invite</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
