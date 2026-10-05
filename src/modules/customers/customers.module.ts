import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/booking.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Booking]), UsersModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
