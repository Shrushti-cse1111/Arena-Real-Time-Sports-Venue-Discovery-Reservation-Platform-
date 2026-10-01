/**
 * ARENA — OWNER AUTH SERVICE
 * Handles Owner Signup, Login, OTP request, OTP verification, Rate Limiting, and Session Management.
 * API routes:
 *   POST /auth/owner/request-otp
 *   POST /auth/owner/verify-otp
 */

const STORAGE_KEY_SESSION = 'arena_owner_session';
const STORAGE_KEY_OTP_ATTEMPTS = 'arena_owner_otp_attempts';

// In-memory / localStorage mock database for owners
const mockOwnersDb = {
  '9876543210': {
    ownerId: 'OWNER-98765',
    businessName: 'Apex Sports Arena',
    mobile: '9876543210',
    verificationStatus: 'verified', // 'unverified' | 'pending' | 'verified' | 'rejected'
  },
  '9812345678': {
    ownerId: 'OWNER-98123',
    businessName: 'SmashPoint Turf',
    mobile: '9812345678',
    verificationStatus: 'unverified',
  },
};

export const ownerAuthService = {
  /**
   * Request OTP for owner signup/login
   * POST /auth/owner/request-otp
   */
  async requestOtp({ mobileNumber, businessName }) {
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    
    // Validation: Indian 10-digit mobile starting with 6-9
    if (!cleanMobile || cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).');
    }

    // Rate Limiting Check (Max 3 resends per 5 minutes)
    const attemptsData = JSON.parse(localStorage.getItem(STORAGE_KEY_OTP_ATTEMPTS) || '{}');
    const mobileRecord = attemptsData[cleanMobile] || { resendCount: 0, lastResend: 0, failedAttempts: 0 };
    const now = Date.now();

    if (mobileRecord.resendCount >= 3 && now - mobileRecord.lastResend < 5 * 60 * 1000) {
      const waitSeconds = Math.ceil((5 * 60 * 1000 - (now - mobileRecord.lastResend)) / 1000);
      throw new Error(`Resend rate limit reached. Please wait ${waitSeconds}s before requesting a new OTP.`);
    }

    // Update attempts record
    mobileRecord.resendCount = (now - mobileRecord.lastResend > 5 * 60 * 1000) ? 1 : mobileRecord.resendCount + 1;
    mobileRecord.lastResend = now;
    mobileRecord.failedAttempts = 0;
    attemptsData[cleanMobile] = mobileRecord;
    localStorage.setItem(STORAGE_KEY_OTP_ATTEMPTS, JSON.stringify(attemptsData));

    // Simulate Network Latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Demo OTP for testing (default '123456')
    return {
      success: true,
      message: `OTP sent successfully to +91 ${cleanMobile}`,
      expiresInSeconds: 30,
      resendRemaining: 3 - mobileRecord.resendCount,
    };
  },

  /**
   * Verify OTP and authenticate owner
   * POST /auth/owner/verify-otp
   */
  async verifyOtp({ mobileNumber, otp, businessName }) {
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    const cleanOtp = otp.trim();

    if (!cleanMobile || cleanMobile.length !== 10) {
      throw new Error('Valid 10-digit mobile number is required.');
    }
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      throw new Error('OTP must be exactly 6 digits.');
    }

    // Attempt Limit Check (Max 5 failed attempts)
    const attemptsData = JSON.parse(localStorage.getItem(STORAGE_KEY_OTP_ATTEMPTS) || '{}');
    const mobileRecord = attemptsData[cleanMobile] || { failedAttempts: 0 };

    if (mobileRecord.failedAttempts >= 5) {
      throw new Error('Too many failed attempts. This phone number is temporarily locked for 15 minutes.');
    }

    // Simulate Network Latency
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Demo check: OTP '000000' or wrong code fails
    if (cleanOtp === '000000' || (cleanOtp !== '123456' && cleanOtp !== '654321')) {
      mobileRecord.failedAttempts += 1;
      attemptsData[cleanMobile] = mobileRecord;
      localStorage.setItem(STORAGE_KEY_OTP_ATTEMPTS, JSON.stringify(attemptsData));
      
      const remaining = 5 - mobileRecord.failedAttempts;
      throw new Error(`Invalid OTP verification code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
    }

    // Successful OTP verification — reset attempt limits
    attemptsData[cleanMobile] = { resendCount: 0, lastResend: 0, failedAttempts: 0 };
    localStorage.setItem(STORAGE_KEY_OTP_ATTEMPTS, JSON.stringify(attemptsData));

    // Retrieve or create owner record
    let ownerRecord = mockOwnersDb[cleanMobile];
    if (!ownerRecord) {
      ownerRecord = {
        ownerId: `OWNER-${Math.floor(10000 + Math.random() * 90000)}`,
        businessName: businessName || 'New Sports Turf',
        mobile: cleanMobile,
        verificationStatus: 'unverified',
      };
      mockOwnersDb[cleanMobile] = ownerRecord;
    } else if (businessName) {
      ownerRecord.businessName = businessName;
    }

    // Create session object
    const session = {
      ownerId: ownerRecord.ownerId,
      businessName: ownerRecord.businessName,
      mobile: ownerRecord.mobile,
      verificationStatus: ownerRecord.verificationStatus,
      token: `bearer_token_owner_${Date.now()}`,
      authenticatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));

    return {
      success: true,
      session,
      verificationStatus: session.verificationStatus,
    };
  },

  /**
   * Get active authenticated owner session
   */
  getOwnerSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SESSION);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  /**
   * Update owner verification status in active session
   */
  updateOwnerVerificationStatus(status) {
    const session = this.getOwnerSession();
    if (session) {
      session.verificationStatus = status;
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
      if (mockOwnersDb[session.mobile]) {
        mockOwnersDb[session.mobile].verificationStatus = status;
      }
    }
    return session;
  },

  /**
   * Logout owner session
   */
  logoutOwner() {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  },
};
