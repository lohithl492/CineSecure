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
  return shows.filter((show) => show.status !== 'cancelled');
}, [shows]);
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeShows.map((show) => (
              <Card
                key={show.id}
                hover
                className="border-white/10 bg-white/[0.035]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-500">
                      {formatDate(show.start_time)}
                    </p>

                    <p className="mt-2 font-display text-2xl font-bold text-white">
                      {formatTime(show.start_time)}
                    </p>
                  </div>

                  {show.format && (
                    <Badge tone="neutral" variant="outline">
                      {show.format}
                    </Badge>
                  )}
                </div>

                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-ink-500">Language</p>
                      <p className="mt-1 text-sm font-medium text-ink-200">
                        {show.language || movie.language || '—'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-ink-500">From</p>
                      <p className="mt-1 text-sm font-bold text-primary-300">
                        ₹{Number(show.base_price || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/booking/${show.id}/seats`}
                    className="mt-5 block"
                  >
                    <Button fullWidth>
                      <Ticket className="h-4 w-4" />
                      Select seats
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}