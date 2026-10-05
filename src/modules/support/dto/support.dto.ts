import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { TicketStatus } from '@/common/enums';
import { PHONE_REGEX } from '../../users/dto/profile.dto';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty({ message: 'Subject is required' })
  @MaxLength(150)
  subject: string;

  @IsString()
  @MinLength(10, { message: 'Please describe your issue in a few words' })
  @MaxLength(3000)
  message: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  bookingId?: number;
}

export class ContactFormDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100)
  name: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Enter a valid phone number' })
  phone?: string;

  @IsString()
  @IsNotEmpty({ message: 'Subject is required' })
  @MaxLength(150)
  subject: string;

  @IsString()
  @MinLength(10, { message: 'Please write at least 10 characters' })
  @MaxLength(3000)
  message: string;
}

export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  adminReply?: string;
}

export class TicketQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}
