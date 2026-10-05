/**
 * Seeds the default admin plus demo venues, customers and bookings.
 * Usage: npm run seed
 * The admin is always upserted; demo data is only added to an empty database.
 */
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  PriceUnit,
  TicketStatus,
  TransactionStatus,
  UserRole,
  VenueType,
} from '../../common/enums';
import { addDays, diffDays, todayISO } from '../../common/utils/date.util';
import { slugify } from '../../common/utils/slug.util';
import dataSource from '../../config/data-source';
import { Booking } from '../../modules/bookings/booking.entity';
import { Payment } from '../../modules/payments/payment.entity';
import { Review } from '../../modules/reviews/review.entity';
import { SupportTicket } from '../../modules/support/support-ticket.entity';
import { User } from '../../modules/users/user.entity';
import { Venue } from '../../modules/venues/venue.entity';

const GST = Number(process.env.GST_PERCENT || 18);
const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=75`;

type VenueSeed = Omit<
  Venue,
  | 'id'
  | 'slug'
  | 'createdAt'
  | 'updatedAt'
  | 'rating'
  | 'reviewCount'
  | 'priceUnit'
  | 'isActive'
>;

const VENUES: VenueSeed[] = [
  {
    name: 'Grand Celebration Hall',
    type: VenueType.HALL,
    location: 'Bengaluru',
    address: '12 MG Road, Ashok Nagar, Bengaluru 560001',
    capacity: 500,
    price: 75000,
    description:
      'Our flagship banquet hall with crystal chandeliers, a grand stage and elegant interiors - perfect for weddings, receptions and large celebrations.',
    amenities: [
      'AC',
      'Parking',
      'Stage',
      'Catering',
      'Sound System',
      'Bridal Room',
      'Power Backup',
    ],
    images: [
      img('1519167758481-83f550bb49b3'),
      img('1587271407850-8d438ca9fdf2'),
      img('1519225421980-715cb0215aed'),
    ],
    isFeatured: true,
  },
  {
    name: 'Royal Palace Hall',
    type: VenueType.HALL,
    location: 'Bengaluru',
    address: '45 Residency Road, Bengaluru 560025',
    capacity: 300,
    price: 45000,
    description:
      'A regal hall with royal decor for engagements, birthday parties and family functions, with in-house catering support.',
    amenities: ['AC', 'Parking', 'Catering', 'Stage', 'Sound System'],
    images: [
      img('1464366400600-7168b8af9bc3'),
      img('1511795409834-ef04bbd61622'),
    ],
    isFeatured: true,
  },
  {
    name: 'Grand Imperial Hall',
    type: VenueType.HALL,
    location: 'Bengaluru',
    address: '8 Whitefield Main Road, Bengaluru 560066',
    capacity: 400,
    price: 60000,
    description:
      'Spacious pillar-less hall with modern lighting, ideal for weddings, conferences and cultural events.',
    amenities: [
      'AC',
      'Parking',
      'Stage',
      'Projector',
      'Sound System',
      'Power Backup',
    ],
    images: [
      img('1587271407850-8d438ca9fdf2'),
      img('1505373877841-8d25f7d46678'),
    ],
    isFeatured: false,
  },
  {
    name: 'Lotus Garden Lawn',
    type: VenueType.HALL,
    location: 'Hyderabad',
    address: 'Road No. 36, Jubilee Hills, Hyderabad 500033',
    capacity: 800,
    price: 90000,
    description:
      'A lush open-air lawn with a floral pergola for destination-style weddings and evening receptions.',
    amenities: ['Parking', 'Stage', 'Catering', 'Decor', 'Generator'],
    images: [
      img('1523438885200-e635ba2c371e'),
      img('1469371670807-013ccf25f16a'),
    ],
    isFeatured: false,
  },
  {
    name: 'Emerald Convention Centre',
    type: VenueType.HALL,
    location: 'Chennai',
    address: '101 OMR, Thoraipakkam, Chennai 600097',
    capacity: 250,
    price: 40000,
    description:
      'Corporate-ready convention centre with AV equipment, breakout rooms and high-speed Wi-Fi.',
    amenities: ['AC', 'Projector', 'WiFi', 'Parking', 'Catering'],
    images: [
      img('1505373877841-8d25f7d46678'),
      img('1540575467063-178a50c2df87'),
    ],
    isFeatured: false,
  },
  {
    name: 'Infinity Swimming Pool',
    type: VenueType.POOL,
    location: 'Bengaluru',
    address: '12 MG Road, Ashok Nagar, Bengaluru 560001',
    capacity: 100,
    price: 8000,
    description:
      'A stunning infinity-edge pool with poolside seating - great for pool parties, birthdays and family get-togethers.',
    amenities: [
      'Poolside Seating',
      'Shower',
      'Changing Rooms',
      'Lifeguard',
      'Music System',
    ],
    images: [
      img('1571896349842-33c89424de2d'),
      img('1540541338287-41700207dee6'),
    ],
    isFeatured: true,
  },
  {
    name: 'Resort Swimming Pool',
    type: VenueType.POOL,
    location: 'Bengaluru',
    address: '22 Sarjapur Road, Bengaluru 560035',
    capacity: 60,
    price: 10000,
    description:
      'Palm-fringed resort pool with cabanas, ideal for private events and weekend celebrations.',
    amenities: ['Cabanas', 'Shower', 'Changing Rooms', 'Lifeguard'],
    images: [
      img('1520250497591-112f2f40a3f4'),
      img('1566073771259-6a8506099945'),
    ],
    isFeatured: false,
  },
  {
    name: 'Family Pool',
    type: VenueType.POOL,
    location: 'Hyderabad',
    address: 'Gachibowli, Hyderabad 500032',
    capacity: 40,
    price: 8000,
    description:
      'A safe, shallow-end friendly pool for families and kids, with a shaded seating area.',
    amenities: ['Kids Zone', 'Shower', 'Changing Rooms', 'Lifeguard'],
    images: [
      img('1576013551627-0cc20b96c2a7'),
      img('1584132967334-10e028bd69f7'),
    ],
    isFeatured: false,
  },
  {
    name: 'Deluxe Room',
    type: VenueType.ROOM,
    location: 'Bengaluru',
    address: '12 MG Road, Ashok Nagar, Bengaluru 560001',
    capacity: 3,
    price: 3000,
    description:
      'Comfortable deluxe room with a king bed, private balcony and complimentary breakfast.',
    amenities: ['AC', 'WiFi', 'Balcony', 'Breakfast', 'TV'],
    images: [
      img('1590490360182-c33d57733427'),
      img('1611892440504-42a792e24d32'),
    ],
    isFeatured: true,
  },
  {
    name: 'Executive Suite',
    type: VenueType.ROOM,
    location: 'Bengaluru',
    address: '12 MG Road, Ashok Nagar, Bengaluru 560001',
    capacity: 4,
    price: 6500,
    description:
      'A spacious suite with a separate living area, work desk and premium amenities for longer stays.',
    amenities: [
      'AC',
      'WiFi',
      'Living Area',
      'Mini Bar',
      'Breakfast',
      'Bathtub',
    ],
    images: [
      img('1566665797739-1674de7a421a'),
      img('1618773928121-c32242e63f39'),
    ],
    isFeatured: false,
  },
  {
    name: 'Family Room',
    type: VenueType.ROOM,
    location: 'Hyderabad',
    address: 'Gachibowli, Hyderabad 500032',
    capacity: 5,
    price: 4500,
    description:
      'Two queen beds and plenty of space - ideal for families attending events at our venues.',
    amenities: ['AC', 'WiFi', 'TV', 'Breakfast'],
    images: [
      img('1631049307264-da0ec9d70304'),
      img('1582719478250-c89cae4dc85b'),
    ],
    isFeatured: false,
  },
];

const CUSTOMERS = [
  {
    name: 'Demo Customer',
    email: 'customer@eventnest.com',
    phone: '9000000001',
    city: 'Bengaluru',
  },
  {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '9000000002',
    city: 'Bengaluru',
  },
  {
    name: 'Sneha R',
    email: 'sneha@example.com',
    phone: '9000000003',
    city: 'Bengaluru',
  },
  {
    name: 'Vikram M',
    email: 'vikram@example.com',
    phone: '9000000004',
    city: 'Hyderabad',
  },
  {
    name: 'Ananya K',
    email: 'ananya@example.com',
    phone: '9000000005',
    city: 'Chennai',
  },
  {
    name: 'Karthik S',
    email: 'karthik@example.com',
    phone: '9000000006',
    city: 'Bengaluru',
  },
  {
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9000000007',
    city: 'Bengaluru',
  },
  {
    name: 'Rohit Kumar',
    email: 'rohit@example.com',
    phone: '9000000008',
    city: 'Hyderabad',
  },
];

interface BookingSeed {
  customer: string;
  venue: string;
  offset: number;
  length: number;
  guests: number;
  eventType: string;
  status: BookingStatus;
  paid: boolean;
  method?: PaymentMethod;
  review?: { rating: number; comment: string };
}

const BOOKINGS: BookingSeed[] = [
  {
    customer: 'priya@example.com',
    venue: 'Grand Celebration Hall',
    offset: -60,
    length: 1,
    guests: 450,
    eventType: 'Wedding',
    status: BookingStatus.COMPLETED,
    paid: true,
    method: PaymentMethod.UPI,
    review: {
      rating: 5,
      comment:
        'The function hall was perfect for our wedding. Excellent service and beautiful venue. Highly recommended!',
    },
  },
  {
    customer: 'rohit@example.com',
    venue: 'Infinity Swimming Pool',
    offset: -45,
    length: 1,
    guests: 30,
    eventType: 'Family Outing',
    status: BookingStatus.COMPLETED,
    paid: true,
    method: PaymentMethod.CARD,
    review: {
      rating: 5,
      comment:
        'The swimming pool was clean and well-maintained. Our family had a great time. We will definitely book again.',
    },
  },
  {
    customer: 'sneha@example.com',
    venue: 'Deluxe Room',
    offset: -30,
    length: 2,
    guests: 2,
    eventType: 'Weekend Stay',
    status: BookingStatus.COMPLETED,
    paid: true,
    method: PaymentMethod.UPI,
    review: {
      rating: 5,
      comment:
        'Comfortable rooms and great hospitality. Everything was well-organized and the booking process was very easy!',
    },
  },
  {
    customer: 'vikram@example.com',
    venue: 'Royal Palace Hall',
    offset: -20,
    length: 1,
    guests: 200,
    eventType: 'Corporate Event',
    status: BookingStatus.COMPLETED,
    paid: true,
    method: PaymentMethod.BANK_TRANSFER,
    review: {
      rating: 4,
      comment:
        'We hosted our annual company meet here. The AV setup, catering and support team were all top-notch.',
    },
  },
  {
    customer: 'customer@eventnest.com',
    venue: 'Resort Swimming Pool',
    offset: -50,
    length: 1,
    guests: 40,
    eventType: 'Private Event',
    status: BookingStatus.COMPLETED,
    paid: true,
    method: PaymentMethod.UPI,
  },
  {
    customer: 'customer@eventnest.com',
    venue: 'Grand Imperial Hall',
    offset: 5,
    length: 1,
    guests: 250,
    eventType: 'Wedding',
    status: BookingStatus.CONFIRMED,
    paid: true,
    method: PaymentMethod.CARD,
  },
  {
    customer: 'customer@eventnest.com',
    venue: 'Deluxe Room',
    offset: 12,
    length: 2,
    guests: 2,
    eventType: 'Stay',
    status: BookingStatus.PENDING,
    paid: false,
  },
  {
    customer: 'customer@eventnest.com',
    venue: 'Executive Suite',
    offset: 25,
    length: 3,
    guests: 2,
    eventType: 'Stay',
    status: BookingStatus.CANCELLED,
    paid: false,
  },
  {
    customer: 'rahul@example.com',
    venue: 'Grand Celebration Hall',
    offset: 8,
    length: 1,
    guests: 400,
    eventType: 'Reception',
    status: BookingStatus.CONFIRMED,
    paid: true,
    method: PaymentMethod.NET_BANKING,
  },
  {
    customer: 'sneha@example.com',
    venue: 'Resort Swimming Pool',
    offset: 10,
    length: 1,
    guests: 35,
    eventType: 'Birthday Party',
    status: BookingStatus.PENDING,
    paid: false,
  },
  {
    customer: 'vikram@example.com',
    venue: 'Deluxe Room',
    offset: 3,
    length: 2,
    guests: 2,
    eventType: 'Stay',
    status: BookingStatus.CONFIRMED,
    paid: true,
    method: PaymentMethod.UPI,
  },
  {
    customer: 'ananya@example.com',
    venue: 'Royal Palace Hall',
    offset: 15,
    length: 1,
    guests: 250,
    eventType: 'Engagement',
    status: BookingStatus.PENDING,
    paid: false,
  },
  {
    customer: 'karthik@example.com',
    venue: 'Family Pool',
    offset: 18,
    length: 1,
    guests: 25,
    eventType: 'Family Outing',
    status: BookingStatus.CANCELLED,
    paid: false,
  },
  {
    customer: 'ananya@example.com',
    venue: 'Emerald Convention Centre',
    offset: 0,
    length: 1,
    guests: 180,
    eventType: 'Corporate Event',
    status: BookingStatus.CONFIRMED,
    paid: true,
    method: PaymentMethod.BANK_TRANSFER,
  },
];

const code = () =>
  `EN${randomBytes(4).toString('hex').toUpperCase().slice(0, 7)}`;

async function seed() {
  await dataSource.initialize();
  const users = dataSource.getRepository(User);
  const venues = dataSource.getRepository(Venue);
  const bookings = dataSource.getRepository(Booking);
  const payments = dataSource.getRepository(Payment);
  const reviews = dataSource.getRepository(Review);
  const tickets = dataSource.getRepository(SupportTicket);

  const adminEmail = (
    process.env.ADMIN_EMAIL || 'admin@eventnest.com'
  ).toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const existingAdmin = await users.findOne({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log(`Admin ${adminEmail} already exists - skipped`);
  } else {
    await users.save(
      users.create({
        name: process.env.ADMIN_NAME || 'EventNest Admin',
        email: adminEmail,
        phone: process.env.ADMIN_PHONE || null,
        role: UserRole.ADMIN,
        passwordHash: await bcrypt.hash(adminPassword, 10),
      }),
    );
    console.log(`Admin created: ${adminEmail} / ${adminPassword}`);
  }

  if ((await venues.count()) > 0) {
    console.log('Venues already exist - demo data skipped');
    await dataSource.destroy();
    return;
  }

  const savedVenues = await venues.save(
    VENUES.map(v =>
      venues.create({
        ...v,
        slug: slugify(v.name),
        priceUnit: v.type === VenueType.ROOM ? PriceUnit.NIGHT : PriceUnit.DAY,
        isActive: true,
      }),
    ),
  );
  console.log(`Created ${savedVenues.length} venues`);

  const customerHash = await bcrypt.hash('Customer@123', 10);
  const savedCustomers = await users.save(
    CUSTOMERS.map(c =>
      users.create({
        ...c,
        role: UserRole.CUSTOMER,
        passwordHash: customerHash,
      }),
    ),
  );
  console.log(
    `Created ${savedCustomers.length} customers (password: Customer@123)`,
  );

  const today = todayISO();
  for (const seedBooking of BOOKINGS) {
    const venue = savedVenues.find(v => v.name === seedBooking.venue)!;
    const customer = savedCustomers.find(
      c => c.email === seedBooking.customer,
    )!;
    const startDate = addDays(today, seedBooking.offset);
    const isNight = venue.priceUnit === PriceUnit.NIGHT;
    const endDate = addDays(
      startDate,
      isNight ? seedBooking.length : seedBooking.length - 1,
    );
    const units = isNight
      ? diffDays(startDate, endDate)
      : diffDays(startDate, endDate) + 1;
    const baseAmount = venue.price * units;
    const gstAmount = Math.round(baseAmount * GST) / 100;
    const totalAmount = baseAmount + gstAmount;
    const createdAt = new Date(`${addDays(startDate, -14)}T10:00:00`);

    const booking = await bookings.save(
      bookings.create({
        bookingCode: code(),
        customerId: customer.id,
        venueId: venue.id,
        startDate,
        endDate,
        units,
        guests: seedBooking.guests,
        eventType: seedBooking.eventType,
        contactName: customer.name,
        contactPhone: customer.phone!,
        notes: null,
        unitPrice: venue.price,
        baseAmount,
        gstPercent: GST,
        gstAmount,
        totalAmount,
        status: seedBooking.status,
        paymentStatus: seedBooking.paid
          ? PaymentStatus.PAID
          : PaymentStatus.UNPAID,
        cancelledAt:
          seedBooking.status === BookingStatus.CANCELLED ? createdAt : null,
        cancellationReason:
          seedBooking.status === BookingStatus.CANCELLED
            ? 'Change of plans'
            : null,
        createdAt,
      }),
    );

    if (seedBooking.paid) {
      await payments.save(
        payments.create({
          bookingId: booking.id,
          amount: totalAmount,
          method: seedBooking.method ?? PaymentMethod.UPI,
          status: TransactionStatus.SUCCESS,
          transactionRef: `TXN${randomBytes(6).toString('hex').toUpperCase()}`,
          paidAt: new Date(createdAt.getTime() + 60 * 60 * 1000),
        }),
      );
    }
    if (seedBooking.review) {
      await reviews.save(
        reviews.create({
          bookingId: booking.id,
          venueId: venue.id,
          customerId: customer.id,
          ...seedBooking.review,
        }),
      );
    }
  }
  console.log(`Created ${BOOKINGS.length} bookings with payments and reviews`);

  for (const venue of savedVenues) {
    const row = await reviews
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.venueId = :id', { id: venue.id })
      .getRawOne<{ avg: string | null; count: string }>();
    await venues.update(venue.id, {
      rating: row?.avg ? Math.round(Number(row.avg) * 10) / 10 : 0,
      reviewCount: Number(row?.count ?? 0),
    });
  }

  const demo = savedCustomers[0];
  await tickets.save([
    tickets.create({
      userId: demo.id,
      name: demo.name,
      email: demo.email,
      phone: demo.phone,
      subject: 'Decoration options for my wedding booking',
      message:
        'Hi, can you share the decoration packages available for Grand Imperial Hall?',
      status: TicketStatus.IN_PROGRESS,
      adminReply:
        'Hello! We have three decor packages starting at Rs 25,000. Our team will call you today.',
      repliedAt: new Date(),
    }),
    tickets.create({
      name: 'Meera Iyer',
      email: 'meera@example.com',
      phone: '9000000010',
      subject: 'Corporate offsite enquiry',
      message:
        'We are planning a 2-day offsite for 120 people next month. Please share availability.',
    }),
  ]);
  console.log('Created support tickets');

  await dataSource.destroy();
  console.log('Seed completed');
}

seed().catch(async error => {
  console.error('Seed failed:', error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});
