import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Film,
  RefreshCw,
  Ticket,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react';

import { Badge, Button, Card, CardHeader, Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/utils/format';

type ReportRange = '7d' | '30d' | 'all';

interface BookingRow {
  id: string;
  booking_reference: string | null;
  total_amount: number | null;
  status: string | null;
  payment_status: string | null;
  booked_at: string;
  show_id: string;
}

interface ShowRow {
  id: string;
  movie_id: string;
  start_time: string;
}

interface MovieRow {
  id: string;
  title: string;
}

interface BookingSeatRow {
  booking_id: string;
  seat_id: string;
}

interface MovieSummary {
  title: string;
  bookings: number;
  tickets: number;
  revenue: number;
}

const RANGE_LABELS: Record<ReportRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  all: 'All time',
};

function getRangeStart(range: ReportRange): string | null {
  if (range === 'all') return null;

  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (range === '7d' ? 6 : 29));

  return date.toISOString();
}

function isRevenueBooking(booking: BookingRow): boolean {
  return (
    booking.status === 'confirmed' &&
    booking.payment_status !== 'failed' &&
    booking.payment_status !== 'refunded'
  );
}

function statusTone(
  status: string | null,
): 'success' | 'warning' | 'error' | 'neutral' {
  if (status === 'confirmed') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'cancelled' || status === 'failed') return 'error';
  return 'neutral';
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

