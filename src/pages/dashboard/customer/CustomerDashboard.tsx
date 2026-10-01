import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock3, Ticket, WalletCards } from 'lucide-react';

import { Card, CardHeader, Badge, Button, Spinner } from '@/components/ui';
import { StatCard } from '@/components/shared/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate, formatTime } from '@/utils/format';
import { supabase } from '@/lib/supabase';

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

export function CustomerDashboard() {
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
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(
          'id, booking_reference, total_amount, status, payment_status, booked_at, show_id'
        )
        .eq('user_id', userId)
        .order('booked_at', { ascending: false });

      if (bookingError) {
        throw new Error(bookingError.message);
      }

      const rows = (bookingData ?? []) as BookingRow[];

      if (rows.length === 0) {
        setBookings([]);
        return;
      }

      const showIds = [...new Set(rows.map((booking) => booking.show_id))];
      const bookingIds = rows.map((booking) => booking.id);

      const [
        { data: showData, error: showError },
        { data: seatData, error: seatError },
      ] = await Promise.all([
        supabase
          .from('shows')
          .select('id, start_time, movies(title), screens(name)')
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

      const showMap = new Map<string, ShowRow>();

      for (const show of (showData ?? []) as ShowRow[]) {
        showMap.set(show.id, show);
      }

      const seatRows = seatData ?? [];

      const seatIds = [
        ...new Set(
          seatRows
            .map((seat) => seat.seat_id as string)
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
          throw new Error(screenSeatError.message);
        }

        for (const seat of screenSeatData ?? []) {
          seatMap.set(
            seat.id as string,
            seat.seat_number as string
          );
        }
      }

      const seatsByBooking = new Map<string, string[]>();

      for (const seat of seatRows) {
        const bookingId = seat.booking_id as string;
        const seatId = seat.seat_id as string;
        const seatNumber = seatMap.get(seatId);

        if (!seatNumber) continue;

        const current = seatsByBooking.get(bookingId) ?? [];
        current.push(seatNumber);
        seatsByBooking.set(bookingId, current);
      }

      const items: BookingItem[] = rows.map((booking) => {
        const show = showMap.get(booking.show_id);

        const movie = Array.isArray(show?.movies)
          ? show?.movies[0]
          : show?.movies;

        const screen = Array.isArray(show?.screens)
          ? show?.screens[0]
          : show?.screens;

        const seats = (
          seatsByBooking.get(booking.id) ?? []
        ).sort((a, b) =>
          a.localeCompare(b, undefined, {
            numeric: true,
          })
        );

        return {
          ...booking,
          movieTitle: movie?.title ?? 'Movie',
          screenName: screen?.name ?? 'Screen',
          startTime: show?.start_time ?? null,
          seats,
        };
      });

      setBookings(items);
    } catch (err) {
      console.error(
        'Failed to load customer dashboard:',
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

  const confirmedBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === 'confirmed'
      ),
    [bookings]
  );

  const upcomingBookings = useMemo(() => {
    const now = Date.now();

    return confirmedBookings.filter((booking) => {
      if (!booking.startTime) return false;

      return (
        new Date(booking.startTime).getTime() > now
      );
    });
  }, [confirmedBookings]);

  const totalSpent = useMemo(
    () =>
      confirmedBookings.reduce(
        (total, booking) =>
          total +
          Number(booking.total_amount || 0),
        0
      ),
    [confirmedBookings]
  );

  const cancelledBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === 'cancelled'
      ).length,
    [bookings]
  );

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div>
        <Badge tone="primary" variant="soft">
          My account
        </Badge>

        <h1 className="mt-3 font-display text-3xl font-bold text-ink-50">
          Welcome back, {user?.name}
        </h1>

        <p className="mt-1 text-ink-400">
          Manage your movie tickets and bookings.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        <StatCard
          label="Total Bookings"
          value={String(bookings.length)}
          icon={Ticket}
          tone="primary"
        />

        <StatCard
          label="Upcoming"
          value={String(upcomingBookings.length)}
          icon={Calendar}
          tone="accent"
        />

        <StatCard
          label="Total Spent"
          value={formatCurrency(totalSpent)}
          icon={WalletCards}
          tone="secondary"
        />

        <StatCard
          label="Cancelled"
          value={String(cancelledBookings)}
          icon={Clock3}
          tone="warning"
        />

      </div>

      {/* Bookings */}
      <Card>
        <CardHeader
          title="Your bookings"
          subtitle="Your recent ticket activity"
          action={
            <Ticket className="h-5 w-5 text-ink-500" />
          }
        />

        {loading ? (
          <Spinner className="py-12" />

        ) : error ? (

          <div className="rounded-xl border border-error-500/20 bg-error-500/5 p-5 text-sm text-error-300">
            <p>{error}</p>

            <button
              onClick={() =>
                user?.id && loadBookings(user.id)
              }
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>

        ) : bookings.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">

            <Ticket className="mx-auto h-10 w-10 text-ink-600" />

            <h3 className="mt-4 font-display text-xl font-semibold text-ink-100">
              No bookings yet
            </h3>

            <p className="mt-2 text-sm text-ink-500">
              Your movie tickets will appear here after you complete a booking.
            </p>

            <Button
              className="mt-5"
              onClick={() => {
                window.location.href = '/movies';
              }}
            >
              Browse movies
            </Button>

          </div>

        ) : (

          <div className="space-y-3">

            {bookings.slice(0, 6).map((booking) => {

              const isUpcoming =
                booking.status === 'confirmed' &&
                booking.startTime &&
                new Date(booking.startTime).getTime() >
                  Date.now();

              return (
                <div
                  key={booking.id}
                  className="rounded-xl border border-white/5 bg-white/[0.035] p-4 transition-colors hover:border-white/10 hover:bg-white/[0.05]"
                >

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    {/* Movie information */}
                    <div className="min-w-0">

                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-ink-100">
                          {booking.movieTitle}
                        </p>

                        <Badge
                          tone={
                            booking.status === 'confirmed'
                              ? 'success'
                              : booking.status === 'cancelled'
                              ? 'error'
                              : 'warning'
                          }
                          variant="soft"
                        >
                          {booking.status || 'pending'}
                        </Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-500">

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

                        {booking.seats.length > 0 && (
                          <span>
                            Seats{' '}
                            {booking.seats.join(', ')}
                          </span>
                        )}

                      </div>

                      <p className="mt-2 text-xs text-ink-600">
                        Booking{' '}
                        {booking.booking_reference}
                        {' · '}
                        Booked{' '}
                        {formatDate(
                          booking.booked_at
                        )}
                      </p>

                    </div>

                    {/* Amount */}
                    <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">

                      <span className="text-base font-bold text-ink-100">
                        {formatCurrency(
                          Number(
                            booking.total_amount
                          )
                        )}
                      </span>

                      {isUpcoming && (
                        <span className="text-xs font-medium text-primary-300">
                          Upcoming show
                        </span>
                      )}

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}
      </Card>

      {/* CTA */}
      {bookings.length > 0 && (
        <Card className="bg-gradient-to-br from-primary-500/5 to-secondary-500/5">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm font-semibold text-primary-300">
                Movie night?
              </p>

              <h2 className="mt-1 font-display text-2xl font-bold text-ink-50">
                Find your next show.
              </h2>
            </div>

            <Button
              onClick={() => {
                window.location.href = '/shows';
              }}
            >
              View showtimes
            </Button>

          </div>

        </Card>
      )}

    </div>
  );
}