import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from '../reviews/review.entity';
import { SettingsModule } from '../settings/settings.module';
import { User } from '../users/user.entity';
import { VenuesModule } from '../venues/venues.module';
import { BookingLedgerService } from './booking-ledger.service';
import { Booking } from './booking.entity';
import {
  AdminBookingsController,
  BookingsController,
} from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Review, User]),
    VenuesModule,
    SettingsModule,
  ],
  controllers: [BookingsController, AdminBookingsController],
  providers: [BookingsService, BookingLedgerService],
  exports: [BookingsService, BookingLedgerService],
})
export class BookingsModule {}
