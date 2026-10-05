import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/booking.entity';
import { SettingsModule } from '../settings/settings.module';
import { Venue } from './venue.entity';
import { AdminVenuesController, VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';

@Module({
  imports: [TypeOrmModule.forFeature([Venue, Booking]), SettingsModule],
  controllers: [VenuesController, AdminVenuesController],
  providers: [VenuesService],
  exports: [VenuesService],
})
export class VenuesModule {}
