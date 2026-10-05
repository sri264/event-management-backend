import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { TicketStatus } from '@/common/enums';
import { Booking } from '../bookings/booking.entity';
import { User } from '../users/user.entity';

@Entity('support_tickets')
export class SupportTicket extends BaseEntity {
  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'booking_id', type: 'int', unsigned: true, nullable: true })
  bookingId: number | null;

  @ManyToOne(() => Booking, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking | null;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ length: 150 })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Index()
  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ name: 'admin_reply', type: 'text', nullable: true })
  adminReply: string | null;

  @Column({ name: 'replied_at', type: 'datetime', nullable: true })
  repliedAt: Date | null;
}
