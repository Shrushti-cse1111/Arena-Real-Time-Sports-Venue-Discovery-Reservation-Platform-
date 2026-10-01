import {
  Module,
  Injectable,
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
  AdminUser,
  Venue,
  User,
  Owner,
  Business,
  Booking,
  Payment,
  Refund,
  Payout,
  Coupon,
  CouponUsage,
  SupportTicket,
  SupportMessage,
  Banner,
  Announcement,
  CommissionRule,
  CancellationRule,
  AuditLog,
} from '../../database/entities';
import { VenueStatus, OwnerVerificationStatus, BookingStatus } from '../../common/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminUser) private adminRepo: Repository<AdminUser>,
    @InjectRepository(Venue) private venueRepo: Repository<Venue>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Owner) private ownerRepo: Repository<Owner>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Refund) private refundRepo: Repository<Refund>,
    @InjectRepository(Payout) private payoutRepo: Repository<Payout>,
    @InjectRepository(Coupon) private couponRepo: Repository<Coupon>,
    @InjectRepository(SupportTicket) private ticketRepo: Repository<SupportTicket>,
    @InjectRepository(SupportMessage) private msgRepo: Repository<SupportMessage>,
    @InjectRepository(Banner) private bannerRepo: Repository<Banner>,
    @InjectRepository(Announcement) private announcementRepo: Repository<Announcement>,
    @InjectRepository(CommissionRule) private commissionRepo: Repository<CommissionRule>,
    @InjectRepository(CancellationRule) private cancelRuleRepo: Repository<CancellationRule>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  // 1. Dashboard Metrics
  async getDashboardMetrics() {
    const totalBookings = await this.bookingRepo.count();
    const confirmedBookings = await this.bookingRepo.count({ where: { status: BookingStatus.CONFIRMED } });
    const totalPlayers = await this.userRepo.count();
    const totalOwners = await this.ownerRepo.count();
    const pendingVenuesCount = await this.venueRepo.count({ where: { status: VenueStatus.PENDING } });
    const pendingOwnersCount = await this.ownerRepo.count({ where: { verificationStatus: OwnerVerificationStatus.PENDING } });
    const openTicketsCount = await this.ticketRepo.count({ where: { status: 'open' as any } });

    // Financial calculations
    const payments = await this.paymentRepo.find({ where: { status: 'success' as any } });
    const grossVolume = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const platformCommission = Math.round(grossVolume * 0.1); // 10% default
    const netPayouts = grossVolume - platformCommission;

    return {
      success: true,
      metrics: {
        grossVolume,
        platformCommission,
        netPayouts,
        totalBookings,
        confirmedBookings,
        totalPlayers,
        totalOwners,
        pendingVenuesCount,
        pendingOwnersCount,
        openTicketsCount,
        takeRatePercent: 10.0,
      },
    };
  }

  // 2. Audit Logger
  async logAction(action: string, adminId: string, details: any) {
    const log = this.auditRepo.create({
      action,
      performedByUserId: adminId,
      performedByRole: 'ADMIN',
      details,
    });
    return this.auditRepo.save(log);
  }

  // 3. Venue Approvals
  async getVenues(query: { status?: string; search?: string }) {
    const qb = this.venueRepo.createQueryBuilder('venue')
      .leftJoinAndSelect('venue.owner', 'owner')
      .leftJoinAndSelect('venue.courts', 'court')
      .leftJoinAndSelect('venue.photos', 'photo');

    if (query.status && query.status !== 'all') {
      qb.andWhere('venue.status = :status', { status: query.status });
    }
    if (query.search) {
      qb.andWhere('(LOWER(venue.name) LIKE LOWER(:q) OR LOWER(venue.area) LIKE LOWER(:q))', {
        q: `%${query.search}%`,
      });
    }

    const venues = await qb.getMany();
    return { success: true, total: venues.length, venues };
  }

  async approveVenue(id: string, adminId: string, adminNote?: string) {
    const venue = await this.venueRepo.findOne({ where: { id } });
    if (!venue) throw new NotFoundException('Venue not found.');

    venue.status = VenueStatus.APPROVED;
    venue.rejectionReason = null;
    const updated = await this.venueRepo.save(venue);
    await this.logAction('VENUE_APPROVED', adminId, { venueId: id, note: adminNote });

    return { success: true, message: `Venue "${venue.name}" has been approved.`, venue: updated };
  }

  async rejectVenue(id: string, reason: string, adminId: string) {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException('A valid rejection reason is mandatory.');
    }
    const venue = await this.venueRepo.findOne({ where: { id } });
    if (!venue) throw new NotFoundException('Venue not found.');

    venue.status = VenueStatus.REJECTED;
    venue.rejectionReason = reason.trim();
    const updated = await this.venueRepo.save(venue);
    await this.logAction('VENUE_REJECTED', adminId, { venueId: id, reason });

    return { success: true, message: `Venue "${venue.name}" has been rejected.`, venue: updated };
  }

  // 4. User Moderation
  async getUsers(query: { search?: string; status?: string }) {
    const users = await this.userRepo.find({ order: { createdAt: 'DESC' } });
    return { success: true, total: users.length, users };
  }

  async blockUser(id: string, reason: string, adminId: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');

    user.isBlocked = true;
    user.blockReason = reason;
    await this.userRepo.save(user);
    await this.logAction('USER_BLOCKED', adminId, { userId: id, reason });

    return { success: true, message: `User ${user.name || user.phone} has been blocked.` };
  }

  async unblockUser(id: string, adminId: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');

    user.isBlocked = false;
    user.blockReason = null;
    await this.userRepo.save(user);
    await this.logAction('USER_UNBLOCKED', adminId, { userId: id });

    return { success: true, message: `User ${user.name || user.phone} has been unblocked.` };
  }

  // 5. Owner Moderation
  async getOwners(query: { search?: string; status?: string }) {
    const owners = await this.ownerRepo.find({
      relations: ['businesses', 'venues'],
      order: { createdAt: 'DESC' },
    });
    return { success: true, total: owners.length, owners };
  }

  async verifyOwner(id: string, adminId: string) {
    const owner = await this.ownerRepo.findOne({ where: { id } });
    if (!owner) throw new NotFoundException('Owner not found.');

    owner.verificationStatus = OwnerVerificationStatus.VERIFIED;
    owner.rejectionReason = null;
    await this.ownerRepo.save(owner);
    await this.logAction('OWNER_VERIFIED', adminId, { ownerId: id });

    return { success: true, message: `Owner ${owner.name || owner.phone} verified.` };
  }

  async suspendOwner(id: string, reason: string, adminId: string) {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException('A valid suspension reason is mandatory.');
    }
    const owner = await this.ownerRepo.findOne({ where: { id } });
    if (!owner) throw new NotFoundException('Owner not found.');

    owner.isSuspended = true;
    owner.suspensionReason = reason.trim();
    owner.verificationStatus = OwnerVerificationStatus.SUSPENDED;
    await this.ownerRepo.save(owner);
    await this.logAction('OWNER_SUSPENDED', adminId, { ownerId: id, reason });

    return { success: true, message: `Owner ${owner.name || owner.phone} suspended.` };
  }

  async reactivateOwner(id: string, adminId: string) {
    const owner = await this.ownerRepo.findOne({ where: { id } });
    if (!owner) throw new NotFoundException('Owner not found.');

    owner.isSuspended = false;
    owner.suspensionReason = null;
    owner.verificationStatus = OwnerVerificationStatus.VERIFIED;
    await this.ownerRepo.save(owner);
    await this.logAction('OWNER_REACTIVATED', adminId, { ownerId: id });

    return { success: true, message: `Owner ${owner.name || owner.phone} reactivated.` };
  }

  // 6. Platform Coupons
  async getCoupons() {
    const coupons = await this.couponRepo.find({ order: { createdAt: 'DESC' } });
    return { success: true, coupons };
  }

  async createCoupon(data: any, adminId: string) {
    const existing = await this.couponRepo.findOne({ where: { code: data.code.toUpperCase().trim() } });
    if (existing) throw new BadRequestException(`Coupon code "${data.code}" already exists.`);

    const coupon = this.couponRepo.create({
      code: data.code.toUpperCase().trim(),
      discountType: data.discountType || 'percentage',
      discountValue: data.discountValue,
      minBookingAmount: data.minBookingAmount || 0,
      maxDiscountAmount: data.maxDiscountAmount || 500,
      validFrom: new Date(data.validFrom || Date.now()),
      validTill: new Date(data.validTill || Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: data.usageLimit || 100,
    });

    const saved = await this.couponRepo.save(coupon);
    await this.logAction('COUPON_CREATED', adminId, { code: saved.code });
    return { success: true, coupon: saved };
  }

  async updateCouponStatus(id: string, status: string, adminId: string) {
    const coupon = await this.couponRepo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found.');

    coupon.status = status;
    await this.couponRepo.save(coupon);
    await this.logAction('COUPON_STATUS_UPDATED', adminId, { couponId: id, status });

    return { success: true, coupon };
  }

  // 7. Support Tickets CRM
  async getSupportTickets(query?: { status?: string; priority?: string }) {
    const tickets = await this.ticketRepo.find({
      relations: ['messages'],
      order: { createdAt: 'DESC' },
    });
    return { success: true, total: tickets.length, tickets };
  }

  async replySupportTicket(ticketId: string, messageText: string, adminId: string, isInternalNote = false) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Support ticket not found.');

    const msg = this.msgRepo.create({
      ticketId,
      senderId: adminId,
      senderName: 'Arena Official Support',
      senderRole: 'ADMIN',
      messageText,
      isInternalNote,
    });
    await this.msgRepo.save(msg);

    if (!isInternalNote) {
      ticket.status = 'in_progress' as any;
      await this.ticketRepo.save(ticket);
    }

    return { success: true, message: msg };
  }

  // 8. Platform Settings & Commission Rules
  async getSettings() {
    const commission = await this.commissionRepo.findOne({ order: { createdAt: 'DESC' } });
    const cancellationRules = await this.cancelRuleRepo.find({ order: { hoursBeforeBooking: 'DESC' } });
    return {
      success: true,
      defaultCommissionPercent: commission?.defaultPercentage || 10.0,
      cancellationRules,
    };
  }

  async updateCommission(percent: number, adminId: string, reason?: string) {
    if (percent < 0 || percent > 100) throw new BadRequestException('Commission percent must be 0-100.');
    const rule = this.commissionRepo.create({
      defaultPercentage: percent,
      updatedByAdminId: adminId,
      reason: reason || 'Platform rate adjustment',
      effectiveFrom: new Date(),
    });
    await this.commissionRepo.save(rule);
    await this.logAction('COMMISSION_RATE_UPDATED', adminId, { newRate: percent, reason });

    return { success: true, message: `Platform commission updated to ${percent}%.`, rule };
  }
}

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('venues')
  async getVenues(@Query() query: { status?: string; search?: string }) {
    return this.adminService.getVenues(query);
  }

  @Post('venues/:id/approve')
  async approveVenue(@Param('id') id: string, @Body() body: { adminId?: string; note?: string }) {
    return this.adminService.approveVenue(id, body.adminId || 'ADM-9001', body.note);
  }

  @Post('venues/:id/reject')
  async rejectVenue(@Param('id') id: string, @Body() body: { reason: string; adminId?: string }) {
    return this.adminService.rejectVenue(id, body.reason, body.adminId || 'ADM-9001');
  }

  @Get('users')
  async getUsers(@Query() query: any) {
    return this.adminService.getUsers(query);
  }

  @Post('users/:id/block')
  async blockUser(@Param('id') id: string, @Body() body: { reason: string; adminId?: string }) {
    return this.adminService.blockUser(id, body.reason, body.adminId || 'ADM-9001');
  }

  @Post('users/:id/unblock')
  async unblockUser(@Param('id') id: string, @Body() body: { adminId?: string }) {
    return this.adminService.unblockUser(id, body.adminId || 'ADM-9001');
  }

  @Get('owners')
  async getOwners(@Query() query: any) {
    return this.adminService.getOwners(query);
  }

  @Post('owners/:id/verify')
  async verifyOwner(@Param('id') id: string, @Body() body: { adminId?: string }) {
    return this.adminService.verifyOwner(id, body.adminId || 'ADM-9001');
  }

  @Post('owners/:id/suspend')
  async suspendOwner(@Param('id') id: string, @Body() body: { reason: string; adminId?: string }) {
    return this.adminService.suspendOwner(id, body.reason, body.adminId || 'ADM-9001');
  }

  @Post('owners/:id/reactivate')
  async reactivateOwner(@Param('id') id: string, @Body() body: { adminId?: string }) {
    return this.adminService.reactivateOwner(id, body.adminId || 'ADM-9001');
  }

  @Get('coupons')
  async getCoupons() {
    return this.adminService.getCoupons();
  }

  @Post('coupons')
  async createCoupon(@Body() body: any) {
    return this.adminService.createCoupon(body, body.adminId || 'ADM-9001');
  }

  @Patch('coupons/:id/status')
  async updateCouponStatus(@Param('id') id: string, @Body() body: { status: string; adminId?: string }) {
    return this.adminService.updateCouponStatus(id, body.status, body.adminId || 'ADM-9001');
  }

  @Get('support/tickets')
  async getSupportTickets(@Query() query: any) {
    return this.adminService.getSupportTickets(query);
  }

  @Post('support/tickets/:id/reply')
  async replySupportTicket(@Param('id') id: string, @Body() body: { message: string; adminId?: string; isInternalNote?: boolean }) {
    return this.adminService.replySupportTicket(id, body.message, body.adminId || 'ADM-9001', body.isInternalNote);
  }

  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings/commission')
  async updateCommission(@Body() body: { percent: number; adminId?: string; reason?: string }) {
    return this.adminService.updateCommission(body.percent, body.adminId || 'ADM-9001', body.reason);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUser,
      Venue,
      User,
      Owner,
      Business,
      Booking,
      Payment,
      Refund,
      Payout,
      Coupon,
      CouponUsage,
      SupportTicket,
      SupportMessage,
      Banner,
      Announcement,
      CommissionRule,
      CancellationRule,
      AuditLog,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
