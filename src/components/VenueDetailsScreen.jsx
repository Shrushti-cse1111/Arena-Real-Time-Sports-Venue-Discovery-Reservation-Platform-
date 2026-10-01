import React, { useState, useRef } from 'react';
import {
  MapPin,
  Star,
  Car,
  DoorClosed,
  Package,
  Droplets,
  Sun,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Share2,
  Bookmark,
  BookmarkCheck,
  Coffee,
  Wifi,
  Navigation,
  ExternalLink,
  X,
  Sparkles,
  Clock,
  Info,
} from 'lucide-react';

export default function VenueDetailsScreen({
  venue,
  selectedCourt,
  isFavorite = false,
  onToggleFavorite,
  onSelectCourt,
  onViewSlots,
}) {
  const [activeCourt, setActiveCourt] = useState(
    selectedCourt || (venue.courts && venue.courts[0]) || {
      id: 'default',
      name: 'Standard Court',
      price: venue.pricePerHour || 400,
    }
  );
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [showFullImageViewer, setShowFullImageViewer] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [saveToast, setSaveToast] = useState(null);

  // Touch Swipe Gesture State
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const photos = venue.photos && venue.photos.length > 0 ? venue.photos : [
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
  ];

  const handleCourtChange = (court) => {
    setActiveCourt(court);
    if (onSelectCourt) onSelectCourt(court);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  };

  const handleToggleSave = () => {
    if (onToggleFavorite) onToggleFavorite(venue.id);
    const msg = isFavorite
      ? `${venue.name} removed from Saved Venues`
      : `${venue.name} added to Saved Venues ♥`;
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  const openGoogleMaps = () => {
    const query = encodeURIComponent(`${venue.name}, ${venue.location}`);
    const lat = venue.latitude || 18.5362;
    const lng = venue.longitude || 73.8958;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&query=${query}`, '_blank');
  };

  // Carousel Next/Prev
  const handleNextPhoto = (e) => {
    if (e) e.stopPropagation();
    setActivePhotoIdx((prev) => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = (e) => {
    if (e) e.stopPropagation();
    setActivePhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const swipeThreshold = 40; // minimum pixels for swipe

    if (diff > swipeThreshold) {
      // Swiped left -> show next
      handleNextPhoto();
    } else if (diff < -swipeThreshold) {
      // Swiped right -> show prev
      handlePrevPhoto();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const renderAmenityIcon = (iconName) => {
    switch (iconName) {
      case 'Car':
        return <Car size={18} />;
      case 'DoorClosed':
        return <DoorClosed size={18} />;
      case 'Package':
        return <Package size={18} />;
      case 'Droplets':
        return <Droplets size={18} />;
      case 'Sun':
        return <Sun size={18} />;
      case 'Coffee':
        return <Coffee size={18} />;
      case 'Wifi':
        return <Wifi size={18} />;
      default:
        return <ShieldCheck size={18} />;
    }
  };

  return (
    <div className="venue-details-container fade-in">
      {/* SHARE TOAST */}
      {shareToast && (
        <div className="floating-toast-badge fade-in">
          <span>Venue link copied to clipboard!</span>
        </div>
      )}

      {/* SAVE TOAST */}
      {saveToast && (
        <div className="booking-toast-alert fade-in">
          <BookmarkCheck size={16} />
          <span>{saveToast}</span>
        </div>
      )}

      {/* FULL-SCREEN IMAGE VIEWER MODAL */}
      {showFullImageViewer && (
        <div
          className="full-image-viewer-modal fade-in"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            className="viewer-close-btn"
            onClick={() => setShowFullImageViewer(false)}
          >
            <X size={22} />
          </button>

          {/* Viewer Carousel Arrows */}
          <button
            type="button"
            className="viewer-arrow-btn left"
            onClick={handlePrevPhoto}
            aria-label="Previous photo"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            className="viewer-arrow-btn right"
            onClick={handleNextPhoto}
            aria-label="Next photo"
          >
            <ChevronRight size={24} />
          </button>

          <img
            src={photos[activePhotoIdx]}
            alt={venue.name}
            className="viewer-main-img"
          />
          <div className="viewer-bottom-bar">
            <span>{venue.name} • Photo {activePhotoIdx + 1} of {photos.length}</span>
          </div>
        </div>
      )}

      {/* TOP PHOTO CAROUSEL HERO WITH TOUCH SWIPE */}
      <div
        className="details-hero-visual"
        style={{ backgroundImage: `url(${photos[activePhotoIdx]})` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="hero-gradient-overlay" />

        <div className="details-hero-top">
          <span className="details-sport-badge">
            {venue.sports ? venue.sports.join(' • ') : venue.primarySport}
          </span>
          <div className="details-top-actions">
            <button
              type="button"
              className="details-action-btn"
              onClick={handleShare}
              title="Share Venue"
            >
              <Share2 size={16} />
            </button>
            <button
              type="button"
              className={`details-action-btn ${isFavorite ? 'saved' : ''}`}
              onClick={handleToggleSave}
              title={isFavorite ? 'Remove from Favorites' : 'Save to Favorites'}
              aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Bookmark size={16} fill={isFavorite ? '#EF4444' : 'none'} color={isFavorite ? '#EF4444' : '#FFF'} />
            </button>
          </div>
        </div>

        {/* Carousel Arrow Buttons for Touch & Desktop */}
        <div className="carousel-nav-arrows">
          <button
            type="button"
            className="hero-arrow-btn left"
            onClick={handlePrevPhoto}
            aria-label="Previous photo"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="hero-arrow-btn right"
            onClick={handleNextPhoto}
            aria-label="Next photo"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Carousel indicators & Photo Tap Prompt */}
        <div className="details-hero-bottom">
          <div
            className="details-photo-count-pill"
            onClick={() => setShowFullImageViewer(true)}
            role="button"
            tabIndex={0}
          >
            <span>{activePhotoIdx + 1} / {photos.length} Photos</span>
          </div>

          <div className="photo-dots-row">
            {photos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`photo-dot ${activePhotoIdx === idx ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx(idx);
                }}
                aria-label={`Photo ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* VENUE INFORMATION SCROLLABLE BODY */}
      <div className="details-scroll-content">
        {/* HEADER CARD */}
        <div className="details-header-card">
          <div className="details-title-row">
            <div>
              <h1 className="details-venue-title">{venue.name}</h1>
              <div className="details-verified-row">
                <ShieldCheck size={14} color="#059669" />
                <span className="verified-text">Arena Verified Facility</span>
              </div>
            </div>

            <div className="details-rating-badge">
              <Star size={13} fill="#F59E0B" color="#F59E0B" />
              <span className="rating-score">{venue.rating}</span>
              <span className="rating-count">({venue.reviewsCount ?? (venue.reviews?.length || 0)})</span>
            </div>
          </div>

          <div className="details-location-row" onClick={openGoogleMaps} role="button" tabIndex={0}>
            <MapPin size={15} className="location-pin" />
            <span className="details-location-text">{venue.location}</span>
            <span className="details-dist-tag">• {venue.distance}</span>
          </div>
        </div>

        {/* ABOUT VENUE */}
        <div className="details-section">
          <h2 className="details-section-heading">About Venue</h2>
          <p className="details-about-text">{venue.about}</p>
        </div>

        {/* COURT / PITCH SELECTION */}
        <div className="details-section">
          <div className="section-label-row">
            <h2 className="details-section-heading">Select Court / Turf</h2>
            <span className="section-note">Tap to switch court</span>
          </div>

          <div className="courts-selector-grid">
            {venue.courts.map((court) => {
              const isSelected = activeCourt.id === court.id;
              return (
                <button
                  key={court.id}
                  type="button"
                  className={`court-select-card ${isSelected ? 'active' : ''}`}
                  onClick={() => handleCourtChange(court)}
                >
                  <div className="court-info-left">
                    <span className="court-name">{court.name}</span>
                    <span className="court-type">{court.type}</span>
                  </div>
                  <div className="court-price-badge">
                    <span>₹{court.price}/hr</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* AMENITIES SECTION */}
        <div className="details-section">
          <h2 className="details-section-heading">Facilities & Amenities</h2>
          <div className="amenities-grid-enhanced">
            {venue.amenities.map((amenity) => (
              <div key={amenity.id} className="amenity-pill-card">
                <div className="amenity-icon-bubble">
                  {renderAmenityIcon(amenity.icon)}
                </div>
                <span className="amenity-name-text">{amenity.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* LOCATION & MAP SECTION */}
        <div className="details-section">
          <div className="section-label-row">
            <h2 className="details-section-heading">Location & Directions</h2>
            <span className="section-note">{venue.distance}</span>
          </div>

          <div className="venue-map-card" onClick={openGoogleMaps} role="button" tabIndex={0}>
            <div className="map-card-header">
              <div className="map-pin-circle">
                <MapPin size={18} color="#FFFFFF" />
              </div>
              <div className="map-address-col">
                <span className="map-venue-title">{venue.name}</span>
                <span className="map-venue-address">{venue.location}</span>
              </div>
            </div>

            <div className="map-cta-row">
              <button type="button" className="get-directions-btn" onClick={openGoogleMaps}>
                <Navigation size={14} />
                <span>Get Directions on Google Maps</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* PRICING BREAKDOWN */}
        <div className="details-section">
          <div className="section-label-row">
            <h2 className="details-section-heading">Court Pricing & Rates</h2>
            <span className="pricing-badge-rate">Per Hour</span>
          </div>

          <div className="pricing-table-container">
            {venue.pricing && venue.pricing.length > 0 ? (
              venue.pricing.map((tier, idx) => (
                <div key={idx} className="pricing-tier-row">
                  <div className="pricing-tier-left">
                    <span className="tier-court-title">{tier.courtName}</span>
                    <span className="tier-hours-note">{tier.peakHours}</span>
                  </div>
                  <div className="pricing-tier-right">
                    <span className="regular-price">₹{tier.regular} <small>/hr</small></span>
                    {tier.peak && (
                      <span className="peak-price-tag">Peak: ₹{tier.peak}/hr</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="pricing-tier-row">
                <div className="pricing-tier-left">
                  <span className="tier-court-title">{activeCourt.name}</span>
                  <span className="tier-hours-note">Standard Booking Slot</span>
                </div>
                <div className="pricing-tier-right">
                  <span className="regular-price">₹{activeCourt.price} <small>/hr</small></span>
                </div>
              </div>
            )}

            <div className="pricing-disclaimer-box">
              <Info size={13} color="#64748B" />
              <span>Exact slot prices & duration discounts are confirmed on the slot selection calendar.</span>
            </div>
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <div className="details-section" style={{ marginBottom: '1rem' }}>
          <div className="section-label-row">
            <h2 className="details-section-heading">Player Reviews</h2>
            <div className="reviews-score-summary">
              <Star size={13} fill="#F59E0B" color="#F59E0B" />
              <span className="score-big">{venue.rating}</span>
              <span className="score-total">({venue.reviewsCount ?? (venue.reviews?.length || 0)})</span>
            </div>
          </div>

          <div className="reviews-cards-list">
            {venue.reviews && venue.reviews.length > 0 ? (
              venue.reviews.map((rev) => (
                <div key={rev.id} className="review-card-item">
                  <div className="review-header-row">
                    <div className="review-avatar-circle">
                      {rev.author ? rev.author.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="review-meta-col">
                      <div className="review-author-line">
                        <span className="review-author-name">{rev.author}</span>
                        {rev.sport && <span className="review-sport-tag">{rev.sport}</span>}
                      </div>
                      <span className="review-date-text">
                        {rev.date}
                        {rev.courtName ? ` • ${rev.courtName}` : ''}
                      </span>
                    </div>
                    <div className="review-rating-pill">
                      <Star size={11} fill="#F59E0B" color="#F59E0B" />
                      <span>{Number(rev.rating).toFixed(1)}</span>
                    </div>
                  </div>
                  {rev.tags && rev.tags.length > 0 && (
                    <div className="review-tags-mini-row">
                      {rev.tags.map((tag) => (
                        <span key={tag} className="review-mini-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="review-comment-body">{rev.comment}</p>
                </div>
              ))
            ) : (
              <div className="review-card-item">
                <p className="review-comment-body">No reviews yet. Be the first to play and review this venue!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR (PERFECTLY PLACED & ALIGNED) */}
      <div className="details-bottom-bar">
        <div className="bottom-price-column">
          <span className="price-lead-label">Starting from</span>
          <div className="price-amount-wrap">
            <span className="price-currency">₹</span>
            <span className="price-number">{activeCourt.price}</span>
            <span className="price-unit">/ hour</span>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary details-cta-btn"
          onClick={() => onViewSlots(activeCourt)}
        >
          <span>Book Now</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
