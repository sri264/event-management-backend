import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Setting } from './setting.entity';

export interface BusinessSettings {
  businessName: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  gstPercent: number;
  freeCancellationDays: number;
  cancellationPolicy: string;
}

const NUMERIC_KEYS: (keyof BusinessSettings)[] = [
  'gstPercent',
  'freeCancellationDays',
];

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepo: Repository<Setting>,
    private readonly config: ConfigService,
  ) {}

  private defaults(): BusinessSettings {
    return {
      businessName: this.config.get<string>('app.name'),
      supportEmail: 'support@eventnest.com',
      supportPhone: '+91 98765 43210',
      address: 'Bengaluru, Karnataka',
      gstPercent: this.config.get<number>('booking.gstPercent'),
      freeCancellationDays: 2,
      cancellationPolicy:
        'Bookings can be cancelled free of charge up to 2 days before the event date. Paid amounts are refunded to the original payment method within 5-7 working days.',
    };
  }

  async getAll(): Promise<BusinessSettings> {
    const rows = await this.settingsRepo.find();
    const settings = this.defaults();
    for (const row of rows) {
      if (!(row.key in settings)) continue;
      const key = row.key as keyof BusinessSettings;
      (settings as unknown as Record<string, unknown>)[key] =
        NUMERIC_KEYS.includes(key) ? Number(row.value) : row.value;
    }
    return settings;
  }

  async update(dto: UpdateSettingsDto): Promise<BusinessSettings> {
    const entries = Object.entries(dto).filter(
      ([, value]) => value !== undefined,
    );
    if (entries.length) {
      await this.settingsRepo.save(
        entries.map(([key, value]) =>
          this.settingsRepo.create({ key, value: String(value) }),
        ),
      );
    }
    return this.getAll();
  }
}
