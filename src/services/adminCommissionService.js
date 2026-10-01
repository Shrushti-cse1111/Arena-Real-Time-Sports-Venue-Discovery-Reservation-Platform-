/**
 * ARENA — ADMIN COMMISSION & PAYMENTS SERVICE
 * Manages commission rates, change history, payout settlement batches,
 * and payment transaction logs.
 * 
 * Endpoints:
 *   GET /admin/commission
 *   PUT /admin/commission
 *   GET /admin/commission/history
 *   GET /admin/payouts
 *   GET /admin/payments
 */

const STORAGE_KEY_COMMISSION = 'arena_admin_commission_config';
const STORAGE_KEY_COMMISSION_HISTORY = 'arena_admin_commission_history';
const STORAGE_KEY_PAYOUTS = 'arena_admin_payouts_master';
const STORAGE_KEY_ADMIN_AUDIT = 'arena_admin_audit_log';

const INITIAL_COMMISSION_CONFIG = {
  currentRate: 10, // 10%
  updatedAt: '2026-09-01T00:00:00Z',
  updatedBy: 'Sarah Connor (ADM-9001)',
  minRate: 0,
  maxRate: 100,
  gstOnCommission: 18, // 18% GST on platform fee
};

const INITIAL_COMMISSION_HISTORY = [
  {
    id: 'CHG-101',
    previousRate: 12,
    newRate: 10,
    effectiveDate: '01 Sep 2026, 00:00',
    changedBy: 'Sarah Connor (ADM-9001)',
    reason: 'Promotional festival quarter reduction to attract premier venue owners.',
  },
  {
    id: 'CHG-100',
    previousRate: 8,
    newRate: 12,
    effectiveDate: '01 Jun 2026, 00:00',
    changedBy: 'System Superadmin (ADM-9001)',
    reason: 'Standard platform fee revision for enhanced server infrastructure.',
  },
];

