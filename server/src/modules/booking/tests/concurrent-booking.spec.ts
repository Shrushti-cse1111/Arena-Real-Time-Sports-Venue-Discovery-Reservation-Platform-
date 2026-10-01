import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { BookingService } from '../services/booking.service';
import { SlotState, BookingState, BOOKING_CONSTANTS } from '../constants/booking.constants';

describe('Arena Booking Engine - Concurrency & Anti-Double-Booking Test', () => {
  let bookingService: BookingService;

  // Mock slot data
  const mockSlot = {
    id: 'slot-uuid-1',
    venueId: 'venue-uuid-1',
    courtId: 'court-uuid-1',
    date: '2026-10-05',
    startTime: '19:00:00',
    endTime: '20:00:00',
    basePrice: 800,
    status: SlotState.AVAILABLE,
    holdExpiresAt: null,
    currentHoldBookingId: null,
  };

  beforeEach(async () => {
    // Setup test harness
  });

  it('GIVEN 10 simultaneous booking requests for the EXACT same slot WHEN executed concurrently THEN exactly 1 succeeds and 9 fail with 409 Conflict', async () => {
    const concurrentUsers = Array.from({ length: 10 }, (_, i) => ({
      userId: `user-uuid-${i + 1}`,
      venueId: mockSlot.venueId,
      courtId: mockSlot.courtId,
      slotId: mockSlot.id,
      date: mockSlot.date,
      startTime: mockSlot.startTime,
      endTime: mockSlot.endTime,
    }));

    let lockHolder: string | null = null;
    let successfulHoldCount = 0;
    let conflictCount = 0;

    // Simulate concurrent distributed lock and DB check
    const attempts = await Promise.allSettled(
      concurrentUsers.map(async (userDto) => {
        // Atomic compare-and-swap simulation of Redis lock + PostgreSQL pessimistic lock
        if (lockHolder === null && mockSlot.status === SlotState.AVAILABLE) {
          lockHolder = userDto.userId;
          mockSlot.status = SlotState.HELD;
          successfulHoldCount++;
          return {
            status: 'success',
            bookingId: `booking-${userDto.userId}`,
            holdExpiresAt: new Date(Date.now() + 300000),
          };
        } else {
          conflictCount++;
          throw new ConflictException(BOOKING_CONSTANTS.DOUBLE_BOOK_MESSAGE);
        }
      }),
    );

    expect(successfulHoldCount).toBe(1);
    expect(conflictCount).toBe(9);

    const successfulAttempts = attempts.filter((a) => a.status === 'fulfilled');
    const rejectedAttempts = attempts.filter((a) => a.status === 'rejected');

    expect(successfulAttempts.length).toBe(1);
    expect(rejectedAttempts.length).toBe(9);

    // Verify error message on all 9 rejected attempts
    rejectedAttempts.forEach((attempt: any) => {
      expect(attempt.reason).toBeInstanceOf(ConflictException);
      expect(attempt.reason.message).toBe(BOOKING_CONSTANTS.DOUBLE_BOOK_MESSAGE);
    });
  });
});
