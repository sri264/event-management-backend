import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import {
  Brackets,
  DataSource,
  EntityManager,
  LessThan,
  Repository,
} from 'typeorm';
import { paginate } from '@/common/dto/pagination-query.dto';
import {
  ACTIVE_BOOKING_STATUSES,
  BookingStatus,
  PaymentStatus,
  UserRole,
} from '@/common/enums';
import { diffDays, todayISO } from '@/common/utils/date.util';
import { Review } from '../reviews/review.entity';
import { SettingsService } from '../settings/settings.service';
import { User } from '../users/user.entity';
import { Venue } from '../venues/venue.entity';
import { VenuesService } from '../venues/venues.service';
import { BookingLedgerService } from './booking-ledger.service';
import { Booking } from './booking.entity';
import {
  AdminBookingQueryDto,
  AdminCreateBookingDto,
  AdminUpdateBookingDto,
  CreateBookingDto,
  MyBookingsQueryDto,
  UpdateBookingStatusDto,
  UpdateMyBookingDto,
} from './dto/booking.dto';

const VENUE_FIELDS = [
  'venue.id',
  'venue.name',
  'venue.slug',
  'venue.type',
  'venue.location',
  'venue.address',
  'venue.images',
  'venue.priceUnit',
  'venue.capacity',
];
const CUSTOMER_FIELDS = [
  'customer.id',
  'customer.name',
  'customer.email',
  'customer.phone',
];

const isOpen = (booking: Booking) =>
  ACTIVE_BOOKING_STATUSES.includes(booking.status);

