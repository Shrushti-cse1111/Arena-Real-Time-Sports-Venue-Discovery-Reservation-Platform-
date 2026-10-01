import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Star,
  Home,
  Calendar,
  User,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  X,
  CheckCircle2,
  Award,
  Bell,
  Bookmark,
  Heart,
} from 'lucide-react';
import RatingReviewModal from './RatingReviewModal';
import { AVAILABLE_SPORTS } from '../data/mockVenues';

export default function PlayerHomeScreen({
  userName = 'Player',
  location = 'Pune, Maharashtra',
  venues = [],
  favoriteVenueIds = new Set(),
  onToggleFavorite,
  pendingReviewBooking = null,
  unreadNotifCount = 0,
  onRateBooking,
  onDismissRatingPrompt,
  onSelectVenue,
  onOpenFilter,
  onViewAll,
  onNavigateTab,
  onOpenNotifications,
  onOpenFavorites,
}) {
  const [selectedSport, setSelectedSport] = useState('All');
  const [activeNavTab, setActiveNavTab] = useState('home');
  const [dismissedPrompt, setDismissedPrompt] = useState(false);

  // Rating Modal state on Home
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [bannerHoverRating, setBannerHoverRating] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter venues by selected sport
  const displayedVenues = selectedSport === 'All'
    ? venues
    : venues.filter((v) => v.sports.includes(selectedSport) || v.primarySport === selectedSport);

  const displayName = userName && userName.trim() ? userName.split(' ')[0] : 'Player';
  const avatarLetter = displayName.charAt(0).toUpperCase();



  return (
    <div className="player-home-container fade-in">
      {/* HEADER SECTION */}
      <header className="player-home-header">
        <div className="home-greeting-row">
          <div>
            <span className="greeting-small">Good morning,</span>
            <h1 className="greeting-name">{displayName}</h1>
          </div>
          <div className="home-header-actions-right">
            <button
              type="button"
              className="home-notif-btn"
              onClick={onOpenFavorites}
              title="Saved Venues"
              aria-label="View saved venues"
            >
              <Heart size={18} fill={favoriteVenueIds.size > 0 ? '#EF4444' : 'none'} color={favoriteVenueIds.size > 0 ? '#EF4444' : 'currentColor'} />
              {favoriteVenueIds.size > 0 && (
                <span className="notif-badge-dot" style={{ background: '#EF4444' }}>
                  {favoriteVenueIds.size > 9 ? '9+' : favoriteVenueIds.size}
                </span>
              )}
            </button>
            <button
              type="button"
              className="home-notif-btn"
              onClick={onOpenNotifications}
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell size={18} />
              {unreadNotifCount > 0 && (
                <span className="notif-badge-dot">
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>
            <button
              type="button"
              className="home-avatar-btn"
              onClick={() => onNavigateTab && onNavigateTab('profile')}
              title="View Profile"
              aria-label="User profile"
            >
              <span>{avatarLetter}</span>
            </button>
          </div>
        </div>

        {/* LOCATION SECTION (Clickable) */}
        <div
          className="home-location-bar"
          onClick={onOpenFilter}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onOpenFilter()}
          title="Change location"
        >
          <div className="location-info">
            <MapPin size={16} className="location-pin-icon" />
            <span className="location-text">{location}</span>
          </div>
          <span className="location-change-tag">Change</span>
        </div>

        {/* SEARCH BAR */}
        <div
          className="home-search-box"
          onClick={onOpenFilter}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onOpenFilter()}
        >
          <Search size={18} className="search-box-icon" />
          <span className="search-placeholder">Search venues or sports</span>
          <div className="search-filter-icon-btn">
            <SlidersHorizontal size={15} />
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

      {/* BODY CONTENT */}
      <div className="home-scroll-content">
        {/* SPORT FILTER CHIPS (Horizontally Scrollable) */}
        <div className="sport-filter-section">
          <div className="sport-chips-scroll">
            {AVAILABLE_SPORTS.map((sport) => {
              const isSelected = selectedSport === sport;
              return (
                <button
                  key={sport}
                  type="button"
                  className={`sport-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedSport(sport)}
                >
                  {sport}
                </button>
              );
            })}
          </div>
        </div>

        {/* POST-GAME RATING PROMPT BANNER (NAVY BLUE BOX) */}
        {!dismissedPrompt && (
          <div
            className="post-game-rating-banner fade-in"
            role="region"
            aria-label="Rate your recent turf experience"
            style={{
              display: 'block',
              minHeight: 'fit-content',
              flexShrink: 0,
              overflow: 'visible',
              width: '100%',
              boxSizing: 'border-box',
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              borderRadius: '16px',
              padding: '1rem 1.15rem',
              color: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.35)',
              margin: '0.25rem 0 0.5rem 0',
            }}
          >
            <div className="banner-top-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div
                className="banner-sparkle-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(251, 191, 36, 0.18)',
                  color: '#FBBF24',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  fontSize: '0.71875rem',
                  fontWeight: 700,
                  border: '1px solid rgba(251, 191, 36, 0.35)',
                }}
              >
                <Star size={13} fill="#F59E0B" color="#F59E0B" />
                <span>Rate Your Recent Game</span>
              </div>
              <button
                type="button"
                className="banner-close-btn"
                onClick={() => {
                  if (onDismissRatingPrompt && pendingReviewBooking) {
                    onDismissRatingPrompt(pendingReviewBooking.id);
                  }
                  setDismissedPrompt(true);
                }}
                title="Dismiss"
                aria-label="Dismiss rating prompt"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  color: '#94A3B8',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            </div>
            <div className="banner-content-col" style={{ margin: '0.5rem 0 0.75rem 0' }}>
              <h3
                className="banner-headline"
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  color: '#F8FAFC',
                  lineHeight: 1.35,
                  margin: '0 0 0.35rem 0',
                }}
              >
                How was your {pendingReviewBooking?.sport || 'Badminton'} experience at {pendingReviewBooking?.venueName || venues[0]?.name || 'Arena Sports Club'}?
              </h3>
              <p
                className="banner-subtext"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  color: '#94A3B8',
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                <MapPin size={13} className="banner-subtext-icon" style={{ color: '#60A5FA', flexShrink: 0 }} />
                <span>{pendingReviewBooking?.courtName || venues[0]?.courts?.[0]?.name || 'Court 1'}</span>
                <span className="banner-subtext-bullet" style={{ color: '#64748B' }}>•</span>
                <span>{pendingReviewBooking?.dateFormatted || pendingReviewBooking?.date || 'Recent Match'}</span>
              </p>
            </div>
            <div
              className="banner-action-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <div className="quick-star-row" role="group" aria-label="Quick star rating" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {[1, 2, 3, 4, 5].map((s) => {
                  const isHighlighted = bannerHoverRating > 0 ? s <= bannerHoverRating : true;
                  return (
                    <button
                      key={s}
                      type="button"
                      className="quick-star-btn"
                      onMouseEnter={() => setBannerHoverRating(s)}
                      onMouseLeave={() => setBannerHoverRating(0)}
                      onClick={() => {
                        setSelectedRating(s);
                        setShowRatingModal(true);
                      }}
                      title={`Rate ${s} star${s > 1 ? 's' : ''}`}
                      aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <Star
                        size={19}
                        className="star-icon"
                        fill={isHighlighted ? '#F59E0B' : 'rgba(245, 158, 11, 0.25)'}
                        color={isHighlighted ? '#FBBF24' : '#94A3B8'}
                      />
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="btn-rate-game-action"
                onClick={() => setShowRatingModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  fontFamily: 'inherit',
                  fontSize: '0.78125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                }}
              >
                <span>Write Review</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* SECTION TITLE: Nearby Venues */}
        <div className="section-header-row">
          <div>
            <h2 className="section-title-text">Nearby Venues</h2>
            <span className="section-subtitle-text">
              {displayedVenues.length} sports facilities found
            </span>
          </div>
          <button
            type="button"
            className="view-all-link"
            onClick={() => onViewAll(selectedSport)}
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* VENUE CARDS LIST */}
        <div className="venues-cards-list">
          {displayedVenues.map((venue) => (
            <div
              key={venue.id}
              className="venue-card fav-venue-card-wrap"
              onClick={() => onSelectVenue(venue)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectVenue(venue)}
            >
              {/* Image Area with Realistic Visual Gradient & Badges */}
              <div
                className="venue-card-visual"
                style={{ background: venue.imageGradient }}
              >
                {venue.badgeText && (
                  <span className="venue-badge-pill">{venue.badgeText}</span>
                )}
                <div className="venue-card-rating-chip">
                  <Star size={12} fill="#F59E0B" color="#F59E0B" />
                  <span className="rating-score">{venue.rating}</span>
                  <span className="rating-count">({venue.reviewsCount ?? (venue.reviews?.length || 0)})</span>
                </div>

                {/* BOOKMARK OVERLAY BUTTON */}
                <button
                  type="button"
                  className={`fav-save-btn ${favoriteVenueIds.has(venue.id) ? 'saved' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleFavorite) onToggleFavorite(venue.id);
                  }}
                  title={favoriteVenueIds.has(venue.id) ? 'Remove from Saved' : 'Save Venue'}
                  aria-label={favoriteVenueIds.has(venue.id) ? `Remove ${venue.name} from favorites` : `Save ${venue.name} to favorites`}
                >
                  <Bookmark
                    size={15}
                    fill={favoriteVenueIds.has(venue.id) ? '#EF4444' : 'none'}
                    color={favoriteVenueIds.has(venue.id) ? '#EF4444' : '#fff'}
                  />
                </button>
              </div>

              {/* Card Details Body */}
              <div className="venue-card-body">
                <div className="venue-main-header">
                  <h3 className="venue-name-heading">{venue.name}</h3>
                  <div className="venue-location-line">
                    <MapPin size={13} className="pin-icon" />
                    <span>{venue.location}</span>
                  </div>
                </div>

                {/* Sports Tags Line */}
                <div className="venue-sports-row">
                  {venue.sports.slice(0, 3).map((sp) => (
                    <span key={sp} className="sport-mini-tag">
                      {sp}
                    </span>
                  ))}
                  {venue.sports.length > 3 && (
                    <span className="sport-mini-tag">
                      +{venue.sports.length - 3}
                    </span>
                  )}
                </div>

                {/* Pricing & Booking Action */}
                <div className="venue-card-footer">
                  <div className="venue-price-block">
                    <span className="price-starting">Starting from</span>
                    <span className="price-val">₹{venue.pricePerHour}<small>/hr</small></span>
                  </div>
                  <button
                    type="button"
                    className="card-book-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectVenue(venue);
                    }}
                  >
                    <span>Book Now</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          MODAL: POST-GAME RATING MODAL (From Home Banner)
          ========================================================================= */}
      <RatingReviewModal
        isOpen={showRatingModal}
        booking={pendingReviewBooking || {
          id: 'manual-review-1',
          bookingId: '#ARN-2026-LIVE',
          venueId: venues[0]?.id || 'venue-1',
          venueName: venues[0]?.name || 'Arena Sports Club',
          courtName: venues[0]?.courts?.[0]?.name || 'Synthetic Badminton Court 1',
          sport: selectedSport !== 'All' ? selectedSport : 'Badminton',
          dateFormatted: 'Today',
        }}
        initialRating={selectedRating}
        onClose={() => setShowRatingModal(false)}
        onSubmit={async (bookingId, reviewData) => {
          const targetBookingId = pendingReviewBooking ? pendingReviewBooking.id : 'manual-review-1';
          if (onRateBooking) {
            const res = await onRateBooking(targetBookingId, reviewData);
            if (res && res.success) {
              showToast(`Review published! Thank you.`);
              setShowRatingModal(false);
              setDismissedPrompt(true);
            }
            return res;
          }
          showToast(`Review published! Thank you.`);
          setShowRatingModal(false);
          setDismissedPrompt(true);
          return { success: true };
        }}
      />

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="bottom-nav-bar" aria-label="Main Navigation">
        <button
          type="button"
          className={`nav-item ${activeNavTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveNavTab('home')}
        >
          <Home size={20} />
          <span>Home</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeNavTab === 'bookings' ? 'active' : ''}`}
          onClick={() => {
            setActiveNavTab('bookings');
            if (onNavigateTab) onNavigateTab('bookings');
          }}
        >
          <Calendar size={20} />
          <span>Bookings</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeNavTab === 'profile' ? 'active' : ''}`}
          onClick={() => {
            setActiveNavTab('profile');
            if (onNavigateTab) onNavigateTab('profile');
          }}
        >
          <User size={20} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
