/**
 * ownerCouponsService.js
 * Backend simulation for Arena Owner Coupons & Promotions:
 * - POST /owner/coupons (creation with server-side validation & uniqueness)
 * - GET /owner/coupons?venueId=
 * - PATCH /owner/coupons/:id/status (pause/resume with expired lock)
 * - Server-controlled coupon validation and anti-abuse calculation
 */

const INITIAL_COUPONS = [
  {
    id: 'CPN-101',
    code: 'SMASH100',
    type: 'fixed', // 'fixed' | 'percentage'
    value: 100, // ₹100 OFF
    timesUsed: 14,
    usageLimit: 50,
    validFrom: '2026-09-01T00:00:00.000Z',
    validTill: '2026-10-31T23:59:59.000Z', // Future -> Active
    venueId: 'v-owner-demo',
    ownerId: 'owner-default',
    status: 'active', // 'active' | 'paused'
    createdAt: '2026-09-01',
  },
  {
    id: 'CPN-102',
    code: 'WEEKEND20',
    type: 'percentage', // 20% OFF
    value: 20,
    timesUsed: 28,
    usageLimit: 100,
    validFrom: '2026-09-10T00:00:00.000Z',
    validTill: '2026-11-15T23:59:59.000Z', // Future -> Active
    venueId: 'v-owner-demo',
    ownerId: 'owner-default',
    status: 'active',
    createdAt: '2026-09-10',
  },
  {
    id: 'CPN-103',
    code: 'FESTIVE15',
    type: 'percentage',
    value: 15,
    timesUsed: 8,
    usageLimit: 30,
    validFrom: '2026-09-15T00:00:00.000Z',
    validTill: '2026-11-30T23:59:59.000Z',
    venueId: 'v-owner-demo',
    ownerId: 'owner-default',
    status: 'paused', // Manually paused by owner
    createdAt: '2026-09-15',
  },
  {
    id: 'CPN-104',
    code: 'EARLYBIRD50',
    type: 'fixed',
    value: 50,
    timesUsed: 42,
    usageLimit: 50,
    validFrom: '2026-08-01T00:00:00.000Z',
    validTill: '2026-09-20T23:59:59.000Z', // Past date -> EXPIRED
    venueId: 'v-owner-demo',
    ownerId: 'owner-default',
    status: 'active', // Stored as active, but expired rule takes precedence!
    createdAt: '2026-08-01',
  },
];

let _couponsDb = [...INITIAL_COUPONS];

/**
 * Server-time check to compute computedStatus:
 * - If validTill < now -> 'expired' (neutral-grey, cannot pause/resume)
 * - Else returns stored status: 'active' | 'paused'
 */
export function computeCouponStatus(coupon) {
  const now = new Date();
  const validTillDate = new Date(coupon.validTill);

  if (validTillDate < now) {
    return 'expired';
  }
  return coupon.status; // 'active' or 'paused'
}

/**
 * GET /owner/coupons?venueId=
 */
export async function fetchOwnerCoupons(venueId = 'v-owner-demo') {
  await new Promise((r) => setTimeout(r, 400));

  const list = _couponsDb
    .filter((c) => c.venueId === venueId)
    .map((c) => ({
      ...c,
      computedStatus: computeCouponStatus(c),
    }));

  return {
    success: true,
    data: list,
  };
}

/**
 * POST /owner/coupons
 * Validates:
 * - code uppercase, alphanumeric, no spaces, unique
 * - type: 'percentage' or 'fixed'
 * - percentage <= 100, fixed > 0
 * - validTill: must be future date
 */
