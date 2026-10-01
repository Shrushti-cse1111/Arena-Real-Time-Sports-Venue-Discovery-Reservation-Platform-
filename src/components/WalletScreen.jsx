import React, { useState } from 'react';
import {
  ChevronLeft,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Search,
  X,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  Zap,
} from 'lucide-react';

export default function WalletScreen({
  walletData,
  refundsData = [],
  onBack,
  onTopUpWallet,
  onSelectBooking,
  onExploreVenues,
  onSyncRefunds,
}) {
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'refunds'
  const [txFilter, setTxFilter] = useState('all'); // 'all' | 'credit' | 'debit' | 'refund' | 'cashback'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Top Up Modal State
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('500');
  const [topUpMethod, setTopUpMethod] = useState('upi'); // 'upi' | 'card'

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      if (onSyncRefunds) onSyncRefunds();
      showToast('Wallet balance & payment gateway refunds synced!');
    }, 700);
  };

  const handleConfirmTopUp = () => {
    const num = Number(topUpAmount);
    if (!num || num < 50) {
      showToast('Minimum top-up amount is ₹50');
      return;
    }
    if (onTopUpWallet) {
      onTopUpWallet(num, topUpMethod === 'upi' ? 'UPI (Google Pay)' : 'Saved Card');
    }
    showToast(`₹${num} added to your Arena Wallet successfully!`);
    setShowTopUpModal(false);
    setTopUpAmount('500');
  };

  // Filter Transactions
  const transactionsList = walletData?.transactions || [];
  const filteredTransactions = transactionsList.filter((tx) => {
    if (txFilter === 'credit' && !tx.isCredit) return false;
    if (txFilter === 'debit' && tx.isCredit) return false;
    if (txFilter === 'refund' && tx.type !== 'refund') return false;
    if (txFilter === 'cashback' && tx.type !== 'cashback') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.title.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q) ||
        tx.txnId?.toLowerCase().includes(q) ||
        tx.relatedBookingId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter Refunds
  const filteredRefunds = refundsData.filter((rf) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        rf.bookingRef?.toLowerCase().includes(q) ||
        rf.venueName?.toLowerCase().includes(q) ||
        rf.refundTxnId?.toLowerCase().includes(q) ||
        rf.status?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getRefundBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="refund-status-badge completed">
            <CheckCircle2 size={12} />
            <span>Refund Completed</span>
          </span>
        );
      case 'processing':
        return (
          <span className="refund-status-badge processing">
            <Clock size={12} />
            <span>Refund Processing</span>
          </span>
        );
      case 'initiated':
        return (
          <span className="refund-status-badge initiated">
            <RotateCcw size={12} />
            <span>Refund Initiated</span>
          </span>
        );
      case 'failed':
        return (
          <span className="refund-status-badge failed">
            <XCircle size={12} />
            <span>Refund Failed</span>
          </span>
        );
      default:
        return (
          <span className="refund-status-badge completed">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="wallet-screen-container fade-in">
      {/* HEADER */}
      <header className="details-header-bar">
        <button
          type="button"
          className="btn-back-header"
          onClick={onBack}
          aria-label="Back"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="details-header-center">
          <span className="details-header-title">Arena Wallet & Refunds</span>
          <span className="details-header-sub">
            A/C: {walletData?.accountNumber || 'ARENA-WLT-982104'}
          </span>
        </div>
        <div className="details-header-actions">
          <button
            type="button"
            className="btn-header-icon"
            onClick={handleManualSync}
            title="Sync with Payment Gateway"
          >
            <RefreshCw size={17} className={isSyncing ? 'spin-icon' : ''} />
          </button>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="booking-toast-alert fade-in">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SCROLLABLE BODY */}
      <div className="wallet-scroll-body">
        {/* WALLET BALANCE HERO CARD */}
        <div className="wallet-hero-card">
          <div className="wallet-hero-top-row">
            <div className="wallet-brand-left">
              <div className="wallet-icon-bubble">
                <Wallet size={18} />
              </div>
              <span className="wallet-card-tag">Total Available Balance</span>
            </div>
            {walletData?.isKycVerified && (
              <div className="wallet-kyc-pill">
                <ShieldCheck size={12} />
                <span>Verified</span>
              </div>
            )}
          </div>

          <div className="wallet-hero-balance-row">
            <span className="wallet-currency-sym">₹</span>
            <span className="wallet-balance-num">
              {Number(walletData?.balance || 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* BALANCE BREAKDOWN PILL */}
          <div className="wallet-breakdown-strip">
            <div className="breakdown-col">
              <span className="breakdown-sub-lbl">Main Balance (Refunds/Top-up)</span>
              <span className="breakdown-sub-val">
                ₹{Number(walletData?.mainBalance || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="breakdown-divider-v" />
            <div className="breakdown-col">
              <span className="breakdown-sub-lbl">Promo / Cashback Credits</span>
              <span className="breakdown-sub-val green">
                ₹{Number(walletData?.promoCashback || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="wallet-hero-actions-row">
            <button
              type="button"
              className="btn-wallet-action primary"
              onClick={() => setShowTopUpModal(true)}
            >
              <Plus size={16} />
              <span>Add Money</span>
            </button>

            <button
              type="button"
              className="btn-wallet-action secondary"
              onClick={onExploreVenues || onBack}
            >
              <Zap size={16} />
              <span>Book Court</span>
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="notif-search-bar" style={{ marginTop: '0.2rem' }}>
          <Search size={15} className="notif-search-icon" />
          <input
            type="text"
            className="notif-search-input"
            placeholder={
              activeTab === 'transactions'
                ? 'Search transaction, match ID, refund...'
                : 'Search booking ref, venue, refund ID...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="notif-clear-search"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* TABS SEGMENT: Transactions vs Refunds */}
        <div className="bookings-tabs-segment" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'transactions'}
            className={`booking-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <span>Transactions</span>
            <span className="tab-count-badge">{transactionsList.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'refunds'}
            className={`booking-tab-btn ${activeTab === 'refunds' ? 'active' : ''}`}
            onClick={() => setActiveTab('refunds')}
          >
            <span>Refunds Tracker</span>
            <span className="tab-count-badge">{refundsData.length}</span>
          </button>
        </div>

        {/* TAB 1: TRANSACTIONS LIST */}
        {activeTab === 'transactions' && (
          <div className="wallet-tab-view fade-in">
            {/* SUB-FILTER CHIPS */}
            <div className="sport-filter-section" style={{ margin: '0 -1.15rem 0.65rem -1.15rem' }}>
              <div className="sport-chips-scroll">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'credit', label: 'Credits (+)' },
                  { id: 'debit', label: 'Debits (-)' },
                  { id: 'refund', label: 'Refunds' },
                  { id: 'cashback', label: 'Cashback' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    className={`sport-chip ${txFilter === chip.id ? 'active' : ''}`}
                    onClick={() => setTxFilter(chip.id)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="notif-empty-state">
                <div className="notif-empty-icon-bubble">
                  <CreditCard size={28} />
                </div>
                <h3 className="notif-empty-title">No transactions found</h3>
                <p className="notif-empty-desc">
                  {searchQuery
                    ? `No transactions matched "${searchQuery}".`
                    : 'Your wallet top-ups, court deductions, and refund credits will appear here.'}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    className="btn-empty-action"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="transactions-cards-list">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="transaction-card-item fade-in"
                    onClick={() => {
                      if (tx.relatedBookingId && onSelectBooking) {
                        onSelectBooking(tx.relatedBookingId);
                      }
                    }}
                  >
                    <div className="tx-icon-col">
                      <div className={`tx-icon-badge ${tx.isCredit ? 'credit' : 'debit'}`}>
                        {tx.type === 'refund' ? (
                          <RotateCcw size={16} />
                        ) : tx.type === 'cashback' ? (
                          <Sparkles size={16} />
                        ) : tx.isCredit ? (
                          <ArrowDownLeft size={16} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}
                      </div>
                    </div>

                    <div className="tx-content-col">
                      <div className="tx-head-line">
                        <span className="tx-title">{tx.title}</span>
                        <span className={`tx-amount ${tx.isCredit ? 'credit' : 'debit'}`}>
                          {tx.isCredit ? '+' : '-'}₹{tx.amount}
                        </span>
                      </div>

                      <p className="tx-desc">{tx.description}</p>

                      <div className="tx-footer-meta">
                        <span className="tx-time">{tx.timestamp}</span>
                        <div className="tx-right-tags">
                          {tx.relatedBookingId && (
                            <span className="tx-booking-tag">
                              <span>Pass #{tx.relatedBookingId}</span>
                              <ChevronRight size={11} />
                            </span>
                          )}
                          <span className="tx-status-pill">{tx.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REFUNDS TRACKER */}
        {activeTab === 'refunds' && (
          <div className="wallet-tab-view fade-in">
            {filteredRefunds.length === 0 ? (
              <div className="notif-empty-state">
                <div className="notif-empty-icon-bubble">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="notif-empty-title">No cancellation refunds recorded</h3>
                <p className="notif-empty-desc">
                  When you cancel an eligible court booking, transparent refund settlement details will appear here.
                </p>
              </div>
            ) : (
              <div className="refunds-cards-list">
                {filteredRefunds.map((rf) => (
                  <div key={rf.id} className="refund-card-item fade-in">
                    <div className="refund-card-top">
                      <div className="refund-sport-badge">
                        <span className="sport-dot" />
                        <span>{rf.sport || 'Sports Match'}</span>
                      </div>
                      {getRefundBadge(rf.status)}
                    </div>

                    <div className="refund-venue-row">
                      <h3 className="refund-venue-title">{rf.venueName}</h3>
                      <span className="refund-booking-ref">{rf.bookingRef}</span>
                    </div>

                    <div className="refund-amount-strip">
                      <div className="refund-amt-col">
                        <span className="refund-amt-lbl">Refunded Amount</span>
                        <span className="refund-amt-val highlight">₹{rf.refundAmount}</span>
                      </div>
                      <div className="refund-amt-col right">
                        <span className="refund-amt-lbl">Destination</span>
                        <span className="refund-dest-text">{rf.destinationMasked || rf.refundMethod}</span>
                      </div>
                    </div>

                    <div className="refund-details-grid">
                      <div className="refund-grid-cell">
                        <span className="cell-lbl">Reason</span>
                        <span className="cell-val">{rf.reason}</span>
                      </div>
                      <div className="refund-grid-cell">
                        <span className="cell-lbl">Gateway ARN Ref</span>
                        <span className="cell-val mono">{rf.refundTxnId}</span>
                      </div>
                      <div className="refund-grid-cell">
                        <span className="cell-lbl">Initiated At</span>
                        <span className="cell-val">{rf.initiatedAt}</span>
                      </div>
                      <div className="refund-grid-cell">
                        <span className="cell-lbl">Settlement Window</span>
                        <span className="cell-val green">{rf.settlementWindow}</span>
                      </div>
                    </div>

                    {rf.bookingId && onSelectBooking && (
                      <div className="refund-card-action-line">
                        <button
                          type="button"
                          className="btn-view-pass-link"
                          onClick={() => onSelectBooking(rf.bookingId)}
                        >
                          <span>View Cancelled Pass Details</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECURITY FOOTER NOTE */}
        <div className="wallet-security-note">
          <ShieldCheck size={14} className="sec-icon" />
          <span>
            Arena Wallet transactions are 256-bit encrypted. Refunds strictly follow standard cancellation guidelines.
          </span>
        </div>
      </div>

      {/* =========================================================================
          MODAL: ADD MONEY TO WALLET
          ========================================================================= */}
      {showTopUpModal && (
        <div
          className="modal-backdrop-overlay fade-in"
          onClick={() => setShowTopUpModal(false)}
        >
          <div className="modal-sheet-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-indicator" />
            <div className="modal-header-row">
              <div className="modal-icon-badge primary">
                <Plus size={20} />
              </div>
              <div className="modal-titles">
                <h3 className="modal-title">Add Money to Arena Wallet</h3>
                <span className="modal-sub">Fast & 1-tap checkout for court passes</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowTopUpModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-content">
              <label className="input-group-label">Enter Amount to Add (₹)</label>
              <div className="wallet-input-amount-wrap">
                <span className="amount-input-currency">₹</span>
                <input
                  type="number"
                  className="wallet-large-amount-input"
                  placeholder="500"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  min="50"
                  max="10000"
                />
              </div>

              {/* QUICK AMOUNT CHIPS */}
              <div className="topup-presets-row">
                {['200', '500', '1000', '2000'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`preset-chip ${topUpAmount === preset ? 'active' : ''}`}
                    onClick={() => setTopUpAmount(preset)}
                  >
                    <span>+₹{preset}</span>
                  </button>
                ))}
              </div>

              {/* PAYMENT SOURCE SELECTOR */}
              <label className="input-group-label" style={{ marginTop: '0.85rem' }}>
                Payment Method
              </label>
              <div className="topup-method-selector">
                <label className={`method-option-pill ${topUpMethod === 'upi' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="topup-method"
                    checked={topUpMethod === 'upi'}
                    onChange={() => setTopUpMethod('upi')}
                  />
                  <span>UPI (Google Pay / PhonePe)</span>
                </label>

                <label className={`method-option-pill ${topUpMethod === 'card' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="topup-method"
                    checked={topUpMethod === 'card'}
                    onChange={() => setTopUpMethod('card')}
                  />
                  <span>Saved Credit/Debit Card</span>
                </label>
              </div>

              <div className="wallet-topup-benefit-box">
                <Sparkles size={14} color="#F59E0B" />
                <span>Enjoy instant refunds and 1-click slot locks with Arena Wallet.</span>
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-secondary"
                onClick={() => setShowTopUpModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-primary"
                onClick={handleConfirmTopUp}
              >
                Pay & Add ₹{topUpAmount || '0'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
