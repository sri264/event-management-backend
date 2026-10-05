import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, In, Not, Repository } from 'typeorm';
import { paginate } from '@/common/dto/pagination-query.dto';
import { ACTIVE_BOOKING_STATUSES, PriceUnit, VenueType } from '@/common/enums';
import {
  addDays,
  diffDays,
  eachDate,
  todayISO,
} from '@/common/utils/date.util';
import { slugify } from '@/common/utils/slug.util';
import { Booking } from '../bookings/booking.entity';
import { SettingsService } from '../settings/settings.service';
import {
  AdminVenueQueryDto,
  CreateVenueDto,
  UpdateVenueDto,
  VenueQueryDto,
} from './dto/venue.dto';
import { Venue } from './venue.entity';

const MAX_UNITS = 30;

export interface Quote {
  available: boolean;
  startDate: string;
  endDate: string;
  units: number;
  priceUnit: PriceUnit;
  unitPrice: number;
  baseAmount: number;
  gstPercent: number;
  gstAmount: number;
  totalAmount: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

@Injectable()
export class VenuesService {
  constructor(
    @InjectRepository(Venue) private readonly venuesRepo: Repository<Venue>,
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    private readonly settingsService: SettingsService,
  ) {}

  async findPublic(query: VenueQueryDto) {
    const { page, limit } = query;
    const qb = this.venuesRepo
      .createQueryBuilder('venue')
      .where('venue.isActive = :active', { active: true });

    if (query.type) qb.andWhere('venue.type = :type', { type: query.type });
    if (query.location) {
      qb.andWhere('venue.location = :location', { location: query.location });
    }
    if (query.guests) {
      qb.andWhere('venue.capacity >= :guests', { guests: query.guests });
    }
    if (query.maxPrice) {
      qb.andWhere('venue.price <= :maxPrice', { maxPrice: query.maxPrice });
    }
    if (query.featured) qb.andWhere('venue.isFeatured = :f', { f: true });
    if (query.search) {
      qb.andWhere(
        new Brackets(where =>
          where
            .where('venue.name LIKE :search')
            .orWhere('venue.location LIKE :search')
            .orWhere('venue.address LIKE :search'),
        ),
        { search: `%${query.search.trim()}%` },
      );
    }

    switch (query.sort) {
      case 'price_asc':
        qb.orderBy('venue.price', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('venue.price', 'DESC');
        break;
      case 'rating':
        qb.orderBy('venue.rating', 'DESC');
        break;
      case 'newest':
        qb.orderBy('venue.createdAt', 'DESC');
        break;
      default:
        qb.orderBy('venue.isFeatured', 'DESC')
          .addOrderBy('venue.reviewCount', 'DESC')
          .addOrderBy('venue.rating', 'DESC');
    }
    qb.addOrderBy('venue.id', 'ASC');

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return paginate(items, total, page, limit);
  }

  async findLocations(): Promise<string[]> {
    const rows = await this.venuesRepo
      .createQueryBuilder('venue')
      .select('DISTINCT venue.location', 'location')
      .where('venue.isActive = :active', { active: true })
      .orderBy('location', 'ASC')
      .getRawMany<{ location: string }>();
    return rows.map(row => row.location);
  }

  async findBySlug(slug: string): Promise<Venue> {
    const venue = await this.venuesRepo.findOne({
      where: { slug, isActive: true },
    });
    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async findAdmin(query: AdminVenueQueryDto) {
    const { page, limit } = query;
    const qb = this.venuesRepo.createQueryBuilder('venue');
    if (query.type) qb.andWhere('venue.type = :type', { type: query.type });
    if (query.status === 'active') qb.andWhere('venue.isActive = 1');
    if (query.status === 'inactive') qb.andWhere('venue.isActive = 0');
    if (query.search) {
      qb.andWhere(
        new Brackets(where =>
          where
            .where('venue.name LIKE :search')
            .orWhere('venue.location LIKE :search'),
        ),
        { search: `%${query.search.trim()}%` },
      );
    }
    const [items, total] = await qb
      .orderBy('venue.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const counts = await this.bookingCounts(items.map(v => v.id));
    return paginate(
      items.map(venue => ({ ...venue, bookingCount: counts[venue.id] ?? 0 })),
      total,
      page,
      limit,
    );
  }

  async findById(id: number): Promise<Venue> {
    const venue = await this.venuesRepo.findOne({ where: { id } });
    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async findAdminDetail(id: number) {
    const venue = await this.findById(id);
    const counts = await this.bookingCounts([id]);
    const revenue = await this.bookingsRepo
      .createQueryBuilder('booking')
      .select('COALESCE(SUM(booking.totalAmount), 0)', 'revenue')
      .where('booking.venueId = :id', { id })
      .andWhere("booking.paymentStatus = 'PAID'")
      .getRawOne<{ revenue: string }>();
    return {
      ...venue,
      bookingCount: counts[id] ?? 0,
      revenue: Number(revenue?.revenue ?? 0),
    };
  }

  async create(dto: CreateVenueDto): Promise<Venue> {
    const venue = this.venuesRepo.create({
      ...dto,
      priceUnit: dto.priceUnit ?? this.defaultPriceUnit(dto.type),
      amenities: this.cleanList(dto.amenities),
      images: this.cleanList(dto.images),
      slug: await this.uniqueSlug(dto.name),
      isFeatured: dto.isFeatured ?? false,
      isActive: dto.isActive ?? true,
    });
    return this.venuesRepo.save(venue);
  }

  async update(id: number, dto: UpdateVenueDto): Promise<Venue> {
    const venue = await this.findById(id);
    if (dto.name && dto.name !== venue.name) {
      venue.slug = await this.uniqueSlug(dto.name, id);
    }
    if (dto.type && dto.type !== venue.type && !dto.priceUnit) {
      dto.priceUnit = this.defaultPriceUnit(dto.type);
    }
    Object.assign(venue, {
      ...dto,
      ...(dto.amenities && { amenities: this.cleanList(dto.amenities) }),
      ...(dto.images && { images: this.cleanList(dto.images) }),
    });
    return this.venuesRepo.save(venue);
  }

  async setStatus(id: number, isActive: boolean): Promise<Venue> {
    const venue = await this.findById(id);
    venue.isActive = isActive;
    return this.venuesRepo.save(venue);
  }

  async remove(id: number): Promise<void> {
    const venue = await this.findById(id);
    const hasBookings = await this.bookingsRepo.exists({
      where: { venueId: id },
    });
    if (hasBookings) {
      throw new ConflictException(
        'This venue has bookings and cannot be deleted. Deactivate it instead.',
      );
    }
    await this.venuesRepo.remove(venue);
  }

  /** Dates on which the venue is already taken (nights for rooms). */
  async bookedDates(venueId: number, from?: string, to?: string) {
    const venue = await this.findById(venueId);
    const start = from ?? todayISO();
    const end = to ?? addDays(start, 120);
    const bookings = await this.bookingsRepo.find({
      where: { venueId, status: In(ACTIVE_BOOKING_STATUSES) },
      select: { startDate: true, endDate: true },
    });
    const dates = new Set<string>();
    for (const booking of bookings) {
      const last =
        venue.priceUnit === PriceUnit.NIGHT
          ? addDays(booking.endDate, -1)
          : booking.endDate;
      for (const date of eachDate(booking.startDate, last)) {
        if (date >= start && date <= end) dates.add(date);
      }
    }
    return [...dates].sort();
  }

  async quote(
    venue: Venue,
    startDate: string,
    endDate: string,
    options: { excludeBookingId?: number; manager?: EntityManager } = {},
  ): Promise<Quote> {
    const units = this.countUnits(venue.priceUnit, startDate, endDate);
    const { gstPercent } = await this.settingsService.getAll();
    const baseAmount = round2(venue.price * units);
    const gstAmount = round2((baseAmount * gstPercent) / 100);
    const available = !(await this.hasConflict(
      venue,
      startDate,
      endDate,
      options.excludeBookingId,
      options.manager,
    ));
    return {
      available,
      startDate,
      endDate,
      units,
      priceUnit: venue.priceUnit,
      unitPrice: venue.price,
      baseAmount,
      gstPercent,
      gstAmount,
      totalAmount: round2(baseAmount + gstAmount),
    };
  }

  countUnits(unit: PriceUnit, startDate: string, endDate: string): number {
    if (startDate < todayISO()) {
      throw new BadRequestException('Start date cannot be in the past');
    }
    const diff = diffDays(startDate, endDate);
    if (unit === PriceUnit.NIGHT && diff < 1) {
      throw new BadRequestException(
        'Check-out date must be after the check-in date',
      );
    }
    if (diff < 0) {
      throw new BadRequestException('End date cannot be before start date');
    }
    const units = unit === PriceUnit.NIGHT ? diff : diff + 1;
    if (units > MAX_UNITS) {
      throw new BadRequestException(
        `Bookings can be made for at most ${MAX_UNITS} ${unit}s at a time`,
      );
    }
    return units;
  }

  async hasConflict(
    venue: Venue,
    startDate: string,
    endDate: string,
    excludeBookingId?: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repo = manager ? manager.getRepository(Booking) : this.bookingsRepo;
    const qb = repo
      .createQueryBuilder('booking')
      .where('booking.venueId = :venueId', { venueId: venue.id })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ACTIVE_BOOKING_STATUSES,
      });
    if (venue.priceUnit === PriceUnit.NIGHT) {
      qb.andWhere('booking.startDate < :end AND booking.endDate > :start');
    } else {
      qb.andWhere('booking.startDate <= :end AND booking.endDate >= :start');
    }
    qb.setParameters({ start: startDate, end: endDate });
    if (excludeBookingId) {
      qb.andWhere({ id: Not(excludeBookingId) });
    }
    if (manager) qb.setLock('pessimistic_write');
    return (await qb.getCount()) > 0;
  }

  private async bookingCounts(ids: number[]): Promise<Record<number, number>> {
    if (!ids.length) return {};
    const rows = await this.bookingsRepo
      .createQueryBuilder('booking')
      .select('booking.venueId', 'venueId')
      .addSelect('COUNT(*)', 'count')
      .where('booking.venueId IN (:...ids)', { ids })
      .groupBy('booking.venueId')
      .getRawMany<{ venueId: number; count: string }>();
    return Object.fromEntries(rows.map(r => [r.venueId, Number(r.count)]));
  }

  private defaultPriceUnit(type: VenueType) {
    return type === VenueType.ROOM ? PriceUnit.NIGHT : PriceUnit.DAY;
  }

  private cleanList(values: string[]) {
    return [...new Set(values.map(v => v.trim()).filter(Boolean))];
  }

  private async uniqueSlug(name: string, excludeId?: number) {
    const base = slugify(name) || 'venue';
    let slug = base;
    for (let i = 2; ; i++) {
      const existing = await this.venuesRepo.findOne({ where: { slug } });
      if (!existing || existing.id === excludeId) return slug;
      slug = `${base}-${i}`;
    }
  }
}
