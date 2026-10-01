export enum SlotState {
  AVAILABLE = 'available',
  HELD = 'held',
  BOOKED = 'booked',
  BLOCKED = 'blocked',
}

export enum BookingState {
  PENDING = 'pending',
  PAYMENT_PENDING = 'payment_pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  EXPIRED = 'expired',
}

export const BOOKING_CONSTANTS = {
  HOLD_DURATION_SECONDS: 300, // 5 minutes temporary hold
  LOCK_TTL_MS: 5000,          // 5 seconds distributed redis lock
  REDIS_LOCK_PREFIX: 'lock:slot:',
  SLOT_EVENT_CHANNEL: 'slot_updates',
  DOUBLE_BOOK_MESSAGE: 'Sorry, this slot was just booked by another player.',
};
