import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches } from 'class-validator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums';
import { DashboardService } from './dashboard.service';

class CalendarQueryDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'Month must be YYYY-MM' })
  month: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  venueId?: number;
}

@ApiTags('Admin - Dashboard')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard')
  @ResponseMessage('Dashboard fetched')
  overview() {
    return this.dashboardService.overview();
  }

  @Get('calendar')
  @ResponseMessage('Calendar fetched')
  calendar(@Query() query: CalendarQueryDto) {
    return this.dashboardService.calendar(query.month, query.venueId);
  }
}
