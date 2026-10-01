import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Film,
  Play,
  Sparkles,
  Star,
  Ticket,
} from 'lucide-react';

import { Button, Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/utils/format';

interface Movie {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  genre: string[] | string | null;
  language: string | null;
  duration_minutes: number | null;
  certificate: string | null;
  release_date: string | null;
}

interface Show {
  id: string;
  movie_id: string;
  start_time: string;
  end_time: string;
  base_price: number;
  language: string | null;
  format: string | null;
  status: string | null;
  movies:
    | {
        id?: string;
        title: string;
        poster_url?: string | null;
        genre?: string[] | string | null;
        language?: string | null;
        duration_minutes?: number | null;
        certificate?: string | null;
      }[]
    | {
        id?: string;
        title: string;
        poster_url?: string | null;
        genre?: string[] | string | null;
        language?: string | null;
        duration_minutes?: number | null;
        certificate?: string | null;
      }
    | null;
}

function getGenre(movie: Movie): string {
  if (Array.isArray(movie.genre)) {
    return movie.genre.join(' • ');
  }

  return movie.genre || '';
}

function getMovieFromShow(show: Show): Movie | null {
  const movie = Array.isArray(show.movies)
    ? show.movies[0]
    : show.movies;

  if (!movie) {
    return null;
  }

  return {
    id: movie.id || show.movie_id,
    title: movie.title,
    description: null,
    poster_url: movie.poster_url || null,
    genre: movie.genre || null,
    language: movie.language || null,
    duration_minutes: movie.duration_minutes || null,
    certificate: movie.certificate || null,
    release_date: null,
  };
}

function formatDuration(minutes: number | null) {
  if (!minutes) return '';

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (hours === 0) return `${remaining}m`;
  if (remaining === 0) return `${hours}h`;

  return `${hours}h ${remaining}m`;
}

function formatPrice(amount: number) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function MoviePoster({
  movie,
  className = '',
}: {
  movie: Movie;
  className?: string;
}) {
  if (movie.poster_url) {
    return (
      <img
        src={movie.poster_url}
        alt={movie.title}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-950 via-slate-900 to-slate-950 ${className}`}
    >
      <Film className="h-12 w-12 text-primary-400/50" />
    </div>
  );
}

function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      to={`/movies/${movie.id}`}
      className="group block min-w-0"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-slate-900 shadow-lg ring-1 ring-white/10">
        <MoviePoster
          movie={movie}
          className="transition duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {movie.certificate && (
              <span className="rounded-md border border-white/15 bg-black/40 px-2 py-1 text-[10px] font-medium text-white/80 backdrop-blur">
                {movie.certificate}
              </span>
            )}

            {movie.language && (
              <span className="rounded-md border border-white/15 bg-black/40 px-2 py-1 text-[10px] font-medium text-white/80 backdrop-blur">
                {movie.language}
              </span>
            )}
          </div>

          <h3 className="line-clamp-1 text-base font-semibold text-white">
            {movie.title}
          </h3>

          <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
            {getGenre(movie) && (
              <span className="line-clamp-1">
                {getGenre(movie)}
              </span>
            )}

            {getGenre(movie) && movie.duration_minutes && (
              <span className="h-1 w-1 shrink-0 rounded-full bg-white/30" />
            )}

            {movie.duration_minutes && (
              <span className="shrink-0">
                {formatDuration(movie.duration_minutes)}
              </span>
            )}
          </div>
        </div>

        <div className="absolute right-3 top-3 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white/10 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  href,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">
            <span className="h-px w-6 bg-primary-500" />
            {eyebrow}
          </div>
        )}

        <h2 className="font-display text-2xl font-bold tracking-tight text-ink-50 sm:text-3xl">
          {title}
        </h2>
      </div>

      {href && (
        <Link
          to={href}
          className="hidden items-center gap-1 text-sm font-medium text-ink-400 transition hover:text-primary-300 sm:flex"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function EmptyMovieState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <Film className="mx-auto h-9 w-9 text-ink-600" />

      <p className="mt-4 text-sm text-ink-400">
        {message}
      </p>

      <Link
        to="/movies"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-300 hover:text-primary-200"
      >
        Browse movies
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadHomeData() {
      setLoading(true);

      try {
        const [moviesResult, showsResult] = await Promise.all([
          supabase
            .from('movies')
            .select(`
              id,
              title,
              description,
              poster_url,
              genre,
              language,
              duration_minutes,
              certificate,
              release_date
            `)
            .order('release_date', { ascending: false }),

          supabase
            .from('shows')
            .select(`
              id,
              movie_id,
              start_time,
              end_time,
              base_price,
              language,
              format,
              status,
              movies (
                id,
                title,
                poster_url,
                genre,
                language,
                duration_minutes,
                certificate
              )
            `)
            .order('start_time', { ascending: true }),
        ]);

        if (moviesResult.error) {
          throw moviesResult.error;
        }

        if (showsResult.error) {
          throw showsResult.error;
        }

        if (!mounted) return;

        setMovies((moviesResult.data || []) as Movie[]);
        setShows((showsResult.data || []) as unknown as Show[]);
      } catch (error) {
        console.error('Unable to load homepage data:', error);

        if (mounted) {
          setMovies([]);
          setShows([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadHomeData();

    return () => {
      mounted = false;
    };
  }, []);

  const showingMovies = useMemo(() => {
    const seen = new Set<string>();
    const result: Movie[] = [];

    for (const show of shows) {
      const movie = getMovieFromShow(show);

      if (!movie || seen.has(movie.id)) {
        continue;
      }

      seen.add(movie.id);
      result.push(movie);
    }

    return result;
  }, [shows]);

  const upcomingMovies = useMemo(() => {
    const showingIds = new Set(
      showingMovies.map((movie) => movie.id),
    );

    return movies
      .filter((movie) => !showingIds.has(movie.id))
      .slice(0, 6);
  }, [movies, showingMovies]);

  const featuredMovie =
    showingMovies[0] || movies[0] || null;

  const featuredShow = shows.find(
    (show) => show.movie_id === featuredMovie?.id,
  );

  const featuredDescription =
    featuredMovie?.description ||
    'Experience the latest movies on the big screen. Choose a showtime and book your seats in a few clicks.';

  if (loading) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn overflow-hidden">

      {/* HERO */}
      <section className="relative min-h-[600px] overflow-hidden border-b border-white/5">
        {featuredMovie?.poster_url && (
          <div className="absolute inset-0">
            <img
              src={featuredMovie.poster_url}
              alt=""
              aria-hidden="true"
              className="h-full w-full scale-110 object-cover opacity-25 blur-2xl"
            />
          </div>
        )}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(37,99,235,0.24),transparent_40%)]" />

        <div className="absolute inset-0 bg-gradient-to-r from-[#050914] via-[#07101f]/95 to-[#050914]/75" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#050914] via-transparent to-[#050914]/30" />

        <div className="container-max section-pad relative flex min-h-[600px] items-center py-16">
          {featuredMovie ? (
            <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_300px]">

              <div className="max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-400/20 bg-primary-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-300 backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Now showing
                </div>

                <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {featuredMovie.title}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-ink-300">
                  {getGenre(featuredMovie) && (
                    <span>{getGenre(featuredMovie)}</span>
                  )}

                  {featuredMovie.language && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-white/30" />
                      <span>{featuredMovie.language}</span>
                    </>
                  )}

                  {featuredMovie.duration_minutes && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-white/30" />
                      <span>
                        {formatDuration(featuredMovie.duration_minutes)}
                      </span>
                    </>
                  )}

                  {featuredMovie.certificate && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-white/30" />
                      <span>{featuredMovie.certificate}</span>
                    </>
                  )}
                </div>

                <p className="mt-5 max-w-xl text-base leading-7 text-ink-300 sm:text-lg">
                  {featuredDescription}
                </p>

                {featuredShow && (
                  <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink-300">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary-400" />
                      {formatDate(featuredShow.start_time)}
                    </span>

                    <span className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-primary-400" />
                      {new Date(
                        featuredShow.start_time,
                      ).toLocaleTimeString('en-IN', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>

                    {featuredShow.format && (
                      <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs">
                        {featuredShow.format}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to={
                      featuredShow
                        ? `/booking/${featuredShow.id}/seats`
                        : `/movies/${featuredMovie.id}`
                    }
                  >
                    <Button size="lg">
                      <Ticket className="h-4 w-4" />
                      Book tickets
                    </Button>
                  </Link>

                  <Link to={`/movies/${featuredMovie.id}`}>
                    <Button size="lg" variant="outline">
                      <Play className="h-4 w-4" />
                      View movie
                    </Button>
                  </Link>
                </div>
              </div>

              {/* FEATURED POSTER */}
              <Link
                to={`/movies/${featuredMovie.id}`}
                className="group relative mx-auto hidden w-full max-w-[300px] lg:block"
              >
                <div className="absolute -inset-4 rounded-[2rem] bg-primary-500/20 opacity-40 blur-2xl transition group-hover:opacity-60" />

                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
                  <MoviePoster
                    movie={featuredMovie}
                    className="transition duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    {featuredMovie.certificate && (
                      <span className="rounded-md bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                        {featuredMovie.certificate}
                      </span>
                    )}

                    <span className="ml-auto flex items-center gap-1 rounded-md bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur">
                      <Star className="h-3.5 w-3.5 fill-current text-yellow-400" />
                      Featured
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Film className="h-8 w-8 text-primary-400" />
              </div>

              <h1 className="mt-6 font-display text-4xl font-bold text-white sm:text-5xl">
                Your next movie awaits
              </h1>

              <p className="mt-4 text-ink-300">
                Movies and showtimes will appear here when they are available.
              </p>

              <Link to="/movies" className="mt-7 inline-block">
                <Button size="lg">
                  Explore movies
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* NOW SHOWING */}
      <section className="container-max section-pad py-16 sm:py-20">
        <SectionHeading
          eyebrow="In cinemas"
          title="Now showing"
          href="/movies"
        />

        {showingMovies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {showingMovies.slice(0, 6).map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                />
              ))}
            </div>

            <Link
              to="/movies"
              className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-primary-300 hover:text-primary-200 sm:hidden"
            >
              View all movies
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        ) : (
          <EmptyMovieState message="No movies are currently showing." />
        )}
      </section>

      {/* UPCOMING */}
      {upcomingMovies.length > 0 && (
        <section className="border-y border-white/5 bg-white/[0.015]">
          <div className="container-max section-pad py-16 sm:py-20">
            <SectionHeading
              eyebrow="Coming soon"
              title="Upcoming releases"
              href="/movies"
            />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {upcomingMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="container-max section-pad py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-primary-500/20 bg-gradient-to-br from-primary-600/15 via-slate-900 to-slate-950 px-6 py-12 text-center sm:px-12">
          <div className="absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl" />

          <div className="relative">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10 text-primary-300">
              <Ticket className="h-5 w-5" />
            </div>

            <h2 className="mt-5 font-display text-2xl font-bold text-white sm:text-3xl">
              Your next movie night starts here
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-400">
              Browse movies, choose a showtime and select your seats.
            </p>

            <Link
              to="/movies"
              className="mt-7 inline-block"
            >
              <Button size="lg">
                Browse movies
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}