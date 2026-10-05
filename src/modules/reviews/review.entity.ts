import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { Booking } from '../bookings/booking.entity';
import { User } from '../users/user.entity';
import { Venue } from '../venues/venue.entity';

@Entity('reviews')
export class Review extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'booking_id', type: 'int', unsigned: true })
  bookingId: number;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'venue_id', type: 'int', unsigned: true })
  venueId: number;

  @ManyToOne(() => Venue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue;

  @Column({ name: 'customer_id', type: 'int', unsigned: true })
  customerId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ type: 'tinyint', unsigned: true })
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @Column({ name: 'is_visible', default: true })
  isVisible: boolean;
}
