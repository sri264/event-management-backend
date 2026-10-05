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
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { UserRole } from '@/common/enums';
import {
  AdminReviewQueryDto,
  CreateReviewDto,
  ReviewVisibilityDto,
  UpdateReviewDto,
} from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get('featured')
  @ResponseMessage('Reviews fetched')
  featured() {
    return this.reviewsService.featured();
  }

  @Public()
  @Get('venue/:venueId')
  @ResponseMessage('Reviews fetched')
  forVenue(
    @Param('venueId', ParseIntPipe) venueId: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.reviewsService.forVenue(venueId, query);
  }

  @ApiBearerAuth()
  @Roles(UserRole.CUSTOMER)
  @Post()
  @ResponseMessage('Thank you! Your review has been submitted')
  create(@CurrentUser('sub') userId: number, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.CUSTOMER)
  @Patch('my/:id')
  @ResponseMessage('Review updated successfully')
  update(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateMine(userId, id, dto);
  }
}

@ApiTags('Admin - Reviews')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ResponseMessage('Reviews fetched')
  findAll(@Query() query: AdminReviewQueryDto) {
    return this.reviewsService.findAll(query);
  }

  @Patch(':id/visibility')
  @ResponseMessage('Review visibility updated')
  setVisibility(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewVisibilityDto,
  ) {
    return this.reviewsService.setVisibility(id, dto.isVisible);
  }

  @Delete(':id')
  @ResponseMessage('Review deleted successfully')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.reviewsService.remove(id);
    return null;
  }
}
