import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookingService } from '../services/booking.service';

@Controller('bookings')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @Get('availability')
  async getAvailability(
    @Query('venueId') venueId: string,
    @Query('date') date: string,
    @Query('courtId') courtId?: string,
  ) {
    return this.bookingService.getAvailability(venueId, date, courtId);
  }

  @Post('hold')
  @HttpCode(HttpStatus.OK)
  async holdSlot(@Body() body: any) {
    return this.bookingService.createSlotHold(body);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirmBooking(@Body() body: any) {
    return this.bookingService.confirmBooking(body);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelBooking(@Param('id') id: string, @Body() body: { userId: string; reason?: string }) {
    return this.bookingService.cancelBooking(id, body.userId, body.reason);
  }

  @Get('user/:userId')
  async getUserBookings(@Param('userId') userId: string) {
    return this.bookingService.getUserBookings(userId);
  }

  @Get('owner/:ownerId')
  async getOwnerBookings(
    @Param('ownerId') ownerId: string,
    @Query() query: { venueId?: string; date?: string; status?: string },
  ) {
    return this.bookingService.getOwnerBookings(ownerId, query);
  }

  @Post('concurrent-test')
  @HttpCode(HttpStatus.OK)
  async runConcurrentTest(@Body() body: { slotId: string; count?: number }) {
    return this.bookingService.runConcurrentTest(body.slotId, body.count || 10);
  }
}
