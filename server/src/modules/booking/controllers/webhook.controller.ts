import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { BookingService } from '../services/booking.service';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private bookingService: BookingService) {}

  @Post('razorpay')
  @HttpCode(HttpStatus.OK)
  async handleRazorpayWebhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    this.logger.log(`Received Razorpay webhook event: ${payload?.event}`);

    if (payload?.event === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      this.logger.log(`Payment captured successfully for order: ${orderId}, paymentId: ${paymentId}`);
    }

    return { status: 'ok', received: true };
  }
}
