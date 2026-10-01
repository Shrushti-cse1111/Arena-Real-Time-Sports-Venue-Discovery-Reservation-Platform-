import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  UserRole,
  OwnerVerificationStatus,
  VenueStatus,
  SlotStatus,
  BookingStatus,
  PaymentStatus,
  SupportTicketStatus,
  SupportTicketPriority,
} from '../../common/enums';

// 1. User Entity (Player)
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  phone: string;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ default: 'PLAYER' })
  role: UserRole;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: false })
  isBlocked: boolean;

  @Column({ nullable: true })
  blockReason: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  walletBalance: number;

  @Column({ nullable: true })
  referralCode: string;

  @Column({ nullable: true })
  referredBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];
}

// 2. Owner Entity
@Entity('owners')
export class Owner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  phone: string;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ default: 'unverified' })
  verificationStatus: OwnerVerificationStatus;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  suspensionReason: string;

  @Column({ default: false })
  isSuspended: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  totalEarnings: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  pendingPayout: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Business, (business) => business.owner)
  businesses: Business[];

  @OneToMany(() => Venue, (venue) => venue.owner)
  venues: Venue[];
}

// 3. Business Entity (KYC & Bank info)
@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessName: string;

  @Column({ nullable: true })
  gstin: string;

  @Column({ nullable: true })
  panNumber: string;

  @Column({ nullable: true })
  aadhaarNumber: string;

  @Column({ nullable: true })
  bankAccountHolder: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  bankAccountNumber: string;

  @Column({ nullable: true })
  bankIfscCode: string;

  @Column({ type: 'jsonb', nullable: true })
  documents: { type: string; url: string; verified: boolean; number?: string }[];

  @Column({ default: false })
  isGstVerified: boolean;

  @Column({ default: false })
  isPanVerified: boolean;

  @ManyToOne(() => Owner, (owner) => owner.businesses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: Owner;

  @Column()
  ownerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 4. Admin User Entity
@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: 'Admin Officer' })
  name: string;

  @Column({ default: 'ADMIN' })
  role: UserRole;

  @Column({ default: true })
  twoFactorEnabled: boolean;

  @Column({ nullable: true })
  twoFactorSecret: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
