import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums';

@ApiTags('Admin - Uploads')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/uploads')
export class UploadsController {
  @Post()
  @ApiConsumes('multipart/form-data')
  @ResponseMessage('Image uploaded')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Choose an image to upload');
    return { url: `/uploads/venues/${file.filename}` };
  }
}
