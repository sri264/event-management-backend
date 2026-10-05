import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { BookingStatus, VenueType } from '@/common/enums';
import { PHONE_REGEX } from '../../users/dto/profile.dto';

export class CreateBookingDto {
  @Type(() => Number)
  @IsInt()
  venueId: number;

  @IsDateString({ strict: true }, { message: 'Enter a valid start date' })
  startDate: string;

  @IsDateString({ strict: true }, { message: 'Enter a valid end date' })
  endDate: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests: number;

  @IsString()
  @IsNotEmpty({ message: 'Select the event type' })
  @MaxLength(60)
  eventType: string;

  @IsString()
  @IsNotEmpty({ message: 'Contact name is required' })
  @MaxLength(100)
  contactName: string;

  @Matches(PHONE_REGEX, { message: 'Enter a valid phone number' })
  contactPhone: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class AdminCreateBookingDto extends CreateBookingDto {
  @Type(() => Number)
  @IsInt()
  customerId: number;

  @IsOptional()
  @IsIn([BookingStatus.PENDING, BookingStatus.CONFIRMED])
  status?: BookingStatus.PENDING | BookingStatus.CONFIRMED;
}

export class UpdateMyBookingDto extends PartialType(
  OmitType(CreateBookingDto, ['venueId', 'startDate', 'endDate'] as const),
) {}

export class AdminUpdateBookingDto extends PartialType(
  OmitType(CreateBookingDto, ['venueId'] as const),
) {}

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class CancelBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export const BOOKING_TABS = [
  'all',
  'upcoming',
  'completed',
  'cancelled',
] as const;
export type BookingTab = (typeof BOOKING_TABS)[number];

export class MyBookingsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(BOOKING_TABS)
  tab?: BookingTab;
}

export class AdminBookingQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(VenueType)
  venueType?: VenueType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  venueId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  customerId?: number;

  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;
}
