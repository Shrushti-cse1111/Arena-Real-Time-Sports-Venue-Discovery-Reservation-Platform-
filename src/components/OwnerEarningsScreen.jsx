import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, ArrowDownToLine, RefreshCw, AlertCircle, ArrowLeft,
  Calendar, CheckCircle2, ShieldCheck, Download, Clock,
  FileText, Building2, TrendingUp, X
} from 'lucide-react';
import {
  fetchEarningsSummary,
  fetchEarningsTransactions,
  fetchPayoutsHistory,
  generateInvoiceDocument,
} from '../services/ownerEarningsService';
import OwnerBottomNav from './OwnerBottomNav';

export default function OwnerEarningsScreen({
  venue = { id: 'v-owner-demo', name: 'Deccan Sports Arena' },
  onBack = () => {},
  onNavigateTab = () => {},
}) {
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [txnLoading, setTxnLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, hasMore: false });

  const [payouts, setPayouts] = useState([]);
  const [downloadingTxnId, setDownloadingTxnId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [error, setError] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // ── Load Summary & Payouts ───────────────────────────────────
  const loadSummaryData = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const [sumRes, poRes] = await Promise.all([
        fetchEarningsSummary(venue.id),
        fetchPayoutsHistory(venue.id),
      ]);
      if (sumRes.success) setSummary(sumRes.data);
      if (poRes.success) setPayouts(poRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  }, [venue.id]);

  // ── Load Transactions (Paginated) ───────────────────────────
  const loadTransactions = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) setTxnLoading(true);
      setError(null);
      const res = await fetchEarningsTransactions({ page, limit: 5 });
      if (res.success) {
        setTransactions((prev) => (append ? [...prev, ...res.data] : res.data));
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Unable to load transactions.');
    } finally {
      setTxnLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummaryData();
    loadTransactions(1, false);
  }, [loadSummaryData, loadTransactions]);

  // ── Download Invoice Handler ─────────────────────────────────
  const handleDownloadInvoice = async (txn) => {
    try {
      setDownloadingTxnId(txn.id);
      await generateInvoiceDocument(txn);
      showToast(`✓ Invoice downloaded for ${txn.bookingId}`);
    } catch (err) {
      showToast(err.message || 'Unable to prepare document.');
    } finally {
      setDownloadingTxnId(null);
    }
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !txnLoading) {
      loadTransactions(pagination.page + 1, true);
    }
  };

  return (
    <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#0F172A', color: '#38BDF8', padding: '0.6rem 1rem', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Screen Header */}
      <div style={{ background: '#102A43', color: '#FFFFFF', padding: '1.25rem 1rem 1rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onBack}
              style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: 0, display: 'flex' }}
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              Earnings &amp; Payouts
            </h1>
          </div>
          <span style={{ fontSize: '0.6875rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '0.2rem 0.5rem', borderRadius: 9999, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShieldCheck size={12} />
            <span>Bank Verified</span>
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>
          Automated settlements, revenue breakdown, and tax invoices.
        </p>
      </div>

      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        {/* ── 1. SUMMARY STATS PAIR (800-weight numbers) ── */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="section-title-row" style={{ marginBottom: '0.65rem' }}>
            <span className="section-h3">Revenue Summary</span>
            <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
              {summary ? `Platform Fee: ${summary.commissionRate}%` : ''}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            {/* Total Earned Card */}
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Total Earned
                </span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={15} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
                {summaryLoading ? '—' : `₹${summary?.totalEarned?.toLocaleString('en-IN') ?? 0}`}
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 700 }}>
                ● Net settled revenue
              </span>
            </div>

            {/* Pending Payout Card */}
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Pending Payout
                </span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={15} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1D4ED8' }}>
                {summaryLoading ? '—' : `₹${summary?.pendingPayout?.toLocaleString('en-IN') ?? 0}`}
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
                Next cycle: Friday
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. SEPARATE CARD: LAST PAYOUT ── */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: '1rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>
              Last Payout
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: '#ECFDF5', color: '#065F46', padding: '0.2rem 0.5rem', borderRadius: 9999 }}>
              {summary?.lastPayout?.status || 'Completed'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
              ₹{summary?.lastPayout?.amount?.toLocaleString('en-IN') ?? '28,450'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
              Paid on {summary?.lastPayout?.date || 'Sep 25, 2026'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.71875rem', color: '#475569', background: '#F8FAFC', padding: '0.45rem 0.65rem', borderRadius: 6, border: '1px solid #E2E8F0' }}>
            <Building2 size={13} color="#2563EB" />
            <span>Disbursed to: {summary?.lastPayout?.bankAccount || 'HDFC Bank ••••4182'}</span>
          </div>
        </div>

        {/* ── 3. TRANSACTION TABLE ── */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '1rem' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>
              Transaction History
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
              Verified Webhooks
            </span>
          </div>

          {txnLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.75rem' }}>
              <RefreshCw size={20} className="spinning" style={{ marginBottom: '0.5rem' }} />
              <div>Loading backend ledger transactions...</div>
            </div>
          ) : transactions.length === 0 ? (
            /* ── EMPTY STATE ── */
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
              <DollarSign size={32} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.35rem' }}>
                No transactions yet
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                Transactions will appear after your first completed booking.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="owner-schedule-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Booking</th>
                    <th>Gross</th>
                    <th>Platform Fee</th>
                    <th>Net</th>
                    <th>Invoice/Download</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => {
                    const isProcessing = txn.status === 'processing';
                    const isCompleted = txn.status === 'completed';
                    const isFailed = txn.status === 'failed';
                    const isRefunded = txn.status === 'refunded';
                    const isPreparing = downloadingTxnId === txn.id;

                    return (
                      <tr key={txn.id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#475569' }}>
                          <div>{txn.date}</div>
                          <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{txn.time}</div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{txn.bookingId}</div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                            {txn.customer} • {txn.court}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          ₹{txn.gross}
                        </td>
                        <td style={{ color: '#EF4444', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          -₹{txn.platformFee}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {isProcessing ? (
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '0.2rem 0.5rem', borderRadius: 9999 }}>
                              Processing
                            </span>
                          ) : isFailed ? (
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '0.2rem 0.5rem', borderRadius: 9999 }}>
                              Failed
                            </span>
                          ) : isRefunded ? (
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569', background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: 9999 }}>
                              Refunded (₹0)
                            </span>
                          ) : (
                            <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.84375rem' }}>
                              ₹{txn.net}
                            </span>
                          )}
                        </td>
                        <td>
                          {isFailed ? (
                            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>N/A</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDownloadInvoice(txn)}
                              disabled={isPreparing}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: 6,
                                background: isPreparing ? '#F1F5F9' : '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                color: isPreparing ? '#64748B' : '#2563EB',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                cursor: isPreparing ? 'wait' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              {isPreparing ? (
                                <>
                                  <RefreshCw size={11} className="spinning" />
                                  <span>Preparing…</span>
                                </>
                              ) : (
                                <>
                                  <Download size={11} />
                                  <span>Invoice</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── PAGINATION ── */}
          {pagination.hasMore && (
            <div style={{ padding: '0.85rem', textAlign: 'center', borderTop: '1px solid #E2E8F0', background: '#FAFBFD' }}>
              <button
                type="button"
                onClick={handleLoadMore}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#1E293B',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Load More Transactions (Page {pagination.page + 1} of {pagination.totalPages})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Owner Bottom Navigation Bar */}
      <OwnerBottomNav activeTab="earnings" onNavigate={onNavigateTab} />
    </div>
  );
}
