/**
 * Arena Group Booking & Split Payment Service
 * Server-side simulation of group creation, split-payment calculations,
 * max venue capacity enforcement, slot locking protection, and participant status lifecycle.
 */

// Simulated Group Bookings database
let groupBookingsStore = [];


export const groupBookingService = {
  /**
   * Get maximum capacity for a venue/sport
   */
  getMaxCapacityForSport(sport = 'Badminton') {
    switch (sport) {
      case 'Badminton':
        return 4;
      case 'Tennis':
        return 4;
      case 'Football':
        return 10;
      case 'Cricket':
        return 12;
      case 'Basketball':
        return 10;
      case 'Table Tennis':
        return 4;
      case 'Squash':
        return 2;
      default:
        return 6;
    }
  },

  /**
   * Calculate split breakdown for an active checkout
   */
  calculateSplit(totalAmount, participantCount = 4, customOrganizerShare = null) {
    const count = Math.max(2, Math.min(16, participantCount));
    const equalShare = Math.ceil(totalAmount / count);
    
    let organizerShare = equalShare;
    let participantShare = equalShare;

    if (customOrganizerShare && customOrganizerShare > 0 && customOrganizerShare < totalAmount) {
      organizerShare = customOrganizerShare;
      participantShare = Math.max(0, Math.ceil((totalAmount - organizerShare) / (count - 1)));
    }

    const remainingTotal = totalAmount - organizerShare;

    return {
      totalAmount,
      participantCount: count,
      organizerShare,
      participantShare,
      remainingTotal,
      isEqualSplit: !customOrganizerShare,
    };
  },

  /**
   * Server-side creation of a group booking
   */
  createGroupBooking(activeBooking, organizerUser, participantCount, initialParticipants = []) {
    const maxCapacity = this.getMaxCapacityForSport(activeBooking.sport);
    const count = Math.min(participantCount, maxCapacity);
    const totalAmount = activeBooking.finalPayable || 445;
    const split = this.calculateSplit(totalAmount, count);

    const groupBookingId = `GRP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const bookingId = activeBooking.bookingId || `#ARN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const organizerParticipant = {
      id: `part-1`,
      userId: organizerUser.id || 'user-1',
      name: organizerUser.fullName || 'Player',
      phone: organizerUser.phoneNumber || '',
      role: 'organizer',
      inviteStatus: 'joined',
      paymentStatus: 'paid', // Organizer pays their share at checkout
      amountDue: split.organizerShare,
      amountPaid: split.organizerShare,
      paymentTxnId: `TXN-WLT-GRP-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentMethod: activeBooking.paymentMethod || 'UPI',
      paidAt: 'Just now',
    };

    const teammateParticipants = Array.from({ length: count - 1 }, (_, i) => {
      const pData = initialParticipants[i] || {};
      return {
        id: `part-${i + 2}`,
        userId: pData.userId || null,
        name: pData.name || `Teammate ${i + 1}`,
        phone: pData.phone || '',
        role: 'participant',
        inviteStatus: pData.name ? 'invited' : 'invited',
        paymentStatus: 'pending',
        amountDue: split.participantShare,
        amountPaid: 0,
        paymentTxnId: null,
        paymentMethod: null,
        paidAt: null,
      };
    });

    const groupBookingRecord = {
      groupBookingId,
      bookingId,
      organizer: {
        id: organizerUser.id || 'user-1',
        name: organizerUser.fullName || 'Player',
        phone: organizerUser.phoneNumber || '',
        email: organizerUser.email || '',
      },
      venue: {
        id: activeBooking.venue?.id || 'venue-1',
        name: activeBooking.venue?.name || 'Arena Sports Club',
        courtId: activeBooking.court?.id || 'court-1',
        courtName: activeBooking.court?.name || 'Synthetic Badminton Court 1',
        sport: activeBooking.sport || 'Badminton',
        date: activeBooking.date?.dateStr || '2026-09-14',
        dateFormatted: activeBooking.date?.fullDate || 'Mon, 14 Sep 2026',
        time: activeBooking.slot?.time || '6:00 PM – 7:00 PM',
        duration: activeBooking.duration || '1 hour',
      },
      totalAmount,
      baseCourtPrice: activeBooking.courtPrice || 400,
      addOnsTotal: activeBooking.addOnsTotal || 0,
      platformFee: activeBooking.platformFee || 20,
      gst: activeBooking.gst || 25,
      participantCount: count,
      maxCapacity,
      sharePerPerson: split.participantShare,
      groupStatus: 'partially_paid',
      createdAt: 'Just now',
      participants: [organizerParticipant, ...teammateParticipants],
    };

    groupBookingsStore = [groupBookingRecord, ...groupBookingsStore];
    return groupBookingRecord;
  },

  /**
   * Get group booking by Group ID or Booking ID
   */
  getGroupBooking(groupOrBookingId) {
    return groupBookingsStore.find(
      (g) => g.groupBookingId === groupOrBookingId || g.bookingId === groupOrBookingId
    );
  },

  /**
   * Record individual participant payment and re-evaluate overall group status
   */
  recordParticipantPayment(groupBookingId, participantId, paymentMethod = 'UPI (Google Pay)') {
    const groupIndex = groupBookingsStore.findIndex((g) => g.groupBookingId === groupBookingId);
    if (groupIndex === -1) return { success: false, error: 'Group booking not found.' };

    const group = groupBookingsStore[groupIndex];
    const partIndex = group.participants.findIndex((p) => p.id === participantId);
    if (partIndex === -1) return { success: false, error: 'Participant not found in group.' };

    const participant = group.participants[partIndex];
    if (participant.paymentStatus === 'paid') {
      return { success: true, message: 'Participant has already paid.', group };
    }

    const txnId = `TXN-WLT-GRP-${Math.floor(1000 + Math.random() * 9000)}`;
    const updatedParticipant = {
      ...participant,
      inviteStatus: 'joined',
      paymentStatus: 'paid',
      amountPaid: participant.amountDue,
      paymentTxnId: txnId,
      paymentMethod,
      paidAt: 'Just now',
    };

    const updatedParticipants = [...group.participants];
    updatedParticipants[partIndex] = updatedParticipant;

    // Evaluate overall group booking confirmation status
    const allPaid = updatedParticipants.every((p) => p.paymentStatus === 'paid');
    const newGroupStatus = allPaid ? 'confirmed' : 'partially_paid';

    const updatedGroup = {
      ...group,
      groupStatus: newGroupStatus,
      participants: updatedParticipants,
    };

    groupBookingsStore[groupIndex] = updatedGroup;
    return {
      success: true,
      allPaid,
      txnId,
      updatedParticipant,
      group: updatedGroup,
    };
  },

  /**
   * Add a new participant to an active group booking (enforces max capacity)
   */
  addParticipant(groupBookingId, newParticipantData) {
    const groupIndex = groupBookingsStore.findIndex((g) => g.groupBookingId === groupBookingId);
    if (groupIndex === -1) return { success: false, error: 'Group booking not found.' };

    const group = groupBookingsStore[groupIndex];
    if (group.participants.length >= group.maxCapacity) {
      return {
        success: false,
        error: `Maximum court capacity reached (${group.maxCapacity} players max for ${group.venue.sport}).`,
      };
    }

    const newCount = group.participants.length + 1;
    const split = this.calculateSplit(group.totalAmount, newCount);

    const newParticipant = {
      id: `part-${Date.now()}`,
      userId: null,
      name: newParticipantData.name || `Player ${newCount}`,
      phone: newParticipantData.phone || '+91 98000 00000',
      role: 'participant',
      inviteStatus: 'invited',
      paymentStatus: 'pending',
      amountDue: split.participantShare,
      amountPaid: 0,
      paymentTxnId: null,
      paymentMethod: null,
      paidAt: null,
    };

    // Update existing unpaid participants' share amount
    const updatedParticipants = [...group.participants, newParticipant].map((p) => ({
      ...p,
      amountDue: p.role === 'organizer' ? split.organizerShare : split.participantShare,
    }));

    const updatedGroup = {
      ...group,
      participantCount: newCount,
      sharePerPerson: split.participantShare,
      participants: updatedParticipants,
    };

    groupBookingsStore[groupIndex] = updatedGroup;
    return { success: true, group: updatedGroup, newParticipant };
  },

  /**
   * Remove a participant from the group booking (if unpaid)
   */
  removeParticipant(groupBookingId, participantId) {
    const groupIndex = groupBookingsStore.findIndex((g) => g.groupBookingId === groupBookingId);
    if (groupIndex === -1) return { success: false, error: 'Group booking not found.' };

    const group = groupBookingsStore[groupIndex];
    const target = group.participants.find((p) => p.id === participantId);

    if (!target) return { success: false, error: 'Participant not found.' };
    if (target.role === 'organizer') return { success: false, error: 'Organizer cannot be removed from group booking.' };
    if (target.paymentStatus === 'paid') return { success: false, error: 'Cannot remove a participant who has already paid. Initiate a refund first.' };

    const filtered = group.participants.filter((p) => p.id !== participantId);
    const newCount = filtered.length;
    const split = this.calculateSplit(group.totalAmount, newCount);

    const updatedParticipants = filtered.map((p) => ({
      ...p,
      amountDue: p.role === 'organizer' ? split.organizerShare : split.participantShare,
    }));

    const updatedGroup = {
      ...group,
      participantCount: newCount,
      sharePerPerson: split.participantShare,
      participants: updatedParticipants,
    };

    groupBookingsStore[groupIndex] = updatedGroup;
    return { success: true, group: updatedGroup };
  },
};
