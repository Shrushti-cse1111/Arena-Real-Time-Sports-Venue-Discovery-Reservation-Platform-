/**
 * Arena Referral & Invite Friends Service
 * Server-side simulation of referral code generation, invite tracking,
 * eligibility validation, self-referral prevention, and wallet reward execution.
 */

const REFERRAL_PROGRAM_CONFIG = {
  enabled: true,
  referrerReward: 150, // ₹150 wallet credit to referrer
  refereeReward: 100,  // ₹100 discount/credit for friend
  rewardType: 'wallet_credit',
};

// Initial simulated referral tracking database
let referralRecords = [];

export const referralService = {
  /**
   * Get referral program settings
   */
  getConfig() {
    return REFERRAL_PROGRAM_CONFIG;
  },

  /**
   * Generate or retrieve a user's unique referral code
   */
  getUserReferralCode(user) {
    if (!user || (!user.fullName && !user.userName)) return 'ARENA2026';
    const namePart = (user.fullName || user.userName || 'PLAYER')
      .replace(/[^A-Za-z]/g, '')
      .toUpperCase()
      .slice(0, 5);
    return `${namePart}2026`;
  },

  /**
   * Get referral summary stats and tracking list for a user
   */
  getReferralSummary(userOrId = null) {
    const userId = typeof userOrId === 'string' ? userOrId : (userOrId?.id || '');
    const userObj = typeof userOrId === 'object' && userOrId !== null ? userOrId : { fullName: 'Player' };
    const userRecords = userId ? referralRecords.filter(r => r.referrerId === userId) : referralRecords;
    
    const totalEarned = userRecords
      .filter(r => r.rewardStatus === 'rewarded')
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

    const totalInvited = userRecords.length;
    const totalRegistered = userRecords.filter(r => r.status === 'registered' || r.status === 'rewarded' || r.status === 'eligible').length;
    const totalRewarded = userRecords.filter(r => r.status === 'rewarded').length;
    const totalPending = userRecords.filter(r => r.status === 'invited' || r.status === 'registered').length;

    const code = this.getUserReferralCode(userObj);

    return {
      referralCode: code,
      referralLink: `https://arena.app/invite/${code}`,
      totalEarned,
      totalInvited,
      totalRegistered,
      totalRewarded,
      totalPending,
      referrerReward: REFERRAL_PROGRAM_CONFIG.referrerReward,
      refereeReward: REFERRAL_PROGRAM_CONFIG.refereeReward,
      records: userRecords,
    };
  },

  /**
   * Server-side validation of referral code
   */
  validateReferralCode(code, userOrId = null, currentUserPhone = '') {
    if (!REFERRAL_PROGRAM_CONFIG.enabled) {
      return { isValid: false, message: 'Referral program is currently inactive.' };
    }

    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { isValid: false, message: 'Please enter a referral code.' };
    }

    // Self-referral check
    const userObj = typeof userOrId === 'object' && userOrId !== null ? userOrId : { fullName: '' };
    const ownCode = userObj.fullName ? this.getUserReferralCode(userObj) : '';
    if (ownCode && cleanCode === ownCode) {
      return { isValid: false, message: 'Self-referral is not permitted. Please use a friend\'s code.' };
    }

    // Check if code matches standard format or registered users
    if (cleanCode.length >= 4 && cleanCode.endsWith('2026')) {
      return {
        isValid: true,
        code: cleanCode,
        message: `Valid Referral Code! You will get ₹${REFERRAL_PROGRAM_CONFIG.refereeReward} bonus on your 1st booking.`,
        discountAmount: REFERRAL_PROGRAM_CONFIG.refereeReward,
      };
    }

    if (cleanCode === 'ARENA50' || cleanCode === 'FIRSTMATCH') {
      return { isValid: false, message: 'This is a promo code. Please enter a friend\'s referral code.' };
    }

    return { isValid: false, message: 'Invalid or expired referral code. Please check and try again.' };
  },

  /**
   * Create an invitation record when sharing
   */
  recordInvite(userOrId = null, contactData, channel = 'WhatsApp') {
    const userId = typeof userOrId === 'string' ? userOrId : (userOrId?.id || 'user-1');
    const userName = typeof userOrId === 'object' && userOrId !== null ? (userOrId.fullName || 'Player') : 'Player';
    const newRecord = {
      id: `ref-${Date.now()}`,
      referrerId: userId,
      referrerName: userName,
      referralCode: this.getUserReferralCode(typeof userOrId === 'object' ? userOrId : { fullName: userName }),
      referredUser: {
        name: contactData.name || 'Invited Friend',
        phone: contactData.phone || '',
        email: contactData.email || '',
      },
      channel,
      status: 'invited',
      date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateIso: new Date().toISOString(),
      rewardStatus: 'pending',
      rewardAmount: REFERRAL_PROGRAM_CONFIG.referrerReward,
      walletTxnId: null,
      completedBookingId: null,
    };

    referralRecords = [newRecord, ...referralRecords];
    return newRecord;
  },

  /**
   * Apply referral code during player registration
   */
  applyReferralOnRegistration(newUser, referralCode) {
    const validation = this.validateReferralCode(referralCode, newUser.id, newUser.phoneNumber);
    if (!validation.isValid) return validation;

    const newRecord = {
      id: `ref-${Date.now()}`,
      referrerId: 'player-referrer',
      referrerName: 'Arena Friend',
      referralCode: referralCode.toUpperCase(),
      referredUser: {
        name: newUser.fullName,
        phone: newUser.phoneNumber,
        email: newUser.email,
      },
      channel: 'Registration',
      status: 'registered',
      date: 'Today',
      dateIso: new Date().toISOString(),
      rewardStatus: 'pending',
      rewardAmount: REFERRAL_PROGRAM_CONFIG.referrerReward,
      walletTxnId: null,
      completedBookingId: null,
    };

    referralRecords = [newRecord, ...referralRecords];
    return {
      success: true,
      message: `Referral applied! ₹${REFERRAL_PROGRAM_CONFIG.refereeReward} promo credit unlocked for your first game.`,
    };
  },

  /**
   * Server-side evaluation & execution of referral rewards when a booking is completed
   */
  processBookingReferralReward(bookingId, userId = '') {
    if (!REFERRAL_PROGRAM_CONFIG.enabled) return null;

    // Find pending registration referral for user
    const matchIndex = referralRecords.findIndex(
      r => r.status === 'registered' && r.rewardStatus === 'pending'
    );

    if (matchIndex !== -1) {
      const match = referralRecords[matchIndex];
      const txnId = `TXN-WLT-REF-${Math.floor(1000 + Math.random() * 9000)}`;

      referralRecords[matchIndex] = {
        ...match,
        status: 'rewarded',
        rewardStatus: 'rewarded',
        walletTxnId: txnId,
        completedBookingId: bookingId,
      };

      return {
        rewardAwarded: true,
        referrerReward: REFERRAL_PROGRAM_CONFIG.referrerReward,
        walletTxn: {
          id: `tx-ref-${Date.now()}`,
          txnId,
          type: 'referral_reward',
          title: `Referral Reward (Friend Joined) 🎁`,
          description: `₹${REFERRAL_PROGRAM_CONFIG.referrerReward} bonus credited for successful friend referral`,
          amount: REFERRAL_PROGRAM_CONFIG.referrerReward,
          isCredit: true,
          timestamp: 'Just now',
          status: 'completed',
          source: 'Referral Program',
        },
      };
    }

    return null;
  },
};
