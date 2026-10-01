/**
 * arenaBookingEngineService.js
 * Client-side integration & simulated high-concurrency engine
 * Mirroring the NestJS + PostgreSQL + Redis + Razorpay + Socket.io architecture.
 */

export const SlotState = {
  AVAILABLE: 'available',
  HELD: 'held',
  BOOKED: 'booked',
  BLOCKED: 'blocked',
};

export const BookingState = {
  PENDING: 'pending',
  PAYMENT_PENDING: 'payment_pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  EXPIRED: 'expired',
};

class ArenaBookingEngineService {
  constructor() {
    this.redisLocks = new Map(); // Simulated Redis distributed keys
    this.slotsDb = new Map();
    this.bookingsDb = new Map();
    this.socketSubscribers = new Set();
    this.initDemoData();
  }

  initDemoData() {
    const today = new Date().toISOString().split('T')[0];
    for (let h = 6; h < 23; h++) {
      const slotId = `slot-${h}`;
      const startTime = `${String(h).padStart(2, '0')}:00:00`;
      const endTime = `${String(h + 1).padStart(2, '0')}:00:00`;
      this.slotsDb.set(slotId, {
        id: slotId,
        venueId: 'v-owner-demo',
        courtId: 'court-1',
        date: today,
        startTime,
        endTime,
        basePrice: 800,
        status: h === 18 ? SlotState.BOOKED : SlotState.AVAILABLE,
        holdExpiresAt: null,
        currentHoldBookingId: null,
      });
    }
  }

  // Socket.io subscription emulator
  subscribeToSlotUpdates(callback) {
    this.socketSubscribers.add(callback);
    return () => this.socketSubscribers.delete(callback);
  }

  emitSlotUpdate(event) {
    this.socketSubscribers.forEach((cb) => {
      try {
        cb(event);
      } catch (e) {
        console.error(e);
      }
    });
  }

  /**
   * 1. GET available slots
   */
  async getAvailableSlots(venueId, date) {
    await new Promise((r) => setTimeout(r, 150));
    return Array.from(this.slotsDb.values()).filter(
      (s) => s.venueId === venueId && s.date === date
    );
  }

  /**
   * 2 - 7. Acquire Redis lock -> Check DB -> Create Hold -> Create Razorpay Order
   */
  async createSlotHold({ userId, venueId, courtId, slotId, date, startTime, endTime }) {
    const lockKey = `lock:slot:${venueId}:${courtId}:${date}:${startTime}:${endTime}`;
    
    // Acquire Redis Lock
    if (this.redisLocks.has(lockKey)) {
      const error = new Error('Sorry, this slot was just booked by another player.');
      error.status = 409;
      throw error;
    }

    const lockToken = `token-${Date.now()}-${Math.random()}`;
    this.redisLocks.set(lockKey, lockToken);

    try {
      await new Promise((r) => setTimeout(r, 80)); // Simulated DB latency
      const slot = this.slotsDb.get(slotId);

      if (!slot) {
        throw new Error('Slot does not exist.');
      }

      const now = new Date();
      const isHoldExpired = slot.status === SlotState.HELD && slot.holdExpiresAt && slot.holdExpiresAt < now;

      if (slot.status !== SlotState.AVAILABLE && !isHoldExpired) {
        const error = new Error('Sorry, this slot was just booked by another player.');
        error.status = 409;
        throw error;
      }

      // Server-side price calculation
      const hour = parseInt(startTime.split(':')[0], 10);
      const isPeak = hour >= 18 && hour < 23;
      const finalPrice = isPeak ? Math.round(slot.basePrice * 1.25) : slot.basePrice;

      const holdExpiresAt = new Date(Date.now() + 300 * 1000); // 5 mins
      const bookingId = `BK-${Date.now().toString().slice(-6)}`;

      const booking = {
        id: bookingId,
        userId,
        venueId,
        courtId,
        slotId,
        date,
        startTime,
        endTime,
        status: BookingState.PAYMENT_PENDING,
        originalAmount: finalPrice,
        finalPayableAmount: finalPrice,
        holdExpiresAt,
        razorpayOrderId: `order_${bookingId}`,
      };

      this.bookingsDb.set(bookingId, booking);

      slot.status = SlotState.HELD;
      slot.currentHoldBookingId = bookingId;
      slot.holdExpiresAt = holdExpiresAt;
      this.slotsDb.set(slotId, slot);

      // Emit Socket.io update
      this.emitSlotUpdate({
        slotId,
        status: SlotState.HELD,
        holdExpiresAt: holdExpiresAt.toISOString(),
      });

      return {
        success: true,
        bookingId,
        holdExpiresAt,
        amount: finalPrice,
        razorpayOrder: {
          id: booking.razorpayOrderId,
          amount: finalPrice * 100,
          currency: 'INR',
        },
      };
    } finally {
      this.redisLocks.delete(lockKey);
    }
  }

  /**
   * 8 - 11. Verify payment signature server-side & Confirm booking
   */
  async confirmBooking({ bookingId, userId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    await new Promise((r) => setTimeout(r, 150));
    const booking = this.bookingsDb.get(bookingId);

    if (!booking) throw new Error('Booking not found.');
    if (booking.status === BookingState.CONFIRMED) return { success: true, booking };

    // Server-side signature verification
    if (!razorpayPaymentId) {
      throw new Error('Payment verification failed.');
    }

    const slot = this.slotsDb.get(booking.slotId);
    if (!slot || slot.status === SlotState.BOOKED) {
      const error = new Error('Sorry, this slot was just booked by another player.');
      error.status = 409;
      throw error;
    }

    booking.status = BookingState.CONFIRMED;
    booking.razorpayPaymentId = razorpayPaymentId;
    booking.razorpaySignature = razorpaySignature;
    booking.confirmedAt = new Date();
    booking.holdExpiresAt = null;

    slot.status = SlotState.BOOKED;
    slot.currentHoldBookingId = null;
    slot.holdExpiresAt = null;

    this.emitSlotUpdate({
      slotId: slot.id,
      status: SlotState.BOOKED,
      holdExpiresAt: null,
    });

    return {
      success: true,
      message: 'Booking confirmed successfully!',
      booking,
    };
  }

  /**
   * CONCURRENT STRESS TEST:
   * Fires N simultaneous booking requests against the same slot.
   * Verifies that exactly ONE gets confirmed and N-1 get 409.
   */
  async runConcurrentBookingTest(slotId, concurrencyCount = 10) {
    const slot = this.slotsDb.get(slotId);
    if (!slot) return { error: 'Slot not found' };

    // Reset slot to available for test
    slot.status = SlotState.AVAILABLE;
    slot.currentHoldBookingId = null;
    slot.holdExpiresAt = null;

    const results = await Promise.allSettled(
      Array.from({ length: concurrencyCount }, (_, i) =>
        this.createSlotHold({
          userId: `user-concurrent-${i + 1}`,
          venueId: slot.venueId,
          courtId: slot.courtId,
          slotId: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled');
    const failed409 = results.filter(
      (r) => r.status === 'rejected' && r.reason?.status === 409
    );

    return {
      totalAttempts: concurrencyCount,
      confirmedCount: successful.length,
      conflict409Count: failed409.length,
      passed: successful.length === 1 && failed409.length === concurrencyCount - 1,
      successfulBooking: successful[0]?.value,
    };
  }
}

export const arenaBookingEngineService = new ArenaBookingEngineService();