export function AdminReportsPage() {
  const [range, setRange] = useState<ReportRange>('30d');
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [shows, setShows] = useState<ShowRow[]>([]);
  const [movies, setMovies] = useState<MovieRow[]>([]);
  const [bookingSeats, setBookingSeats] = useState<BookingSeatRow[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [movieCount, setMovieCount] = useState(0);
  const [showCount, setShowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setError(null);

    try {
      const rangeStart = getRangeStart(range);

      const bookingsQuery = supabase
        .from('bookings')
        .select(
          'id, booking_reference, total_amount, status, payment_status, booked_at, show_id',
        )
        .order('booked_at', { ascending: false });

      if (rangeStart) {
        bookingsQuery.gte('booked_at', rangeStart);
      }

      const [
        bookingsResult,
        showsResult,
        moviesResult,
        usersResult,
        allMoviesResult,
        allShowsResult,
      ] = await Promise.all([
        bookingsQuery,
        supabase.from('shows').select('id, movie_id, start_time'),
        supabase.from('movies').select('id, title').order('title'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('movies').select('id', { count: 'exact', head: true }),
        supabase.from('shows').select('id', { count: 'exact', head: true }),
      ]);

      if (bookingsResult.error) throw bookingsResult.error;
      if (showsResult.error) throw showsResult.error;
      if (moviesResult.error) throw moviesResult.error;
      if (usersResult.error) throw usersResult.error;
      if (allMoviesResult.error) throw allMoviesResult.error;
      if (allShowsResult.error) throw allShowsResult.error;

      const bookingRows = (bookingsResult.data ?? []) as BookingRow[];
      const bookingIds = bookingRows.map((booking) => booking.id);

      let seatRows: BookingSeatRow[] = [];

      if (bookingIds.length > 0) {
        const { data, error: seatError } = await supabase
          .from('booking_seats')
          .select('booking_id, seat_id')
          .in('booking_id', bookingIds);

        if (seatError) throw seatError;
        seatRows = (data ?? []) as BookingSeatRow[];
      }

      setBookings(bookingRows);
      setShows((showsResult.data ?? []) as ShowRow[]);
      setMovies((moviesResult.data ?? []) as MovieRow[]);
      setBookingSeats(seatRows);
      setUserCount(usersResult.count ?? 0);
      setMovieCount(allMoviesResult.count ?? 0);
      setShowCount(allShowsResult.count ?? 0);
    } catch (err) {
      console.error('Unable to load admin reports:', err);
      setError(err instanceof Error ? err.message : 'Unable to load reports.');
      setBookings([]);
      setBookingSeats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    setLoading(true);
    void loadReports();
  }, [loadReports]);

  const showMap = useMemo(
    () => new Map(shows.map((show) => [show.id, show])),
    [shows],
  );

  const movieMap = useMemo(
    () => new Map(movies.map((movie) => [movie.id, movie])),
    [movies],
  );

  const ticketsByBooking = useMemo(() => {
    const map = new Map<string, number>();

    for (const seat of bookingSeats) {
      map.set(seat.booking_id, (map.get(seat.booking_id) ?? 0) + 1);
    }

    return map;
  }, [bookingSeats]);

  const confirmedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'confirmed'),
    [bookings],
  );

  const revenue = useMemo(
    () =>
      bookings
        .filter(isRevenueBooking)
        .reduce((sum, booking) => sum + Number(booking.total_amount ?? 0), 0),
    [bookings],
  );

  const ticketsSold = useMemo(
    () =>
      confirmedBookings.reduce(
        (sum, booking) => sum + (ticketsByBooking.get(booking.id) ?? 0),
        0,
      ),
    [confirmedBookings, ticketsByBooking],
  );

  const averageBookingValue = confirmedBookings.length
    ? revenue / confirmedBookings.length
    : 0;

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const booking of bookings) {
      const status = booking.status ?? 'unknown';
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }

    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [bookings]);

  const movieSummaries = useMemo(() => {
    const map = new Map<string, MovieSummary>();

    for (const booking of confirmedBookings) {
      const show = showMap.get(booking.show_id);
      if (!show) continue;

      const movie = movieMap.get(show.movie_id);
      if (!movie) continue;

      const current = map.get(movie.id) ?? {
        title: movie.title,
        bookings: 0,
        tickets: 0,
        revenue: 0,
      };

      current.bookings += 1;
      current.tickets += ticketsByBooking.get(booking.id) ?? 0;
      current.revenue += isRevenueBooking(booking)
        ? Number(booking.total_amount ?? 0)
        : 0;

      map.set(movie.id, current);
    }

    return Array.from(map.values())
      .sort((a, b) => {
        if (b.revenue !== a.revenue) return b.revenue - a.revenue;
        return b.tickets - a.tickets;
      })
      .slice(0, 5);
  }, [confirmedBookings, movieMap, showMap, ticketsByBooking]);

  const dailyTrend = useMemo(() => {
    if (range === 'all') {
      const grouped = new Map<string, { label: string; bookings: number; revenue: number }>();

      for (const booking of bookings) {
        const date = new Date(booking.booked_at);
        const key = date.toISOString().slice(0, 10);
        const current = grouped.get(key) ?? {
          label: formatDay(date),
          bookings: 0,
          revenue: 0,
        };

        current.bookings += 1;
        if (isRevenueBooking(booking)) {
          current.revenue += Number(booking.total_amount ?? 0);
        }

        grouped.set(key, current);
      }

      return Array.from(grouped.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([, value]) => value);
    }

    const days = range === '7d' ? 7 : 14;
    const result: Array<{ label: string; bookings: number; revenue: number }> = [];

    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - index);

      const key = date.toISOString().slice(0, 10);
      const dayBookings = bookings.filter(
        (booking) => booking.booked_at.slice(0, 10) === key,
      );

      result.push({
        label: formatDay(date),
        bookings: dayBookings.length,
        revenue: dayBookings
          .filter(isRevenueBooking)
          .reduce((sum, booking) => sum + Number(booking.total_amount ?? 0), 0),
      });
    }

    return result;
  }, [bookings, range]);

  const maxDailyBookings = Math.max(
    ...dailyTrend.map((day) => day.bookings),
    1,
  );

  const maxMovieRevenue = Math.max(
    ...movieSummaries.map((movie) => movie.revenue),
    1,
  );

  const maxStatusCount = Math.max(
    ...statusCounts.map(([, count]) => count),
    1,
  );

  const recentBookings = bookings.slice(0, 8);

  const upcomingShows = useMemo(
    () =>
      shows.filter(
        (show) =>
          show.start_time &&
          new Date(show.start_time).getTime() > Date.now(),
      ).length,
    [shows],
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void loadReports();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge tone="primary" variant="soft">
            CineSecure
          </Badge>
          <h1 className="mt-3 font-display text-3xl font-bold text-ink-50 sm:text-4xl">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-ink-400">
            Live booking and platform performance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['7d', '30d', 'all'] as ReportRange[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                range === option
                  ? 'border-primary-500/30 bg-primary-500/15 text-primary-300'
                  : 'border-white/10 bg-white/[0.02] text-ink-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {RANGE_LABELS[option]}
            </button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-error-500/20 bg-error-500/5 p-4 text-sm text-error-300">
          <p className="font-medium">Unable to load report data.</p>
          <p className="mt-1 text-error-300/80">{error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <ReportStat
          label="Revenue"
          value={formatCurrency(revenue)}
          icon={WalletCards}
          tone="success"
          hint={RANGE_LABELS[range]}
        />
        <ReportStat
          label="Confirmed bookings"
          value={String(confirmedBookings.length)}
          icon={Ticket}
          tone="primary"
          hint={RANGE_LABELS[range]}
        />
        <ReportStat
          label="Tickets sold"
          value={String(ticketsSold)}
          icon={TrendingUp}
          tone="accent"
          hint={RANGE_LABELS[range]}
        />
        <ReportStat
          label="Avg. booking"
          value={formatCurrency(averageBookingValue)}
          icon={BarChart3}
          tone="secondary"
          hint="Confirmed bookings"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Booking trend"
            subtitle={`${RANGE_LABELS[range]} · bookings per day`}
            action={<BarChart3 className="h-5 w-5 text-ink-500" />}
          />

          {dailyTrend.length === 0 ? (
            <EmptyState message="No booking activity for this period." />
          ) : (
            <div className="flex h-56 items-end gap-2 overflow-x-auto pb-2">
              {dailyTrend.map((day) => (
                <div
                  key={`${day.label}-${day.bookings}-${day.revenue}`}
                  className="flex min-w-[42px] flex-1 flex-col items-center justify-end gap-2"
                  title={`${day.label}: ${day.bookings} bookings · ${formatCurrency(day.revenue)}`}
                >
                  <span className="text-[10px] font-medium text-ink-500">
                    {day.bookings}
                  </span>
                  <div
                    className="w-full max-w-10 rounded-t-md bg-primary-500/80 transition-all"
                    style={{
                      height: `${Math.max(
                        day.bookings ? 10 : 2,
                        (day.bookings / maxDailyBookings) * 150,
                      )}px`,
                    }}
                  />
                  <span className="whitespace-nowrap text-[10px] text-ink-600">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Booking status"
            subtitle={RANGE_LABELS[range]}
            action={<CalendarDays className="h-5 w-5 text-ink-500" />}
          />

          {statusCounts.length === 0 ? (
            <EmptyState message="No bookings in this period." />
          ) : (
            <div className="space-y-4">
              {statusCounts.map(([status, count]) => (
                <div key={status}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <Badge tone={statusTone(status)} variant="soft">
                      {status}
                    </Badge>
                    <span className="text-sm font-semibold text-ink-200">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-primary-500/70"
                      style={{
                        width: `${(count / maxStatusCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Top movies"
            subtitle={`Best performers · ${RANGE_LABELS[range].toLowerCase()}`}
            action={<Film className="h-5 w-5 text-ink-500" />}
          />

          {movieSummaries.length === 0 ? (
            <EmptyState message="No confirmed booking data for this period." />
          ) : (
            <div className="space-y-5">
              {movieSummaries.map((movie, index) => (
                <div key={movie.title}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-ink-400">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-100">
                          {movie.title}
                        </p>
                        <p className="text-xs text-ink-500">
                          {movie.tickets} ticket{movie.tickets === 1 ? '' : 's'} ·{' '}
                          {movie.bookings} booking{movie.bookings === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-ink-100">
                      {formatCurrency(movie.revenue)}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all"
                      style={{
                        width: `${Math.max(
                          4,
                          (movie.revenue / maxMovieRevenue) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Platform overview"
            subtitle="Current database totals"
            action={<TrendingUp className="h-5 w-5 text-ink-500" />}
          />

          <div className="grid grid-cols-2 gap-3">
            <MiniStat icon={Users} label="Users" value={userCount} />
            <MiniStat icon={Film} label="Movies" value={movieCount} />
            <MiniStat icon={CalendarDays} label="Shows" value={showCount} />
            <MiniStat icon={Ticket} label="Upcoming" value={upcomingShows} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent bookings"
          subtitle={`Latest activity · ${RANGE_LABELS[range].toLowerCase()}`}
          action={<Ticket className="h-5 w-5 text-ink-500" />}
        />

        {recentBookings.length === 0 ? (
          <EmptyState message="No booking data is available for this period." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-ink-500">
                  <th className="pb-3 pr-4 font-medium">Reference</th>
                  <th className="pb-3 pr-4 font-medium">Movie</th>
                  <th className="pb-3 pr-4 font-medium">Tickets</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Booked</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {recentBookings.map((booking) => {
                  const show = showMap.get(booking.show_id);
                  const movie = show ? movieMap.get(show.movie_id) : undefined;

                  return (
                    <tr key={booking.id} className="text-sm">
                      <td className="py-4 pr-4 font-semibold text-ink-100">
                        {booking.booking_reference || '—'}
                      </td>
                      <td className="py-4 pr-4 text-ink-300">
                        {movie?.title || 'Unknown movie'}
                      </td>
                      <td className="py-4 pr-4 text-ink-300">
                        {ticketsByBooking.get(booking.id) ?? 0}
                      </td>
                      <td className="py-4 pr-4 font-semibold text-ink-100">
                        {formatCurrency(Number(booking.total_amount ?? 0))}
                      </td>
                      <td className="py-4 pr-4">
                        <Badge tone={statusTone(booking.status)} variant="soft">
                          {booking.status || 'unknown'}
                        </Badge>
                      </td>
                      <td className="py-4 text-ink-500">
                        {formatDateTime(booking.booked_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function ReportStat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
  tone: 'primary' | 'secondary' | 'accent' | 'success';
}) {
  const toneClasses = {
    primary: 'bg-primary-500/10 text-primary-300',
    secondary: 'bg-secondary-500/10 text-secondary-300',
    accent: 'bg-accent-500/10 text-accent-300',
    success: 'bg-success-500/10 text-success-300',
  };

  return (
    <Card variant="solid">
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-3 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-ink-500">{label}</p>
          <p className="mt-1 truncate text-xl font-bold text-ink-100 sm:text-2xl">
            {value}
          </p>
          <p className="mt-1 text-[11px] text-ink-600">{hint}</p>
        </div>
      </div>
    </Card>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-white/5 p-2.5 text-primary-300">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-ink-500">{label}</p>
          <p className="mt-1 text-lg font-bold text-ink-100">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center">
      <BarChart3 className="mx-auto h-8 w-8 text-ink-600" />
      <p className="mt-3 text-sm text-ink-500">{message}</p>
    </div>
  );
}
