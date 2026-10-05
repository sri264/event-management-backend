import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import {
  BookingStatus,
  PaymentStatus,
  TransactionStatus,
} from '@/common/enums';
import { Payment } from '../payments/payment.entity';
import { Booking } from './booking.entity';

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Keeps a booking's payment status consistent with its payment records. */
@Injectable()
export class BookingLedgerService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async amountPaid(bookingId: number, manager?: EntityManager) {
    const repo = (manager ?? this.dataSource.manager).getRepository(Payment);
    const row = await repo
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'paid')
      .where('payment.bookingId = :bookingId', { bookingId })
      .andWhere('payment.status = :status', {
        status: TransactionStatus.SUCCESS,
      })
      .getRawOne<{ paid: string }>();
    return round2(Number(row?.paid ?? 0));
  }

  async refundAll(bookingId: number, manager: EntityManager, note: string) {
    await manager
      .getRepository(Payment)
      .update(
        { bookingId, status: TransactionStatus.SUCCESS },
        { status: TransactionStatus.REFUNDED, refundedAt: new Date(), note },
      );
  }

  /** Recomputes payment status, confirming pending bookings once fully paid. */
  async sync(booking: Booking, manager: EntityManager): Promise<Booking> {
    const paid = await this.amountPaid(booking.id, manager);
    const refunded = await manager.getRepository(Payment).exists({
      where: { bookingId: booking.id, status: TransactionStatus.REFUNDED },
    });

    if (paid >= booking.totalAmount && paid > 0) {
      booking.paymentStatus = PaymentStatus.PAID;
      if (booking.status === BookingStatus.PENDING) {
        booking.status = BookingStatus.CONFIRMED;
      }
    } else if (paid === 0 && refunded) {
      booking.paymentStatus = PaymentStatus.REFUNDED;
    } else {
      booking.paymentStatus = PaymentStatus.UNPAID;
    }
    return manager.getRepository(Booking).save(booking);
  }
}
