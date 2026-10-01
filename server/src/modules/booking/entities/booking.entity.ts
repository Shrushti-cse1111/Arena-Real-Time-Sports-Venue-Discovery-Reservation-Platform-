import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BookingState } from '../constants/booking.constants';
import { Slot } from './slot.entity';

@Entity('bookings')
@Index(['userId', 'status'])
@Index(['venueId', 'courtId', 'date'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  venueId: string;

  @Column({ type: 'uuid' })
  courtId: string;

  @Column({ type: 'uuid' })
  slotId: string;

  @ManyToOne(() => Slot, (slot) => slot.bookings, { eager: true })
  @JoinColumn({ name: 'slotId' })
  slot: Slot;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({
    type: 'enum',
    enum: BookingState,
    default: BookingState.PENDING,
  })
  status: BookingState;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  originalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  finalPayableAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  couponCode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  razorpayOrderId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  razorpayPaymentId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razorpaySignature?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  holdExpiresAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  confirmedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  razorpayRefundId?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
