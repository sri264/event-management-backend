import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

@ApiTags('Health')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ResponseMessage('API is running')
  async check() {
    let database: 'up' | 'down' = 'down';
    try {
      await this.dataSource.query('SELECT 1');
      database = 'up';
    } catch {
      database = 'down';
    }

    return {
      app: this.configService.get<string>('app.name'),
      env: this.configService.get<string>('app.env'),
      database,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
