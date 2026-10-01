import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Check,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import {
  AVAILABLE_SPORTS,
  PUNE_NEIGHBORHOODS,
  DISTANCE_OPTIONS,
} from '../data/mockVenues';

export default function VenueFilterScreen({
  venues = [],
  initialFilters = {
    sports: ['Badminton'],
    neighborhood: 'All Areas',
    distanceOption: '5km',
  },
  onApplyFilters,
  onCancel,
}) {
  const [selectedSports, setSelectedSports] = useState(
    initialFilters.sports && initialFilters.sports.length > 0 ? initialFilters.sports : ['Badminton']
  );
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(
    initialFilters.neighborhood || 'All Areas'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistance, setSelectedDistance] = useState(
    initialFilters.distanceOption || '5km'
  );

  // Toggle sport selection
  const handleToggleSport = (sport) => {
    if (sport === 'All') {
      setSelectedSports(['All']);
      return;
    }

    let next = selectedSports.filter((s) => s !== 'All');
    if (next.includes(sport)) {
      if (next.length > 1) {
        next = next.filter((s) => s !== sport);
      }
    } else {
      next.push(sport);
    }
    setSelectedSports(next);
  };

  // Reset to default
  const handleReset = () => {
    setSelectedSports(['All']);
    setSelectedNeighborhood('All Areas');
    setSelectedDistance('any');
    setSearchQuery('');
  };

  // Filter count computation
  const filteredNeighborhoods = PUNE_NEIGHBORHOODS.filter((n) =>
    n.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Approximate matching count for button label
  const matchCount = venues.filter((v) => {
    const sportMatch =
      selectedSports.includes('All') ||
      selectedSports.some((s) => v.sports.includes(s) || v.primarySport === s);
    const areaMatch =
      selectedNeighborhood === 'All Areas' || v.neighborhood === selectedNeighborhood;
    const distLimit =
      DISTANCE_OPTIONS.find((d) => d.id === selectedDistance)?.maxKm || 999;
    const distMatch = v.distanceKm <= distLimit;
    return sportMatch && areaMatch && distMatch;
  }).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyFilters({
      sports: selectedSports,
      neighborhood: selectedNeighborhood,
      distanceOption: selectedDistance,
      locationDisplay:
        selectedNeighborhood === 'All Areas'
          ? 'Pune, Maharashtra'
          : `${selectedNeighborhood}, Pune`,
    });
  };

  return (
    <div className="screen-body fade-in">
      <div className="filter-header-row">
        <div>
          <h1 className="screen-title" style={{ marginBottom: '0.15rem' }}>Find a Venue</h1>
          <p className="screen-subtitle">Filter by sport, area and distance</p>
        </div>
        <button
          type="button"
          className="filter-reset-btn"
          onClick={handleReset}
          title="Reset all filters"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="filter-form-body">
        {/* SPORT SECTION */}
        <div className="filter-section-group">
          <label className="form-label" style={{ marginBottom: '0.5rem' }}>
            Select Sports
          </label>
          <div className="multi-sport-grid">
            {AVAILABLE_SPORTS.map((sport) => {
              const isSelected = selectedSports.includes(sport);
              return (
                <button
                  key={sport}
                  type="button"
                  className={`filter-sport-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => handleToggleSport(sport)}
                >
                  <div className="pill-check-indicator">
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span>{sport}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LOCATION SECTION */}
        <div className="filter-section-group">
          <div className="form-label-row" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label">Location</label>
            <span className="location-current-tag">
              <MapPin size={12} />
              <span>Pune, Maharashtra</span>
            </span>
          </div>

          <div className="input-wrapper" style={{ marginBottom: '0.65rem' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search area in Pune (e.g. Koregaon Park)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="input-icon-right">
              <Search size={16} color="#94A3B8" />
            </span>
          </div>

          {/* Quick Select Areas */}
          <div className="neighborhood-chips-scroll">
            {filteredNeighborhoods.map((area) => (
              <button
                key={area}
                type="button"
                className={`neighborhood-chip ${selectedNeighborhood === area ? 'active' : ''}`}
                onClick={() => setSelectedNeighborhood(area)}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* DISTANCE RANGE */}
        <div className="filter-section-group">
          <label className="form-label" style={{ marginBottom: '0.5rem' }}>
            Distance Range
          </label>
          <div className="distance-options-grid">
            {DISTANCE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`distance-opt-card ${selectedDistance === opt.id ? 'active' : ''}`}
                onClick={() => setSelectedDistance(opt.id)}
              >
                <span className="distance-label">{opt.label}</span>
                <div className="distance-radio">
                  {selectedDistance === opt.id && <div className="radio-dot" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* BOTTOM ACTION BUTTON */}
        <div className="bottom-action-container">
          <button type="submit" className="btn-primary">
            <span>Show Venues ({matchCount})</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
