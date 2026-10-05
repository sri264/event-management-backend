import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums';
import { BookingsService } from './bookings.service';
import {
  AdminBookingQueryDto,
  AdminCreateBookingDto,
  AdminUpdateBookingDto,
  CancelBookingDto,
  CreateBookingDto,
  MyBookingsQueryDto,
  UpdateBookingStatusDto,
  UpdateMyBookingDto,
} from './dto/booking.dto';

@ApiTags('Bookings')
@ApiBearerAuth()
@Roles(UserRole.CUSTOMER)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ResponseMessage('Booking created successfully')
  create(@CurrentUser('sub') userId: number, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createForCustomer(userId, dto);
  }

  @Get('my')
  @ResponseMessage('Bookings fetched')
  findMine(
    @CurrentUser('sub') userId: number,
    @Query() query: MyBookingsQueryDto,
  ) {
    return this.bookingsService.findMine(userId, query);
  }

  @Get('my/summary')
  @ResponseMessage('Booking summary fetched')
  summary(@CurrentUser('sub') userId: number) {
    return this.bookingsService.summary(userId);
  }

  @Get('my/:id')
  @ResponseMessage('Booking fetched')
  findOne(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.findMineById(userId, id);
  }

  @Patch('my/:id')
  @ResponseMessage('Booking updated successfully')
  update(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMyBookingDto,
  ) {
    return this.bookingsService.updateMine(userId, id, dto);
  }

  @Patch('my/:id/cancel')
  @ResponseMessage('Booking cancelled successfully')
  cancel(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelMine(userId, id, dto.reason);
  }
}

@ApiTags('Admin - Bookings')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/bookings')
export class AdminBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ResponseMessage('Bookings fetched')
  findAll(@Query() query: AdminBookingQueryDto) {
    return this.bookingsService.findAll(query);
  }

  @Get(':id')
  @ResponseMessage('Booking fetched')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.findById(id);
  }

  @Post()
  @ResponseMessage('Booking created successfully')
  create(@Body() dto: AdminCreateBookingDto) {
    return this.bookingsService.createByAdmin(dto);
  }

  @Patch(':id')
  @ResponseMessage('Booking updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateBookingDto,
  ) {
    return this.bookingsService.updateByAdmin(id, dto);
  }

  @Patch(':id/status')
  @ResponseMessage('Booking status updated')
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.setStatus(id, dto);
  }
}
