import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums';
import {
  AdminVenueQueryDto,
  BookedDatesQueryDto,
  CreateVenueDto,
  QuoteQueryDto,
  UpdateVenueDto,
  UpdateVenueStatusDto,
  VenueQueryDto,
} from './dto/venue.dto';
import { VenuesService } from './venues.service';

@ApiTags('Venues')
@Public()
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  @ResponseMessage('Venues fetched')
  findAll(@Query() query: VenueQueryDto) {
    return this.venuesService.findPublic(query);
  }

  @Get('locations')
  @ResponseMessage('Locations fetched')
  locations() {
    return this.venuesService.findLocations();
  }

  @Get(':id/booked-dates')
  @ResponseMessage('Booked dates fetched')
  bookedDates(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: BookedDatesQueryDto,
  ) {
    return this.venuesService.bookedDates(id, query.from, query.to);
  }

  @Get(':id/quote')
  @ResponseMessage('Price calculated')
  async quote(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QuoteQueryDto,
  ) {
    const venue = await this.venuesService.findById(id);
    return this.venuesService.quote(venue, query.startDate, query.endDate);
  }

  @Get(':slug')
  @ResponseMessage('Venue fetched')
  findOne(@Param('slug') slug: string) {
    return this.venuesService.findBySlug(slug);
  }
}

@ApiTags('Admin - Venues')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/venues')
export class AdminVenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  @ResponseMessage('Venues fetched')
  findAll(@Query() query: AdminVenueQueryDto) {
    return this.venuesService.findAdmin(query);
  }

  @Get(':id')
  @ResponseMessage('Venue fetched')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.venuesService.findAdminDetail(id);
  }

  @Post()
  @ResponseMessage('Venue created successfully')
  create(@Body() dto: CreateVenueDto) {
    return this.venuesService.create(dto);
  }

  @Patch(':id')
  @ResponseMessage('Venue updated successfully')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVenueDto) {
    return this.venuesService.update(id, dto);
  }

  @Patch(':id/status')
  @ResponseMessage('Venue status updated')
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVenueStatusDto,
  ) {
    return this.venuesService.setStatus(id, dto.isActive);
  }

  @Delete(':id')
  @ResponseMessage('Venue deleted successfully')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.venuesService.remove(id);
    return null;
  }
}
