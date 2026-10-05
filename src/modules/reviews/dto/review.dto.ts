import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  bookingId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Please write at least 10 characters' })
  @MaxLength(1000)
  comment: string;
}

export class UpdateReviewDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Please write at least 10 characters' })
  @MaxLength(1000)
  comment?: string;
}

export class ReviewVisibilityDto {
  @IsBoolean()
  isVisible: boolean;
}

export class AdminReviewQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsIn(['all', 'visible', 'hidden'])
  visibility?: 'all' | 'visible' | 'hidden';
}
