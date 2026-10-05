import { BadRequestException, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UploadsController } from './uploads.controller';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dir = join(
          process.cwd(),
          config.get<string>('upload.dir'),
          'venues',
        );
        return {
          storage: diskStorage({
            destination: (_req, _file, cb) => {
              mkdirSync(dir, { recursive: true });
              cb(null, dir);
            },
            filename: (_req, file, cb) =>
              cb(
                null,
                `${randomUUID()}${extname(file.originalname).toLowerCase()}`,
              ),
          }),
          limits: {
            fileSize: config.get<number>('upload.maxSizeMb') * 1024 * 1024,
          },
          fileFilter: (_req, file, cb) =>
            ALLOWED_TYPES.includes(file.mimetype)
              ? cb(null, true)
              : cb(
                  new BadRequestException(
                    'Only JPG, PNG or WEBP images are allowed',
                  ),
                  false,
                ),
        };
      },
    }),
  ],
  controllers: [UploadsController],
})
export class UploadsModule {}
