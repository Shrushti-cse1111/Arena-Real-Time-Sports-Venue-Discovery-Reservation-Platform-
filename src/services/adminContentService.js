/**
 * ARENA — ADMIN CONTENT MANAGEMENT SERVICE
 * Manages promotional carousel banners, platform announcements, and broadcast push notifications.
 * 
 * Endpoints:
 *   GET    /admin/content/banners
 *   POST   /admin/content/banners
 *   PATCH  /admin/content/banners/:id
 *   DELETE /admin/content/banners/:id
 * 
 *   GET    /admin/announcements
 *   POST   /admin/announcements
 *   PATCH  /admin/announcements/:id
 * 
 *   POST   /admin/notifications/broadcast
 */

const STORAGE_KEY_BANNERS = 'arena_admin_banners_master';
const STORAGE_KEY_ANNOUNCEMENTS = 'arena_admin_announcements_master';
const STORAGE_KEY_BROADCASTS = 'arena_admin_broadcasts_log';
const STORAGE_KEY_ADMIN_AUDIT = 'arena_admin_audit_log';

const INITIAL_BANNERS = [
  {
    id: 'BNR-101',
    title: 'Pune Badminton Championship 2026',
    description: 'Register your doubles squad for Pune’s largest indoor tournament.',
    cta: 'Register Now',
    imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80',
    startDate: '2026-09-15',
    endDate: '2026-10-15',
    status: 'active', // 'active' | 'inactive'
    clicks: 1420,
  },
  {
    id: 'BNR-102',
    title: 'Night Turf Football Under Floodlights',
    description: 'Get flat 20% OFF on midnight slots between 10 PM and 2 AM.',
    cta: 'Book Midnight Slot',
    imageUrl: 'https://images.unsplash.com/photo-1529900245534-47fbf867b1cb?w=800&q=80',
    startDate: '2026-09-01',
    endDate: '2026-10-31',
    status: 'active',
    clicks: 890,
  },
];

const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ANN-101',
    title: 'Instant Refund to Arena Wallet Now Live',
    message: 'Cancelled slots cancelled before 6 hours now receive instant 100% wallet credit with zero PG gateway deduction delay.',
    publishDate: '28 Sep 2026',
    status: 'Published', // 'Published' | 'Draft'
  },
  {
    id: 'ANN-102',
    title: 'Kothrud & Viman Nagar Turf Expansion',
    message: '14 new floodlit box cricket and synthetic pickleball venues added to the Arena network this week.',
    publishDate: '25 Sep 2026',
    status: 'Published',
  },
];

const INITIAL_BROADCASTS = [
  {
    id: 'BC-901',
    title: 'Weekend Floodlit Special Rates',
    message: 'Enjoy up to 25% off on evening tennis and badminton bookings this Saturday & Sunday across Pune.',
    audience: 'All Users',
    sentAt: '2026-09-27T10:00:00Z',
    deliveredCount: 12480,
    sentBy: 'Sarah Connor (ADM-9001)',
  },
];

function recordAuditEntry(action, details = {}) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_ADMIN_AUDIT) || '[]');
    const newEntry = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.104 (TLS 1.3)',
      userAgent: navigator.userAgent.slice(0, 60) + '...',
      ...details,
    };
    const updated = [newEntry, ...existing].slice(0, 50);
    localStorage.setItem(STORAGE_KEY_ADMIN_AUDIT, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to log security audit:', e);
  }
}