@Injectable()
export class BookingsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    @InjectRepository(Review) private readonly reviewsRepo: Repository<Review>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly venuesService: VenuesService,
    private readonly ledger: BookingLedgerService,
    private readonly settingsService: SettingsService,
  ) {}

  // ───────────── Customer ─────────────

  createForCustomer(customerId: number, dto: CreateBookingDto) {
    return this.createBooking(customerId, dto, BookingStatus.PENDING);
  }

  async findMine(customerId: number, query: MyBookingsQueryDto) {
    const { page, limit } = query;
    const qb = this.baseQuery().where('booking.customerId = :customerId', {
      customerId,
    });
    this.applyTab(qb, query.tab);
    if (query.search) {
      qb.andWhere(
        new Brackets(w =>
          w.where('venue.name LIKE :s').orWhere('booking.bookingCode LIKE :s'),
        ),
        { s: `%${query.search.trim()}%` },
      );
    }
    const [items, total] = await qb
      .orderBy('booking.startDate', query.tab === 'upcoming' ? 'ASC' : 'DESC')
      .addOrderBy('booking.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return paginate(items, total, page, limit);
  }

  async findMineById(customerId: number, id: number) {
    const booking = await this.loadFull(id);
    if (booking.customerId !== customerId) {
      throw new NotFoundException('Booking not found');
    }
    return this.toDetail(booking);
  }

  async updateMine(customerId: number, id: number, dto: UpdateMyBookingDto) {
    const booking = await this.bookingsRepo.findOne({
      where: { id, customerId },
      relations: { venue: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!isOpen(booking) || booking.startDate < todayISO()) {
      throw new BadRequestException('This booking can no longer be edited');
    }
    this.assertCapacity(booking.venue, dto.guests);
    Object.assign(booking, this.cleanDetails(dto));
    await this.bookingsRepo.save(booking);
    return this.findMineById(customerId, id);
  }

  async cancelMine(customerId: number, id: number, reason?: string) {
    const booking = await this.bookingsRepo.findOne({
      where: { id, customerId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!isOpen(booking)) {
      throw new BadRequestException('Only upcoming bookings can be cancelled');
    }
    if (booking.startDate <= todayISO()) {
      throw new BadRequestException(
        'Bookings cannot be cancelled on or after the event date',
      );
    }
    const { freeCancellationDays } = await this.settingsService.getAll();
    const refundable =
      diffDays(todayISO(), booking.startDate) >= freeCancellationDays;

    await this.dataSource.transaction(async manager => {
      await this.cancel(
        booking,
        manager,
        reason?.trim() || 'Cancelled by customer',
        refundable,
      );
    });
    return this.findMineById(customerId, id);
  }

  async summary(customerId: number) {
    const today = todayISO();
    const rows = await this.bookingsRepo
      .createQueryBuilder('booking')
      .select('booking.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('booking.customerId = :customerId', { customerId })
      .groupBy('booking.status')
      .getRawMany<{ status: BookingStatus; count: string }>();
    const counts = Object.fromEntries(
      rows.map(r => [r.status, Number(r.count)]),
    ) as Partial<Record<BookingStatus, number>>;

    const upcoming = await this.bookingsRepo
      .createQueryBuilder('booking')
      .where('booking.customerId = :customerId', { customerId })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ACTIVE_BOOKING_STATUSES,
      })
      .andWhere('booking.endDate >= :today', { today })
      .getCount();

    const spent = await this.bookingsRepo.manager
      .createQueryBuilder()
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .from('payments', 'payment')
      .innerJoin('bookings', 'booking', 'booking.id = payment.booking_id')
      .where('booking.customer_id = :customerId', { customerId })
      .andWhere("payment.status = 'SUCCESS'")
      .getRawOne<{ total: string }>();

    const nextBooking = await this.baseQuery()
      .where('booking.customerId = :customerId', { customerId })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ACTIVE_BOOKING_STATUSES,
      })
      .andWhere('booking.endDate >= :today', { today })
      .orderBy('booking.startDate', 'ASC')
      .getOne();

    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    return {
      total,
      upcoming,
      completed: counts.COMPLETED ?? 0,
      cancelled: counts.CANCELLED ?? 0,
      totalSpent: Number(spent?.total ?? 0),
      nextBooking: nextBooking ?? null,
    };
  }

  // ───────────── Admin ─────────────

  async findAll(query: AdminBookingQueryDto) {
    const { page, limit } = query;
    const qb = this.baseQuery().addSelect(CUSTOMER_FIELDS);
    if (query.status) {
      qb.andWhere('booking.status = :status', { status: query.status });
    }
    if (query.venueType) {
      qb.andWhere('venue.type = :venueType', { venueType: query.venueType });
    }
    if (query.venueId) {
      qb.andWhere('booking.venueId = :venueId', { venueId: query.venueId });
    }
    if (query.customerId) {
      qb.andWhere('booking.customerId = :customerId', {
        customerId: query.customerId,
      });
    }
    if (query.from) {
      qb.andWhere('booking.endDate >= :from', { from: query.from });
    }
    if (query.to) qb.andWhere('booking.startDate <= :to', { to: query.to });
    if (query.search) {
      qb.andWhere(
        new Brackets(w =>
          w
            .where('booking.bookingCode LIKE :s')
            .orWhere('customer.name LIKE :s')
            .orWhere('customer.email LIKE :s')
            .orWhere('customer.phone LIKE :s')
            .orWhere('venue.name LIKE :s'),
        ),
        { s: `%${query.search.trim()}%` },
      );
    }
    const [items, total] = await qb
      .orderBy('booking.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return paginate(items, total, page, limit);
  }

  async findById(id: number) {
    return this.toDetail(await this.loadFull(id));
  }

  async createByAdmin(dto: AdminCreateBookingDto) {
    const customer = await this.usersRepo.findOne({
      where: { id: dto.customerId },
    });
    if (!customer || customer.role !== UserRole.CUSTOMER) {
      throw new NotFoundException('Customer not found');
    }
    if (!customer.isActive) {
      throw new BadRequestException('This customer account is deactivated');
    }
    const { customerId, status, ...details } = dto;
    const booking = await this.createBooking(
      customerId,
      details,
      status ?? BookingStatus.PENDING,
    );
    return this.findById(booking.id);
  }

  async updateByAdmin(id: number, dto: AdminUpdateBookingDto) {
    await this.dataSource.transaction(async manager => {
      const repo = manager.getRepository(Booking);
      const booking = await repo.findOne({
        where: { id },
        relations: { venue: true },
      });
      if (!booking) throw new NotFoundException('Booking not found');
      if (!isOpen(booking)) {
        throw new BadRequestException(
          'Only pending or confirmed bookings can be edited',
        );
      }
      this.assertCapacity(booking.venue, dto.guests);

      const startDate = dto.startDate ?? booking.startDate;
      const endDate = dto.endDate ?? booking.endDate;
      if (startDate !== booking.startDate || endDate !== booking.endDate) {
        const quote = await this.venuesService.quote(
          booking.venue,
          startDate,
          endDate,
          { excludeBookingId: id, manager },
        );
        if (!quote.available) {
          throw new ConflictException(
            'The venue is already booked for the selected dates',
          );
        }
        Object.assign(booking, {
          startDate,
          endDate,
          units: quote.units,
          unitPrice: quote.unitPrice,
          baseAmount: quote.baseAmount,
          gstPercent: quote.gstPercent,
          gstAmount: quote.gstAmount,
          totalAmount: quote.totalAmount,
        });
      }

      Object.assign(booking, this.cleanDetails(dto));
      await this.ledger.sync(booking, manager);
    });
    return this.findById(id);
  }

  async setStatus(id: number, dto: UpdateBookingStatusDto) {
    await this.dataSource.transaction(async manager => {
      const booking = await manager
        .getRepository(Booking)
        .findOne({ where: { id } });
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.status === dto.status) return;

      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException(
          'Cancelled bookings cannot be reopened. Create a new booking instead.',
        );
      }

      switch (dto.status) {
        case BookingStatus.CANCELLED:
          await this.cancel(
            booking,
            manager,
            dto.reason?.trim() || 'Cancelled by admin',
            true,
          );
          return;
        case BookingStatus.COMPLETED:
          if (booking.status !== BookingStatus.CONFIRMED) {
            throw new BadRequestException(
              'Only confirmed bookings can be marked as completed',
            );
          }
          if (booking.startDate > todayISO()) {
            throw new BadRequestException(
              'A booking can only be completed on or after its event date',
            );
          }
          break;
        case BookingStatus.PENDING:
          if (booking.paymentStatus === PaymentStatus.PAID) {
            throw new BadRequestException(
              'Fully paid bookings cannot be moved back to pending',
            );
          }
          break;
      }
      booking.status = dto.status;
      await manager.getRepository(Booking).save(booking);
    });
    return this.findById(id);
  }

  // ───────────── Scheduled housekeeping ─────────────

  async onApplicationBootstrap() {
    await this.runHousekeeping().catch(error =>
      this.logger.warn(`Booking housekeeping skipped: ${error.message}`),
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async runHousekeeping() {
    const today = todayISO();
    const completed = await this.bookingsRepo.update(
      { status: BookingStatus.CONFIRMED, endDate: LessThan(today) },
      { status: BookingStatus.COMPLETED },
    );
    const expired = await this.bookingsRepo.update(
      {
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        startDate: LessThan(today),
      },
      {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Expired - payment was not received in time',
      },
    );
    if (completed.affected || expired.affected) {
      this.logger.log(
        `Housekeeping: ${completed.affected ?? 0} completed, ${expired.affected ?? 0} expired`,
      );
    }
  }

  // ───────────── Internals ─────────────

  private async createBooking(
    customerId: number,
    dto: CreateBookingDto,
    status: BookingStatus,
  ): Promise<Booking> {
    const saved = await this.dataSource.transaction(async manager => {
      const venue = await manager
        .getRepository(Venue)
        .findOne({ where: { id: dto.venueId } });
      if (!venue || !venue.isActive) {
        throw new NotFoundException('Venue not found or not available');
      }
      this.assertCapacity(venue, dto.guests);

      const quote = await this.venuesService.quote(
        venue,
        dto.startDate,
        dto.endDate,
        { manager },
      );
      if (!quote.available) {
        throw new ConflictException(
          'Sorry, this venue is already booked for the selected dates',
        );
      }

      const repo = manager.getRepository(Booking);
      return repo.save(
        repo.create({
          ...this.cleanDetails(dto),
          bookingCode: await this.generateCode(manager),
          customerId,
          venueId: venue.id,
          startDate: dto.startDate,
          endDate: dto.endDate,
          units: quote.units,
          unitPrice: quote.unitPrice,
          baseAmount: quote.baseAmount,
          gstPercent: quote.gstPercent,
          gstAmount: quote.gstAmount,
          totalAmount: quote.totalAmount,
          status,
          paymentStatus: PaymentStatus.UNPAID,
        }),
      );
    });
    return this.loadFull(saved.id);
  }

  private async cancel(
    booking: Booking,
    manager: EntityManager,
    reason: string,
    refund: boolean,
  ) {
    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    if (refund) {
      await this.ledger.refundAll(booking.id, manager, `Refund: ${reason}`);
      await this.ledger.sync(booking, manager);
    } else {
      await manager.getRepository(Booking).save(booking);
    }
  }

  private baseQuery() {
    return this.bookingsRepo
      .createQueryBuilder('booking')
      .leftJoin('booking.venue', 'venue')
      .addSelect(VENUE_FIELDS)
      .leftJoin('booking.customer', 'customer');
  }

  private applyTab(
    qb: ReturnType<BookingsService['baseQuery']>,
    tab?: MyBookingsQueryDto['tab'],
  ) {
    if (tab === 'upcoming') {
      qb.andWhere('booking.status IN (:...open)', {
        open: ACTIVE_BOOKING_STATUSES,
      }).andWhere('booking.endDate >= :today', { today: todayISO() });
    } else if (tab === 'completed') {
      qb.andWhere('booking.status = :completed', {
        completed: BookingStatus.COMPLETED,
      });
    } else if (tab === 'cancelled') {
      qb.andWhere('booking.status = :cancelled', {
        cancelled: BookingStatus.CANCELLED,
      });
    }
  }

  private async loadFull(id: number): Promise<Booking> {
    const booking = await this.baseQuery()
      .addSelect(CUSTOMER_FIELDS)
      .leftJoinAndSelect('booking.payments', 'payment')
      .where('booking.id = :id', { id })
      .orderBy('payment.paidAt', 'DESC')
      .getOne();
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  private async toDetail(booking: Booking) {
    const amountPaid = await this.ledger.amountPaid(booking.id);
    const review = await this.reviewsRepo.findOne({
      where: { bookingId: booking.id },
    });
    const today = todayISO();
    const open = isOpen(booking);
    return {
      ...booking,
      amountPaid,
      balanceDue: open
        ? Math.max(
            0,
            Math.round((booking.totalAmount - amountPaid) * 100) / 100,
          )
        : 0,
      canEdit: open && booking.startDate >= today,
      canCancel: open && booking.startDate > today,
      canPay: open && amountPaid < booking.totalAmount,
      canReview: booking.status === BookingStatus.COMPLETED && !review,
      review,
    };
  }

  private assertCapacity(venue: Venue, guests?: number) {
    if (guests !== undefined && guests > venue.capacity) {
      throw new BadRequestException(
        `${venue.name} can accommodate at most ${venue.capacity} guests`,
      );
    }
  }

  private cleanDetails<T extends Partial<CreateBookingDto>>(dto: T) {
    const clean: Partial<Booking> = {};
    if (dto.guests !== undefined) clean.guests = dto.guests;
    if (dto.eventType !== undefined) clean.eventType = dto.eventType.trim();
    if (dto.contactName !== undefined) {
      clean.contactName = dto.contactName.trim();
    }
    if (dto.contactPhone !== undefined) {
      clean.contactPhone = dto.contactPhone.trim();
    }
    if (dto.notes !== undefined) clean.notes = dto.notes.trim() || null;
    return clean;
  }

  private async generateCode(manager: EntityManager): Promise<string> {
    const repo = manager.getRepository(Booking);
    for (;;) {
      const code = `EN${randomBytes(4).toString('hex').toUpperCase().slice(0, 7)}`;
      if (!(await repo.exists({ where: { bookingCode: code } }))) return code;
    }
  }
}
