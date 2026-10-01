import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
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
} from '../../database/entities';
import { BookingService } from './services/booking.service';
import { RedisLockService } from './services/redis-lock.service';
import { PricingService, RazorpayService } from './services/pricing.service';
import { BookingEventsGateway } from './gateways/booking-events.gateway';
import { BookingController } from './controllers/booking.controller';
import { WebhookController } from './controllers/webhook.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Slot,
      Booking,
      BookingHold,
      Payment,
      Refund,
      Venue,
      Court,
      User,
      Owner,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [BookingController, WebhookController],
  providers: [
    BookingService,
    RedisLockService,
    PricingService,
    RazorpayService,
    BookingEventsGateway,
  ],
  exports: [BookingService, RedisLockService, BookingEventsGateway],
})
export class BookingModule {}