export async function createCoupon({
  code,
  type = 'percentage',
  value,
  validTill,
  venueId = 'v-owner-demo',
  ownerId = 'owner-default',
  usageLimit = 100,
}) {
  await new Promise((r) => setTimeout(r, 450));

  // 1. Code Validation
  if (!code || typeof code !== 'string') {
    return { success: false, error: 'Coupon code is required.' };
  }

  const cleanCode = code.trim().toUpperCase();

  if (!/^[A-Z0-9]+$/.test(cleanCode)) {
    return {
      success: false,
      error: 'Coupon code must be uppercase alphanumeric with no spaces or special symbols.',
    };
  }

  // Uniqueness check for this venue
  const exists = _couponsDb.some(
    (c) => c.venueId === venueId && c.code === cleanCode
  );
  if (exists) {
    return { success: false, error: 'This code already exists', field: 'code' };
  }

  // 2. Discount Validation
  const numValue = Number(value);
  if (isNaN(numValue) || numValue <= 0) {
    return { success: false, error: 'Discount value must be a positive number.' };
  }

  if (type === 'percentage') {
    if (numValue > 100) {
      return { success: false, error: 'Percentage discount cannot exceed 100%.' };
    }
  }

  // 3. Valid Till Validation
  if (!validTill) {
    return { success: false, error: 'Expiration date is required.' };
  }

  const validTillDate = new Date(validTill);
  const now = new Date();
  if (validTillDate <= now) {
    return { success: false, error: 'Valid till must be a future date and time.' };
  }

  const newCoupon = {
    id: `CPN-${Date.now().toString().slice(-4)}`,
    code: cleanCode,
    type,
    value: numValue,
    timesUsed: 0,
    usageLimit: Number(usageLimit) || 100,
    validFrom: new Date().toISOString(),
    validTill: validTillDate.toISOString(),
    venueId,
    ownerId,
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
  };

  _couponsDb = [newCoupon, ..._couponsDb];

  return {
    success: true,
    data: {
      ...newCoupon,
      computedStatus: 'active',
    },
  };
}

/**
 * PATCH /owner/coupons/:id/status
 * Prevents pausing expired coupons
 */
export async function updateCouponStatus(couponId, newStatus) {
  await new Promise((r) => setTimeout(r, 350));

  const index = _couponsDb.findIndex((c) => c.id === couponId);
  if (index === -1) {
    return { success: false, error: 'Coupon not found.' };
  }

  const coupon = _couponsDb[index];
  const computed = computeCouponStatus(coupon);

  if (computed === 'expired') {
    return { success: false, error: 'Cannot modify status of an expired coupon.' };
  }

  if (newStatus !== 'active' && newStatus !== 'paused') {
    return { success: false, error: 'Invalid status.' };
  }

  coupon.status = newStatus;
  _couponsDb[index] = { ...coupon };

  return {
    success: true,
    data: {
      ...coupon,
      computedStatus: newStatus,
    },
  };
}

/**
 * Server-controlled booking validation & anti-abuse discount calculation
 * Never trust calculation from frontend!
 */
export function validateAndApplyCouponServer({
  code,
  bookingAmount,
  venueId = 'v-owner-demo',
}) {
  if (!code) {
    return { valid: false, error: 'No coupon specified.' };
  }

  const coupon = _couponsDb.find(
    (c) => c.code === code.trim().toUpperCase() && c.venueId === venueId
  );

  if (!coupon) {
    return { valid: false, error: 'Coupon does not exist for this venue.' };
  }

  const computedStatus = computeCouponStatus(coupon);
  if (computedStatus === 'expired') {
    return { valid: false, error: 'This coupon has expired.' };
  }

  if (computedStatus === 'paused') {
    return { valid: false, error: 'This coupon is currently paused.' };
  }

  if (coupon.timesUsed >= coupon.usageLimit) {
    return { valid: false, error: 'This coupon has reached its usage limit.' };
  }

  // Calculate discount server-side with anti-abuse
  let discountAmount = 0;
  if (coupon.type === 'percentage') {
    discountAmount = Math.round((bookingAmount * coupon.value) / 100);
  } else {
    discountAmount = coupon.value;
  }

  // ANTI-ABUSE: Do not allow negative totals or discount exceeding booking amount
  discountAmount = Math.min(discountAmount, bookingAmount);
  const finalPayable = Math.max(0, bookingAmount - discountAmount);

  return {
    valid: true,
    couponCode: coupon.code,
    type: coupon.type,
    discountValue: coupon.value,
    originalAmount: bookingAmount,
    discountAmount,
    finalPayable,
  };
}
