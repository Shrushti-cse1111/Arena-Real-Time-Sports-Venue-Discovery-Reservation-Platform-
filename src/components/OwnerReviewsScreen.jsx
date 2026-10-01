import React, { useState, useEffect, useCallback } from 'react';
import {
  Star, MessageSquare, Send, CheckCircle2, AlertCircle,
  ArrowLeft, RefreshCw, X, Filter, Sparkles, User, CornerDownRight, Edit2, RotateCcw
} from 'lucide-react';
import {
  fetchOwnerReviews,
  submitOwnerReply,
  editOwnerReply,
  subscribeToReviewEvents,
  simulateIncomingReview,
} from '../services/ownerReviewsService';
import OwnerBottomNav from './OwnerBottomNav';

/* ── Star Rating Display ─────────────────────────────────────── */
function StarRating({ rating = 5 }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          color={s <= rating ? '#F59E0B' : '#CBD5E1'}
          fill={s <= rating ? '#F59E0B' : 'none'}
        />
      ))}
      <span style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#B45309', marginLeft: '0.2rem' }}>
        {rating}.0
      </span>
    </div>
  );
}

/* ── Single Review Card ──────────────────────────────────────── */
function ReviewCardItem({
  review,
  venueId,
  onReplySuccess,
}) {
  const [replyInput, setReplyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const hasReply = Boolean(review.ownerReply);

  const handleSendReply = async () => {
    const trimmed = replyInput.trim();
    if (!trimmed) {
      setValidationError('Reply cannot be empty.');
      return;
    }
    if (trimmed.length > 500) {
      setValidationError('Reply must be 500 characters or less.');
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError('');
      const res = await submitOwnerReply({
        venueId,
        reviewId: review.id,
        replyText: trimmed,
      });

      if (res.success) {
        onReplySuccess(res.data);
        setIsEditing(false);
        setReplyInput('');
      } else {
        setValidationError(res.error || 'Unable to submit reply.');
      }
    } catch (err) {
      setValidationError(err.message || 'Error submitting reply.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = () => {
    setReplyInput(review.ownerReply);
    setIsEditing(true);
    setValidationError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setReplyInput('');
    setValidationError('');
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        padding: '1rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
      }}
    >
      {/* Review Header: Customer name, Star rating, Date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.8125rem',
            }}
          >
            {review.customer.avatar || (review.customer.name ? review.customer.name.charAt(0) : 'P')}
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>
              {review.customer.name}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
              {review.courtName ? `${review.courtName} • ` : ''}{review.sport || 'Sports'}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <StarRating rating={review.rating} />
          {/* Date: use text-light (muted color) */}
          <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '0.15rem' }}>
            {review.date}
          </div>
        </div>
      </div>

      {/* Customer Comment */}
      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#334155', lineHeight: 1.5 }}>
        &ldquo;{review.comment}&rdquo;
      </p>

      {/* ── UNREPLIED REVIEW FLOW ── */}
      {!hasReply && !isEditing && (
        <div style={{ marginTop: '0.35rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={replyInput}
                maxLength={500}
                placeholder="Write an official owner reply..."
                onChange={(e) => {
                  setReplyInput(e.target.value);
                  if (validationError) setValidationError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendReply();
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 8,
                  border: validationError ? '1px solid #EF4444' : '1px solid #CBD5E1',
                  fontSize: '0.78125rem',
                  boxSizing: 'border-box',
                  background: '#F8FAFC',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem', padding: '0 0.2rem' }}>
                {validationError ? (
                  <span style={{ fontSize: '0.6875rem', color: '#DC2626', fontWeight: 600 }}>
                    {validationError}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.625rem', color: '#94A3B8' }}>
                    {replyInput.length}/500
                  </span>
                )}
              </div>
            </div>

            {/* Small Primary "Reply" button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSendReply}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: 8,
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                flexShrink: 0,
              }}
            >
              {isSubmitting ? (
                <RefreshCw size={13} className="spinning" />
              ) : (
                <Send size={13} />
              )}
              <span>Reply</span>
            </button>
          </div>
        </div>
      )}

      {/* ── REPLIED REVIEW DISPLAY ── */}
      {hasReply && !isEditing && (
        <div
          style={{
            marginTop: '0.25rem',
            padding: '0.65rem 0.85rem',
            background: '#F8FAFC',
            borderRadius: 8,
            borderLeft: '3px solid #2563EB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CornerDownRight size={13} color="#2563EB" />
              <span style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#0F172A' }}>
                Owner Response
              </span>
              {review.ownerRepliedAt && (
                <span style={{ fontSize: '0.625rem', color: '#94A3B8' }}>
                  • {review.ownerRepliedAt}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleStartEdit}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                fontSize: '0.6875rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                padding: 0,
              }}
            >
              <Edit2 size={11} />
              <span>Edit</span>
            </button>
          </div>
          {/* Small muted text */}
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', lineHeight: 1.45 }}>
            {review.ownerReply}
          </p>
        </div>
      )}

      {/* ── EDIT EXISTING REPLY FLOW ── */}
      {isEditing && (
        <div style={{ marginTop: '0.35rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
            Editing Owner Response:
          </div>
          <textarea
            rows={2}
            value={replyInput}
            maxLength={500}
            onChange={(e) => setReplyInput(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 8,
              border: validationError ? '1px solid #EF4444' : '1px solid #CBD5E1',
              fontSize: '0.75rem',
              boxSizing: 'border-box',
              resize: 'none',
            }}
          />
          {validationError && (
            <div style={{ fontSize: '0.6875rem', color: '#DC2626', marginTop: '0.2rem' }}>
              {validationError}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.4rem' }}>
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{ padding: '0.35rem 0.75rem', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSendReply}
              style={{ padding: '0.35rem 0.85rem', borderRadius: 6, border: 'none', background: '#2563EB', color: '#FFF', fontSize: '0.6875rem', fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer' }}
            >
              Save Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component: OwnerReviewsScreen ──────────────────────── */
export default function OwnerReviewsScreen({
  venue = { id: 'v-owner-demo', name: 'Deccan Sports Arena' },
  onBack = () => {},
  onNavigateTab = () => {},
}) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, averageRating: '0.0', unrepliedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'unreplied' | 'replied'
  const [ratingFilter, setRatingFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 4, total: 0, hasMore: false });
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // ── Fetch Reviews ────────────────────────────────────────────
  const loadReviews = useCallback(async (page = 1, append = false, simulateErr = false) => {
    try {
      if (!append) setLoading(true);
      setError(null);

      const res = await fetchOwnerReviews({
        venueId: venue.id,
        page,
        limit: 4,
        filter,
        ratingFilter,
        simulateError: simulateErr,
      });

      if (res.success) {
        setReviews((prev) => (append ? [...prev, ...res.data] : res.data));
        setStats(res.stats);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  }, [venue.id, filter, ratingFilter]);

  useEffect(() => {
    loadReviews(1, false);
  }, [loadReviews]);

  // ── Real-time Review Listener ────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToReviewEvents((event, payload) => {
      if (event === 'NEW_REVIEW') {
        setReviews((prev) => {
          if (prev.some((r) => r.id === payload.id)) return prev;
          return [payload, ...prev];
        });
        setStats((prev) => ({
          ...prev,
          totalReviews: prev.totalReviews + 1,
          unrepliedCount: prev.unrepliedCount + 1,
        }));
        showToast(`⭐ New review from ${payload.customer.name}: ${payload.rating} Stars!`);
      } else if (event === 'REVIEW_REPLIED') {
        setReviews((prev) =>
          prev.map((r) => (r.id === payload.id ? payload : r))
        );
        setStats((prev) => ({
          ...prev,
          unrepliedCount: Math.max(0, prev.unrepliedCount - 1),
        }));
      }
    });

    return () => unsub();
  }, [showToast]);

  const handleReplySuccess = (updated) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
    setStats((prev) => ({
      ...prev,
      unrepliedCount: Math.max(0, prev.unrepliedCount - 1),
    }));
    showToast('✓ Official response published successfully.');
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !loading) {
      loadReviews(pagination.page + 1, true);
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
              Reviews Management
            </h1>
          </div>
          <button
            type="button"
            onClick={() => simulateIncomingReview(venue.id)}
            style={{
              padding: '0.3rem 0.6rem',
              borderRadius: 6,
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#F59E0B',
              fontSize: '0.6875rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Test Review
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>
          Respond to player feedback, improve court ratings, and maintain venue reputation.
        </p>
      </div>

      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        {/* ── TOP STATS CARD ── */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Overall Rating
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.15rem' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A' }}>
                {stats.averageRating}
              </span>
              <StarRating rating={Math.round(Number(stats.averageRating))} />
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
              {stats.totalReviews} total player reviews
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Pending Replies
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stats.unrepliedCount > 0 ? '#DC2626' : '#059669', marginTop: '0.15rem' }}>
              {stats.unrepliedCount}
            </div>
            <span style={{ fontSize: '0.6875rem', color: stats.unrepliedCount > 0 ? '#DC2626' : '#059669', fontWeight: 700 }}>
              {stats.unrepliedCount > 0 ? 'Action required' : 'All caught up ✓'}
            </span>
          </div>
        </div>

        {/* ── FILTER & SORT CONTROLS ── */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#E2E8F0', borderRadius: 8, padding: '0.15rem', flex: 1 }}>
            <button
              type="button"
              onClick={() => setFilter('all')}
              style={{
                flex: 1,
                padding: '0.4rem 0.5rem',
                borderRadius: 6,
                border: 'none',
                background: filter === 'all' ? '#FFFFFF' : 'transparent',
                color: filter === 'all' ? '#0F172A' : '#64748B',
                fontSize: '0.71875rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              All ({stats.totalReviews})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unreplied')}
              style={{
                flex: 1,
                padding: '0.4rem 0.5rem',
                borderRadius: 6,
                border: 'none',
                background: filter === 'unreplied' ? '#FFFFFF' : 'transparent',
                color: filter === 'unreplied' ? '#DC2626' : '#64748B',
                fontSize: '0.71875rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Unreplied ({stats.unrepliedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('replied')}
              style={{
                flex: 1,
                padding: '0.4rem 0.5rem',
                borderRadius: 6,
                border: 'none',
                background: filter === 'replied' ? '#FFFFFF' : 'transparent',
                color: filter === 'replied' ? '#059669' : '#64748B',
                fontSize: '0.71875rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Replied
            </button>
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            style={{
              padding: '0.4rem 0.6rem',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              fontSize: '0.71875rem',
              background: '#FFF',
              fontWeight: 700,
              color: '#334155',
            }}
          >
            <option value="all">All Stars</option>
            <option value="5">5 Stars only</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        {/* ── RETRY ERROR BANNER ── */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '1rem', textAlign: 'center', marginBottom: '1.25rem' }}>
            <AlertCircle size={24} color="#DC2626" style={{ marginBottom: '0.35rem' }} />
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#991B1B', marginBottom: '0.45rem' }}>
              {error}
            </div>
            <button
              type="button"
              onClick={() => loadReviews(1, false, false)}
              style={{ padding: '0.4rem 0.85rem', borderRadius: 6, background: '#DC2626', color: '#FFF', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── REVIEWS LIST / SKELETON / EMPTY STATE ── */}
        {loading ? (
          /* Review Skeleton Cards */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ background: '#FFFFFF', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div className="owner-skeleton" style={{ width: 120, height: 16, borderRadius: 4 }} />
                  <div className="owner-skeleton" style={{ width: 70, height: 16, borderRadius: 4 }} />
                </div>
                <div className="owner-skeleton" style={{ width: '90%', height: 14, borderRadius: 4, marginBottom: '0.4rem' }} />
                <div className="owner-skeleton" style={{ width: '60%', height: 14, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          /* Empty State */
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '3rem 1.5rem', textAlign: 'center', border: '1px solid #E2E8F0' }}>
            <MessageSquare size={36} color="#CBD5E1" style={{ marginBottom: '0.65rem' }} />
            <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
              No reviews yet.
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
              Player feedback and court ratings will appear here after matches are played.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reviews.map((rev) => (
              <ReviewCardItem
                key={rev.id}
                review={rev}
                venueId={venue.id}
                onReplySuccess={handleReplySuccess}
              />
            ))}
          </div>
        )}

        {/* ── PAGINATION ── */}
        {pagination.hasMore && (
          <div style={{ padding: '1rem 0', textAlign: 'center' }}>
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
              Load More Reviews (Page {pagination.page + 1} of {pagination.totalPages})
            </button>
          </div>
        )}
      </div>

      {/* Owner Bottom Navigation Bar */}
      <OwnerBottomNav activeTab="reviews" onNavigate={onNavigateTab} />
    </div>
  );
}
