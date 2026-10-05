export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

export enum VenueType {
  HALL = 'hall',
  POOL = 'pool',
  ROOM = 'room',
}

export enum PriceUnit {
  DAY = 'day',
  NIGHT = 'night',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  UPI = 'UPI',
  CARD = 'CARD',
  NET_BANKING = 'NET_BANKING',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum TransactionStatus {
  SUCCESS = 'SUCCESS',
  REFUNDED = 'REFUNDED',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

/** Bookings in these states block the venue for their dates. */
export const ACTIVE_BOOKING_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
];
