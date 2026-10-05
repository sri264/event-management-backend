import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { PaymentMethod, TransactionStatus } from '@/common/enums';

export const ONLINE_METHODS = [
  PaymentMethod.UPI,
  PaymentMethod.CARD,
  PaymentMethod.NET_BANKING,
];

export class PayBookingDto {
  @Type(() => Number)
  @IsInt()
  bookingId: number;

  @IsIn(ONLINE_METHODS, { message: 'Choose UPI, card or net banking' })
  method: PaymentMethod;
}

export class RecordPaymentDto {
  @Type(() => Number)
  @IsInt()
  bookingId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}

export class RefundPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}

export class PaymentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;
}
