/**
 * ownerProfileService.js
 * Backend profile & settings simulation for Arena Owner Portal:
 * - GET /owner/profile
 * - PATCH /owner/profile
 * - Invalidate session & logout
 */

const STORAGE_KEY_PROFILE = 'arena_owner_profile_settings';

// Default initial profile record
const DEFAULT_PROFILE = {
  ownerId: 'OWNER-98231',
  fullName: 'Rajesh Malhotra',
  businessName: 'Arena Sports Ventures LLP',
  contactNumber: '+91 98221 44551',
  supportEmail: 'contact@arenasports.in',
  city: 'Pune, Maharashtra',
  registeredGstin: '27AABCA1234F1Z5',
  verificationStatus: 'verified',
  joinedDate: 'January 2026',
  // Masked Payout Information (raw numbers never stored in client)
  payoutAccount: {
    bankName: 'HDFC Bank Ltd',
    branch: 'FC Road, Pune',
    accountHolder: 'Arena Sports Ventures LLP',
    maskedAccountNumber: '•••• •••• •••• 8842',
    ifscCode: 'HDFC0000123',
    accountType: 'Current Account',
    status: 'Active & Verified',
  },
  preferences: {
    smsAlerts: true,
    whatsappUpdates: true,
    weeklyDigest: true,
  },
};

function getStoredProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch (e) {
    return DEFAULT_PROFILE;
  }
}

function saveStoredProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save owner profile:', e);
  }
}

export const ownerProfileService = {
  /**
   * Fetch authenticated owner profile
   * GET /owner/profile
   */
  async getProfile(ownerId = 'OWNER-98231') {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const current = getStoredProfile();
    return current;
  },

  /**
   * Update owner profile details
   * PATCH /owner/profile
   */
  async updateProfile(updates = {}) {
    const current = getStoredProfile();

    // Validation
    if (updates.businessName !== undefined) {
      if (!updates.businessName || !updates.businessName.trim()) {
        throw new Error('Business name cannot be empty.');
      }
    }

    if (updates.supportEmail !== undefined) {
      const emailTrimmed = updates.supportEmail.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
        throw new Error('Please provide a valid support email address.');
      }
      updates.supportEmail = emailTrimmed;
    }

    // Simulate Network Delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Simulated Error Flag for resilience testing (if testing failure trigger)
    if (updates._simulateFailure) {
      throw new Error("Couldn't save your changes. Please try again.");
    }

    const updatedProfile = {
      ...current,
      ...updates,
      businessName: updates.businessName ? updates.businessName.trim() : current.businessName,
      supportEmail: updates.supportEmail ? updates.supportEmail.trim() : current.supportEmail,
      updatedAt: new Date().toISOString(),
    };

    saveStoredProfile(updatedProfile);

    return {
      success: true,
      message: 'Profile updated successfully!',
      profile: updatedProfile,
    };
  },

  /**
   * Perform secure logout
   */
  async logout() {
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      sessionStorage.removeItem('arena_selected_venue_id');
      sessionStorage.removeItem('arena_owner_session_token');
    } catch (e) {}
    return { success: true };
  },
};
