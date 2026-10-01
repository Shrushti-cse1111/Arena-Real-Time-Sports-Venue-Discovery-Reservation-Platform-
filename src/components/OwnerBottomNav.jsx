import React from 'react';
import { Home, CalendarCheck, BarChart3, Calendar, Building2, Tag, MessageSquare } from 'lucide-react';

export default function OwnerBottomNav({
  activeTab = 'dashboard',
  onNavigate = () => {},
}) {
  return (
    <nav className="bottom-nav-bar" aria-label="Owner Navigation" style={{ zIndex: 40, padding: '0 0.2rem' }}>
      <button
        type="button"
        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => onNavigate('dashboard')}
        style={{ padding: '0.35rem 0.2rem', flex: 1 }}
      >
        <Home size={17} />
        <span style={{ fontSize: '0.6rem' }}>Dashboard</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
        onClick={() => onNavigate('bookings')}
        style={{ padding: '0.35rem 0.2rem', flex: 1 }}
      >
        <CalendarCheck size={17} />
        <span style={{ fontSize: '0.6rem' }}>Bookings</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
        onClick={() => onNavigate('analytics')}
        style={{ padding: '0.35rem 0.2rem', flex: 1 }}
      >
        <BarChart3 size={17} />
        <span style={{ fontSize: '0.6rem' }}>Analytics</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activeTab === 'availability' ? 'active' : ''}`}
        onClick={() => onNavigate('availability')}
        style={{ padding: '0.35rem 0.2rem', flex: 1 }}
      >
        <Calendar size={17} />
        <span style={{ fontSize: '0.6rem' }}>Calendar</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activeTab === 'venues' ? 'active' : ''}`}
        onClick={() => onNavigate('venues')}
        style={{ padding: '0.35rem 0.2rem', flex: 1 }}
      >
        <Building2 size={17} />
        <span style={{ fontSize: '0.6rem' }}>Venues</span>
      </button>
    </nav>
  );
}
