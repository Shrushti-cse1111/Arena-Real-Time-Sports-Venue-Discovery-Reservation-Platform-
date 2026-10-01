/**
 * ownerNotificationService.js
 * Backend notification simulation for Arena Owner Notifications / Alerts:
 * - GET /owner/notifications?venueId=
 * - PATCH /owner/notifications/:id/read
 * - POST /owner/notifications/read-all
 * - Firebase Cloud Messaging (FCM) Push simulation & deduplication
 */

const STORAGE_KEY_NOTIFICATIONS = 'arena_owner_notifications';

// Initial pre-populated owner notifications
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-101',
    venueId: 'venue-101',
    type: 'new_booking',
    title: 'New Booking Confirmed',
    message: 'Rahul Mehta booked Court A (Badminton) for 07:00 AM - 08:00 AM. ₹650 paid via UPI.',
    timestamp: '10 mins ago',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    isRead: false,
    deepLinkTarget: 'owner-bookings',
    metadata: { bookingId: 'BK-1081', customer: 'Rahul Mehta', amount: 650 },
  },
  {
    id: 'notif-102',
    venueId: 'venue-101',
    type: 'new_review',
    title: 'New 5-Star Review Received',
    message: 'Aditya Deshpande left a 5-star review: "Excellent wooden courts with optimal lighting."',
    timestamp: '45 mins ago',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isRead: false,
    deepLinkTarget: 'owner-reviews',
    metadata: { reviewId: 'rev-201', rating: 5 },
  },
  {
    id: 'notif-103',
    venueId: 'venue-101',
    type: 'payout_update',
    title: 'Weekly Payout Transferred',
    message: '₹42,850 has been successfully deposited into your HDFC Bank account (ending in 8842).',
    timestamp: '3 hours ago',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    deepLinkTarget: 'owner-earnings',
    metadata: { payoutId: 'PO-8842', amount: 42850 },
  },
  {
    id: 'notif-104',
    venueId: 'venue-101',
    type: 'booking_cancellation',
    title: 'Booking Cancelled',
    message: 'Kunal Joshi cancelled Court C booking for 08:00 PM. Instant refund of ₹800 issued.',
    timestamp: '5 hours ago',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    deepLinkTarget: 'owner-bookings',
    metadata: { bookingId: 'BK-1079' },
  },
  {
    id: 'notif-105',
    venueId: 'venue-101',
    type: 'coupon_update',
    title: 'Promo Code Milestone',
    message: 'Your coupon "WEEKDAY20" has reached 45 redemptions this week.',
    timestamp: '1 day ago',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    deepLinkTarget: 'owner-promotions',
    metadata: { couponCode: 'WEEKDAY20' },
  },
  {
    id: 'notif-106',
    venueId: 'venue-101',
    type: 'venue_verification',
    title: 'Business Verification Approved',
    message: 'Your GSTIN and ownership verification has been verified by the Arena Compliance Team.',
    timestamp: '2 days ago',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    deepLinkTarget: 'owner-verification',
    metadata: { status: 'verified' },
  },
  {
    id: 'notif-107',
    venueId: 'venue-101',
    type: 'system_announcement',
    title: 'Peak Pricing Optimization',
    message: 'Weekend peak pricing has been auto-adjusted for Saturday evening hours.',
    timestamp: '3 days ago',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    deepLinkTarget: 'owner-dashboard',
    metadata: {},
  },
];

function getStoredNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_NOTIFICATIONS;
  } catch (e) {
    return DEFAULT_NOTIFICATIONS;
  }
}

function saveStoredNotifications(notifs) {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifs));
  } catch (e) {
    console.error('Failed to save notifications:', e);
  }
}

export const ownerNotificationService = {
  /**
   * Fetch all owner notifications
   * GET /owner/notifications?venueId=
   */
  async getNotifications(venueId = 'venue-101') {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const all = getStoredNotifications();
    return all.filter((n) => !n.venueId || n.venueId === venueId || venueId === 'all');
  },

  /**
   * Get unread count
   */
  getUnreadCount(venueId = 'venue-101') {
    const all = getStoredNotifications();
    return all.filter((n) => (!n.venueId || n.venueId === venueId) && !n.isRead).length;
  },

  /**
   * Mark single notification as read
   * PATCH /owner/notifications/:id/read
   */
  async markAsRead(notificationId) {
    // Immediate state persistence without requiring reload
    const all = getStoredNotifications();
    const updated = all.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n));
    saveStoredNotifications(updated);

    return {
      success: true,
      notificationId,
    };
  },

  /**
   * Mark all notifications as read
   * POST /owner/notifications/read-all
   */
  async markAllAsRead(venueId = 'venue-101') {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const all = getStoredNotifications();
    const updated = all.map((n) => (n.venueId === venueId || venueId === 'all' ? { ...n, isRead: true } : n));
    saveStoredNotifications(updated);

    return {
      success: true,
      unreadCount: 0,
    };
  },

  /**
   * Ingest a simulated Firebase Cloud Messaging (FCM) Push notification
   */
  async receivePushNotification(venueId, payload) {
    const all = getStoredNotifications();
    const notifId = payload.id || `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Avoid duplicates
    if (all.some((n) => n.id === notifId)) {
      return { success: false, duplicate: true };
    }

    const newNotif = {
      id: notifId,
      venueId: venueId || 'venue-101',
      type: payload.type || 'new_booking',
      title: payload.title || 'New Arena Notification',
      message: payload.message || '',
      timestamp: 'Just now',
      createdAt: new Date().toISOString(),
      isRead: false,
      deepLinkTarget: payload.deepLinkTarget || 'owner-bookings',
      metadata: payload.metadata || {},
    };

    const updated = [newNotif, ...all];
    saveStoredNotifications(updated);

    return {
      success: true,
      notification: newNotif,
    };
  },
};
