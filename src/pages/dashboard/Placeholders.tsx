import { useEffect, useState } from 'react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  Film,
  ShieldAlert,
  Ticket,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge, Button, Card, Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  formatCurrency,
  formatDate,
  formatTime,
} from '@/utils/format';

/* =========================================================
   ADMIN / OWNER PAGES
   ========================================================= */

interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  created_at: string | null;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .eq('role', 'customer')
      .order('created_at', {
        ascending: false,
      });

    if (queryError) {
      console.error('Failed to load users:', queryError);
      setUsers([]);
      setError(queryError.message);
    } else {
      setUsers((data ?? []) as AdminUser[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <Badge
          tone="primary"
          variant="soft"
        >
          CineSecure
        </Badge>

        <h1 className="mt-3 font-display text-3xl font-bold text-ink-50">
          Users
        </h1>

        <p className="mt-1 text-ink-400">
          Manage registered CineSecure customers.
        </p>
      </div>

      <Card>
        {loading ? (
          <Spinner className="py-12" />
        ) : error ? (
          <div className="rounded-xl border border-error-500/20 bg-error-500/5 p-5 text-sm text-error-300">
            <p>{error}</p>

            <button
              onClick={() => void loadUsers()}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
            <Users className="mx-auto h-11 w-11 text-ink-600" />

            <h2 className="mt-4 font-display text-xl font-semibold text-ink-100">
              No customers found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
              Registered customer accounts will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-ink-500">
                  <th className="px-5 py-4 font-medium">
                    Name
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Email
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Role
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Registered
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-white/5 transition hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500/10 font-semibold text-primary-300">
                          {(customer.full_name?.[0] ??
                            customer.email?.[0] ??
                            'U'
                          ).toUpperCase()}
                        </div>

                        <div>
                          <p className="font-medium text-ink-100">
                            {customer.full_name ||
                              'Unnamed user'}
                          </p>

                          <p className="text-xs text-ink-600">
                            Customer
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-ink-300">
                      {customer.email || 'No email'}
                    </td>

                    <td className="px-5 py-4">
                      <Badge
                        tone="primary"
                        variant="soft"
                      >
                        Customer
                      </Badge>
                    </td>

                    <td className="px-5 py-4 text-sm text-ink-400">
                      {customer.created_at
                        ? formatDate(customer.created_at)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export const AdminMoviesPage = () => (
  <CleanPlaceholder
    title="Movies"
    description="Manage the movie catalogue."
    icon={Film}
  />
);

export const AdminReportsPage = () => (
  <CleanPlaceholder
    title="Reports & Analytics"
    description="View booking and platform analytics."
    icon={BarChart3}
  />
);

export const OwnerTheatersPage = () => (
  <CleanPlaceholder
    title="Theaters"
    description="Manage cinema locations and screens."
    icon={Building2}
  />
);

export const OwnerShowsPage = () => (
  <CleanPlaceholder
    title="Shows"
    description="Manage movie showtimes."
    icon={CalendarDays}
  />
);

export const OwnerBookingsPage = () => (
  <CleanPlaceholder
    title="Bookings"
    description="View bookings for your cinema."
    icon={Ticket}
  />
);

export const SecurityPlaceholder = () => (
  <CleanPlaceholder
    title="Security"
    description="Monitor CineSecure security activity."
    icon={ShieldAlert}
  />
);

/* =========================================================
   CUSTOMER BOOKINGS
   ========================================================= */

interface BookingRow {
  id: string;
  booking_reference: string;
  total_amount: number;
  status: string | null;
  payment_status: string | null;
  booked_at: string;
  show_id: string;
}

interface ShowRow {
  id: string;
  start_time: string;
  movies:
    | { title: string }[]
    | { title: string }
    | null;
  screens:
    | { name: string }[]
    | { name: string }
    | null;
}

interface BookingItem extends BookingRow {
  movieTitle: string;
  screenName: string;
  startTime: string | null;
  seats: string[];
}

export function CustomerBookingsPage() {
  return <CustomerBookingList historyOnly={false} />;
}

export function CustomerHistoryPage() {
  return <CustomerBookingList historyOnly />;
}

function CustomerBookingList({
  historyOnly,
}: {
  historyOnly: boolean;
}) {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadBookings(user.id);
    }
  }, [user?.id]);

  async function loadBookings(userId: string) {
    setLoading(true);
    setError(null);

    try {
      /* ---------------------------------------------
         Get user's bookings
      --------------------------------------------- */

      const {
        data: bookingData,
        error: bookingError,
      } = await supabase
        .from('bookings')
        .select(
          'id, booking_reference, total_amount, status, payment_status, booked_at, show_id'
        )
        .eq('user_id', userId)
        .order('booked_at', {
          ascending: false,
        });

      if (bookingError) {
        throw new Error(bookingError.message);
      }

      const rows = (bookingData ?? []) as BookingRow[];

      if (rows.length === 0) {
        setBookings([]);
        return;
      }

      const showIds = [
        ...new Set(
          rows.map((booking) => booking.show_id)
        ),
      ];

      const bookingIds = rows.map(
        (booking) => booking.id
      );

      /* ---------------------------------------------
         Get shows and seats
      --------------------------------------------- */

      const [
        { data: showData, error: showError },
        { data: bookingSeatData, error: seatError },
      ] = await Promise.all([
        supabase
          .from('shows')
          .select(
            'id, start_time, movies(title), screens(name)'
          )
          .in('id', showIds),

        supabase
          .from('booking_seats')
          .select('booking_id, seat_id')
          .in('booking_id', bookingIds),
      ]);

      if (showError) {
        throw new Error(showError.message);
      }

      if (seatError) {
        throw new Error(seatError.message);
      }

      /* ---------------------------------------------
         Create show lookup
      --------------------------------------------- */

      const showMap = new Map<string, ShowRow>();

      for (const show of (showData ?? []) as ShowRow[]) {
        showMap.set(show.id, show);
      }

      /* ---------------------------------------------
         Get seat numbers
      --------------------------------------------- */

      const seatIds = [
        ...new Set(
          (bookingSeatData ?? [])
            .map(
              (seat) => seat.seat_id as string
            )
            .filter(Boolean)
        ),
      ];

      const seatMap = new Map<string, string>();

      if (seatIds.length > 0) {
        const {
          data: screenSeatData,
          error: screenSeatError,
        } = await supabase
          .from('screen_seats')
          .select('id, seat_number')
          .in('id', seatIds);

        if (screenSeatError) {
          throw new Error(
            screenSeatError.message
          );
        }

        for (const seat of screenSeatData ?? []) {
          seatMap.set(
            seat.id as string,
            seat.seat_number as string
          );
        }
      }

      /* ---------------------------------------------
         Group seats by booking
      --------------------------------------------- */

      const seatsByBooking =
        new Map<string, string[]>();

      for (const seat of bookingSeatData ?? []) {
        const bookingId =
          seat.booking_id as string;

        const seatNumber = seatMap.get(
          seat.seat_id as string
        );

        if (!seatNumber) continue;

        const current =
          seatsByBooking.get(bookingId) ?? [];

        current.push(seatNumber);

        seatsByBooking.set(
          bookingId,
          current
        );
      }

      /* ---------------------------------------------
         Build final booking objects
      --------------------------------------------- */

      const items: BookingItem[] = rows.map(
        (booking) => {
          const show = showMap.get(
            booking.show_id
          );

          const movie = Array.isArray(
            show?.movies
          )
            ? show.movies[0]
            : show?.movies;

          const screen = Array.isArray(
            show?.screens
          )
            ? show.screens[0]
            : show?.screens;

          const seats = (
            seatsByBooking.get(booking.id) ?? []
          ).sort((a, b) =>
            a.localeCompare(
              b,
              undefined,
              { numeric: true }
            )
          );

          return {
            ...booking,
            movieTitle:
              movie?.title ?? 'Movie',
            screenName:
              screen?.name ?? 'Screen',
            startTime:
              show?.start_time ?? null,
            seats,
          };
        }
      );

      setBookings(items);
    } catch (err) {
      console.error(
        'Failed to load bookings:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your bookings.'
      );
    } finally {
      setLoading(false);
    }
  }

  /* ---------------------------------------------
     Filter current bookings / history
  --------------------------------------------- */

  const now = Date.now();

  const visibleBookings = bookings.filter(
    (booking) => {
      if (!booking.startTime) {
        return historyOnly;
      }

      const showTime = new Date(
        booking.startTime
      ).getTime();

      if (historyOnly) {
        return showTime < now;
      }

      return showTime >= now;
    }
  );

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div>
        <Badge
          tone="primary"
          variant="soft"
        >
          My tickets
        </Badge>

        <h1 className="mt-3 font-display text-3xl font-bold text-ink-50">
          {historyOnly
            ? 'Booking history'
            : 'My bookings'}
        </h1>

        <p className="mt-1 text-ink-400">
          {historyOnly
            ? 'Your previous movie bookings.'
            : 'Your upcoming movie tickets.'}
        </p>
      </div>

      {/* Content */}
      <Card>

        {loading ? (
          <Spinner className="py-12" />
        ) : error ? (

          <div className="rounded-xl border border-error-500/20 bg-error-500/5 p-5 text-sm text-error-300">
            <p>{error}</p>

            <button
              onClick={() =>
                user?.id &&
                loadBookings(user.id)
              }
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>

        ) : visibleBookings.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">

            <Ticket className="mx-auto h-11 w-11 text-ink-600" />

            <h2 className="mt-4 font-display text-xl font-semibold text-ink-100">
              {historyOnly
                ? 'No booking history'
                : 'No upcoming bookings'}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
              {historyOnly
                ? 'Your completed movie bookings will appear here.'
                : 'Book a movie and your upcoming ticket will appear here.'}
            </p>

            <Link
              to="/movies"
              className="mt-5 inline-block"
            >
              <Button>
                Browse movies
              </Button>
            </Link>

          </div>

        ) : (

          <div className="space-y-3">

            {visibleBookings.map(
              (booking) => (
                <div
                  key={booking.id}
                  className="rounded-xl border border-white/5 bg-white/[0.035] p-4 transition hover:border-white/10 hover:bg-white/[0.05]"
                >

                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    {/* Movie */}
                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="text-base font-semibold text-ink-100">
                          {booking.movieTitle}
                        </h3>

                        <Badge
                          tone={
                            booking.status ===
                            'confirmed'
                              ? 'success'
                              : booking.status ===
                                'cancelled'
                              ? 'error'
                              : 'warning'
                          }
                          variant="soft"
                        >
                          {booking.status ??
                            'pending'}
                        </Badge>

                      </div>

                      {/* Show details */}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">

                        {booking.startTime && (
                          <span>
                            {formatDate(
                              booking.startTime
                            )}{' '}
                            ·{' '}
                            {formatTime(
                              booking.startTime
                            )}
                          </span>
                        )}

                        <span>
                          {booking.screenName}
                        </span>

                        {booking.seats.length >
                          0 && (
                          <span>
                            Seats{' '}
                            {booking.seats.join(
                              ', '
                            )}
                          </span>
                        )}

                      </div>

                      {/* Reference */}
                      <p className="mt-2 text-xs text-ink-600">
                        Booking{' '}
                        {booking.booking_reference}
                      </p>

                    </div>

                    {/* Price */}
                    <div className="flex shrink-0 items-center justify-between gap-4 md:flex-col md:items-end">

                      <span className="text-base font-bold text-ink-100">
                        {formatCurrency(
                          Number(
                            booking.total_amount
                          )
                        )}
                      </span>

                      <span className="text-xs text-ink-600">
                        {formatDate(
                          booking.booked_at
                        )}
                      </span>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </Card>

    </div>
  );
}

/* =========================================================
   CLEAN PLACEHOLDER
   ========================================================= */

function CleanPlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof Users;
}) {
  return (
    <div className="space-y-6 animate-fadeIn">

      <div>
        <Badge
          tone="primary"
          variant="soft"
        >
          CineSecure
        </Badge>

        <h1 className="mt-3 font-display text-3xl font-bold text-ink-50">
          {title}
        </h1>

        <p className="mt-1 text-ink-400">
          {description}
        </p>
      </div>

      <Card className="p-10 text-center">

        <Icon className="mx-auto h-10 w-10 text-ink-600" />

        <p className="mt-4 text-sm text-ink-500">
          This area is ready for live data.
        </p>

      </Card>

    </div>
  );
}