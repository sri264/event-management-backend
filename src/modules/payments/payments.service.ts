import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';
import { paginate } from '@/common/dto/pagination-query.dto';
import {
  ACTIVE_BOOKING_STATUSES,
  PaymentMethod,
  TransactionStatus,
} from '@/common/enums';
import { BookingLedgerService } from '../bookings/booking-ledger.service';
import { Booking } from '../bookings/booking.entity';
import {
  PayBookingDto,
  PaymentQueryDto,
  RecordPaymentDto,
} from './dto/payment.dto';
import { Payment } from './payment.entity';

const round2 = (value: number) => Math.round(value * 100) / 100;

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly ledger: BookingLedgerService,
  ) {}

  /** Simulated online payment of the full outstanding balance. */
  async payAsCustomer(customerId: number, dto: PayBookingDto) {
    return this.dataSource.transaction(async manager => {
      const booking = await this.lockBooking(manager, dto.bookingId);
      if (booking.customerId !== customerId) {
        throw new NotFoundException('Booking not found');
      }
      const balance = await this.balanceFor(booking, manager);
      return this.addPayment(manager, booking, balance, dto.method, null);
    });
  }

  async recordByAdmin(dto: RecordPaymentDto) {
    return this.dataSource.transaction(async manager => {
      const booking = await this.lockBooking(manager, dto.bookingId);
      const balance = await this.balanceFor(booking, manager);
      if (dto.amount > balance) {
        throw new BadRequestException(
          `Amount exceeds the balance due of ₹${balance.toLocaleString('en-IN')}`,
        );
      }
      return this.addPayment(
        manager,
        booking,
        dto.amount,
        dto.method,
        dto.note?.trim() || null,
      );
    });
  }

  async refund(paymentId: number, note?: string) {
    return this.dataSource.transaction(async manager => {
      const repo = manager.getRepository(Payment);
      const payment = await repo.findOne({ where: { id: paymentId } });
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.status === TransactionStatus.REFUNDED) {
        throw new BadRequestException('This payment is already refunded');
      }
      payment.status = TransactionStatus.REFUNDED;
      payment.refundedAt = new Date();
      payment.note = note?.trim() || payment.note || 'Refunded by admin';
      await repo.save(payment);

      const booking = await manager
        .getRepository(Booking)
        .findOneOrFail({ where: { id: payment.bookingId } });
      await this.ledger.sync(booking, manager);
      return payment;
    });
  }

  async findMine(customerId: number, query: PaymentQueryDto) {
    const { page, limit } = query;
    const [items, total] = await this.listQuery()
      .where('booking.customerId = :customerId', { customerId })
      .orderBy('payment.paidAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return paginate(items, total, page, limit);
  }

  async findAll(query: PaymentQueryDto) {
    const { page, limit } = query;
    const qb = this.listQuery()
      .leftJoin('booking.customer', 'customer')
      .addSelect(['customer.id', 'customer.name', 'customer.email']);
    if (query.status) {
      qb.andWhere('payment.status = :status', { status: query.status });
    }
    if (query.method) {
      qb.andWhere('payment.method = :method', { method: query.method });
    }
    if (query.from) {
      qb.andWhere('DATE(payment.paidAt) >= :from', { from: query.from });
    }
    if (query.to) qb.andWhere('DATE(payment.paidAt) <= :to', { to: query.to });
    if (query.search) {
      qb.andWhere(
        new Brackets(w =>
          w
            .where('payment.transactionRef LIKE :s')
            .orWhere('booking.bookingCode LIKE :s')
            .orWhere('customer.name LIKE :s')
            .orWhere('venue.name LIKE :s'),
        ),
        { s: `%${query.search.trim()}%` },
      );
    }
    const [items, total] = await qb
      .orderBy('payment.paidAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totals = await this.paymentsRepo
      .createQueryBuilder('payment')
      .select('payment.status', 'status')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
      .addSelect('COUNT(*)', 'count')
      .groupBy('payment.status')
      .getRawMany<{
        status: TransactionStatus;
        amount: string;
        count: string;
      }>();
    const byStatus = Object.fromEntries(totals.map(t => [t.status, t]));

    return {
      ...paginate(items, total, page, limit),
      summary: {
        collected: Number(byStatus.SUCCESS?.amount ?? 0),
        refunded: Number(byStatus.REFUNDED?.amount ?? 0),
        successCount: Number(byStatus.SUCCESS?.count ?? 0),
        refundCount: Number(byStatus.REFUNDED?.count ?? 0),
      },
    };
  }

  private listQuery() {
    return this.paymentsRepo
      .createQueryBuilder('payment')
      .innerJoin('payment.booking', 'booking')
      .addSelect([
        'booking.id',
        'booking.bookingCode',
        'booking.startDate',
        'booking.endDate',
        'booking.totalAmount',
      ])
      .innerJoin('booking.venue', 'venue')
      .addSelect(['venue.id', 'venue.name', 'venue.type']);
  }

  private async lockBooking(manager: EntityManager, id: number) {
    const booking = await manager
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .setLock('pessimistic_write')
      .where('booking.id = :id', { id })
      .getOne();
    if (!booking) throw new NotFoundException('Booking not found');
    if (!ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
      throw new BadRequestException(
        'Payments can only be made for pending or confirmed bookings',
      );
    }
    return booking;
  }

  private async balanceFor(booking: Booking, manager: EntityManager) {
    const paid = await this.ledger.amountPaid(booking.id, manager);
    const balance = round2(booking.totalAmount - paid);
    if (balance <= 0) {
      throw new BadRequestException('This booking is already fully paid');
    }
    return balance;
  }

  private async addPayment(
    manager: EntityManager,
    booking: Booking,
    amount: number,
    method: PaymentMethod,
    note: string | null,
  ) {
    const repo = manager.getRepository(Payment);
    const payment = await repo.save(
      repo.create({
        bookingId: booking.id,
        amount: round2(amount),
        method,
        note,
        status: TransactionStatus.SUCCESS,
        transactionRef: `TXN${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString('hex').toUpperCase()}`,
        paidAt: new Date(),
      }),
    );
    const updated = await this.ledger.sync(booking, manager);
    return {
      payment,
      booking: {
        id: updated.id,
        status: updated.status,
        paymentStatus: updated.paymentStatus,
      },
    };
  }
}
