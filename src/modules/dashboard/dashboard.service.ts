import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  ACTIVE_BOOKING_STATUSES,
  BookingStatus,
  TicketStatus,
  TransactionStatus,
  UserRole,
} from '@/common/enums';
import { addDays, todayISO } from '@/common/utils/date.util';
import { Booking } from '../bookings/booking.entity';
import { Payment } from '../payments/payment.entity';
import { SupportTicket } from '../support/support-ticket.entity';
import { User } from '../users/user.entity';
import { Venue } from '../venues/venue.entity';

const BOOKING_FIELDS = [
  'venue.id',
  'venue.name',
  'venue.type',
  'customer.id',
  'customer.name',
  'customer.email',
];

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Venue) private readonly venuesRepo: Repository<Venue>,
    @InjectRepository(SupportTicket)
    private readonly ticketsRepo: Repository<SupportTicket>,
  ) {}

  async overview() {
    const today = todayISO();
    const monthStart = `${today.slice(0, 7)}-01`;

    const [
      totalBookings,
      customers,
      activeVenues,
      pendingBookings,
      openTickets,
      revenue,
      revenueThisMonth,
      bookingsThisMonth,
    ] = await Promise.all([
      this.bookingsRepo.count(),
      this.usersRepo.count({ where: { role: UserRole.CUSTOMER } }),
      this.venuesRepo.count({ where: { isActive: true } }),
      this.bookingsRepo.count({ where: { status: BookingStatus.PENDING } }),
      this.ticketsRepo.count({
        where: { status: In([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]) },
      }),
      this.sumPayments(),
      this.sumPayments(monthStart),
      this.bookingsRepo
        .createQueryBuilder('booking')
        .where('booking.createdAt >= :monthStart', { monthStart })
        .getCount(),
    ]);

    const statusRows = await this.bookingsRepo
      .createQueryBuilder('booking')
      .select('booking.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('booking.status')
      .getRawMany<{ status: BookingStatus; count: string }>();

    const typeRows = await this.bookingsRepo
      .createQueryBuilder('booking')
      .innerJoin('booking.venue', 'venue')
      .select('venue.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('venue.type')
      .getRawMany<{ type: string; count: string }>();

    const recentBookings = await this.bookingsRepo
      .createQueryBuilder('booking')
      .leftJoin('booking.venue', 'venue')
      .leftJoin('booking.customer', 'customer')
      .addSelect(BOOKING_FIELDS)
      .orderBy('booking.createdAt', 'DESC')
      .take(6)
      .getMany();

    const todaysEvents = await this.bookingsRepo
      .createQueryBuilder('booking')
      .leftJoin('booking.venue', 'venue')
      .leftJoin('booking.customer', 'customer')
      .addSelect(BOOKING_FIELDS)
      .where('booking.status IN (:...statuses)', {
        statuses: ACTIVE_BOOKING_STATUSES,
      })
      .andWhere('booking.startDate <= :today AND booking.endDate >= :today', {
        today,
      })
      .orderBy('booking.startDate', 'ASC')
      .getMany();

    return {
      stats: {
        totalBookings,
        revenue,
        customers,
        activeVenues,
        pendingBookings,
        openTickets,
        revenueThisMonth,
        bookingsThisMonth,
      },
      statusBreakdown: Object.fromEntries(
        Object.values(BookingStatus).map(status => [
          status,
          Number(statusRows.find(r => r.status === status)?.count ?? 0),
        ]),
      ),
      typeBreakdown: Object.fromEntries(
        typeRows.map(r => [r.type, Number(r.count)]),
      ),
      revenueByMonth: await this.revenueByMonth(6),
      recentBookings,
      todaysEvents,
    };
  }

  async calendar(month: string, venueId?: number) {
    const start = `${month}-01`;
    const [y, m] = month.split('-').map(Number);
    const end = addDays(
      `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01`,
      -1,
    );
    const qb = this.bookingsRepo
      .createQueryBuilder('booking')
      .leftJoin('booking.venue', 'venue')
      .leftJoin('booking.customer', 'customer')
      .addSelect(BOOKING_FIELDS)
      .where('booking.startDate <= :end AND booking.endDate >= :start', {
        start,
        end,
      })
      .andWhere('booking.status != :cancelled', {
        cancelled: BookingStatus.CANCELLED,
      });
    if (venueId) qb.andWhere('booking.venueId = :venueId', { venueId });
    const bookings = await qb.orderBy('booking.startDate', 'ASC').getMany();
    return { month, start, end, bookings };
  }

  private async sumPayments(from?: string) {
    const qb = this.paymentsRepo
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .where('payment.status = :status', { status: TransactionStatus.SUCCESS });
    if (from) qb.andWhere('payment.paidAt >= :from', { from });
    const row = await qb.getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  private async revenueByMonth(months: number) {
    const now = new Date();
    const keys = Array.from({ length: months }, (_, i) => {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - (months - 1 - i),
        1,
      );
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const rows = await this.paymentsRepo
      .createQueryBuilder('payment')
      .select("DATE_FORMAT(payment.paidAt, '%Y-%m')", 'month')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'total')
      .where('payment.status = :status', { status: TransactionStatus.SUCCESS })
      .andWhere('payment.paidAt >= :from', { from: `${keys[0]}-01` })
      .groupBy('month')
      .getRawMany<{ month: string; total: string }>();
    return keys.map(month => ({
      month,
      total: Number(rows.find(r => r.month === month)?.total ?? 0),
    }));
  }
}
