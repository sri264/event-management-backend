import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('settings/public')
  @ResponseMessage('Settings fetched')
  getPublic() {
    return this.settingsService.getAll();
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get('admin/settings')
  @ResponseMessage('Settings fetched')
  getAll() {
    return this.settingsService.getAll();
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch('admin/settings')
  @ResponseMessage('Settings updated successfully')
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
