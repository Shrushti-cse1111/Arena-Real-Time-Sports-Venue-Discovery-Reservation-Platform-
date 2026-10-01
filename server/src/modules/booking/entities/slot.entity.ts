import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
  OneToMany,
} from 'typeorm';
import { SlotState } from '../constants/booking.constants';
import { Booking } from './booking.entity';

@Entity('slots')
@Unique('UQ_SLOT_COURT_TIME', ['venueId', 'courtId', 'date', 'startTime', 'endTime'])
@Index(['venueId', 'date', 'status'])
export class Slot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  venueId: string;

  @Column({ type: 'uuid' })
  courtId: string;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ type: 'time' })
  startTime: string; // HH:mm:ss

  @Column({ type: 'time' })
  endTime: string; // HH:mm:ss

  @Column({
    type: 'enum',
    enum: SlotState,
    default: SlotState.AVAILABLE,
  })
  status: SlotState;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'uuid', nullable: true })
  currentHoldBookingId?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  holdExpiresAt?: Date;

  @Column({ type: 'int', default: 0 })
  version: number; // Optimistic locking support

  @OneToMany(() => Booking, (booking) => booking.slot)
  bookings: Booking[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
