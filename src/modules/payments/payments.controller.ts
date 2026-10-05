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
import {
  PayBookingDto,
  PaymentQueryDto,
  RecordPaymentDto,
  RefundPaymentDto,
} from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@Roles(UserRole.CUSTOMER)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ResponseMessage('Payment successful')
  pay(@CurrentUser('sub') userId: number, @Body() dto: PayBookingDto) {
    return this.paymentsService.payAsCustomer(userId, dto);
  }

  @Get('my')
  @ResponseMessage('Payments fetched')
  findMine(
    @CurrentUser('sub') userId: number,
    @Query() query: PaymentQueryDto,
  ) {
    return this.paymentsService.findMine(userId, query);
  }
}

@ApiTags('Admin - Payments')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ResponseMessage('Payments fetched')
  findAll(@Query() query: PaymentQueryDto) {
    return this.paymentsService.findAll(query);
  }

  @Post()
  @ResponseMessage('Payment recorded successfully')
  record(@Body() dto: RecordPaymentDto) {
    return this.paymentsService.recordByAdmin(dto);
  }

  @Patch(':id/refund')
  @ResponseMessage('Payment refunded successfully')
  refund(@Param('id', ParseIntPipe) id: number, @Body() dto: RefundPaymentDto) {
    return this.paymentsService.refund(id, dto.note);
  }
}
