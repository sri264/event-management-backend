import {
  BadRequestException,
  Logger,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

const flattenValidationErrors = (errors: ValidationError[]) =>
  errors.map(error => ({
    field: error.property,
    message: Object.values(error.constraints ?? {}).join('. '),
  }));

async function bootstrap() {
  process.env.TZ = process.env.TZ || 'Asia/Kolkata';

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const env = config.get<string>('app.env');
  const isProd = env === 'prod' || env === 'production';
  const port = config.get<number>('app.port');
  const apiPrefix = config.get<string>('app.apiPrefix');
  const corsOrigins = config.get<string[]>('app.corsOrigins');

  app.use(
    helmet({
      // Uploaded images are loaded by the frontend from a different origin.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());
  app.disable('x-powered-by');

  app.enableCors({
    origin: (origin, callback) => {
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(
        origin ?? '',
      );
      if (!origin || corsOrigins.includes(origin) || (!isProd && isLocalhost)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });

  app.setGlobalPrefix(apiPrefix);

  app.useStaticAssets(join(process.cwd(), config.get<string>('upload.dir')), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: errors =>
        new BadRequestException({
          message: 'Validation failed',
          errors: flattenValidationErrors(errors),
        }),
    }),
  );

  if (config.get<boolean>('app.enableSwagger')) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('EventNest API')
      .setDescription('Event & Facility Booking System API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.enableShutdownHooks();
  await app.listen(port);

  logger.log(`EventNest API running on http://localhost:${port}/${apiPrefix}`);
  if (config.get<boolean>('app.enableSwagger')) {
    logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
  }
}

bootstrap();
