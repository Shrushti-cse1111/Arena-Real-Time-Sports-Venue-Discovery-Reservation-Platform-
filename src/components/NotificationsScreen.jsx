import React, { useState } from 'react';
import {
  ChevronLeft,
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Percent,
  MapPin,
  CheckCircle2,
  XCircle,
  RotateCcw,
  CreditCard,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Layers,
  Search,
  X,
  Filter,
  RefreshCw,
  BellRing,
  Zap,
} from 'lucide-react';

export default function NotificationsScreen({
  notifications = [],
  onBack,
  onMarkAsRead,
  onMarkAsUnread,
  onMarkAllAsRead,
  onClearNotification,
  onClearAllNotifications,
  onNotificationClick,
  onSimulatePush,
}) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'bookings' | 'offers'
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Notifications refreshed');
    }, 600);
  };

  // Filter list
  const filteredNotifications = notifications.filter((item) => {
    // Tab filter
    if (activeFilter === 'unread' && item.isRead) return false;
    if (activeFilter === 'bookings' && item.badgeCategory !== 'Bookings' && !item.type.startsWith('booking_') && !item.type.includes('refund')) return false;
    if (activeFilter === 'offers' && item.badgeCategory !== 'Offers' && !item.type.includes('promo')) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        item.actionText?.toLowerCase().includes(q) ||
        item.couponCode?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
        return (
          <div className="notif-type-icon green">
            <CheckCircle2 size={18} />
          </div>
        );
      case 'booking_reminder':
        return (
          <div className="notif-type-icon amber">
            <Clock size={18} />
          </div>
        );
      case 'booking_cancelled':
        return (
          <div className="notif-type-icon danger">
            <XCircle size={18} />
          </div>
        );
      case 'booking_rescheduled':
        return (
          <div className="notif-type-icon blue">
            <RotateCcw size={18} />
          </div>
        );
      case 'refund_processed':
      case 'payment_success':
        return (
          <div className="notif-type-icon emerald">
            <CreditCard size={18} />
          </div>
        );
      case 'promo_offer':
        return (
          <div className="notif-type-icon purple">
            <Tag size={18} />
          </div>
        );
      case 'venue_alert':
        return (
          <div className="notif-type-icon navy">
            <Zap size={18} />
          </div>
        );
      default:
        return (
          <div className="notif-type-icon blue">
            <Bell size={18} />
          </div>
        );
    }
  };

  return (
    <div className="notifications-screen-container fade-in">
      {/* HEADER BAR */}
      <header className="details-header-bar">
        <button
          type="button"
          className="btn-back-header"
          onClick={onBack}
          aria-label="Back"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="details-header-center">
          <span className="details-header-title">Notifications</span>
          <span className="details-header-sub">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </span>
        </div>
        <div className="details-header-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn-header-icon"
              onClick={() => {
                if (onMarkAllAsRead) onMarkAllAsRead();
                showToast('All notifications marked as read');
              }}
              title="Mark all as read"
            >
              <CheckCheck size={18} />
            </button>
          )}
          <button
            type="button"
            className="btn-header-icon"
            onClick={handleRefresh}
            title="Refresh notifications"
          >
            <RefreshCw size={17} className={isRefreshing ? 'spin-icon' : ''} />
          </button>
        </div>
      </header>

      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="booking-toast-alert fade-in">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN SCROLL AREA */}
      <div className="notifications-scroll-body">
        {/* PUSH SIMULATION TRIGGER (FCM DEMO BAR) */}
        <div className="fcm-simulation-strip">
          <div className="fcm-strip-left">
            <BellRing size={14} className="fcm-strip-icon" />
            <span className="fcm-strip-text">Push Notifications Active (FCM)</span>
          </div>
          {onSimulatePush && (
            <button
              type="button"
              className="btn-fcm-test"
              onClick={() => {
                onSimulatePush();
                showToast('Simulated real-time push received!');
              }}
              title="Trigger simulated live match alert"
            >
              <Sparkles size={12} />
              <span>Simulate Alert</span>
            </button>
          )}
        </div>

        {/* SEARCH BOX */}
        <div className="notif-search-bar">
          <Search size={15} className="notif-search-icon" />
          <input
            type="text"
            className="notif-search-input"
            placeholder="Search notifications, match IDs, offers..."
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

        {/* CATEGORY TABS */}
        <div className="notif-tabs-row" role="tablist">
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            {
              id: 'bookings',
              label: 'Bookings',
              count: notifications.filter((n) => n.badgeCategory === 'Bookings' || n.type.startsWith('booking_') || n.type.includes('refund')).length,
            },
            {
              id: 'offers',
              label: 'Offers',
              count: notifications.filter((n) => n.badgeCategory === 'Offers' || n.type.includes('promo')).length,
            },
          ].map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`notif-tab-chip ${isSelected ? 'active' : ''}`}
                onClick={() => setActiveFilter(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="notif-chip-count">{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* NOTIFICATIONS LIST */}
        {filteredNotifications.length === 0 ? (
          <div className="notif-empty-state fade-in">
            <div className="notif-empty-icon-bubble">
              <Bell size={32} />
            </div>
            {searchQuery ? (
              <>
                <h3 className="notif-empty-title">No matching notifications</h3>
                <p className="notif-empty-desc">
                  No alerts match your search "{searchQuery}".
                </p>
                <button
                  type="button"
                  className="btn-empty-action"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </button>
              </>
            ) : activeFilter === 'unread' ? (
              <>
                <h3 className="notif-empty-title">You're all caught up!</h3>
                <p className="notif-empty-desc">
                  You have read all your match reminders and updates.
                </p>
                <button
                  type="button"
                  className="btn-empty-action"
                  onClick={() => setActiveFilter('all')}
                >
                  View All Notifications
                </button>
              </>
            ) : (
              <>
                <h3 className="notif-empty-title">No notifications yet</h3>
                <p className="notif-empty-desc">
                  Court booking confirmations, match reminders, and promo offers will appear here.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="notifications-items-list">
            {filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`notification-item-card fade-in ${item.isRead ? 'read' : 'unread'}`}
                onClick={() => {
                  if (!item.isRead && onMarkAsRead) {
                    onMarkAsRead(item.id);
                  }
                  if (onNotificationClick) {
                    onNotificationClick(item);
                  }
                }}
              >
                {/* ICON COL */}
                <div className="notif-card-icon-col">
                  {getNotificationIcon(item.type)}
                  {!item.isRead && <span className="unread-pulsing-dot" />}
                </div>

                {/* CONTENT COL */}
                <div className="notif-card-content-col">
                  <div className="notif-card-head-line">
                    <h3 className="notif-card-title">{item.title}</h3>
                    <span className="notif-card-time">{item.timestamp}</span>
                  </div>

                  <p className="notif-card-msg">{item.message}</p>

                  {/* BOTTOM ACTION / META STRIP */}
                  <div className="notif-card-footer-strip">
                    {item.actionText && (
                      <span className="notif-action-tag">
                        <span>{item.actionText}</span>
                        <ChevronRight size={12} />
                      </span>
                    )}

                    {item.couponCode && (
                      <span className="notif-coupon-code-badge">
                        <code>{item.couponCode}</code>
                      </span>
                    )}

                    {/* DISMISS / TOGGLE READ ACTIONS */}
                    <div
                      className="notif-item-actions-row"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="btn-notif-micro"
                        onClick={() => {
                          if (item.isRead) {
                            if (onMarkAsUnread) onMarkAsUnread(item.id);
                          } else {
                            if (onMarkAsRead) onMarkAsRead(item.id);
                          }
                        }}
                        title={item.isRead ? 'Mark as unread' : 'Mark as read'}
                      >
                        {item.isRead ? 'Mark Unread' : 'Mark Read'}
                      </button>

                      {onClearNotification && (
                        <button
                          type="button"
                          className="btn-notif-micro-icon"
                          onClick={() => onClearNotification(item.id)}
                          title="Delete notification"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BOTTOM CLEAR ALL OPTION */}
        {notifications.length > 0 && onClearAllNotifications && (
          <div className="notifications-bottom-clear-row">
            <button
              type="button"
              className="btn-clear-all-notifs"
              onClick={() => {
                onClearAllNotifications();
                showToast('All notifications cleared');
              }}
            >
              <Trash2 size={13} />
              <span>Clear All Notifications</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
