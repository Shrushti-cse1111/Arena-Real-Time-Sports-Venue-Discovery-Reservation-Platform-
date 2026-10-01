import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  Building2,
  Calendar,
  DollarSign,
  Star,
  ShieldCheck,
  Tag,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Zap,
  ChevronRight,
  Info,
} from 'lucide-react';
import { ownerNotificationService } from '../services/ownerNotificationService';
import OwnerBottomNav from './OwnerBottomNav';

export default function OwnerNotificationsScreen({
  venue = null,
  onNavigate = () => {},
  onBack = () => {},
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const venueId = venue?.id || 'venue-101';
  const venueTitle = venue?.name || 'Arena Sports Club';

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await ownerNotificationService.getNotifications(venueId);
      setNotifications(list);
    } catch (err) {
      setError(err.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationTap = async (item) => {
    // 1. Immediately update UI state in place without reloading or reordering
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      // 2. Persist read state to backend
      ownerNotificationService.markAsRead(item.id).catch(console.error);
    }

    // 3. Deep link to target screen if applicable
    if (item.deepLinkTarget) {
      onNavigate(item.deepLinkTarget);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await ownerNotificationService.markAllAsRead(venueId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setToastMessage('All notifications marked as read.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateFCMPush = async () => {
    const pushSamples = [
      {
        type: 'new_booking',
        title: 'New Booking from Rohan Roy',
        message: 'Rohan Roy booked Court B for 06:00 PM - 07:00 PM today. ₹750 received.',
        deepLinkTarget: 'owner-bookings',
      },
      {
        type: 'new_review',
        title: 'New 5-Star Customer Review',
        message: 'Kunal Verma left a review: "Brilliant turf quality and smooth check-in!"',
        deepLinkTarget: 'owner-reviews',
      },
      {
        type: 'payment_update',
        title: 'Instant UPI Settlement Received',
        message: '₹1,200 credited to account via Razorpay UPI auto-split.',
        deepLinkTarget: 'owner-earnings',
      },
    ];

    const sample = pushSamples[Math.floor(Math.random() * pushSamples.length)];
    const res = await ownerNotificationService.receivePushNotification(venueId, sample);
    if (res.success) {
      setNotifications((prev) => [res.notification, ...prev]);
      setToastMessage(`🔔 Push Notification Arrived: "${sample.title}"`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="owner-notifications-screen screen-container" style={{ paddingBottom: '5rem' }}>
      {/* Live Toast */}
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
            maxWidth: '90%',
          }}
        >
          <Sparkles size={14} color="#FBBF24" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="screen-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="screen-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              Notifications & Alerts
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              <Building2 size={13} color="var(--text-muted)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{venueTitle}</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'var(--action-blue, #2563EB)',
                    color: '#FFFFFF',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    marginLeft: '4px',
                  }}
                >
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>

          {/* Header Action: Mark all read */}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--action-blue, #2563EB)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Push Simulation Testing Toolbar */}
      <div
        style={{
          background: '#F8FAFC',
          border: '1px dashed #CBD5E1',
          borderRadius: '8px',
          padding: '0.55rem 0.85rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Firebase Cloud Messaging (FCM) Integration
        </span>
        <button
          type="button"
          onClick={handleSimulateFCMPush}
          style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: 'var(--action-blue)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <Zap size={12} color="#EAB308" />
          Test Push Arrival
        </button>
      </div>

      {/* Error state with retry */}
      {error && !loading && (
        <div
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
            <span style={{ fontSize: '0.875rem' }}>Unable to load notifications.</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchNotifications}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div
          style={{
            background: 'var(--bg-surface, #FFFFFF)',
            border: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: 'var(--radius-md, 12px)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div className="skeleton-card" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E2E8F0', marginTop: '6px' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="skeleton-card" style={{ width: '40%', height: '14px', background: '#E2E8F0', borderRadius: '4px' }} />
                <div className="skeleton-card" style={{ width: '85%', height: '12px', background: '#E2E8F0', borderRadius: '4px' }} />
                <div className="skeleton-card" style={{ width: '20%', height: '10px', background: '#E2E8F0', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && notifications.length === 0 && (
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
            <Bell size={26} />
          </div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-main, #0F172A)' }}>
            You&apos;re all caught up.
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #64748B)', maxWidth: '280px', margin: '0 auto' }}>
            New booking updates, cancellations, customer reviews and payout notifications will appear here.
          </p>
        </div>
      )}

      {/* Notification List (Single White Card) */}
      {!loading && !error && notifications.length > 0 && (
        <div
          className="notification-list-card"
          style={{
            background: 'var(--bg-surface, #FFFFFF)',
            border: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: 'var(--radius-md, 12px)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0,0,0,0.05))',
          }}
        >
          {notifications.map((item, index) => {
            const isUnread = !item.isRead;
            const isLast = index === notifications.length - 1;

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationTap(item)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  padding: '1rem',
                  borderBottom: isLast ? 'none' : '1px solid #F1F5F9',
                  background: isUnread ? '#FAFBFD' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                {/* Notification Dot: Action Blue for unread, #E2E8F0 for read */}
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isUnread ? 'var(--action-blue, #2563EB)' : '#E2E8F0',
                    marginTop: '6px',
                    flexShrink: 0,
                    transition: 'background 0.3s ease',
                  }}
                />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title: 600 weight for unread, 500 weight + text-muted for read */}
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: isUnread ? 600 : 500,
                      color: isUnread ? 'var(--text-main, #0F172A)' : 'var(--text-muted, #64748B)',
                      marginBottom: '0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>{item.title}</span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        color: 'var(--text-muted, #94A3B8)',
                        fontWeight: 400,
                        flexShrink: 0,
                        marginLeft: '0.5rem',
                      }}
                    >
                      {item.timestamp}
                    </span>
                  </div>

                  {/* Short Message */}
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: isUnread ? '#334155' : 'var(--text-muted, #64748B)',
                      margin: '0 0 0.35rem 0',
                      lineHeight: 1.45,
                    }}
                  >
                    {item.message}
                  </p>

                  {/* Deep link indicator */}
                  {item.deepLinkTarget && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        color: 'var(--action-blue, #2563EB)',
                      }}
                    >
                      <span>View details</span>
                      <ChevronRight size={11} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Owner Bottom Navigation */}
      <OwnerBottomNav
        activeTab="notifications"
        onNavigate={(tab) => {
          if (tab === 'dashboard') onNavigate('owner-dashboard');
          else if (tab === 'bookings') onNavigate('owner-bookings');
          else if (tab === 'analytics') onNavigate('owner-analytics');
          else if (tab === 'availability') onNavigate('owner-availability');
          else if (tab === 'venues') onNavigate('owner-venues');
          else if (tab === 'reviews') onNavigate('owner-reviews');
          else if (tab === 'promotions') onNavigate('owner-promotions');
          else if (tab === 'earnings') onNavigate('owner-earnings');
          else if (tab === 'staff') onNavigate('owner-staff');
          else if (tab === 'notifications') onNavigate('owner-notifications');
        }}
      />
    </div>
  );
}
