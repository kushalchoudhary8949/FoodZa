import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPaymentByOrder(orderId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: { order: { select: { orderNumber: true, totalAmount: true } } },
    });
    if (!payment) throw new NotFoundException('Payment record not found');
    return payment;
  }

  /**
   * Razorpay online order creation stub
   */
  async createRazorpayOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    // Stub for Razorpay API integration
    const mockRazorpayOrderId = `order_${Math.random().toString(36).substring(2, 12)}`;

    await this.prisma.payment.update({
      where: { orderId },
      data: { transactionId: mockRazorpayOrderId },
    });

    return {
      razorpayOrderId: mockRazorpayOrderId,
      amount: Number(order.totalAmount) * 100, // paise
      currency: 'INR',
    };
  }

  /**
   * Razorpay webhook / verification stub
   */
  async verifyRazorpayPayment(orderId: string, transactionId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new NotFoundException('Payment record not found');

    return this.prisma.payment.update({
      where: { orderId },
      data: {
        status: PaymentStatus.PAID,
        transactionId,
        paidAt: new Date(),
      },
    });
  }
}
