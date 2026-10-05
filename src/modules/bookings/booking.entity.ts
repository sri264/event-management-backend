import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { BookingStatus, PaymentStatus } from '@/common/enums';
import { decimalTransformer } from '@/common/utils/decimal.transformer';
import { Payment } from '../payments/payment.entity';
import { User } from '../users/user.entity';
import { Venue } from '../venues/venue.entity';

@Entity('bookings')
@Index(['venueId', 'startDate', 'endDate'])
export class Booking extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'booking_code', length: 20 })
  bookingCode: string;

  @Column({ name: 'customer_id', type: 'int', unsigned: true })
  customerId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ name: 'venue_id', type: 'int', unsigned: true })
  venueId: number;

  @ManyToOne(() => Venue, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ type: 'int', unsigned: true })
  units: number;

  @Column({ type: 'int', unsigned: true })
  guests: number;

  @Column({ name: 'event_type', length: 60 })
  eventType: string;

  @Column({ name: 'contact_name', length: 100 })
  contactName: string;

  @Column({ name: 'contact_phone', length: 20 })
  contactPhone: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  unitPrice: number;

  @Column({
    name: 'base_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  baseAmount: number;

  @Column({ name: 'gst_percent', type: 'tinyint', unsigned: true })
  gstPercent: number;

  @Column({
    name: 'gst_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  gstAmount: number;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  totalAmount: number;

  @Index()
  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
  cancelledAt: Date | null;

  @Column({
    name: 'cancellation_reason',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  cancellationReason: string | null;

  @OneToMany(() => Payment, payment => payment.booking)
  payments: Payment[];
}
