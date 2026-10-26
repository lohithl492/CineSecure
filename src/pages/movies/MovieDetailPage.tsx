import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, Clock3, Film, Play, Ticket } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Badge, Button, Card, Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatDate, formatDuration, formatTime } from '@/utils/format';

interface Movie {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  genre: string | string[] | null;
  language: string | null;
  duration_minutes: number | null;
  certificate: string | null;
  release_date: string | null;
}

interface Show {
  id: string;
  movie_id: string;
  screen_id: string;
  start_time: string;
  end_time: string | null;
  base_price: number;
  language: string | null;
  format: string | null;
  status: string | null;
}

function formatGenre(genre: string | string[] | null): string {
  if (!genre) return '';

  if (Array.isArray(genre)) {
    return genre
      .filter(Boolean)
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(' • ');
  }

  return genre
    .replace(/([a-z])([A-Z])/g, '$1 • $2')
    .trim();
}

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Movie not found.');
      setLoading(false);
      return;
    }

    loadMovie(id);
  }, [id]);

  async function loadMovie(movieId: string) {
    setLoading(true);
    setError(null);

    try {
      const { data: movieData, error: movieError } = await supabase
        .from('movies')
        .select(
          'id, title, description, poster_url, genre, language, duration_minutes, certificate, release_date'
        )
        .eq('id', movieId)
        .single();

      if (movieError) {
        throw new Error(movieError.message);
      }

      if (!movieData) {
        throw new Error('Movie not found.');
      }

      setMovie(movieData as Movie);

      const { data: showData, error: showError } = await supabase
        .from('shows')
        .select(
          'id, movie_id, screen_id, start_time, end_time, base_price, language, format, status'
        )
        .eq('movie_id', movieId)
        .order('start_time', { ascending: true });

      if (showError) {
        throw new Error(showError.message);
      }

      setShows((showData ?? []) as Show[]);
    } catch (err) {
      console.error('Failed to load movie:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load movie information.'
      );
    } finally {
      setLoading(false);
    }
  }