const INITIAL_PAYOUTS_MASTER = [
  {
    payoutId: 'PAY-8801',
    ownerId: 'OWN-201',
    ownerName: 'Rajesh Nair',
    businessName: 'Smash Point Sports & Leisure LLP',
    grossBookingsAmount: '₹54,200',
    platformCommission: '₹5,420 (10%)',
    gstOnFee: '₹975.60',
    netPayoutAmount: '₹47,804.40',
    bankAccount: 'HDFC Bank (•••• 4812)',
    period: '22 Sep – 28 Sep 2026',
    status: 'Processed', // 'Processed' | 'Pending' | 'On Hold'
    processedAt: '29 Sep 2026, 11:30 AM',
    utrNumber: 'HDFCNEFT262729104',
  },
  {
    payoutId: 'PAY-8802',
    ownerId: 'OWN-202',
    ownerName: 'Vikram Joshi',
    businessName: 'SkyTurf Box Sports Pvt Ltd',
    grossBookingsAmount: '₹38,000',
    platformCommission: '₹3,800 (10%)',
    gstOnFee: '₹684.00',
    netPayoutAmount: '₹33,516.00',
    bankAccount: 'ICICI Bank (•••• 9931)',
    period: '22 Sep – 28 Sep 2026',
    status: 'Processed',
    processedAt: '29 Sep 2026, 11:35 AM',
    utrNumber: 'ICICNEFT992019482',
  },
  {
    payoutId: 'PAY-8803',
    ownerId: 'OWN-205',
    ownerName: 'Priya Malhotra',
    businessName: 'Viman Sports Complex LLP',
    grossBookingsAmount: '₹71,000',
    platformCommission: '₹7,100 (10%)',
    gstOnFee: '₹1,278.00',
    netPayoutAmount: '₹62,622.00',
    bankAccount: 'Kotak Mahindra Bank (•••• 7721)',
    period: '22 Sep – 28 Sep 2026',
    status: 'Pending',
    processedAt: 'Scheduled for 05 Oct 2026',
    utrNumber: 'Batch Pending Approval',
  },
  {
    payoutId: 'PAY-8804',
    ownerId: 'OWN-204',
    ownerName: 'Nikhil Shinde',
    businessName: 'Futsal Park Pune Enterprises',
    grossBookingsAmount: '₹12,400',
    platformCommission: '₹1,240 (10%)',
    gstOnFee: '₹223.20',
    netPayoutAmount: '₹10,936.80',
    bankAccount: 'Axis Bank (•••• 6671)',
    period: '15 Sep – 21 Sep 2026',
    status: 'On Hold',
    processedAt: 'Frozen due to KYC suspension',
    utrNumber: 'HELD-SUSPENSION',
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

export const adminCommissionService = {
  getCommissionConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COMMISSION);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_COMMISSION, JSON.stringify(INITIAL_COMMISSION_CONFIG));
        return INITIAL_COMMISSION_CONFIG;
      }
      return JSON.parse(raw);
    } catch (e) {
      return INITIAL_COMMISSION_CONFIG;
    }
  },

  getCommissionHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COMMISSION_HISTORY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_COMMISSION_HISTORY, JSON.stringify(INITIAL_COMMISSION_HISTORY));
        return INITIAL_COMMISSION_HISTORY;
      }
      return JSON.parse(raw);
    } catch (e) {
      return INITIAL_COMMISSION_HISTORY;
    }
  },

  /**
   * GET /admin/commission
   */
  async getCommission() {
    await new Promise((r) => setTimeout(r, 200));
    const config = this.getCommissionConfig();
    const history = this.getCommissionHistory();
    return {
      success: true,
      config,
      history,
    };
  },

  /**
   * PUT /admin/commission
   * Updates standard commission percentage (0-100) with mandatory audit recording.
   * Applies only to future new bookings.
   */
  async updateCommission(newRate, reason, adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    const num = Number(newRate);
    if (isNaN(num) || num < 0 || num > 100) {
      throw new Error('Commission percentage must be a valid number between 0 and 100.');
    }
    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed reason (minimum 5 characters) is required to update platform commission.');
    }

    await new Promise((r) => setTimeout(r, 450));

    const currentConfig = this.getCommissionConfig();
    const previousRate = currentConfig.currentRate;

    if (previousRate === num) {
      throw new Error(`Platform commission is already set to ${num}%.`);
    }

    const timestamp = new Date().toISOString();
    const updatedConfig = {
      ...currentConfig,
      currentRate: num,
      updatedAt: timestamp,
      updatedBy: `${adminName} (${adminId})`,
    };

    const newHistoryItem = {
      id: `CHG-${Date.now()}`,
      previousRate,
      newRate: num,
      effectiveDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      changedBy: `${adminName} (${adminId})`,
      reason: reason.trim(),
    };

    const history = [newHistoryItem, ...this.getCommissionHistory()];

    localStorage.setItem(STORAGE_KEY_COMMISSION, JSON.stringify(updatedConfig));
    localStorage.setItem(STORAGE_KEY_COMMISSION_HISTORY, JSON.stringify(history));

    recordAuditEntry('COMMISSION_RATE_UPDATED', {
      previousRate,
      newRate: num,
      reason: reason.trim(),
      adminId,
      adminName,
    });

    return {
      success: true,
      message: `Standard platform commission successfully updated from ${previousRate}% to ${num}%.`,
      config: updatedConfig,
      history,
    };
  },

  /**
   * GET /admin/payouts
   */
  async getPayouts({ status = 'all' } = {}) {
    await new Promise((r) => setTimeout(r, 250));
    let list = JSON.parse(localStorage.getItem(STORAGE_KEY_PAYOUTS) || JSON.stringify(INITIAL_PAYOUTS_MASTER));

    if (status && status !== 'all') {
      list = list.filter((p) => p.status.toLowerCase() === status.toLowerCase());
    }

    return {
      success: true,
      total: list.length,
      payouts: list,
    };
  },

  /**
   * GET /admin/payments
   * Returns payment transactions breakdown
   */
  async getPaymentTransactions() {
    await new Promise((r) => setTimeout(r, 250));
    return {
      success: true,
      gatewayStatus: {
        gateway: 'Razorpay PG v2 (Live)',
        webhookStatus: 'Healthy (0 dropped)',
        autoSettlement: 'Enabled (T+1 Cycle)',
        pciCompliance: 'Level 1 Certified',
      },
    };
  },
};
