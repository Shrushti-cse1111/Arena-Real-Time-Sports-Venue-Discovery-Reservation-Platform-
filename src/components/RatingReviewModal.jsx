import React, { useState, useEffect } from 'react';
import { Star, X, AlertCircle, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';

const PRESET_TAGS = [
  'Clean Court',
  'Great Lighting',
  'Good Grip',
  'Helpful Staff',
  'Clean Showers',
  'Easy Parking',
  'Quality Rackets',
  'Good Ventilation',
];

export default function RatingReviewModal({
  isOpen,
  booking,
  initialRating = 5,
  onClose,
  onSubmit,
}) {
  const [selectedRating, setSelectedRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState(['Clean Court', 'Great Lighting']);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [simulateFailure, setSimulateFailure] = useState(false);

  const isEditing = Boolean(booking?.userReview);

  // Sync state when modal opens or target booking changes
  useEffect(() => {
    if (booking) {
      if (booking.userReview) {
        setSelectedRating(booking.userReview.rating || 5);
        setSelectedTags(booking.userReview.tags || ['Clean Court']);
        setComment(booking.userReview.comment || '');
      } else {
        setSelectedRating(initialRating || 5);
        setSelectedTags(['Clean Court', 'Great Lighting']);
        setComment('');
      }
      setErrorMessage(null);
      setIsSubmitting(false);
      setSimulateFailure(false);
    }
  }, [booking, initialRating, isOpen]);

  if (!isOpen || !booking) return null;

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const getRatingLabel = (score) => {
    switch (score) {
      case 5:
        return '🌟 Excellent Turf & Facilities!';
      case 4:
        return '👍 Great Game Experience';
      case 3:
        return '🙂 Average / Decent';
      case 2:
        return '😕 Needs Improvement';
      case 1:
        return '👎 Poor Experience';
      default:
        return 'Select a star rating';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation 1: Rating must be 1 to 5
    if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
      setErrorMessage('Please select a star rating between 1 and 5.');
      return;
    }

    // Validation 2: Character limit check
    if (comment.length > 500) {
      setErrorMessage('Review text cannot exceed 500 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (simulateFailure) {
        // Simulate network failure
        await new Promise((resolve) => setTimeout(resolve, 600));
        throw new Error('Network connection error: Unable to reach Arena review server. Please try again.');
      }

      if (onSubmit) {
        const result = await onSubmit(booking.id, {
          rating: selectedRating,
          tags: selectedTags,
          comment: comment.trim(),
          isEdit: isEditing,
        });

        if (result && !result.success) {
          setErrorMessage(result.error || 'Failed to submit review. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      setIsSubmitting(false);
      if (onClose) onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'An unexpected error occurred while saving your review.');
    }
  };

  return (
    <div className="modal-backdrop-overlay fade-in" onClick={onClose}>
      <div className="modal-sheet-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-indicator" />

        {/* Modal Header */}
        <div className="modal-header-row">
          <div className="modal-icon-badge warning">
            <Star size={20} className="star-filled" />
          </div>
          <div className="modal-titles">
            <h3 className="modal-title">
              {isEditing ? 'Edit Your Review' : 'Rate Venue Experience'}
            </h3>
            <span className="modal-sub">
              {booking.venueName} • {booking.courtName || booking.sport}
            </span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            title="Close"
            aria-label="Close review modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div
            className="fade-in"
            style={{
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '0.65rem 0.85rem',
              color: '#991B1B',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontWeight: 600 }}>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="modal-body-content">
          {/* Star Picker */}
          <div className="star-rating-picker" role="group" aria-label="Rating selection">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="star-pick-btn"
                onClick={() => setSelectedRating(star)}
                disabled={isSubmitting}
                title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                <Star
                  size={32}
                  className={star <= selectedRating ? 'star-filled-large' : 'star-empty-large'}
                />
              </button>
            ))}
          </div>

          {/* Contextual Rating Description */}
          <div className="rating-label-display">
            {getRatingLabel(selectedRating)}
          </div>

          {/* Tags Section */}
          <label className="input-group-label" style={{ marginTop: '0.75rem' }}>
            What stood out the most? (Optional)
          </label>
          <div className="rating-tags-wrap">
            {PRESET_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
                disabled={isSubmitting}
              >
                <span>{tag}</span>
              </button>
            ))}
          </div>

          {/* Written Feedback Textarea */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem' }}>
            <label className="input-group-label" style={{ margin: 0 }}>
              Your Review / Tips for Players
            </label>
            <span style={{ fontSize: '0.6875rem', color: comment.length > 500 ? '#EF4444' : '#94A3B8' }}>
              {comment.length}/500
            </span>
          </div>
          <textarea
            className="modal-text-input"
            placeholder="Share court bounce, net quality, lighting, parking, or locker facilities to help fellow athletes..."
            rows={3}
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
          />

          {/* Testing / Simulation Control (Subtle developer helper) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.4rem 0.65rem',
              background: '#F8FAFC',
              borderRadius: '6px',
              border: '1px dashed #CBD5E1',
              marginTop: '0.5rem',
              fontSize: '0.6875rem',
              color: '#64748B',
            }}
          >
            <span>Simulate Network / API Failure</span>
            <input
              type="checkbox"
              id="simulate-network-fail"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
              disabled={isSubmitting}
              style={{ cursor: 'pointer' }}
            />
          </div>

          {/* Modal Actions */}
          <div className="modal-actions-row" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="btn-modal-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-primary"
              disabled={isSubmitting}
              style={{ minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="spin-icon" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Update Review' : 'Submit Review'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