const activeShows = useMemo(() => {
  const now = Date.now();
  return shows.filter((show) => {
    const start = new Date(show.start_time).getTime();
    const status = (show.status || 'scheduled').toLowerCase();
    return start > now && status === 'scheduled';
  });
}, [shows]);

  const availableDates = useMemo(() => {
    return Array.from(
      new Set(
        activeShows.map((show) => {
          const date = new Date(show.start_time);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }),
      ),
    );
  }, [activeShows]);

  useEffect(() => {
    if (availableDates.length === 0) {
      setSelectedDate('');
    } else if (!availableDates.includes(selectedDate)) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  const selectedDateShows = useMemo(
    () => activeShows.filter((show) => {
      const date = new Date(show.start_time);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return key === selectedDate;
    }),
    [activeShows, selectedDate],
  );

  const genreText = formatGenre(movie?.genre ?? null);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Spinner size="lg" className="py-20" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <main className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-4xl">
          <Card className="p-10 text-center">
            <Film className="mx-auto h-14 w-14 text-error-400" />

            <h1 className="mt-5 font-display text-2xl font-bold text-ink-50">
              Movie unavailable
            </h1>

            <p className="mt-3 text-ink-400">
              {error || 'The requested movie could not be found.'}
            </p>

            <Link to="/movies" className="mt-6 inline-block">
              <Button>
                <ArrowLeft className="h-4 w-4" />
                Back to movies
              </Button>
            </Link>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ink-950">
      {/* Back */}
      <div className="mx-auto max-w-7xl px-5 pt-6 lg:px-8">
        <Link
          to="/movies"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to movies
        </Link>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {movie.poster_url && (
            <img
              src={movie.poster_url}
              alt=""
              className="h-full w-full object-cover opacity-[0.12] blur-2xl"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/90 to-ink-950" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:items-center">
            {/* Poster */}
            <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl">
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center">
                  <Film className="h-16 w-16 text-ink-700" />
                </div>
              )}
            </div>

            {/* Movie information */}
            <div>
              <div className="flex flex-wrap gap-2">
                {movie.certificate && (
                  <Badge tone="primary" variant="soft">
                    {movie.certificate}
                  </Badge>
                )}

                {movie.language && (
                  <Badge tone="neutral" variant="outline">
                    {movie.language}
                  </Badge>
                )}
              </div>

              <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {movie.title}
              </h1>

              {genreText && (
                <p className="mt-4 text-sm font-medium text-ink-400 sm:text-base">
                  {genreText}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-ink-400">
                {movie.duration_minutes && (
                  <span className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-primary-400" />
                    {formatDuration(movie.duration_minutes)}
                  </span>
                )}

                {movie.release_date && (
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary-400" />
                    {formatDate(movie.release_date)}
                  </span>
                )}
              </div>

              {movie.description && (
                <p className="mt-7 max-w-3xl text-base leading-7 text-ink-300 sm:text-lg">
                  {movie.description}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                {activeShows.length > 0 && (
                  <a href="#showtimes">
                    <Button size="lg">
                      <Ticket className="h-5 w-5" />
                      Book tickets
                    </Button>
                  </a>
                )}

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    window.scrollTo({
                      top: document.body.scrollHeight,
                      behavior: 'smooth',
                    })
                  }
                >
                  <Play className="h-5 w-5" />
                  View showtimes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showtimes */}
      <section
        id="showtimes"
        className="mx-auto max-w-7xl px-5 pb-16 lg:px-8"
      >
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge tone="primary" variant="soft">
              Showtime
            </Badge>

            <h2 className="mt-3 font-display text-3xl font-bold text-white">
              Choose your show
            </h2>

            <p className="mt-1 text-ink-400">
              Select a time and continue to seat selection.
            </p>
          </div>

          <span className="text-sm text-ink-500">
            {activeShows.length}{' '}
            {activeShows.length === 1 ? 'show available' : 'shows available'}
          </span>
        </div>

        {activeShows.length === 0 ? (
          <Card className="p-10 text-center">
            <Clock3 className="mx-auto h-10 w-10 text-ink-600" />

            <h3 className="mt-4 font-display text-xl font-semibold text-ink-100">
              No upcoming shows
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
              There are currently no upcoming showtimes available for this
              movie.
            </p>

            <Link to="/movies" className="mt-6 inline-block">
              <Button variant="outline">Browse other movies</Button>
            </Link>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="flex gap-2 overflow-x-auto border-b border-white/10 p-3 sm:p-4">
              {availableDates.map((dateKey) => {
                const date = new Date(`${dateKey}T12:00:00`);
                const isSelected = dateKey === selectedDate;
                const today = new Date();
                const isToday = dateKey === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const isTomorrow = dateKey === `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(dateKey)}
                    className={`min-w-[76px] rounded-xl border px-4 py-3 text-center transition ${
                      isSelected
                        ? 'border-primary-500 bg-primary-500/15 text-white'
                        : 'border-transparent bg-white/[0.035] text-ink-400 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <span className="block text-[11px] font-semibold uppercase tracking-wider">
                      {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                    <span className="mt-1 block text-lg font-bold">
                      {date.toLocaleDateString('en-IN', { day: '2-digit' })}
                    </span>
                    <span className="block text-[11px] uppercase">
                      {date.toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-ink-300">
                  {selectedDate ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Available showtimes'}
                </p>
                <span className="text-xs text-ink-500">
                  {selectedDateShows.length} {selectedDateShows.length === 1 ? 'show' : 'shows'}
                </span>
              </div>

              {selectedDateShows.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-ink-500">
                  No showtimes available for this date.
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {selectedDateShows.map((show) => (
                    <Link
                      key={show.id}
                      to={`/booking/${show.id}/seats`}
                      aria-label={`Select ${formatTime(show.start_time)} show and choose seats`}
                      className="group inline-flex min-w-[108px] items-center justify-center rounded-lg border border-emerald-500/35 bg-emerald-500/[0.06] px-5 py-3 text-sm font-semibold text-emerald-300 transition hover:border-primary-500 hover:bg-primary-500/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    >
                      {formatTime(show.start_time)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}