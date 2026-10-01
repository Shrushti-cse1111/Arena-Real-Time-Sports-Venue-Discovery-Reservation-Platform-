import React from 'react';
import {
  MapPin,
  Star,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  SearchX,
  Bookmark,
} from 'lucide-react';
import { DISTANCE_OPTIONS } from '../data/mockVenues';

export default function VenueListScreen({
  venues = [],
  activeFilters = {
    sports: ['Badminton'],
    neighborhood: 'All Areas',
    distanceOption: '5km',
    locationDisplay: 'Pune, Maharashtra',
  },
  favoriteVenueIds = new Set(),
  onToggleFavorite,
  onSelectVenue,
  onOpenFilter,
}) {
  // Apply filtering logic
  const filteredVenues = venues.filter((v) => {
    const sportMatch =
      !activeFilters.sports ||
      activeFilters.sports.includes('All') ||
      activeFilters.sports.some((s) => v.sports.includes(s) || v.primarySport === s);

    const areaMatch =
      !activeFilters.neighborhood ||
      activeFilters.neighborhood === 'All Areas' ||
      v.neighborhood === activeFilters.neighborhood;

    const maxDist =
      DISTANCE_OPTIONS.find((d) => d.id === activeFilters.distanceOption)?.maxKm || 999;
    const distMatch = v.distanceKm <= maxDist;

    return sportMatch && areaMatch && distMatch;
  });

  // Display summary text e.g. "Badminton • Pune"
  const sportsSummary =
    activeFilters.sports && !activeFilters.sports.includes('All')
      ? activeFilters.sports.join(', ')
      : 'All Sports';

  const areaSummary =
    activeFilters.neighborhood && activeFilters.neighborhood !== 'All Areas'
      ? activeFilters.neighborhood
      : 'Pune';

  const summaryBadge = `${sportsSummary} • ${areaSummary}`;

  return (
    <div className="screen-body fade-in" style={{ paddingBottom: '1.5rem' }}>
      {/* SCREEN HEADER INFO */}
      <div className="venue-list-header-row">
        <div>
          <h1 className="screen-title" style={{ marginBottom: '0.2rem' }}>
            Available Venues
          </h1>
          <p className="screen-subtitle">
            Showing {filteredVenues.length} sports facilities
          </p>
        </div>

        <button
          type="button"
          className="list-filter-btn"
          onClick={onOpenFilter}
          title="Adjust filters"
        >
          <SlidersHorizontal size={15} />
          <span>Filters</span>
        </button>
      </div>

      {/* COMPACT ACTIVE FILTERS BADGE ROW */}
      <div className="filter-summary-pill-bar">
        <div className="summary-tags-wrap">
          <span className="summary-badge-pill">
            <span className="summary-dot" />
            <span>{summaryBadge}</span>
          </span>
          {activeFilters.distanceOption && activeFilters.distanceOption !== 'any' && (
            <span className="summary-badge-pill subtle">
              Under {activeFilters.distanceOption.replace('km', ' km')}
            </span>
          )}
        </div>
        <button
          type="button"
          className="link-btn-sm"
          onClick={onOpenFilter}
        >
          Change
        </button>
      </div>

      {/* VENUE CARDS LIST */}
      {filteredVenues.length > 0 ? (
        <div className="venues-cards-list">
          {filteredVenues.map((venue) => (
            <div
              key={venue.id}
              className="venue-card fav-venue-card-wrap"
              onClick={() => onSelectVenue(venue)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectVenue(venue)}
            >
              {/* Visual container with sports badges */}
              <div
                className="venue-card-visual"
                style={{ background: venue.imageGradient }}
              >
                <div className="visual-top-row">
                  <span className="venue-sport-tag">
                    {venue.sports.join(' • ')}
                  </span>
                  {venue.badgeText && (
                    <span className="venue-highlight-badge">
                      <Sparkles size={11} />
                      <span>{venue.badgeText}</span>
                    </span>
                  )}
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
                    {venue.sports.join(' • ')}
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
                  <button type="button" className="card-book-btn">
                    <span>View Slots</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-venues-state">
          <SearchX size={44} color="#94A3B8" />
          <h3>No Venues Found</h3>
          <p>
            No venues match your current filter criteria. Try changing sports or expanding your distance range.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: '1rem', width: 'auto', padding: '0 1.5rem' }}
            onClick={onOpenFilter}
          >
            Adjust Filters
          </button>
        </div>
      )}
    </div>
  );
}
