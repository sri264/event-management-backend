import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  paginate,
  PaginationQueryDto,
} from '@/common/dto/pagination-query.dto';
import { BookingStatus } from '@/common/enums';
import { Booking } from '../bookings/booking.entity';
import { Venue } from '../venues/venue.entity';
import {
  AdminReviewQueryDto,
  CreateReviewDto,
  UpdateReviewDto,
} from './dto/review.dto';
import { Review } from './review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviewsRepo: Repository<Review>,
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    @InjectRepository(Venue) private readonly venuesRepo: Repository<Venue>,
  ) {}

  async create(customerId: number, dto: CreateReviewDto) {
    const booking = await this.bookingsRepo.findOne({
      where: { id: dto.bookingId, customerId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'You can review a venue once your booking is completed',
      );
    }
    if (await this.reviewsRepo.exists({ where: { bookingId: booking.id } })) {
      throw new ConflictException('You have already reviewed this booking');
    }
    const review = await this.reviewsRepo.save(
      this.reviewsRepo.create({
        bookingId: booking.id,
        venueId: booking.venueId,
        customerId,
        rating: dto.rating,
        comment: dto.comment.trim(),
      }),
    );
    await this.recalculate(booking.venueId);
    return review;
  }

  async updateMine(customerId: number, id: number, dto: UpdateReviewDto) {
    const review = await this.reviewsRepo.findOne({
      where: { id, customerId },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.comment !== undefined) review.comment = dto.comment.trim();
    await this.reviewsRepo.save(review);
    await this.recalculate(review.venueId);
    return review;
  }

  async forVenue(venueId: number, query: PaginationQueryDto) {
    const { page, limit } = query;
    const [items, total] = await this.publicQuery()
      .andWhere('review.venueId = :venueId', { venueId })
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return paginate(items, total, page, limit);
  }

  featured() {
    return this.publicQuery()
      .andWhere('review.rating >= 4')
      .orderBy('review.rating', 'DESC')
      .addOrderBy('review.createdAt', 'DESC')
      .take(8)
      .getMany();
  }

  async findAll(query: AdminReviewQueryDto) {
    const { page, limit } = query;
    const qb = this.reviewsRepo
      .createQueryBuilder('review')
      .leftJoin('review.customer', 'customer')
      .addSelect(['customer.id', 'customer.name', 'customer.email'])
      .leftJoin('review.venue', 'venue')
      .addSelect(['venue.id', 'venue.name', 'venue.type', 'venue.slug'])
      .leftJoin('review.booking', 'booking')
      .addSelect(['booking.id', 'booking.bookingCode', 'booking.eventType']);
    if (query.rating) {
      qb.andWhere('review.rating = :rating', { rating: query.rating });
    }
    if (query.visibility === 'visible') qb.andWhere('review.isVisible = 1');
    if (query.visibility === 'hidden') qb.andWhere('review.isVisible = 0');
    if (query.search) {
      qb.andWhere(
        new Brackets(w =>
          w
            .where('review.comment LIKE :s')
            .orWhere('customer.name LIKE :s')
            .orWhere('venue.name LIKE :s'),
        ),
        { s: `%${query.search.trim()}%` },
      );
    }
    const [items, total] = await qb
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return paginate(items, total, page, limit);
  }

  async setVisibility(id: number, isVisible: boolean) {
    const review = await this.reviewsRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    review.isVisible = isVisible;
    await this.reviewsRepo.save(review);
    await this.recalculate(review.venueId);
    return review;
  }

  async remove(id: number) {
    const review = await this.reviewsRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.reviewsRepo.remove(review);
    await this.recalculate(review.venueId);
  }

  private publicQuery() {
    return this.reviewsRepo
      .createQueryBuilder('review')
      .leftJoin('review.customer', 'customer')
      .addSelect(['customer.id', 'customer.name'])
      .leftJoin('review.venue', 'venue')
      .addSelect(['venue.id', 'venue.name', 'venue.slug', 'venue.type'])
      .leftJoin('review.booking', 'booking')
      .addSelect(['booking.id', 'booking.eventType'])
      .where('review.isVisible = 1');
  }

  private async recalculate(venueId: number) {
    const row = await this.reviewsRepo
      .createQueryBuilder('review')
      .select('COALESCE(AVG(review.rating), 0)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('review.venueId = :venueId', { venueId })
      .andWhere('review.isVisible = 1')
      .getRawOne<{ avg: string; count: string }>();
    await this.venuesRepo.update(venueId, {
      rating: Math.round(Number(row?.avg ?? 0) * 10) / 10,
      reviewCount: Number(row?.count ?? 0),
    });
  }
}
