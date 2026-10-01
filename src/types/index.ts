export type UserRole = 'customer' | 'owner' | 'admin';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  isBlocked?: boolean;
  createdAt?: string;
}

export interface AuthSession {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export interface Movie {
  id: string;
  title: string;
  posterUrl: string;
  genre: string[];
  language: string;
  durationMin: number;
  releaseDate: string;
  rating: number;
  trailerUrl?: string;
  description: string;
  cast?: string[];
  director?: string;
  status: 'now_showing' | 'upcoming' | 'archived';
}

export interface Theater {
  id: string;
  name: string;
  address: string;
  city: string;
  screensCount: number;
  ownerId: string;
}

export interface Screen {
  id: string;
  theaterId: string;
  name: string;
  rows: number;
  cols: number;
}

export interface Show {
  id: string;
  movieId: string;
  theaterId: string;
  screenId: string;
  showTime: string;
  ticketPrice: number;
  availableSeats: number;
  totalSeats: number;
}

export type SeatStatus = 'available' | 'locked' | 'booked' | 'selected';

export interface Seat {
  id: string;
  row: string;
  number: number;
  status: SeatStatus;
  price: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'failed';

export interface Booking {
  id: string;
  bookingRef: string;
  userId: string;
  showId: string;
  movieTitle: string;
  theaterName: string;
  screenName: string;
  showTime: string;
  seats: string[];
  totalAmount: number;
  status: BookingStatus;
  qrCodeUrl?: string;
  createdAt: string;
}

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  transactionId: string;
  createdAt: string;
}

export interface SecurityLog {
  id: string;
  eventType:
    | 'failed_login'
    | 'blocked_ip'
    | 'rate_limited'
    | 'jwt_failure'
    | 'rbac_denied'
    | 'booking_created'
    | 'payment_success'
    | 'payment_failed'
    | 'user_blocked'
    | 'seat_lock';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  ip?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalMovies: number;
  totalBookings: number;
  totalRevenue: number;
  recentBookings: Booking[];
  failedLogins: number;
  blockedRequests: number;
  apiUsage: number;
}

export interface SecurityDashboard {
  failedLogins: number;
  blockedIps: number;
  rateLimitedRequests: number;
  jwtFailures: number;
  recentEvents: SecurityLog[];
  auditLogs: SecurityLog[];
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
