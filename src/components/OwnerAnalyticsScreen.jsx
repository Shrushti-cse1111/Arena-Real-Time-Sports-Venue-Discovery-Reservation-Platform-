import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Activity,
  AlertCircle,
  RefreshCw,
  Clock,
  ChevronRight,
  Info,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { ownerAnalyticsService } from '../services/ownerAnalyticsService';
import OwnerBottomNav from './OwnerBottomNav';

export default function OwnerAnalyticsScreen({
  activeVenue = null,
  venues = [],
  onSelectVenue = () => {},
  onNavigate = () => {},
  onBack = () => {},
}) {
  const [selectedRange, setSelectedRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [insufficientData, setInsufficientData] = useState(false);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredHeatCell, setHoveredHeatCell] = useState(null);

  const venueId = activeVenue?.id || venues[0]?.id || 'venue-101';
  const venueTitle = activeVenue?.name || venues[0]?.name || 'Arena Sports Club';

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ownerAnalyticsService.getAnalyticsSummary(venueId, selectedRange);
      if (res.insufficientData) {
        setInsufficientData(true);
        setAnalytics(null);
      } else {
        setInsufficientData(false);
        setAnalytics(res.data);
      }
    } catch (err) {
      setError(err.message || 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [venueId, selectedRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Max value calculation for CSS 7-bar chart
  const weeklyBookings = analytics?.weeklyBookings || [];
  const maxBookingCount = Math.max(...weeklyBookings.map((b) => b.count || 0), 1);

  return (
    <div className="owner-analytics-screen screen-container" style={{ paddingBottom: '5rem' }}>
      {/* Header */}
      <div className="screen-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h1 className="screen-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            Venue Analytics
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
            <Building2 size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{venueTitle}</span>
          </div>
        </div>

        {/* Date Range Selector */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface-secondary, #F1F5F9)',
            padding: '3px',
            borderRadius: 'var(--radius-md, 8px)',
            gap: '2px',
          }}
        >
          {[
            { id: '7d', label: '7D' },
            { id: '30d', label: '30D' },
            { id: '90d', label: '90D' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedRange(tab.id)}
              style={{
                border: 'none',
                background: selectedRange === tab.id ? '#FFFFFF' : 'transparent',
                color: selectedRange === tab.id ? 'var(--action-blue, #2563EB)' : 'var(--text-muted, #64748B)',
                fontWeight: selectedRange === tab.id ? 700 : 500,
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: selectedRange === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div
          className="error-banner"
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '1rem',
            borderRadius: 'var(--radius-md, 8px)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.875rem' }}>Unable to load analytics.</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadAnalytics}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Top stats skeletons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="skeleton-card" style={{ height: '90px', background: '#E2E8F0', borderRadius: '10px' }} />
            <div className="skeleton-card" style={{ height: '90px', background: '#E2E8F0', borderRadius: '10px' }} />
          </div>
          {/* Chart skeleton */}
          <div className="skeleton-card" style={{ height: '220px', background: '#E2E8F0', borderRadius: '10px' }} />
          {/* Heat strip skeleton */}
          <div className="skeleton-card" style={{ height: '140px', background: '#E2E8F0', borderRadius: '10px' }} />
        </div>
      )}

      {/* Insufficient Data Zero-State (NOT misleading zero charts) */}
      {!loading && !error && insufficientData && (
        <div
          className="insufficient-data-card"
          style={{
            background: 'var(--bg-surface, #FFFFFF)',
            border: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: 'var(--radius-md, 12px)',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            marginTop: '1rem',
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
            <Activity size={26} />
          </div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main, #0F172A)' }}>
            Not enough data yet
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #64748B)', maxWidth: '320px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            This venue has fewer than 7 days of active bookings recorded. Analytics charts will automatically generate as new customer bookings occur.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('venues')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
            >
              Switch Venue
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate('bookings')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
            >
              View Bookings
            </button>
          </div>
        </div>
      )}

      {/* Analytics Content */}
      {!loading && !error && !insufficientData && analytics && (
        <>
          {/* Top Stats Grid (800-weight numbers) */}
          <div
            className="analytics-top-stats"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}
          >
            {/* Average Booking Value */}
            <div
              className="stat-card"
              style={{
                background: 'var(--bg-surface, #FFFFFF)',
                border: '1px solid var(--border-color, #E2E8F0)',
                borderRadius: 'var(--radius-md, 12px)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', fontWeight: 600 }}>
                  Avg. Booking Value
                </span>
                <div
                  style={{
                    background: 'var(--action-blue-light, #EFF6FF)',
                    color: 'var(--action-blue, #2563EB)',
                    padding: '4px',
                    borderRadius: '6px',
                  }}
                >
                  <DollarSign size={14} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #0F172A)' }}>
                ₹{analytics.averageBookingValue}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#16A34A', marginTop: '0.25rem', fontWeight: 600 }}>
                +12.4% vs last period
              </div>
            </div>

            {/* Repeat Customers % */}
            <div
              className="stat-card"
              style={{
                background: 'var(--bg-surface, #FFFFFF)',
                border: '1px solid var(--border-color, #E2E8F0)',
                borderRadius: 'var(--radius-md, 12px)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', fontWeight: 600 }}>
                  Repeat Customers
                </span>
                <div
                  style={{
                    background: '#F0FDF4',
                    color: '#16A34A',
                    padding: '4px',
                    borderRadius: '6px',
                  }}
                >
                  <Users size={14} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #0F172A)' }}>
                {analytics.repeatCustomerPct}%
              </div>
              <div style={{ fontSize: '0.7rem', color: '#16A34A', marginTop: '0.25rem', fontWeight: 600 }}>
                High player loyalty
              </div>
            </div>
          </div>

          {/* Secondary Metric Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.625rem 0.5rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>Total Bookings</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {analytics.totalBookings}
              </span>
            </div>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.625rem 0.5rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>Occupancy</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {analytics.occupancyRate}%
              </span>
            </div>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.625rem 0.5rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>Cancellation</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {analytics.cancellationRate}%
              </span>
            </div>
          </div>

          {/* Bookings This Week — 7-Bar CSS Chart */}
          <div
            className="analytics-chart-card"
            style={{
              background: 'var(--bg-surface, #FFFFFF)',
              border: '1px solid var(--border-color, #E2E8F0)',
              borderRadius: 'var(--radius-md, 12px)',
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Bookings this week
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Daily booking distribution
                </span>
              </div>
              {hoveredBar && (
                <div
                  style={{
                    background: 'var(--text-main, #0F172A)',
                    color: '#FFFFFF',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                  }}
                >
                  {hoveredBar.day}: {hoveredBar.count} bookings (₹{hoveredBar.revenue.toLocaleString()})
                </div>
              )}
            </div>

            {/* 7-Bar CSS Chart Area */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: '140px',
                paddingTop: '1rem',
                borderBottom: '1px solid #E2E8F0',
                gap: '0.5rem',
              }}
            >
              {weeklyBookings.map((item, idx) => {
                const heightPct = Math.max(12, Math.round((item.count / maxBookingCount) * 100));
                const isHovered = hoveredBar?.day === item.day;
                return (
                  <div
                    key={item.day || idx}
                    onMouseEnter={() => setHoveredBar(item)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '28px',
                        height: `${heightPct}%`,
                        background: isHovered ? 'var(--action-blue-hover, #1D4ED8)' : 'var(--action-blue, #2563EB)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease, background 0.15s ease',
                        position: 'relative',
                      }}
                    >
                      {/* Floating count label on bar */}
                      <span
                        style={{
                          position: 'absolute',
                          top: '-18px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: isHovered ? 'var(--action-blue)' : 'var(--text-muted)',
                        }}
                      >
                        {item.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '0.5rem',
                padding: '0 4px',
              }}
            >
              {weeklyBookings.map((item, idx) => (
                <span
                  key={item.day || idx}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: hoveredBar?.day === item.day ? 700 : 500,
                    color: hoveredBar?.day === item.day ? 'var(--action-blue)' : 'var(--text-muted)',
                  }}
                >
                  {item.day}
                </span>
              ))}
            </div>
          </div>

          {/* Peak Hours — 48-Cell Heat Strip */}
          <div
            className="analytics-heat-card"
            style={{
              background: 'var(--bg-surface, #FFFFFF)',
              border: '1px solid var(--border-color, #E2E8F0)',
              borderRadius: 'var(--radius-md, 12px)',
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Peak hours
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  48-slot 30-minute booking density
                </span>
              </div>
              {hoveredHeatCell && (
                <div
                  style={{
                    background: 'var(--text-main, #0F172A)',
                    color: '#FFFFFF',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                  }}
                >
                  {hoveredHeatCell.timeLabel}: ~{hoveredHeatCell.estimatedBookings} bookings ({Math.round(hoveredHeatCell.intensity * 100)}% density)
                </div>
              )}
            </div>

            {/* 48-Cell Heat Strip Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(48, 1fr)',
                height: '32px',
                gap: '1px',
                background: '#E2E8F0',
                padding: '2px',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              {(analytics.peakHours || []).map((slot) => {
                const isHovered = hoveredHeatCell?.index === slot.index;
                const opacityVal = Math.max(0.08, slot.intensity);
                return (
                  <div
                    key={slot.index}
                    onMouseEnter={() => setHoveredHeatCell(slot)}
                    onMouseLeave={() => setHoveredHeatCell(null)}
                    style={{
                      height: '100%',
                      background: `rgba(37, 99, 235, ${opacityVal})`,
                      cursor: 'pointer',
                      borderRadius: '1px',
                      transform: isHovered ? 'scaleY(1.15)' : 'none',
                      transition: 'transform 0.1s ease',
                    }}
                  />
                );
              })}
            </div>

            {/* Heat Strip Time Markers */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '0.4rem',
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
              }}
            >
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11:30 PM</span>
            </div>

            {/* Legend */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                marginTop: '0.75rem',
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
              }}
            >
              <span>Low</span>
              <div
                style={{
                  display: 'flex',
                  gap: '2px',
                }}
              >
                <div style={{ width: '10px', height: '10px', background: 'rgba(37, 99, 235, 0.15)', borderRadius: '2px' }} />
                <div style={{ width: '10px', height: '10px', background: 'rgba(37, 99, 235, 0.45)', borderRadius: '2px' }} />
                <div style={{ width: '10px', height: '10px', background: 'rgba(37, 99, 235, 0.75)', borderRadius: '2px' }} />
                <div style={{ width: '10px', height: '10px', background: 'rgba(37, 99, 235, 1.0)', borderRadius: '2px' }} />
              </div>
              <span>Peak</span>
            </div>
          </div>

          {/* Quick venue switch helper */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={16} color="var(--action-blue)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Managing {venues.length} venues on this account.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('venues')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--action-blue)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              Switch Venue <ChevronRight size={14} />
            </button>
          </div>
        </>
      )}

      {/* Owner Bottom Navigation */}
      <OwnerBottomNav
        activeTab="analytics"
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
