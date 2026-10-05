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
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums';
import {
  ContactFormDto,
  CreateTicketDto,
  TicketQueryDto,
  UpdateTicketDto,
} from './dto/support.dto';
import { SupportService } from './support.service';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('contact')
  @ResponseMessage("Thanks for reaching out! We'll get back to you shortly")
  contact(@Body() dto: ContactFormDto) {
    return this.supportService.createFromContactForm(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.CUSTOMER)
  @Post()
  @ResponseMessage('Support request submitted')
  create(@CurrentUser('sub') userId: number, @Body() dto: CreateTicketDto) {
    return this.supportService.createForCustomer(userId, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.CUSTOMER)
  @Get('my')
  @ResponseMessage('Support requests fetched')
  findMine(@CurrentUser('sub') userId: number, @Query() query: TicketQueryDto) {
    return this.supportService.findMine(userId, query);
  }
}

@ApiTags('Admin - Support')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/support')
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  @ResponseMessage('Support requests fetched')
  findAll(@Query() query: TicketQueryDto) {
    return this.supportService.findAll(query);
  }

  @Get(':id')
  @ResponseMessage('Support request fetched')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supportService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Support request updated')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTicketDto) {
    return this.supportService.update(id, dto);
  }
}
