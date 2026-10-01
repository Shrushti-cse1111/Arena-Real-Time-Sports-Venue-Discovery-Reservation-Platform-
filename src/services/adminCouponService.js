/**
 * ARENA — ADMIN PLATFORM COUPONS & PROMOTIONS SERVICE
 * Handles promotional code creation, discount computation rules, usage limits,
 * and pause/resume lifecycle.
 * 
 * Endpoints:
 *   GET   /admin/coupons
 *   POST  /admin/coupons
 *   PATCH /admin/coupons/:id
 *   PATCH /admin/coupons/:id/status
 * 
 * Validation:
 *   - Unique uppercase alphanumeric code.
 *   - Percentage <= 100 or Fixed discount > 0.
 *   - Valid date ranges.
 *   - Usage limit >= 1.
 *   - Server-side discount evaluation.
 */

const STORAGE_KEY_COUPONS = 'arena_admin_coupons_master';
const STORAGE_KEY_ADMIN_AUDIT = 'arena_admin_audit_log';

const INITIAL_COUPONS_MASTER = [
  {
    id: 'CPN-101',
    code: 'ARENAFIRST',
    description: 'Welcome discount for new players across all Pune venues',
    discountType: 'Percentage', // 'Percentage' | 'Fixed'
    discountValue: 20, // 20%
    minBookingAmount: 500,
    maxDiscount: 200,
    validFrom: '2026-01-01',
    validTill: '2026-12-31',
    usageLimit: 5000,
    timesUsed: 1420,
    status: 'active', // 'active' | 'paused' | 'expired'
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'Sarah Connor (ADM-9001)',
  },
  {
    id: 'CPN-102',
    code: 'SMASH100',
    description: 'Flat ₹100 OFF on badminton synthetic courts',
    discountType: 'Fixed',
    discountValue: 100, // ₹100
    minBookingAmount: 600,
    maxDiscount: 100,
    validFrom: '2026-08-01',
    validTill: '2026-10-31',
    usageLimit: 1000,
    timesUsed: 685,
    status: 'active',
    createdAt: '2026-08-01T00:00:00Z',
    createdBy: 'Sarah Connor (ADM-9001)',
  },
  {
    id: 'CPN-103',
    code: 'WEEKEND50',
    description: '50% Weekend Flash Sale on box cricket & turf football',
    discountType: 'Percentage',
    discountValue: 50,
    minBookingAmount: 1200,
    maxDiscount: 350,
    validFrom: '2026-09-01',
    validTill: '2026-09-30',
    usageLimit: 200,
    timesUsed: 200,
    status: 'expired',
    createdAt: '2026-09-01T00:00:00Z',
    createdBy: 'System Superadmin (ADM-9001)',
  },
  {
    id: 'CPN-104',
    code: 'MONSOON25',
    description: 'Special 25% monsoon discount on indoor glass squash & tennis',
    discountType: 'Percentage',
    discountValue: 25,
    minBookingAmount: 800,
    maxDiscount: 250,
    validFrom: '2026-07-01',
    validTill: '2026-11-30',
    usageLimit: 800,
    timesUsed: 310,
    status: 'paused',
    createdAt: '2026-07-01T00:00:00Z',
    createdBy: 'Sarah Connor (ADM-9001)',
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

export const adminCouponService = {
  getStoredCoupons() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COUPONS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(INITIAL_COUPONS_MASTER));
        return INITIAL_COUPONS_MASTER;
      }
      return JSON.parse(raw);
    } catch (e) {
      return INITIAL_COUPONS_MASTER;
    }
  },

  saveCoupons(coupons) {
    try {
      localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(coupons));
    } catch (e) {
      console.error('Failed to save master coupons:', e);
    }
  },

  /**
   * GET /admin/coupons
   */
  async getCoupons({ search = '', status = 'all' } = {}) {
    await new Promise((r) => setTimeout(r, 250));

    let list = this.getStoredCoupons();

    if (status && status !== 'all') {
      list = list.filter((c) => c.status === status);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }

    const all = this.getStoredCoupons();

    return {
      success: true,
      total: list.length,
      counts: {
        all: all.length,
        active: all.filter((c) => c.status === 'active').length,
        paused: all.filter((c) => c.status === 'paused').length,
        expired: all.filter((c) => c.status === 'expired').length,
      },
      coupons: list,
    };
  },

  /**
   * POST /admin/coupons
   */
  async createCoupon(payload, adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    const {
      code,
      description,
      discountType,
      discountValue,
      minBookingAmount = 0,
      maxDiscount = 0,
      validFrom,
      validTill,
      usageLimit = 100,
    } = payload;

    // 1. Code Validation
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode || !/^[A-Z0-9_-]{3,20}$/.test(cleanCode)) {
      throw new Error('Coupon code must be 3-20 uppercase alphanumeric characters (e.g. ARENA2026).');
    }

    const existingList = this.getStoredCoupons();
    if (existingList.some((c) => c.code === cleanCode)) {
      throw new Error(`Coupon with code "${cleanCode}" already exists.`);
    }

    // 2. Discount Validation
    const dVal = Number(discountValue);
    if (isNaN(dVal) || dVal <= 0) {
      throw new Error('Discount value must be a positive number.');
    }
    if (discountType === 'Percentage' && dVal > 100) {
      throw new Error('Percentage discount cannot exceed 100%.');
    }

    // 3. Date Validation
    if (!validFrom || !validTill) {
      throw new Error('Valid From and Valid Till dates are required.');
    }
    if (new Date(validTill) < new Date(validFrom)) {
      throw new Error('Valid Till date must be after Valid From date.');
    }

    // 4. Usage Limit Validation
    const limit = Number(usageLimit);
    if (isNaN(limit) || limit < 1) {
      throw new Error('Usage limit must be at least 1.');
    }

    await new Promise((r) => setTimeout(r, 450));

    const newCoupon = {
      id: `CPN-${Date.now().toString().slice(-4)}`,
      code: cleanCode,
      description: (description || '').trim() || `Promotional code ${cleanCode}`,
      discountType,
      discountValue: dVal,
      minBookingAmount: Number(minBookingAmount) || 0,
      maxDiscount: discountType === 'Percentage' ? (Number(maxDiscount) || 500) : dVal,
      validFrom,
      validTill,
      usageLimit: limit,
      timesUsed: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: `${adminName} (${adminId})`,
    };

    const updated = [newCoupon, ...existingList];
    this.saveCoupons(updated);

    recordAuditEntry('COUPON_CREATED', {
      couponId: newCoupon.id,
      code: newCoupon.code,
      discountType,
      discountValue: dVal,
      adminId,
      adminName,
    });

    return {
      success: true,
      message: `Coupon "${newCoupon.code}" created successfully.`,
      coupon: newCoupon,
    };
  },

  /**
   * PATCH /admin/coupons/:id/status
   * Toggle Pause/Resume
   */
  async updateCouponStatus(couponId, newStatus, adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    if (!['active', 'paused', 'expired'].includes(newStatus)) {
      throw new Error('Invalid coupon status.');
    }

    await new Promise((r) => setTimeout(r, 300));

    const list = this.getStoredCoupons();
    const index = list.findIndex((c) => c.id === couponId);

    if (index === -1) {
      throw new Error(`Coupon with ID "${couponId}" not found.`);
    }

    const updated = {
      ...list[index],
      status: newStatus,
    };

    list[index] = updated;
    this.saveCoupons(list);

    recordAuditEntry('COUPON_STATUS_CHANGED', {
      couponId: updated.id,
      code: updated.code,
      newStatus,
      adminId,
      adminName,
    });

    return {
      success: true,
      message: `Coupon "${updated.code}" status changed to ${newStatus}.`,
      coupon: updated,
    };
  },

  /**
   * Secure Backend Calculation: Calculates eligible discount for a given gross booking amount.
   * Never trust client-computed discounts.
   */
  calculateDiscount(couponCode, grossAmount) {
    const list = this.getStoredCoupons();
    const coupon = list.find((c) => c.code === (couponCode || '').toUpperCase());

    if (!coupon || coupon.status !== 'active') {
      return { valid: false, error: 'Invalid or inactive promo code.', discountAmount: 0 };
    }

    const now = new Date();
    if (now < new Date(coupon.validFrom) || now > new Date(coupon.validTill)) {
      return { valid: false, error: 'Coupon code has expired.', discountAmount: 0 };
    }

    if (coupon.timesUsed >= coupon.usageLimit) {
      return { valid: false, error: 'Coupon usage limit reached.', discountAmount: 0 };
    }

    if (grossAmount < coupon.minBookingAmount) {
      return { valid: false, error: `Minimum booking of ₹${coupon.minBookingAmount} required for this coupon.`, discountAmount: 0 };
    }

    let discount = 0;
    if (coupon.discountType === 'Percentage') {
      discount = Math.round((grossAmount * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = Math.min(coupon.discountValue, grossAmount);
    }

    return {
      valid: true,
      couponCode: coupon.code,
      discountAmount: discount,
      finalAmount: Math.max(0, grossAmount - discount),
    };
  },
};
