import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Not, Repository } from 'typeorm';
import { paginate } from '@/common/dto/pagination-query.dto';
import { UserRole } from '@/common/enums';
import { Booking } from '../bookings/booking.entity';
import { User } from '../users/user.entity';
import { toPublicUser, UsersService } from '../users/users.service';
import {
  CreateCustomerDto,
  CustomerQueryDto,
  UpdateCustomerDto,
} from './dto/customer.dto';

interface CustomerStats {
  bookingCount: number;
  totalSpent: number;
  lastBookingAt: string | null;
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    private readonly usersService: UsersService,
  ) {}

  async findAll(query: CustomerQueryDto) {
    const { page, limit } = query;
    const qb = this.usersRepo
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.CUSTOMER });
    if (query.status === 'active') qb.andWhere('user.isActive = 1');
    if (query.status === 'inactive') qb.andWhere('user.isActive = 0');
    if (query.search) {
      qb.andWhere(
        new Brackets(w =>
          w
            .where('user.name LIKE :s')
            .orWhere('user.email LIKE :s')
            .orWhere('user.phone LIKE :s')
            .orWhere('user.city LIKE :s'),
        ),
        { s: `%${query.search.trim()}%` },
      );
    }
    const [users, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const stats = await this.statsFor(users.map(u => u.id));
    const items = users.map(user => ({
      ...toPublicUser(user),
      ...(stats[user.id] ?? {
        bookingCount: 0,
        totalSpent: 0,
        lastBookingAt: null,
      }),
    }));
    return paginate(items, total, page, limit);
  }

  async findOne(id: number) {
    const user = await this.findCustomer(id);
    const stats = (await this.statsFor([id]))[id];
    const bookings = await this.bookingsRepo
      .createQueryBuilder('booking')
      .leftJoin('booking.venue', 'venue')
      .addSelect(['venue.id', 'venue.name', 'venue.type', 'venue.location'])
      .where('booking.customerId = :id', { id })
      .orderBy('booking.startDate', 'DESC')
      .take(20)
      .getMany();
    return {
      ...toPublicUser(user),
      bookingCount: stats?.bookingCount ?? 0,
      totalSpent: stats?.totalSpent ?? 0,
      lastBookingAt: stats?.lastBookingAt ?? null,
      bookings,
    };
  }

  async create(dto: CreateCustomerDto) {
    const user = await this.usersService.create({
      ...dto,
      role: UserRole.CUSTOMER,
    });
    return this.findOne(user.id);
  }

  async update(id: number, dto: UpdateCustomerDto) {
    const user = await this.findCustomer(id);
    if (dto.email) {
      const email = dto.email.toLowerCase().trim();
      const taken = await this.usersRepo.exists({
        where: { email, id: Not(id) },
      });
      if (taken) {
        throw new ConflictException('Another account already uses this email');
      }
      user.email = email;
    }
    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.phone !== undefined) user.phone = dto.phone.trim() || null;
    if (dto.city !== undefined) user.city = dto.city.trim() || null;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    await this.usersRepo.save(user);

    if (dto.password) {
      await this.usersRepo.update(id, {
        passwordHash: await this.usersService.hashPassword(dto.password),
        refreshTokenHash: null,
      });
    }
    if (dto.isActive === false) {
      await this.usersService.setRefreshTokenHash(id, null);
    }
    return this.findOne(id);
  }

  async setStatus(id: number, isActive: boolean) {
    const user = await this.findCustomer(id);
    user.isActive = isActive;
    await this.usersRepo.save(user);
    if (!isActive) await this.usersService.setRefreshTokenHash(id, null);
    return this.findOne(id);
  }

  private async findCustomer(id: number) {
    const user = await this.usersRepo.findOne({
      where: { id, role: UserRole.CUSTOMER },
    });
    if (!user) throw new NotFoundException('Customer not found');
    return user;
  }

  private async statsFor(
    ids: number[],
  ): Promise<Record<number, CustomerStats>> {
    if (!ids.length) return {};
    const bookingRows = await this.bookingsRepo
      .createQueryBuilder('booking')
      .select('booking.customerId', 'customerId')
      .addSelect('COUNT(*)', 'count')
      .addSelect('MAX(booking.createdAt)', 'last')
      .where('booking.customerId IN (:...ids)', { ids })
      .groupBy('booking.customerId')
      .getRawMany<{ customerId: number; count: string; last: string }>();

    const spentRows = await this.bookingsRepo.manager
      .createQueryBuilder()
      .select('booking.customer_id', 'customerId')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'spent')
      .from('payments', 'payment')
      .innerJoin('bookings', 'booking', 'booking.id = payment.booking_id')
      .where('booking.customer_id IN (:...ids)', { ids })
      .andWhere("payment.status = 'SUCCESS'")
      .groupBy('booking.customer_id')
      .getRawMany<{ customerId: number; spent: string }>();
    const spent = Object.fromEntries(
      spentRows.map(r => [Number(r.customerId), Number(r.spent)]),
    );

    return Object.fromEntries(
      bookingRows.map(r => [
        Number(r.customerId),
        {
          bookingCount: Number(r.count),
          totalSpent: spent[Number(r.customerId)] ?? 0,
          lastBookingAt: r.last,
        },
      ]),
    );
  }
}
