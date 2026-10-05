import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { paginate } from '@/common/dto/pagination-query.dto';
import { TicketStatus } from '@/common/enums';
import { Booking } from '../bookings/booking.entity';
import { UsersService } from '../users/users.service';
import {
  ContactFormDto,
  CreateTicketDto,
  TicketQueryDto,
  UpdateTicketDto,
} from './dto/support.dto';
import { SupportTicket } from './support-ticket.entity';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketsRepo: Repository<SupportTicket>,
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    private readonly usersService: UsersService,
  ) {}

  async createForCustomer(userId: number, dto: CreateTicketDto) {
    const user = await this.usersService.findById(userId);
    if (dto.bookingId) {
      const owns = await this.bookingsRepo.exists({
        where: { id: dto.bookingId, customerId: userId },
      });
      if (!owns) throw new NotFoundException('Booking not found');
    }
    return this.ticketsRepo.save(
      this.ticketsRepo.create({
        userId,
        bookingId: dto.bookingId ?? null,
        name: user.name,
        email: user.email,
        phone: user.phone,
        subject: dto.subject.trim(),
        message: dto.message.trim(),
      }),
    );
  }

  createFromContactForm(dto: ContactFormDto) {
    return this.ticketsRepo.save(
      this.ticketsRepo.create({
        name: dto.name.trim(),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone?.trim() || null,
        subject: dto.subject.trim(),
        message: dto.message.trim(),
      }),
    );
  }

  async findMine(userId: number, query: TicketQueryDto) {
    const { page, limit } = query;
    const [items, total] = await this.listQuery()
      .where('ticket.userId = :userId', { userId })
      .orderBy('ticket.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return paginate(items, total, page, limit);
  }

  async findAll(query: TicketQueryDto) {
    const { page, limit } = query;
    const qb = this.listQuery();
    if (query.status) {
      qb.andWhere('ticket.status = :status', { status: query.status });
    }
    if (query.search) {
      qb.andWhere(
        new Brackets(w =>
          w
            .where('ticket.subject LIKE :s')
            .orWhere('ticket.name LIKE :s')
            .orWhere('ticket.email LIKE :s'),
        ),
        { s: `%${query.search.trim()}%` },
      );
    }
    const [items, total] = await qb
      .orderBy(
        "FIELD(ticket.status, 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')",
      )
      .addOrderBy('ticket.createdAt', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getManyAndCount();
    return paginate(items, total, page, limit);
  }

  async findOne(id: number) {
    const ticket = await this.listQuery()
      .where('ticket.id = :id', { id })
      .getOne();
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async update(id: number, dto: UpdateTicketDto) {
    const ticket = await this.ticketsRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (dto.adminReply !== undefined && dto.adminReply.trim()) {
      ticket.adminReply = dto.adminReply.trim();
      ticket.repliedAt = new Date();
      if (!dto.status && ticket.status === TicketStatus.OPEN) {
        ticket.status = TicketStatus.IN_PROGRESS;
      }
    }
    if (dto.status) ticket.status = dto.status;
    await this.ticketsRepo.save(ticket);
    return this.findOne(id);
  }

  private listQuery() {
    return this.ticketsRepo
      .createQueryBuilder('ticket')
      .leftJoin('ticket.booking', 'booking')
      .addSelect(['booking.id', 'booking.bookingCode']);
  }
}
