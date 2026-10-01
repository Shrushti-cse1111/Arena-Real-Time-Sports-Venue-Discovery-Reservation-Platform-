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
import { VenueStatus } from '../../common/enums';
import { Owner } from './user-owner.entity';

// 5. Venue Entity
@Entity('venues')
export class Venue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'Football' })
  primarySport: string;

  @Column('simple-array', { nullable: true })
  sports: string[];

  @Column()
  address: string;

  @Column()
  area: string;

  @Column({ default: 'Pune' })
  city: string;

  @Column({ default: 'Maharashtra' })
  state: string;

  @Column({ nullable: true })
  pincode: string;

  @Column('decimal', { precision: 10, scale: 6, default: 18.5204 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 6, default: 73.8567 })
  longitude: number;

  @Column('simple-array', { nullable: true })
  amenities: string[];

  @Column({ default: 'pending' })
  status: VenueStatus;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 4.8 })
  rating: number;

  @Column({ default: 0 })
  reviewsCount: number;

  @Column({ default: 1 })
  courtsCount: number;

  @ManyToOne(() => Owner, (owner) => owner.venues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: Owner;

  @Column()
  ownerId: string;

  @OneToMany(() => Court, (court) => court.venue, { cascade: true })
  courts: Court[];

  @OneToMany(() => VenuePhoto, (photo) => photo.venue, { cascade: true })
  photos: VenuePhoto[];

  @OneToMany(() => OperatingHour, (hour) => hour.venue, { cascade: true })
  operatingHours: OperatingHour[];

  @OneToMany(() => PricingRule, (rule) => rule.venue, { cascade: true })
  pricingRules: PricingRule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 6. Venue Photo Entity
@Entity('venue_photos')
export class VenuePhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column({ default: false })
  isPrimary: boolean;

  @ManyToOne(() => Venue, (venue) => venue.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venueId' })
  venue: Venue;

  @Column()
  venueId: string;
}

// 7. Court Entity
@Entity('courts')
export class Court {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: 'Synthetic Turf' })
  surfaceType: string;

  @Column({ default: 'Football' })
  sport: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 800.0 })
  basePricePerHour: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1100.0 })
  peakPricePerHour: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Venue, (venue) => venue.courts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venueId' })
  venue: Venue;

  @Column()
  venueId: string;

  @CreateDateColumn()
  createdAt: Date;
}

// 8. Operating Hours Entity
@Entity('operating_hours')
export class OperatingHour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayOfWeek: number;

  @Column({ default: '06:00' })
  openTime: string;

  @Column({ default: '23:00' })
  closeTime: string;

  @Column({ default: false })
  isClosed: boolean;

  @ManyToOne(() => Venue, (venue) => venue.operatingHours, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venueId' })
  venue: Venue;

  @Column()
  venueId: string;
}

// 9. Pricing Rule Entity
@Entity('pricing_rules')
export class PricingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: 'PEAK_HOURS' }) // PEAK_HOURS, WEEKEND, CUSTOM
  ruleType: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.25 })
  multiplier: number;

  @Column({ nullable: true })
  startTime: string;

  @Column({ nullable: true })
  endTime: string;

  @Column('simple-array', { nullable: true })
  applicableDays: number[];

  @ManyToOne(() => Venue, (venue) => venue.pricingRules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venueId' })
  venue: Venue;

  @Column()
  venueId: string;
}
