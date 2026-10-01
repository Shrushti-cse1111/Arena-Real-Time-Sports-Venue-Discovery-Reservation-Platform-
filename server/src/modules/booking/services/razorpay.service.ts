import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private razorpayInstance: Razorpay;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_key_arena';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_arena';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_arena';

    this.razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: this.keySecret,
    });
  }

  /**
   * Create Razorpay Order with currency & server-verified amount
   */
  async createOrder(bookingId: string, amountInRupees: number): Promise<{ orderId: string; amount: number; currency: string }> {
    const amountInPaise = Math.round(amountInRupees * 100);

    try {
      const order = await this.razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${bookingId.slice(0, 18)}`,
        notes: { bookingId },
      });

      return {
        orderId: order.id,
        amount: amountInPaise,
        currency: order.currency,
      };
    } catch (error) {
      this.logger.error('Error creating Razorpay order', error);
      throw error;
    }
  }

  /**
   * Server-side HMAC SHA256 Signature Verification
   * NEVER trust frontend alone!
   */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const generatedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(signature),
    );
  }

  /**
   * Verify Razorpay Webhook Signature
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signatureHeader;
  }

  /**
   * Initiate Refund for cancellation
   */
  async processRefund(paymentId: string, amountInRupees: number): Promise<{ refundId: string; status: string }> {
    if (amountInRupees <= 0) {
      return { refundId: 'no_refund_zero_amount', status: 'processed' };
    }

    try {
      const refund = await this.razorpayInstance.payments.refund(paymentId, {
        amount: Math.round(amountInRupees * 100),
        notes: { reason: 'Customer requested cancellation within eligible window' },
      });

      return {
        refundId: refund.id,
        status: refund.status,
      };
    } catch (error) {
      this.logger.error(`Error refunding payment ${paymentId}`, error);
      throw error;
    }
  }
}
