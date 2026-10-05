import { PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { PriceUnit, VenueType } from '@/common/enums';

const toBoolean = ({ value }: { value: unknown }) =>
  value === true || value === 'true' || value === '1';

export class CreateVenueDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsEnum(VenueType)
  type: VenueType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  location: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  capacity: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  price: number;

  @IsOptional()
  @IsEnum(PriceUnit)
  priceUnit?: PriceUnit;

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  amenities: string[];

  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one image' })
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  images: string[];

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVenueDto extends PartialType(CreateVenueDto) {}

export class UpdateVenueStatusDto {
  @IsBoolean()
  isActive: boolean;
}

export const VENUE_SORTS = [
  'popular',
  'price_asc',
  'price_desc',
  'rating',
  'newest',
] as const;

export class VenueQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(VenueType)
  type?: VenueType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(VENUE_SORTS)
  sort?: (typeof VENUE_SORTS)[number];

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  featured?: boolean;
}

export class AdminVenueQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(VenueType)
  type?: VenueType;

  @IsOptional()
  @IsIn(['all', 'active', 'inactive'])
  status?: 'all' | 'active' | 'inactive';
}

export class QuoteQueryDto {
  @IsDateString({ strict: true }, { message: 'Enter a valid start date' })
  startDate: string;

  @IsDateString({ strict: true }, { message: 'Enter a valid end date' })
  endDate: string;
}

export class BookedDatesQueryDto {
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;
}
