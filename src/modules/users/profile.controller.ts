import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { ChangePasswordDto, UpdateProfileDto } from './dto/profile.dto';
import { toPublicUser, UsersService } from './users.service';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ResponseMessage('Profile fetched')
  async get(@CurrentUser('sub') userId: number) {
    return toPublicUser(await this.usersService.findById(userId));
  }

  @Patch()
  @ResponseMessage('Profile updated successfully')
  async update(
    @CurrentUser('sub') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return toPublicUser(await this.usersService.updateProfile(userId, dto));
  }

  @Patch('password')
  @ResponseMessage('Password changed successfully')
  async changePassword(
    @CurrentUser('sub') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(userId, dto);
    return null;
  }
}
