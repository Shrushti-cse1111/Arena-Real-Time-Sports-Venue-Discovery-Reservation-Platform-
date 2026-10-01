import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  ChevronRight,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ownerVenueService } from '../services/ownerVenueService';
import OwnerBottomNav from './OwnerBottomNav';

export default function OwnerVenuesScreen({
  activeVenueId = 'venue-101',
  onSelectVenue = () => {},
  onNavigateAddVenue = () => {},
  onNavigateDashboard = () => {},
  onNavigate = () => {},
}) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState('owner'); // 'owner' | 'staff'
  const [currentActiveId, setCurrentActiveId] = useState(activeVenueId);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchVenues = useCallback(async (role = currentRole) => {
    setLoading(true);
    try {
      const data = await ownerVenueService.getVenues('owner-session-id', role);
      setVenues(data);
      // Ensure currentActiveId is valid
      const storedActiveId = ownerVenueService.getActiveVenueId();
      if (storedActiveId && data.some((v) => v.id === storedActiveId)) {
        setCurrentActiveId(storedActiveId);
      } else if (data.length > 0) {
        const fallbackId = data[0].id;
        setCurrentActiveId(fallbackId);
        ownerVenueService.setActiveVenueId(fallbackId);
      }
    } catch (err) {
      console.error('Failed to load venues:', err);
    } finally {
      setLoading(false);
    }
  }, [currentRole]);

  useEffect(() => {
    fetchVenues(currentRole);
  }, [fetchVenues, currentRole]);

  const handleSelectVenue = (venue) => {
    if (venue.status === 'rejected') {
      setToastMessage('Cannot select a rejected venue.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setCurrentActiveId(venue.id);
    ownerVenueService.setActiveVenueId(venue.id);
    onSelectVenue(venue);
    setToastMessage(`Switched active venue to "${venue.name}"`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRoleToggle = (newRole) => {
    setCurrentRole(newRole);
    fetchVenues(newRole);
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <span
          style={{
            background: '#F0FDF4',
            color: '#16A34A',
            border: '1px solid #BBF7D0',
            fontSize: '0.6875rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <CheckCircle2 size={11} />
          Active
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span
          style={{
            background: '#FFFBEB',
            color: '#D97706',
            border: '1px solid #FDE68A',
            fontSize: '0.6875rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <Clock size={11} />
          Pending Review
        </span>
      );
    }
    return (
      <span
        style={{
          background: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #FECACA',
          fontSize: '0.6875rem',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '999px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
        }}
      >
        <AlertTriangle size={11} />
        Rejected
      </span>
    );
  };

  return (
    <div className="owner-venues-screen screen-container" style={{ paddingBottom: '5rem' }}>
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--text-main, #0F172A)',
            color: '#FFFFFF',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            zIndex: 100,
            boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={14} color="#FBBF24" />
          {toastMessage}
        </div>
      )}

      {/* Screen Header */}
      <div className="screen-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="screen-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              Multi-Venue Hub
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', margin: '0.2rem 0 0 0' }}>
              Manage sports venues, switch workspace context & track status
            </p>
          </div>

          {/* Role switcher for permissions demo */}
          <div
            style={{
              display: 'flex',
              background: '#F1F5F9',
              padding: '2px',
              borderRadius: '6px',
            }}
          >
            <button
              type="button"
              onClick={() => handleRoleToggle('owner')}
              style={{
                border: 'none',
                background: currentRole === 'owner' ? '#FFFFFF' : 'transparent',
                color: currentRole === 'owner' ? 'var(--action-blue)' : 'var(--text-muted)',
                fontWeight: currentRole === 'owner' ? 700 : 500,
                fontSize: '0.6875rem',
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Owner
            </button>
            <button
              type="button"
              onClick={() => handleRoleToggle('staff')}
              style={{
                border: 'none',
                background: currentRole === 'staff' ? '#FFFFFF' : 'transparent',
                color: currentRole === 'staff' ? 'var(--action-blue)' : 'var(--text-muted)',
                fontWeight: currentRole === 'staff' ? 700 : 500,
                fontSize: '0.6875rem',
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Staff View
            </button>
          </div>
        </div>
      </div>

      {/* Active Context Banner */}
      <div
        style={{
          background: 'var(--action-blue-light, #EFF6FF)',
          border: '1px solid var(--action-blue-border, #BFDBFE)',
          borderRadius: 'var(--radius-md, 10px)',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--action-blue, #2563EB)',
            }}
          />
          <div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, display: 'block' }}>
              Active Workspace
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--action-blue)' }}>
              {venues.find((v) => v.id === currentActiveId)?.name || 'Select a venue below'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onNavigateDashboard()}
          style={{
            padding: '0.35rem 0.75rem',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          Open Dashboard <ArrowRight size={13} />
        </button>
      </div>

      {/* Skeletons Loader */}
      {loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          <div className="skeleton-card" style={{ height: '220px', background: '#E2E8F0', borderRadius: '12px' }} />
          <div className="skeleton-card" style={{ height: '220px', background: '#E2E8F0', borderRadius: '12px' }} />
        </div>
      )}

      {/* Empty State */}
      {!loading && venues.length === 0 && (
        <div
          style={{
            background: 'var(--bg-surface, #FFFFFF)',
            border: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: 'var(--radius-md, 12px)',
            padding: '3rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--action-blue-light, #EFF6FF)',
              color: 'var(--action-blue, #2563EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
            }}
          >
            <Building2 size={26} />
          </div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Create your first venue
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto 1.5rem auto' }}>
            List your courts, configure sports and upload photos to start taking bookings.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNavigateAddVenue}
            style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
          >
            <Plus size={16} />
            + Add venue
          </button>
        </div>
      )}

      {/* Venue Grid (2-column desktop, 1-column mobile) */}
      {!loading && venues.length > 0 && (
        <div
          className="venues-card-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {venues.map((venue) => {
            const isCurrentlyActive = currentActiveId === venue.id;

            return (
              <div
                key={venue.id}
                onClick={() => handleSelectVenue(venue)}
                className="venue-management-card"
                style={{
                  background: 'var(--bg-surface, #FFFFFF)',
                  borderRadius: 'var(--radius-md, 12px)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  /* CRITICAL REQUIREMENT: Only ONE venue receives Action Blue border + soft outer ring */
                  border: isCurrentlyActive
                    ? '2px solid var(--action-blue, #2563EB)'
                    : '1px solid var(--border-color, #E2E8F0)',
                  boxShadow: isCurrentlyActive
                    ? '0 0 0 2px var(--action-blue-border, #BFDBFE), var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1))'
                    : 'var(--shadow-sm, 0 1px 2px 0 rgba(0,0,0,0.05))',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Active Indicator Top Banner */}
                {isCurrentlyActive && (
                  <div
                    style={{
                      background: 'var(--action-blue, #2563EB)',
                      color: '#FFFFFF',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      padding: '3px 0',
                      letterSpacing: '0.03em',
                    }}
                  >
                    CURRENT ACTIVE VENUE
                  </div>
                )}

                {/* Venue Thumbnail with overlay */}
                <div style={{ position: 'relative', height: '140px', width: '100%', overflow: 'hidden' }}>
                  <img
                    src={venue.photos?.[0] || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80'}
                    alt={venue.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  {/* Status Badge in corner */}
                  <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                    {getStatusBadge(venue.status)}
                  </div>
                  {/* Sport Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#FFFFFF',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {venue.primarySport || venue.sports?.[0] || 'Sports'}
                  </div>
                </div>

                {/* Venue Details */}
                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: 'var(--text-main)' }}>
                      {venue.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                      <MapPin size={13} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {venue.address || venue.location}
                      </span>
                    </div>

                    {/* Sport Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                      {(venue.sports || []).map((sport) => (
                        <span
                          key={sport}
                          style={{
                            background: '#F1F5F9',
                            color: 'var(--text-main)',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div
                    style={{
                      borderTop: '1px solid #F1F5F9',
                      paddingTop: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {venue.courtsCount || 3} Courts configured
                    </span>

                    <button
                      type="button"
                      style={{
                        border: 'none',
                        background: isCurrentlyActive ? 'var(--action-blue-light, #EFF6FF)' : 'transparent',
                        color: isCurrentlyActive ? 'var(--action-blue, #2563EB)' : 'var(--text-muted, #64748B)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {isCurrentlyActive ? 'Active' : 'Select'} <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Dashed "+ Add venue" Card */}
          <div
            onClick={onNavigateAddVenue}
            style={{
              border: '2px dashed var(--action-blue-border, #BFDBFE)',
              borderRadius: 'var(--radius-md, 12px)',
              background: '#F8FAFC',
              minHeight: '220px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '1.5rem',
              textAlign: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--action-blue-light, #EFF6FF)',
                color: 'var(--action-blue, #2563EB)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <Plus size={22} />
            </div>
            <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--action-blue, #2563EB)' }}>
              + Add venue
            </span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', margin: '0.25rem 0 0 0' }}>
              Create a new sports turf or badminton hall listing
            </p>
          </div>
        </div>
      )}

      {/* Owner Bottom Navigation */}
      <OwnerBottomNav
        activeTab="venues"
        onNavigate={(tab) => {
          if (tab === 'dashboard') onNavigate('owner-dashboard');
          else if (tab === 'bookings') onNavigate('owner-bookings');
          else if (tab === 'availability') onNavigate('owner-availability');
          else if (tab === 'reviews') onNavigate('owner-reviews');
          else if (tab === 'promotions') onNavigate('owner-promotions');
          else if (tab === 'venues') onNavigate('owner-venues');
          else if (tab === 'analytics') onNavigate('owner-analytics');
        }}
      />
    </div>
  );
}
