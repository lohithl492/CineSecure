import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  Ticket,
  Film,
} from 'lucide-react';

import {
  Badge,
  Card,
  Button,
  Spinner,
} from '@/components/ui';

import {
  formatCurrency,
  formatTime,
  formatDate,
} from '@/utils/format';

import { supabase } from '@/lib/supabase';

interface MovieRelation {
  title: string;
}

interface TheaterRelation {
  name: string;
}

interface ScreenRelation {
  name: string;
  theaters:
    | TheaterRelation[]
    | TheaterRelation
    | null;
}

interface Show {
  id: string;
  movie_id: string;
  screen_id: string;
  start_time: string;
  end_time: string;
  base_price: number;
  language: string | null;
  format: string | null;
  status: string | null;

  movies:
    | MovieRelation[]
    | MovieRelation
    | null;

  screens:
    | ScreenRelation[]
    | ScreenRelation
    | null;
}

export function ShowsPage() {
  const navigate = useNavigate();

  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadShows();
  }, []);

  async function loadShows() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('shows')
      .select(`
        id,
        movie_id,
        screen_id,
        start_time,
        end_time,
        base_price,
        language,
        format,
        status,
        movies (
          title
        ),
        screens (
          name,
          theaters (
            name
          )
        )
      `)
      .order('start_time', {
        ascending: true,
      });

    if (error) {
      console.error(
        'Failed to load shows:',
        error
      );

      setError(error.message);
      setLoading(false);
      return;
    }

    setShows(
      (data as unknown as Show[]) ?? []
    );

    setLoading(false);
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-5 py-10">

        {/* Header */}
        <div className="mb-8">
          <Badge
            tone="primary"
            variant="soft"
          >
            Cinema
          </Badge>

          <h1 className="mt-3 font-display text-4xl font-bold text-ink-50">
            Available shows
          </h1>

          <p className="mt-2 text-ink-400">
            Choose a movie, theater and showtime
            to continue booking.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <Spinner
            size="lg"
            className="py-20"
          />
        )}

        {/* Error */}
        {!loading && error && (
          <Card className="p-12 text-center">

            <Film className="h-12 w-12 mx-auto mb-4 text-error-400" />

            <h2 className="text-xl font-semibold text-ink-100">
              Unable to load shows
            </h2>

            <p className="mt-2 text-sm text-error-300">
              {error}
            </p>

            <button
              onClick={loadShows}
              className="mt-5 text-sm font-semibold text-primary-400 hover:text-primary-300"
            >
              Try again
            </button>

          </Card>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          shows.length === 0 && (
            <Card className="p-12 text-center">

              <Film className="h-12 w-12 mx-auto mb-4 text-ink-600" />

              <h2 className="text-xl font-semibold text-ink-200">
                No shows available
              </h2>

              <p className="mt-2 text-sm text-ink-400">
                There are currently no scheduled
                shows.
              </p>

            </Card>
          )}

        {/* Shows */}
        {!loading &&
          !error &&
          shows.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {shows.map((show, index) => (
                <ShowCard
                  key={show.id}
                  show={show}
                  delay={index * 60}
                  onSelect={() =>
                    navigate(
                      `/booking/${show.id}/seats`
                    )
                  }
                />
              ))}

            </div>
          )}

      </div>
    </div>
  );
}

function ShowCard({
  show,
  delay,
  onSelect,
}: {
  show: Show;
  delay: number;
  onSelect: () => void;
}) {
  /*
   * Supabase relationships can sometimes
   * be returned as arrays.
   */

  const movie = Array.isArray(show.movies)
    ? show.movies[0]
    : show.movies;

  const screen = Array.isArray(show.screens)
    ? show.screens[0]
    : show.screens;

  const theater = screen?.theaters
    ? Array.isArray(screen.theaters)
      ? screen.theaters[0]
      : screen.theaters
    : null;

  const movieTitle =
    movie?.title ?? 'Unknown movie';

  const screenName =
    screen?.name ?? 'Unknown screen';

  const theaterName =
    theater?.name ?? 'Unknown theater';

  const status =
    show.status?.toLowerCase() ??
    'scheduled';

  const isCancelled =
    status === 'cancelled';

  const isCompleted =
    status === 'completed';

  return (
    <Card
      hover
      className="animate-slideUp"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >

      {/* Movie */}
      <div>
        <h3 className="font-display text-xl font-bold text-ink-50">
          {movieTitle}
        </h3>

        <p className="text-sm text-ink-400 mt-1">
          {theaterName} · {screenName}
        </p>
      </div>

      {/* Date / Time */}
      <div className="mt-5 space-y-2 text-sm text-ink-300">

        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-ink-500" />
          {formatDate(show.start_time)}
        </p>

        <p className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-ink-500" />
          {formatTime(show.start_time)}
        </p>

      </div>

      {/* Language / Format */}
      <div className="mt-4 flex flex-wrap gap-2">

        {show.language && (
          <Badge
            tone="primary"
            variant="soft"
          >
            {show.language}
          </Badge>
        )}

        {show.format && (
          <Badge
            tone="primary"
            variant="soft"
          >
            {show.format}
          </Badge>
        )}

      </div>

      {/* Price / Status */}
      <div className="mt-5 flex items-center justify-between">

        <div>
          <p className="text-xs text-ink-500">
            Ticket price
          </p>

          <p className="font-display text-xl font-bold text-ink-50">
            {formatCurrency(
              Number(show.base_price)
            )}
          </p>
        </div>

        <Badge
          tone={
            isCancelled
              ? 'error'
              : isCompleted
                ? 'warning'
                : 'success'
          }
          variant="soft"
        >
          <Ticket className="h-3.5 w-3.5" />

          {isCancelled
            ? 'Cancelled'
            : isCompleted
              ? 'Completed'
              : 'Scheduled'}
        </Badge>

      </div>

      {/* Select seats */}
      <Button
        fullWidth
        className="mt-5"
        disabled={
          isCancelled || isCompleted
        }
        onClick={onSelect}
      >
        Select seats
      </Button>

    </Card>
  );
}