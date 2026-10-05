import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { PaymentMethod, TransactionStatus } from '@/common/enums';
import { decimalTransformer } from '@/common/utils/decimal.transformer';
import { Booking } from '../bookings/booking.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ name: 'booking_id', type: 'int', unsigned: true })
  bookingId: number;

  @ManyToOne(() => Booking, booking => booking.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Index()
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.SUCCESS,
  })
  status: TransactionStatus;

  @Index({ unique: true })
  @Column({ name: 'transaction_ref', length: 40 })
  transactionRef: string;

  @Column({ name: 'paid_at', type: 'datetime' })
  paidAt: Date;

  @Column({ name: 'refunded_at', type: 'datetime', nullable: true })
  refundedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note: string | null;
}
