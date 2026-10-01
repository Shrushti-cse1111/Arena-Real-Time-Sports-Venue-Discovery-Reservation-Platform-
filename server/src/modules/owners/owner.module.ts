import {
  Module,
  Injectable,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Owner,
  Business,
  Venue,
  Court,
  Booking,
  Payment,
  Payout,
  Review,
  ReviewReply,
  Staff,
  Notification,
} from '../../database/entities';
import { OwnerVerificationStatus, BookingStatus } from '../../common/enums';

@Injectable()
export class OwnerService {
  constructor(
    @InjectRepository(Owner) private ownerRepo: Repository<Owner>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Venue) private venueRepo: Repository<Venue>,
    @InjectRepository(Court) private courtRepo: Repository<Court>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Payout) private payoutRepo: Repository<Payout>,
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(ReviewReply) private replyRepo: Repository<ReviewReply>,
    @InjectRepository(Staff) private staffRepo: Repository<Staff>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  // 1. Owner Dashboard KPIs & Summary
  async getDashboard(ownerId: string) {
    const owner = await this.ownerRepo.findOne({
      where: { id: ownerId },
      relations: ['venues', 'businesses'],
    });

    const venues = await this.venueRepo.find({ where: { ownerId } });
    const venueIds = venues.map((v) => v.id);

    let bookingsCount = 0;
    let totalRevenue = 0;
    let recentBookings: Booking[] = [];

    if (venueIds.length > 0) {
      bookingsCount = await this.bookingRepo
        .createQueryBuilder('b')
        .where('b.venueId IN (:...venueIds)', { venueIds })
        .getCount();

      recentBookings = await this.bookingRepo
        .createQueryBuilder('b')
        .leftJoinAndSelect('b.venue', 'venue')
        .leftJoinAndSelect('b.user', 'user')
        .where('b.venueId IN (:...venueIds)', { venueIds })
        .orderBy('b.createdAt', 'DESC')
        .take(10)
        .getMany();

      const confirmedBookings = await this.bookingRepo
        .createQueryBuilder('b')
        .where('b.venueId IN (:...venueIds)', { venueIds })
        .andWhere('b.status = :st', { st: BookingStatus.CONFIRMED })
        .getMany();

      totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.ownerPayoutAmount || 0), 0);
    }

    const staffCount = await this.staffRepo.count({ where: { ownerId } });

    return {
      success: true,
      owner,
      stats: {
        totalRevenue,
        bookingsCount,
        venuesCount: venues.length,
        staffCount,
        utilizationRate: 78.5,
        ratingAverage: 4.85,
      },
      recentBookings,
    };
  }

  // 2. Earnings & Payout Ledger
  async getEarnings(ownerId: string) {
    const owner = await this.ownerRepo.findOne({ where: { id: ownerId } });
    const payouts = await this.payoutRepo.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });

    return {
      success: true,
      totalEarnings: owner?.totalEarnings || 0,
      pendingPayout: owner?.pendingPayout || 0,
      payouts,
    };
  }

  // 3. Reviews & Replies
  async getReviews(ownerId: string) {
    const venues = await this.venueRepo.find({ where: { ownerId } });
    const venueIds = venues.map((v) => v.id);

    if (venueIds.length === 0) return { success: true, reviews: [] };

    const reviews = await this.reviewRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.venue', 'v')
      .leftJoinAndSelect('r.user', 'u')
      .leftJoinAndSelect('r.replies', 'rep')
      .where('r.venueId IN (:...venueIds)', { venueIds })
      .orderBy('r.createdAt', 'DESC')
      .getMany();

    return { success: true, total: reviews.length, reviews };
  }

  async replyToReview(reviewId: string, ownerId: string, replyText: string) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found.');

    const reply = this.replyRepo.create({
      reviewId,
      ownerId,
      replyText: replyText.trim(),
    });
    const saved = await this.replyRepo.save(reply);
    return { success: true, message: 'Reply posted successfully.', reply: saved };
  }

  // 4. Staff Management
  async getStaff(ownerId: string) {
    const staff = await this.staffRepo.find({ where: { ownerId } });
    return { success: true, staff };
  }

  async addStaff(ownerId: string, data: any) {
    const staff = this.staffRepo.create({
      ownerId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      roleTitle: data.roleTitle || 'Court Manager',
      assignedVenueIds: data.assignedVenueIds || [],
      permissions: data.permissions || ['VIEW_BOOKINGS', 'CHECKIN_PLAYERS'],
    });
    const saved = await this.staffRepo.save(staff);
    return { success: true, message: 'Staff member added successfully.', staff: saved };
  }

  // 5. Business KYC Verification Submission
  async submitVerification(ownerId: string, data: any) {
    const owner = await this.ownerRepo.findOne({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException('Owner not found.');

    let business = await this.businessRepo.findOne({ where: { ownerId } });
    if (!business) {
      business = this.businessRepo.create({ ownerId, businessName: data.businessName || 'Sports Arena' });
    }

    business.businessName = data.businessName || business.businessName;
    business.gstin = data.gstin || business.gstin;
    business.panNumber = data.panNumber || business.panNumber;
    business.bankAccountHolder = data.accountHolder || business.bankAccountHolder;
    business.bankName = data.bankName || business.bankName;
    business.bankAccountNumber = data.accountNumber || business.bankAccountNumber;
    business.bankIfscCode = data.ifscCode || business.bankIfscCode;
    business.documents = data.documents || business.documents;

    await this.businessRepo.save(business);

    owner.verificationStatus = OwnerVerificationStatus.PENDING;
    await this.ownerRepo.save(owner);

    return {
      success: true,
      message: 'Business KYC documents submitted successfully for administrative review.',
      business,
    };
  }
}

@Controller('owner')
export class OwnerController {
  constructor(private ownerService: OwnerService) {}

  @Get(':id/dashboard')
  async getDashboard(@Param('id') id: string) {
    return this.ownerService.getDashboard(id);
  }

  @Get(':id/earnings')
  async getEarnings(@Param('id') id: string) {
    return this.ownerService.getEarnings(id);
  }

  @Get(':id/reviews')
  async getReviews(@Param('id') id: string) {
    return this.ownerService.getReviews(id);
  }

  @Post('reviews/:reviewId/reply')
  async replyToReview(
    @Param('reviewId') reviewId: string,
    @Body() body: { ownerId: string; replyText: string },
  ) {
    return this.ownerService.replyToReview(reviewId, body.ownerId, body.replyText);
  }

  @Get(':id/staff')
  async getStaff(@Param('id') id: string) {
    return this.ownerService.getStaff(id);
  }

  @Post('staff')
  async addStaff(@Body() body: any) {
    return this.ownerService.addStaff(body.ownerId, body);
  }

  @Post('verification')
  async submitVerification(@Body() body: any) {
    return this.ownerService.submitVerification(body.ownerId, body);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Owner,
      Business,
      Venue,
      Court,
      Booking,
      Payment,
      Payout,
      Review,
      ReviewReply,
      Staff,
      Notification,
    ]),
  ],
  controllers: [OwnerController],
  providers: [OwnerService],
  exports: [OwnerService],
})
export class OwnerModule {}
