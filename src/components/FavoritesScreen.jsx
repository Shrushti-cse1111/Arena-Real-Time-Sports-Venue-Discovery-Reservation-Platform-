import React, { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  MapPin,
  Star,
  ChevronRight,
  Search,
  X,
  Home,
  Calendar,
  User,
  Sparkles,
  Heart,
} from 'lucide-react';
import { AVAILABLE_SPORTS } from '../data/mockVenues';

export default function FavoritesScreen({
  venues = [],
  favoriteVenueIds = new Set(),
  onSelectVenue,
  onToggleFavorite,
  onNavigateTab,
  onExploreVenues,
}) {
  const [selectedSport, setSelectedSport] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Derive saved venues list from all venues filtered by favoriteVenueIds
  const savedVenues = venues.filter((v) => favoriteVenueIds.has(v.id));

  // Apply sport filter
  const sportFiltered =
    selectedSport === 'All'
      ? savedVenues
      : savedVenues.filter(
          (v) => v.sports.includes(selectedSport) || v.primarySport === selectedSport
        );

  // Apply search filter
  const displayedVenues = sportFiltered.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.name?.toLowerCase().includes(q) ||
      v.location?.toLowerCase().includes(q) ||
      v.neighborhood?.toLowerCase().includes(q) ||
      v.sports?.some((s) => s.toLowerCase().includes(q))
    );
  });

  const handleRemoveFavorite = (e, venueId, venueName) => {
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(venueId);
    showToast(`${venueName} removed from Saved Venues`);
  };

  return (
    <div className="favorites-screen-container fade-in">
      {/* HEADER */}
      <header className="favorites-header">
        <div className="favorites-header-top">
          <div>
            <h1 className="favorites-page-title">Saved Venues</h1>
            <p className="favorites-page-subtitle">
              {savedVenues.length} venue{savedVenues.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <div className="favorites-header-icon">
            <Heart size={20} fill="#EF4444" color="#EF4444" />
          </div>
        </div>
      </header>

      {/* TOAST */}
      {toastMessage && (
        <div className="booking-toast-alert fade-in">
          <BookmarkCheck size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BODY */}
      <div className="favorites-scroll-body">
        {savedVenues.length === 0 ? (
          /* ── EMPTY STATE ── */
          <div className="favorites-empty-state">
            <div className="fav-empty-icon-bubble">
              <Bookmark size={34} />
            </div>
            <h3 className="fav-empty-title">No Saved Venues Yet</h3>
            <p className="fav-empty-desc">
              Tap the bookmark icon on any venue to save it here for quick access and booking.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '1.25rem', width: 'auto', padding: '0 1.75rem' }}
              onClick={onExploreVenues}
            >
              Explore Venues
            </button>
          </div>
        ) : (
          <>
            {/* SEARCH BAR */}
            <div className="notif-search-bar">
              <Search size={15} className="notif-search-icon" />
              <input
                type="text"
                className="notif-search-input"
                placeholder="Search saved venues..."
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

            {/* SPORT FILTER CHIPS */}
            <div className="sport-filter-section" style={{ margin: '0 -1.1rem' }}>
              <div className="sport-chips-scroll">
                {AVAILABLE_SPORTS.map((sport) => (
                  <button
                    key={sport}
                    type="button"
                    className={`sport-chip ${selectedSport === sport ? 'active' : ''}`}
                    onClick={() => setSelectedSport(sport)}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            {/* RESULTS COUNT */}
            <div className="fav-results-row">
              <span className="fav-results-label">
                {displayedVenues.length} venue{displayedVenues.length !== 1 ? 's' : ''} found
              </span>
            </div>

            {/* VENUE CARDS */}
            {displayedVenues.length === 0 ? (
              <div className="empty-venues-state">
                <Search size={40} color="#94A3B8" />
                <h3>No Results</h3>
                <p>
                  {searchQuery
                    ? `No saved venues matched "${searchQuery}".`
                    : `No saved venues for the "${selectedSport}" filter.`}
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ marginTop: '1rem', width: 'auto', padding: '0 1.25rem' }}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSport('All');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="venues-cards-list">
                {displayedVenues.map((venue) => (
                  <div
                    key={venue.id}
                    className="venue-card fav-venue-card-wrap"
                    onClick={() => onSelectVenue && onSelectVenue(venue)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onSelectVenue && onSelectVenue(venue)}
                  >
                    {/* Card Visual Area */}
                    <div
                      className="venue-card-visual"
                      style={{ background: venue.imageGradient }}
                    >
                      <div className="visual-top-row">
                        <span className="venue-sport-tag">
                          {venue.sports ? venue.sports.join(' • ') : venue.primarySport}
                        </span>
                        {venue.badgeText && (
                          <span className="venue-highlight-badge">
                            <Sparkles size={11} />
                            <span>{venue.badgeText}</span>
                          </span>
                        )}
                      </div>

                      {/* REMOVE FROM FAVORITES BUTTON */}
                      <button
                        type="button"
                        className="fav-save-btn saved"
                        onClick={(e) => handleRemoveFavorite(e, venue.id, venue.name)}
                        title="Remove from Saved Venues"
                        aria-label={`Remove ${venue.name} from favorites`}
                      >
                        <Bookmark size={16} fill="#EF4444" color="#EF4444" />
                      </button>

                      <div className="visual-bottom-row">
                        <span className="venue-live-status">
                          <span className="live-dot" />
                          <span>{venue.availabilityStatus}</span>
                        </span>
                      </div>
                    </div>

                    {/* Information Body */}
                    <div className="venue-card-body">
                      <div className="venue-name-row">
                        <h3 className="venue-name">{venue.name}</h3>
                        <div className="venue-rating-pill">
                          <Star size={13} fill="#F59E0B" color="#F59E0B" />
                          <span>{venue.rating}</span>
                        </div>
                      </div>

                      <div className="venue-submeta-row">
                        <span className="venue-sports-dist">
                          {venue.sports ? venue.sports.join(' • ') : venue.primarySport}
                        </span>
                        <div className="venue-location-dist">
                          <MapPin size={12} color="#64748B" />
                          <span>
                            {venue.neighborhood} • {venue.distance}
                          </span>
                        </div>
                      </div>

                      <div className="venue-card-footer">
                        <div className="venue-price-wrap">
                          <span className="venue-price">{venue.priceDisplay}</span>
                        </div>
                        <button
                          type="button"
                          className="card-book-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVenue && onSelectVenue(venue);
                          }}
                        >
                          <span>View Slots</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="bottom-nav-bar" aria-label="Main Navigation">
        <button
          type="button"
          className="nav-item"
          onClick={() => onNavigateTab && onNavigateTab('home')}
        >
          <Home size={20} />
          <span>Home</span>
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={() => onNavigateTab && onNavigateTab('bookings')}
        >
          <Calendar size={20} />
          <span>Bookings</span>
        </button>

        <button
          type="button"
          className="nav-item active"
        >
          <Heart size={20} />
          <span>Saved</span>
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={() => onNavigateTab && onNavigateTab('profile')}
        >
          <User size={20} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
