import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Slot,
  Booking,
  BookingHold,
  Payment,
  Refund,
  Venue,
  Court,
  User,
  Owner,
} from '../../../database/entities';
import { SlotStatus, BookingStatus, PaymentStatus } from '../../../common/enums';
import { RedisLockService } from './redis-lock.service';
import { PricingService, RazorpayService } from './pricing.service';
import { BookingEventsGateway } from '../gateways/booking-events.gateway';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectRepository(Slot) private slotRepo: Repository<Slot>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(BookingHold) private holdRepo: Repository<BookingHold>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Refund) private refundRepo: Repository<Refund>,
    @InjectRepository(Venue) private venueRepo: Repository<Venue>,
    @InjectRepository(Court) private courtRepo: Repository<Court>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Owner) private ownerRepo: Repository<Owner>,
    private redisLockService: RedisLockService,
    private pricingService: PricingService,
    private razorpayService: RazorpayService,
    private eventsGateway: BookingEventsGateway,
    private dataSource: DataSource,
  ) {}

  /**
   * 1. Check Availability & Get Slots for a Venue & Date
   */
  async getAvailability(venueId: string, date: string, courtId?: string) {
    const qb = this.slotRepo.createQueryBuilder('slot')
      .where('slot.venueId = :venueId', { venueId })
      .andWhere('slot.date = :date', { date });

    if (courtId) {
      qb.andWhere('slot.courtId = :courtId', { courtId });
    }

    let slots = await qb.getMany();

    // Auto-seed default daily slots if not yet generated for this date
    if (slots.length === 0) {
      const courts = await this.courtRepo.find({ where: { venueId } });
      const createdSlots: Slot[] = [];

      for (const court of courts) {
        for (let h = 6; h < 23; h++) {
          const startTime = `${String(h).padStart(2, '0')}:00`;
          const endTime = `${String(h + 1).padStart(2, '0')}:00`;
          const s = this.slotRepo.create({
            venueId,
            courtId: court.id,
            date,
            startTime,
            endTime,
            basePrice: court.basePricePerHour || 800,
            status: SlotStatus.AVAILABLE,
          });
          createdSlots.push(s);
        }
      }
      if (createdSlots.length > 0) {
        slots = await this.slotRepo.save(createdSlots);
      }
    }

    // Auto-expire obsolete holds
    const now = new Date();
    for (const s of slots) {
      if (s.status === SlotStatus.HELD && s.holdExpiresAt && new Date(s.holdExpiresAt) < now) {
        s.status = SlotStatus.AVAILABLE;
        s.holdExpiresAt = null;
        s.currentHoldBookingId = null;
        await this.slotRepo.save(s);
      }
    }

    return {
      success: true,
      venueId,
      date,
      totalSlots: slots.length,
      availableSlots: slots.filter((s) => s.status === SlotStatus.AVAILABLE).length,
      slots,
    };
  }

  /**
   * 2. HOLD SLOT & CREATE RAZORPAY ORDER (Double-Booking Protected)
   */
  async createSlotHold(params: {
    userId: string;
    venueId: string;
    courtId: string;
    slotId?: string;
    date: string;
    startTime: string;
    endTime: string;
    couponCode?: string;
    couponDiscount?: number;
  }) {
    const { userId, venueId, courtId, date, startTime, endTime, couponCode, couponDiscount } = params;

    const lockKey = `lock:slot:${venueId}:${courtId}:${date}:${startTime}`;
    const lockToken = await this.redisLockService.acquireLock(lockKey, 10000);

    if (!lockToken) {
      throw new ConflictException('Sorry, this slot was just booked by another player.');
    }

    try {
      // Find or verify the slot
      let slot: Slot | null = null;
      if (params.slotId) {
        slot = await this.slotRepo.findOne({ where: { id: params.slotId } });
      } else {
        slot = await this.slotRepo.findOne({
          where: { venueId, courtId, date, startTime },
        });
      }

      if (!slot) {
        const court = await this.courtRepo.findOne({ where: { id: courtId } });
        slot = this.slotRepo.create({
          venueId,
          courtId,
          date,
          startTime,
          endTime,
          basePrice: court?.basePricePerHour || 800,
          status: SlotStatus.AVAILABLE,
        });
        slot = await this.slotRepo.save(slot);
      }

      const now = new Date();
      const isHoldExpired = slot.status === SlotStatus.HELD && slot.holdExpiresAt && new Date(slot.holdExpiresAt) < now;

      if (slot.status !== SlotStatus.AVAILABLE && !isHoldExpired) {
        throw new ConflictException('Sorry, this slot was just booked by another player.');
      }

      // Server-side price calculation
      const court = await this.courtRepo.findOne({ where: { id: courtId } });
      const pricing = this.pricingService.calculatePrice({
        baseHourlyPrice: Number(court?.basePricePerHour || slot.basePrice || 800),
        startTime,
        date,
        couponDiscount: couponDiscount || 0,
      });

      const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes hold
      const bookingCode = `BK-${Date.now().toString().slice(-6)}`;

      // Create Razorpay order
      const razorpayOrder = await this.razorpayService.createOrder(bookingCode, pricing.finalAmount);

      // Create booking record in payment_pending
      const booking = this.bookingRepo.create({
        bookingCode,
        userId,
        venueId,
        courtId,
        date,
        startTime,
        endTime,
        status: BookingStatus.PAYMENT_PENDING,
        baseAmount: pricing.baseAmount,
        discountAmount: pricing.discountAmount,
        couponCode: couponCode || null,
        convenienceFee: pricing.convenienceFee,
        finalAmount: pricing.finalAmount,
        commissionPercent: pricing.commissionPercent,
        commissionAmount: pricing.commissionAmount,
        ownerPayoutAmount: pricing.ownerPayoutAmount,
        razorpayOrderId: razorpayOrder.id,
        holdExpiresAt,
      });

      const savedBooking = await this.bookingRepo.save(booking);

      // Update Slot to HELD
      slot.status = SlotStatus.HELD;
      slot.currentHoldBookingId = savedBooking.id;
      slot.holdExpiresAt = holdExpiresAt;
      await this.slotRepo.save(slot);

      // Broadcast real-time slot update
      this.eventsGateway.broadcastSlotUpdate(venueId, {
        slotId: slot.id,
        courtId,
        date,
        startTime,
        status: SlotStatus.HELD,
        holdExpiresAt: holdExpiresAt.toISOString(),
      });

      return {
        success: true,
        bookingId: savedBooking.id,
        bookingCode: savedBooking.bookingCode,
        holdExpiresAt: holdExpiresAt.toISOString(),
        pricing,
        razorpayOrder,
      };
    } finally {
      await this.redisLockService.releaseLock(lockKey, lockToken);
    }
  }

  /**
   * 3. CONFIRM BOOKING & VERIFY PAYMENT SIGNATURE
   */
  async confirmBooking(params: {
    bookingId: string;
    userId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['venue', 'court', 'user'],
    });

    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.status === BookingStatus.CONFIRMED) {
      return { success: true, message: 'Booking already confirmed.', booking };
    }

    // Server-side Signature Verification
    const isSigValid = this.razorpayService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );

    if (!isSigValid) {
      throw new BadRequestException('Payment signature verification failed.');
    }

    // Atomic DB Transaction
    return await this.dataSource.transaction(async (manager) => {
      booking.status = BookingStatus.CONFIRMED;
      booking.razorpayPaymentId = razorpayPaymentId;
      booking.razorpaySignature = razorpaySignature;
      booking.confirmedAt = new Date();
      booking.holdExpiresAt = null;
      await manager.save(booking);

      // Update Slot to BOOKED
      await manager.update(
        Slot,
        { venueId: booking.venueId, courtId: booking.courtId, date: booking.date, startTime: booking.startTime },
        { status: SlotStatus.BOOKED, currentHoldBookingId: null, holdExpiresAt: null },
      );

      // Record Payment
      const payment = this.paymentRepo.create({
        bookingId: booking.id,
        amount: booking.finalAmount,
        status: PaymentStatus.SUCCESS,
        razorpayOrderId,
        razorpayPaymentId,
        paymentMethod: 'UPI/Card',
      });
      await manager.save(payment);

      // Credit Owner Earnings
      const venue = await manager.findOne(Venue, { where: { id: booking.venueId } });
      if (venue && venue.ownerId) {
        const owner = await manager.findOne(Owner, { where: { id: venue.ownerId } });
        if (owner) {
          owner.totalEarnings = Number(owner.totalEarnings || 0) + Number(booking.ownerPayoutAmount);
          owner.pendingPayout = Number(owner.pendingPayout || 0) + Number(booking.ownerPayoutAmount);
          await manager.save(owner);

          // Realtime notify owner
          this.eventsGateway.broadcastNewBooking(owner.id, {
            bookingId: booking.id,
            bookingCode: booking.bookingCode,
            venueName: venue.name,
            amount: booking.finalAmount,
            ownerPayout: booking.ownerPayoutAmount,
            date: booking.date,
            startTime: booking.startTime,
          });
        }
      }

      // Broadcast Slot State: BOOKED
      this.eventsGateway.broadcastSlotUpdate(booking.venueId, {
        courtId: booking.courtId,
        date: booking.date,
        startTime: booking.startTime,
        status: SlotStatus.BOOKED,
      });

      return {
        success: true,
        message: 'Booking confirmed successfully!',
        booking,
      };
    });
  }

  /**
   * 4. CANCEL BOOKING & PROCESS REFUND
   */
  async cancelBooking(bookingId: string, userId: string, reason?: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['venue', 'user'],
    });

    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled.');
    }

    // Cancellation Policy Refund Calculation
    const slotDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
    const now = new Date();
    const diffHours = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercent = 0;
    if (diffHours >= 24) refundPercent = 100;
    else if (diffHours >= 12) refundPercent = 75;
    else if (diffHours >= 4) refundPercent = 50;
    else refundPercent = 0;

    const refundAmount = Math.round((booking.finalAmount * refundPercent) / 100);

    return await this.dataSource.transaction(async (manager) => {
      booking.status = BookingStatus.CANCELLED;
      booking.cancelledAt = new Date();
      booking.cancellationReason = reason || 'Player initiated cancellation';
      await manager.save(booking);

      // Free Slot back to AVAILABLE
      await manager.update(
        Slot,
        { venueId: booking.venueId, courtId: booking.courtId, date: booking.date, startTime: booking.startTime },
        { status: SlotStatus.AVAILABLE, currentHoldBookingId: null, holdExpiresAt: null },
      );

      // Refund to User Wallet
      if (refundAmount > 0) {
        const user = await manager.findOne(User, { where: { id: booking.userId } });
        if (user) {
          user.walletBalance = Number(user.walletBalance || 0) + refundAmount;
          await manager.save(user);
        }

        const refund = this.refundRepo.create({
          bookingId: booking.id,
          amount: refundAmount,
          refundTarget: 'wallet',
          status: 'success',
          reason: `Cancelled ${diffHours.toFixed(1)}h before match (${refundPercent}% refund)`,
        });
        await manager.save(refund);
      }

      // Broadcast Slot State: AVAILABLE
      this.eventsGateway.broadcastSlotUpdate(booking.venueId, {
        courtId: booking.courtId,
        date: booking.date,
        startTime: booking.startTime,
        status: SlotStatus.AVAILABLE,
      });

      return {
        success: true,
        message: `Booking cancelled. Refund of ₹${refundAmount} (${refundPercent}%) credited to Arena Wallet.`,
        refundAmount,
        refundPercent,
        booking,
      };
    });
  }

  /**
   * 5. HIGH-CONCURRENCY STRESS TEST (N simultaneous requests for same slot)
   */
  async runConcurrentTest(slotId: string, count = 10) {
    let slot = await this.slotRepo.findOne({ where: { id: slotId } });
    if (!slot) {
      const all = await this.slotRepo.find({ take: 1 });
      if (all.length > 0) slot = all[0];
      else throw new NotFoundException('No slots available for concurrency test.');
    }

    // Reset slot to available
    slot.status = SlotStatus.AVAILABLE;
    slot.holdExpiresAt = null;
    slot.currentHoldBookingId = null;
    await this.slotRepo.save(slot);

    // Launch N concurrent requests
    const promises = Array.from({ length: count }, (_, i) =>
      this.createSlotHold({
        userId: `user-test-${i + 1}`,
        venueId: slot.venueId,
        courtId: slot.courtId,
        slotId: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }).then(
        (val) => ({ status: 'fulfilled', value: val }),
        (err) => ({ status: 'rejected', reason: err.message, statusCode: err.getStatus?.() || 400 }),
      ),
    );

    const results = await Promise.all(promises);
    const successful = results.filter((r) => r.status === 'fulfilled');
    const conflicts = results.filter((r) => r.status === 'rejected' && r.statusCode === 409);

    return {
      success: true,
      totalAttempts: count,
      confirmedHoldCount: successful.length,
      conflict409Count: conflicts.length,
      passed: successful.length === 1 && conflicts.length === count - 1,
      successfulHold: successful[0]?.['value'],
    };
  }

  /**
   * 6. Get User Bookings
   */
  async getUserBookings(userId: string) {
    const bookings = await this.bookingRepo.find({
      where: { userId },
      relations: ['venue', 'court'],
      order: { createdAt: 'DESC' },
    });
    return { success: true, bookings };
  }

  /**
   * 7. Get Owner Bookings
   */
  async getOwnerBookings(ownerId: string, query?: { venueId?: string; date?: string; status?: string }) {
    const qb = this.bookingRepo.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.venue', 'venue')
      .leftJoinAndSelect('booking.court', 'court')
      .leftJoinAndSelect('booking.user', 'user')
      .where('venue.ownerId = :ownerId', { ownerId })
      .orderBy('booking.createdAt', 'DESC');

    if (query?.venueId && query.venueId !== 'all') {
      qb.andWhere('booking.venueId = :venueId', { venueId: query.venueId });
    }
    if (query?.status && query.status !== 'all') {
      qb.andWhere('booking.status = :status', { status: query.status });
    }
    if (query?.date) {
      qb.andWhere('booking.date = :date', { date: query.date });
    }

    const bookings = await qb.getMany();
    return { success: true, total: bookings.length, bookings };
  }
}