export const adminContentService = {
  // Banners
  getStoredBanners() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BANNERS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_BANNERS, JSON.stringify(INITIAL_BANNERS));
        return INITIAL_BANNERS;
      }
      return JSON.parse(raw);
    } catch (e) {
      return INITIAL_BANNERS;
    }
  },

  async getBanners() {
    await new Promise((r) => setTimeout(r, 200));
    return { success: true, banners: this.getStoredBanners() };
  },

  async createBanner(payload, adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    if (!payload.title || payload.title.trim().length < 3) {
      throw new Error('Banner title must be at least 3 characters.');
    }
    if (!payload.startDate || !payload.endDate) {
      throw new Error('Banner start and end dates are required.');
    }

    await new Promise((r) => setTimeout(r, 350));
    const list = this.getStoredBanners();
    const newBanner = {
      id: `BNR-${Date.now().toString().slice(-4)}`,
      title: payload.title.trim(),
      description: (payload.description || '').trim(),
      cta: (payload.cta || 'Book Now').trim(),
      imageUrl: payload.imageUrl || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80',
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: 'active',
      clicks: 0,
    };

    const updated = [newBanner, ...list];
    localStorage.setItem(STORAGE_KEY_BANNERS, JSON.stringify(updated));

    recordAuditEntry('BANNER_CREATED', { bannerId: newBanner.id, title: newBanner.title, adminId, adminName });
    return { success: true, message: 'Banner created successfully.', banner: newBanner };
  },

  async deleteBanner(bannerId, adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    await new Promise((r) => setTimeout(r, 250));
    let list = this.getStoredBanners();
    list = list.filter((b) => b.id !== bannerId);
    localStorage.setItem(STORAGE_KEY_BANNERS, JSON.stringify(list));
    recordAuditEntry('BANNER_DELETED', { bannerId, adminId, adminName });
    return { success: true, message: 'Banner deleted.' };
  },

  // Announcements
  getStoredAnnouncements() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ANNOUNCEMENTS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
        return INITIAL_ANNOUNCEMENTS;
      }
      return JSON.parse(raw);
    } catch (e) {
      return INITIAL_ANNOUNCEMENTS;
    }
  },

  async getAnnouncements() {
    await new Promise((r) => setTimeout(r, 200));
    return { success: true, announcements: this.getStoredAnnouncements() };
  },

  async createAnnouncement(payload, adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    if (!payload.title || payload.title.trim().length < 3) {
      throw new Error('Announcement title is required.');
    }
    if (!payload.message || payload.message.trim().length < 5) {
      throw new Error('Announcement message is required.');
    }

    await new Promise((r) => setTimeout(r, 300));
    const list = this.getStoredAnnouncements();
    const newAnn = {
      id: `ANN-${Date.now().toString().slice(-4)}`,
      title: payload.title.trim(),
      message: payload.message.trim(),
      publishDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Published',
    };
    const updated = [newAnn, ...list];
    localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(updated));
    recordAuditEntry('ANNOUNCEMENT_CREATED', { announcementId: newAnn.id, title: newAnn.title, adminId, adminName });
    return { success: true, message: 'Announcement published.', announcement: newAnn };
  },

  // Broadcast Push Notifications
  getStoredBroadcasts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BROADCASTS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_BROADCASTS, JSON.stringify(INITIAL_BROADCASTS));
        return INITIAL_BROADCASTS;
      }
      return JSON.parse(raw);
    } catch (e) {
      return INITIAL_BROADCASTS;
    }
  },

  async getBroadcasts() {
    await new Promise((r) => setTimeout(r, 200));
    return { success: true, broadcasts: this.getStoredBroadcasts() };
  },

  async sendBroadcastNotification({ title, message, audience }, adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    if (!title || title.trim().length < 3) throw new Error('Broadcast title is required.');
    if (!message || message.trim().length < 5) throw new Error('Broadcast message is required.');

    await new Promise((r) => setTimeout(r, 600));

    const list = this.getStoredBroadcasts();
    const deliveredCount = audience === 'Owners Only' ? 94 : audience === 'Players Only' ? 12386 : 12480;

    const newBroadcast = {
      id: `BC-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      message: message.trim(),
      audience: audience || 'All Users',
      sentAt: new Date().toISOString(),
      deliveredCount,
      sentBy: `${adminName} (${adminId})`,
    };

    const updated = [newBroadcast, ...list];
    localStorage.setItem(STORAGE_KEY_BROADCASTS, JSON.stringify(updated));

    recordAuditEntry('BROADCAST_NOTIFICATION_SENT', {
      broadcastId: newBroadcast.id,
      title: newBroadcast.title,
      audience: newBroadcast.audience,
      deliveredCount,
      adminId,
      adminName,
    });

    return {
      success: true,
      message: `Broadcast successfully dispatched to ${deliveredCount.toLocaleString()} devices.`,
      broadcast: newBroadcast,
    };
  },
};
