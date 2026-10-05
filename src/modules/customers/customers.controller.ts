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
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  CustomerQueryDto,
  UpdateCustomerDto,
  UpdateCustomerStatusDto,
} from './dto/customer.dto';

@ApiTags('Admin - Customers')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ResponseMessage('Customers fetched')
  findAll(@Query() query: CustomerQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @ResponseMessage('Customer fetched')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @Post()
  @ResponseMessage('Customer created successfully')
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @ResponseMessage('Customer updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, dto);
  }

  @Patch(':id/status')
  @ResponseMessage('Customer status updated')
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerStatusDto,
  ) {
    return this.customersService.setStatus(id, dto.isActive);
  }
}
