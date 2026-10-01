/**
 * ARENA — ADMIN SETTINGS SERVICE
 * Manages global platform configuration:
 * 1. Default commission % & change history
 * 2. Cancellation tiers & refund percentages
 * 3. Platform rules & auto-timeout settings
 * 
 * Endpoints:
 *   GET   /admin/settings
 *   PATCH /admin/settings/commission
 *   PATCH /admin/settings/cancellation
 */

const STORAGE_KEY_SETTINGS = 'arena_admin_platform_settings';
const STORAGE_KEY_ADMIN_AUDIT = 'arena_admin_audit_log';

const INITIAL_SETTINGS = {
  commission: {
    defaultCommissionRate: 10, // 10%
    gstPercentage: 18,
    payoutCycleDays: 7, // Every 7 days
    minPayoutThreshold: 1000,
    updatedAt: '2026-09-01T00:00:00Z',
    updatedBy: 'Sarah Connor (ADM-9001)',
  },
  cancellationTiers: [
    { id: 'tier-1', label: 'More than 12 hours before slot', minHoursBefore: 12, refundPercentage: 100, cancellationFee: 0 },
    { id: 'tier-2', label: 'Between 4 to 12 hours before slot', minHoursBefore: 4, refundPercentage: 75, cancellationFee: 25 },
    { id: 'tier-3', label: 'Between 2 to 4 hours before slot', minHoursBefore: 2, refundPercentage: 50, cancellationFee: 50 },
    { id: 'tier-4', label: 'Less than 2 hours before slot / No Show', minHoursBefore: 0, refundPercentage: 0, cancellationFee: 100 },
  ],
  platformRules: {
    slotLockHoldDurationSec: 600, // 10 mins
    maxAdvanceBookingDays: 14,
    allowInstantRefundToWallet: true,
    requireOwnerKycBeforeListing: true,
  },
};

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

export const adminSettingsService = {
  getStoredSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(INITIAL_SETTINGS));
        return INITIAL_SETTINGS;
      }
      return JSON.parse(raw);
    } catch (e) {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  /**
   * GET /admin/settings
   */
  async getSettings() {
    await new Promise((r) => setTimeout(r, 200));
    return {
      success: true,
      settings: this.getStoredSettings(),
    };
  },

  /**
   * PATCH /admin/settings/commission
   */
  async updateCommissionSettings({ rate, gst, payoutCycle, minThreshold }, adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    const r = Number(rate);
    if (isNaN(r) || r < 0 || r > 100) {
      throw new Error('Commission rate must be between 0 and 100.');
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
    const current = this.getStoredSettings();
    const updated = {
      ...current,
      commission: {
        ...current.commission,
        defaultCommissionRate: r,
        gstPercentage: Number(gst) || 18,
        payoutCycleDays: Number(payoutCycle) || 7,
        minPayoutThreshold: Number(minThreshold) || 1000,
        updatedAt: new Date().toISOString(),
        updatedBy: `${adminName} (${adminId})`,
      },
    };

    this.saveSettings(updated);
    recordAuditEntry('COMMISSION_SETTINGS_UPDATED', { newRate: r, adminId, adminName });

    return {
      success: true,
      message: 'Commission settings updated.',
      settings: updated,
    };
  },

  /**
   * PATCH /admin/settings/cancellation
   */
  async updateCancellationTiers(tiers, adminId = 'ADM-9001', adminName = 'Sarah Connor') {
    if (!Array.isArray(tiers) || tiers.length === 0) {
      throw new Error('Cancellation policy tiers cannot be empty.');
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
    const current = this.getStoredSettings();
    const updated = {
      ...current,
      cancellationTiers: tiers,
    };

    this.saveSettings(updated);
    recordAuditEntry('CANCELLATION_POLICY_UPDATED', { tiersCount: tiers.length, adminId, adminName });

    return {
      success: true,
      message: 'Cancellation policy rules updated.',
      settings: updated,
    };
  },
};
