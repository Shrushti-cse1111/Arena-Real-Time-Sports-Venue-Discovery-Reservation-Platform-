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
import { SupportTicketStatus, SupportTicketPriority } from '../../common/enums';
import { User, Owner } from './user-owner.entity';
import { Venue } from './venue.entity';
import { Booking } from './booking-payment.entity';

// 15. Review Entity
@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  venueId: string;

  @ManyToOne(() => Venue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venueId' })
  venue: Venue;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @OneToMany(() => ReviewReply, (reply) => reply.review, { cascade: true })
  replies: ReviewReply[];

  @CreateDateColumn()
  createdAt: Date;
}

// 16. Review Reply Entity (Owner response)
@Entity('review_replies')
export class ReviewReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reviewId: string;

  @ManyToOne(() => Review, (review) => review.replies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewId' })
  review: Review;

  @Column()
  ownerId: string;

  @Column({ type: 'text' })
  replyText: string;

  @CreateDateColumn()
  createdAt: Date;
}

// 17. Coupon Entity
@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  code: string;

  @Column({ default: 'percentage' }) // 'percentage' | 'fixed'
  discountType: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  minBookingAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 500.0 })
  maxDiscountAmount: number;

  @Column({ type: 'timestamp' })
  validFrom: Date;

  @Column({ type: 'timestamp' })
  validTill: Date;

  @Column({ default: 100 })
  usageLimit: number;

  @Column({ default: 0 })
  usedCount: number;

  @Column({ default: 'active' }) // 'active' | 'paused' | 'expired'
  status: string;

  @Column({ nullable: true })
  venueId: string; // optional venue-specific coupon

  @CreateDateColumn()
  createdAt: Date;
}

// 18. Coupon Usage Entity
@Entity('coupon_usage')
export class CouponUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  couponId: string;

  @Column()
  userId: string;

  @Column()
  bookingId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountApplied: number;

  @CreateDateColumn()
  usedAt: Date;
}

// 19. Staff Entity
@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: 'Staff Member' })
  roleTitle: string;

  @Column('simple-array', { nullable: true })
  assignedVenueIds: string[];

  @Column('simple-array', { nullable: true })
  permissions: string[]; // e.g. ['MANAGE_SLOTS', 'VIEW_BOOKINGS', 'CHECKIN_PLAYERS']

  @Column()
  ownerId: string;

  @ManyToOne(() => Owner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: Owner;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}

// 20. Notification Entity
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recipientId: string; // userId, ownerId, or 'ALL_USERS' / 'ALL_OWNERS'

  @Column({ default: 'PLAYER' })
  recipientType: string; // 'PLAYER' | 'OWNER' | 'ADMIN'

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: 'info' })
  type: string; // 'booking' | 'payment' | 'payout' | 'venue' | 'support' | 'announcement'

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}

// 21. Support Ticket Entity
@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  ticketNumber: string; // e.g. TKT-8921

  @Column()
  userId: string;

  @Column({ default: 'PLAYER' })
  userType: string;

  @Column()
  subject: string;

  @Column({ default: 'General Inquiry' })
  category: string;

  @Column({ default: 'open' })
  status: SupportTicketStatus;

  @Column({ default: 'medium' })
  priority: SupportTicketPriority;

  @Column({ nullable: true })
  bookingReference: string;

  @OneToMany(() => SupportMessage, (msg) => msg.ticket, { cascade: true })
  messages: SupportMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 22. Support Message Entity
@Entity('support_messages')
export class SupportMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticketId: string;

  @ManyToOne(() => SupportTicket, (tkt) => tkt.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: SupportTicket;

  @Column()
  senderId: string;

  @Column()
  senderName: string;

  @Column({ default: 'USER' }) // 'USER' | 'ADMIN' | 'SYSTEM'
  senderRole: string;

  @Column({ type: 'text' })
  messageText: string;

  @Column({ default: false })
  isInternalNote: boolean; // Only visible to admins

  @CreateDateColumn()
  sentAt: Date;
}

// 23. Banner Entity
@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column()
  imageUrl: string;

  @Column({ nullable: true })
  actionLink: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}

// 24. Announcement Entity
@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: 'ALL' }) // 'ALL' | 'PLAYERS' | 'OWNERS'
  targetAudience: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  publishDate: Date;

  @Column({ default: 'published' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}

// 25. Commission Rule Entity
@Entity('commission_rules')
export class CommissionRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10.0 })
  defaultPercentage: number;

  @Column({ nullable: true })
  effectiveFrom: Date;

  @Column({ nullable: true })
  updatedByAdminId: string;

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}

// 26. Cancellation Rule Entity
@Entity('cancellation_rules')
export class CancellationRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column() // hours before slot time, e.g. 24, 12, 4
  hoursBeforeBooking: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 }) // refund percentage, e.g. 100, 75, 50, 0
  refundPercentage: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

// 27. Payout Entity
@Entity('payouts')
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => Owner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: Owner;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ default: 'settled' }) // 'pending' | 'processing' | 'settled' | 'failed'
  status: string;

  @Column({ nullable: true })
  utrNumber: string;

  @Column({ nullable: true })
  bankAccount: string;

  @Column({ type: 'timestamp', nullable: true })
  settledAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

// 28. Audit Log Entity
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  performedByUserId: string;

  @Column({ nullable: true })
  performedByName: string;

  @Column({ default: 'ADMIN' })
  performedByRole: string;

  @Column({ nullable: true })
  targetEntity: string;

  @Column({ nullable: true })
  targetEntityId: string;

  @Column({ type: 'jsonb', nullable: true })
  details: any;

  @Column({ default: '127.0.0.1' })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
