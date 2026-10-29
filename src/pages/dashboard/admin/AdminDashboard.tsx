import { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  Film,
  ShieldAlert,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';

import { StatCard } from '@/components/shared/StatCard';
import { Card, CardHeader, Badge, Spinner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { readSecurityLogs } from '@/utils/securityLog';
import { relativeTime, formatCurrency, formatDate } from '@/utils/format';

interface RecentBooking {
  id: string;
  booking_reference: string | null;
  total_amount: number | null;
  payment_status: string | null;
  booked_at: string | null;
  show_id: string;
  shows:
    | {
        start_time: string;
        movies:
          | { title: string }[]
          | { title: string }
          | null;
      }[]
    | {
        start_time: string;
        movies:
          | { title: string }[]
          | { title: string }
          | null;
      }
    | null;
}

interface DashboardStats {
  users: number;
  movies: number;
  bookings: number;
  revenue: number;
}

function getMovieTitle(booking: RecentBooking): string {
  const show = Array.isArray(booking.shows)
    ? booking.shows[0]
    : booking.shows;

  if (!show?.movies) return 'Movie information unavailable';

  const movie = Array.isArray(show.movies)
    ? show.movies[0]
    : show.movies;

  return movie?.title || 'Movie information unavailable';
}

export function AdminDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    movies: 0,
    bookings: 0,
    revenue: 0,
  });

  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logs = readSecurityLogs().slice(0, 6);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const [
          usersResult,
          moviesResult,
          bookingsCountResult,
          revenueResult,
          recentBookingsResult,
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true }),

          supabase
            .from('movies')
            .select('id', { count: 'exact', head: true }),

          supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true }),

          supabase
            .from('bookings')
            .select('total_amount, payment_status'),

          supabase
            .from('bookings')
            .select(`
              id,
              booking_reference,
              total_amount,
              payment_status,
              booked_at,
              show_id,
              shows (
                start_time,
                movies (
                  title
                )
              )
            `)
            .order('booked_at', { ascending: false })
            .limit(5),
        ]);

        const results = [
          usersResult,
          moviesResult,
          bookingsCountResult,
          revenueResult,
          recentBookingsResult,
        ];

        const failedResult = results.find((result) => result.error);

        if (failedResult?.error) {
          throw new Error(failedResult.error.message);
        }

        const revenue = (revenueResult.data ?? []).reduce(
          (total, booking) => {
            const paid =
              (booking.payment_status || '').toLowerCase() === 'paid';

            return paid
              ? total + Number(booking.total_amount || 0)
              : total;
          },
          0,
        );

        if (!active) return;

        setStats({
          users: usersResult.count ?? 0,
          movies: moviesResult.count ?? 0,
          bookings: bookingsCountResult.count ?? 0,
          revenue,
        });

        setRecentBookings(
          (recentBookingsResult.data ?? []) as unknown as RecentBooking[],
        );
      } catch (err) {
        console.error('Unable to load admin dashboard:', err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load dashboard data.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <Badge tone="error" variant="soft">
          Administration
        </Badge>

        <h1 className="mt-3 font-display text-3xl font-bold text-ink-50">
          Welcome back, {user?.name}
        </h1>

        <p className="mt-1 text-ink-400">
          Manage CineSecure from one place.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
        >
          <p className="font-semibold">
            Unable to load dashboard data
          </p>
          <p className="mt-1 break-words">{error}</p>
          <p className="mt-2 text-red-200/70">
            Check the Supabase table permissions and column names.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Users"
          value={loading ? '—' : stats.users.toLocaleString('en-IN')}
          icon={Users}
          tone="primary"
        />

        <StatCard
          label="Movies"
          value={loading ? '—' : stats.movies.toLocaleString('en-IN')}
          icon={Film}
          tone="secondary"
        />

        <StatCard
          label="Bookings"
          value={loading ? '—' : stats.bookings.toLocaleString('en-IN')}
          icon={Ticket}
          tone="accent"
        />

        <StatCard
          label="Revenue"
          value={loading ? '—' : formatCurrency(stats.revenue)}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent bookings"
            subtitle="Latest booking records"
          />

          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner size="lg" />
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <Ticket className="mx-auto h-10 w-10 text-ink-600" />
              <p className="mt-4 text-sm text-ink-500">
                No booking records were returned.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.035] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-100">
                      {getMovieTitle(booking)}
                    </p>

                    <p className="mt-1 text-xs text-ink-500">
                      {booking.booking_reference || booking.id.slice(0, 8)}
                      {' · '}
                      {booking.booked_at
                        ? formatDate(booking.booked_at)
                        : 'Date unavailable'}
                    </p>

                    <p className="mt-1 text-xs text-ink-400">
                      Payment: {booking.payment_status || 'Unknown'}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-semibold text-ink-100">
                    {formatCurrency(Number(booking.total_amount || 0))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent activity"
            subtitle="Local security events"
            action={<Activity className="h-5 w-5 text-ink-500" />}
          />

          {logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-ink-600" />
              <p className="mt-4 text-sm text-ink-500">
                No recent activity.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl bg-white/[0.035] px-4 py-3"
                >
                  <p className="truncate text-sm text-ink-100">
                    {log.message}
                  </p>

                  <p className="mt-1 text-xs text-ink-500">
                    {log.eventType} · {relativeTime(log.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Platform overview"
          subtitle="Current database totals"
          action={<BarChart3 className="h-5 w-5 text-ink-500" />}
        />

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white/[0.025] p-5">
              <p className="text-sm text-ink-400">Registered users</p>
              <p className="mt-2 text-2xl font-bold text-ink-50">
                {stats.users.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl bg-white/[0.025] p-5">
              <p className="text-sm text-ink-400">Movies in catalogue</p>
              <p className="mt-2 text-2xl font-bold text-ink-50">
                {stats.movies.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl bg-white/[0.025] p-5">
              <p className="text-sm text-ink-400">Total bookings</p>
              <p className="mt-2 text-2xl font-bold text-ink-50">
                {stats.bookings.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
