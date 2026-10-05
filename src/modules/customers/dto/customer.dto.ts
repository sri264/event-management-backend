import { OmitType, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import {
  PASSWORD_MESSAGE,
  PASSWORD_REGEX,
  PHONE_REGEX,
} from '../../users/dto/profile.dto';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100)
  name: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(150)
  email: string;

  @Matches(PHONE_REGEX, { message: 'Enter a valid phone number' })
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCustomerDto extends PartialType(
  OmitType(CreateCustomerDto, ['password'] as const),
) {
  @IsOptional()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password?: string;
}

export class UpdateCustomerStatusDto {
  @IsBoolean()
  isActive: boolean;
}

export class CustomerQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['all', 'active', 'inactive'])
  status?: 'all' | 'active' | 'inactive';
}
