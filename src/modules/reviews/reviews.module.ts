import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/booking.entity';
import { Venue } from '../venues/venue.entity';
import { Review } from './review.entity';
import {
  AdminReviewsController,
  ReviewsController,
} from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Booking, Venue])],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
