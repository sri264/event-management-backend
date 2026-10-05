import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/booking.entity';
import { Payment } from '../payments/payment.entity';
import { SupportTicket } from '../support/support-ticket.entity';
import { User } from '../users/user.entity';
import { Venue } from '../venues/venue.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Payment, User, Venue, SupportTicket]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
