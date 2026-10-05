import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/booking.entity';
import { UsersModule } from '../users/users.module';
import {
  AdminSupportController,
  SupportController,
} from './support.controller';
import { SupportService } from './support.service';
import { SupportTicket } from './support-ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SupportTicket, Booking]), UsersModule],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService],
})
export class SupportModule {}
