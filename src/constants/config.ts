export const APP_CONFIG = {
  name: 'CineSecure',
  tagline: 'Book your next cinematic escape',
  description:
    'Discover movies, choose your showtime and book your seats with CineSecure.',
  version: '1.0.0',
  supportEmail: 'support@cinesecure.app',
  currency: 'INR',
  currencySymbol: '₹',
  seatLockMinutes: 5,
  tokenRefreshThresholdMs: 5 * 60 * 1000,
} as const;

export const API_ROUTES = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    profile: '/auth/profile',
  },
  movies: {
    base: '/movies',
    detail: (id: string) => `/movies/${id}`,
  },
  theaters: {
    base: '/theaters',
    detail: (id: string) => `/theaters/${id}`,
  },
  shows: {
    base: '/shows',
    detail: (id: string) => `/shows/${id}`,
    seats: (id: string) => `/shows/${id}/seats`,
    lock: (id: string) => `/shows/${id}/lock`,
  },
  bookings: {
    base: '/bookings',
    detail: (id: string) => `/bookings/${id}`,
    cancel: (id: string) => `/bookings/${id}/cancel`,
    ticket: (id: string) => `/bookings/${id}/ticket`,
  },
  payments: {
    base: '/payments',
    process: '/payments/process',
    refund: (id: string) => `/payments/${id}/refund`,
  },
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    security: '/admin/security',
    reports: '/admin/reports',
  },
  owner: {
    dashboard: '/owner/dashboard',
    theaters: '/owner/theaters',
    shows: '/owner/shows',
    bookings: '/owner/bookings',
  },
} as const;

export const STORAGE_KEYS = {
  accessToken: 'cs_at',
  refreshToken: 'cs_rt',
  user: 'cs_user',
  theme: 'cs_theme',
} as const;
