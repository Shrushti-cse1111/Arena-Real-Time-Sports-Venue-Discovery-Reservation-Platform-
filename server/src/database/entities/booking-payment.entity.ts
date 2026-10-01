import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { SlotStatus, BookingStatus, PaymentStatus } from '../../common/enums';
import { User } from './user-owner.entity';
import { Venue, Court } from './venue.entity';

// 10. Slot Entity
@Entity('slots')
@Index(['venueId', 'courtId', 'date', 'startTime'], { unique: true })
export class Slot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  venueId: string;

  @Column()
  courtId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 800.0 })
  basePrice: number;

  @Column({ default: 'available' })
  status: SlotStatus;

  @Column({ type: 'timestamp', nullable: true })
  holdExpiresAt: Date;

  @Column({ nullable: true })
  currentHoldBookingId: string;

  @ManyToOne(() => Venue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venueId' })
  venue: Venue;

  @ManyToOne(() => Court, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courtId' })
  court: Court;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 11. Booking Hold Entity (Redis shadow & persistent tracking)
@Entity('booking_holds')
export class BookingHold {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  slotId: string;

  @Column()
  userId: string;

  @Column()
  venueId: string;

  @Column()
  courtId: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  isReleased: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

// 12. Booking Entity
@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  bookingCode: string; // e.g. BK-982341

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  venueId: string;

  @ManyToOne(() => Venue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venueId' })
  venue: Venue;

  @Column()
  courtId: string;

  @ManyToOne(() => Court, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courtId' })
  court: Court;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ default: 'payment_pending' })
  status: BookingStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  discountAmount: number;

  @Column({ nullable: true })
  couponCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  convenienceFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  finalAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10.0 })
  commissionPercent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  commissionAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  ownerPayoutAmount: number;

  @Column({ nullable: true })
  razorpayOrderId: string;

  @Column({ nullable: true })
  razorpayPaymentId: string;

  @Column({ nullable: true })
  razorpaySignature: string;

  @Column({ type: 'timestamp', nullable: true })
  holdExpiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancellationReason: string;

  @OneToMany(() => Payment, (payment) => payment.booking, { cascade: true })
  payments: Payment[];

  @OneToMany(() => Refund, (refund) => refund.booking, { cascade: true })
  refunds: Refund[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 13. Payment Entity
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookingId: string;

  @ManyToOne(() => Booking, (booking) => booking.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ default: 'pending' })
  status: PaymentStatus;

  @Column({ nullable: true })
  razorpayOrderId: string;

  @Column({ nullable: true })
  razorpayPaymentId: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ type: 'jsonb', nullable: true })
  rawGatewayResponse: any;

  @CreateDateColumn()
  createdAt: Date;
}

// 14. Refund Entity
@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookingId: string;

  @ManyToOne(() => Booking, (booking) => booking.refunds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'wallet' }) // 'wallet' or 'source_gateway'
  refundTarget: string;

  @Column({ default: 'success' })
  status: string;

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  razorpayRefundId: string;

  @CreateDateColumn()
  createdAt: Date;
}
