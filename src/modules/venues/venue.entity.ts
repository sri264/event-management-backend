import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { PriceUnit, VenueType } from '@/common/enums';
import { decimalTransformer } from '@/common/utils/decimal.transformer';

@Entity('venues')
export class Venue extends BaseEntity {
  @Column({ length: 150 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 170 })
  slug: string;

  @Index()
  @Column({ type: 'enum', enum: VenueType })
  type: VenueType;

  @Column({ type: 'text' })
  description: string;

  @Index()
  @Column({ length: 100 })
  location: string;

  @Column({ length: 255 })
  address: string;

  @Column({ type: 'int', unsigned: true })
  capacity: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  price: number;

  @Column({ name: 'price_unit', type: 'enum', enum: PriceUnit })
  priceUnit: PriceUnit;

  @Column({ type: 'json' })
  amenities: string[];

  @Column({ type: 'json' })
  images: string[];

  @Column({
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 0,
    transformer: decimalTransformer,
  })
  rating: number;

  @Column({ name: 'review_count', type: 'int', unsigned: true, default: 0 })
  reviewCount: number;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
