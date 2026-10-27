import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Film,
  Play,
  Sparkles,
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
  status?: string | null;
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
  const [selectedMovieIndex, setSelectedMovieIndex] = useState(0);
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
              release_date,
              status
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

  // Build the Now Showing list from movie status first, then include any
  // movies already connected to showtimes. This prevents the homepage from
  // showing only one movie just because only one has a show row attached.
  const showingMovies = useMemo(() => {
    const byId = new Map<string, Movie>();

    movies
      .filter((movie) => (movie.status || '').toLowerCase().replace(/[\s-]+/g, '_') === 'now_showing')
      .forEach((movie) => byId.set(movie.id, movie));

    for (const show of shows) {
      const movieFromShow = getMovieFromShow(show);
      if (!movieFromShow) continue;
      const fullMovie = movies.find((movie) => movie.id === movieFromShow.id);
      byId.set(movieFromShow.id, fullMovie ? { ...movieFromShow, ...fullMovie } : movieFromShow);
    }

    return Array.from(byId.values());
  }, [movies, shows]);

  const upcomingMovies = useMemo(() => {
    const showingIds = new Set(showingMovies.map((movie) => movie.id));

    return movies
      .filter((movie) => !showingIds.has(movie.id) && (movie.status || '').toLowerCase().replace(/[\s-]+/g, '_') !== 'now_showing')
      .slice(0, 6);
  }, [movies, showingMovies]);

  const featuredMovie = showingMovies[selectedMovieIndex] || showingMovies[0] || movies[0] || null;

  // Only allow booking for a future show that is still scheduled.
  // Never send users to seat selection for an expired or cancelled show.
  const featuredShow = shows.find(
    (show) =>
      show.movie_id === featuredMovie?.id &&
      new Date(show.start_time).getTime() >= Date.now() &&
      (show.status || '').toLowerCase() === 'scheduled',
  ) || null;

  const changeFeaturedMovie = (direction: -1 | 1) => {
    if (showingMovies.length < 2) return;
    setSelectedMovieIndex((current) => (current + direction + showingMovies.length) % showingMovies.length);
  };

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

      {/* CINEMATIC FEATURED MOVIE HERO */}
      <section className="relative isolate min-h-[640px] overflow-hidden border-b border-white/5 bg-ink-950 sm:min-h-[680px] lg:min-h-[720px]">
        {/* Soft ambient light behind the artwork */}
        {featuredMovie?.poster_url && (
          <div className="pointer-events-none absolute inset-y-0 right-0 -z-20 w-full overflow-hidden sm:w-[62%]">
            <img
              key={`${featuredMovie.id}-ambient`}
              src={featuredMovie.poster_url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-35 blur-3xl"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-ink-950/20 to-ink-950" />
          </div>
        )}

        {/* Main poster: rounded edges, full brightness, contained in its own frame */}
        {featuredMovie?.poster_url && (
          <div className="pointer-events-none absolute right-[3.5%] top-1/2 z-0 h-[78%] max-h-[620px] w-[42%] -translate-y-1/2 overflow-hidden rounded-[28px] bg-ink-900 shadow-2xl shadow-black/40 ring-1 ring-white/10 sm:rounded-[32px] lg:right-[3.8%] lg:h-[82%] lg:w-[40%]">
            <img
              key={`${featuredMovie.id}-hero-poster`}
              src={featuredMovie.poster_url}
              alt={`${featuredMovie.title} poster`}
              className="h-full w-full object-cover object-center opacity-100 transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />
          </div>
        )}

        {/* Fade the artwork naturally into the text side without dimming the poster itself */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-ink-950 via-ink-950/95 via-[43%] to-transparent" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-ink-950/45 via-transparent to-ink-950/20" />

        <div className="container-max section-pad relative z-10 flex min-h-[640px] items-center py-16 sm:min-h-[680px] sm:py-20 lg:min-h-[720px]">
          {featuredMovie ? (
            <div className="w-full min-w-0 max-w-[54%] pb-10 pt-4 pl-14 sm:pl-16 lg:max-w-[52%] lg:pl-14">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-200 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Now showing
              </div>

              <h1
                key={featuredMovie.id}
                className="max-w-full break-words animate-fadeIn font-display text-4xl font-bold tracking-tight text-ink-50 sm:text-5xl lg:text-6xl xl:text-6xl 2xl:text-7xl"
              >
                {featuredMovie.title}
              </h1>

              <div className="mt-5 flex max-w-2xl flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-300 sm:text-base">
                {getGenre(featuredMovie) && <span>{getGenre(featuredMovie)}</span>}
                {featuredMovie.language && <><span className="h-1 w-1 rounded-full bg-white/30" /><span>{featuredMovie.language}</span></>}
                {featuredMovie.duration_minutes && <><span className="h-1 w-1 rounded-full bg-white/30" /><span>{formatDuration(featuredMovie.duration_minutes)}</span></>}
                {featuredMovie.certificate && <><span className="h-1 w-1 rounded-full bg-white/30" /><span className="rounded-md border border-white/15 bg-black/20 px-2 py-0.5 text-xs">{featuredMovie.certificate}</span></>}
              </div>

              <p className="mt-6 max-w-xl text-base leading-7 text-ink-300 sm:text-lg sm:leading-8">
                {featuredMovie.description || 'Experience the latest movies on the big screen. Choose a showtime and book your seats in a few clicks.'}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {featuredShow ? (
                  <Link to={`/booking/${featuredShow.id}/seats`}>
                    <Button size="lg">
                      <Ticket className="h-4 w-4" />
                      Book tickets
                    </Button>
                  </Link>
                ) : (
                  <Link to={`/movies/${featuredMovie.id}`}>
                    <Button size="lg" variant="outline">
                      <Ticket className="h-4 w-4" />
                      View movie
                    </Button>
                  </Link>
                )}
                <Link to={`/movies/${featuredMovie.id}`}>
                  <Button size="lg" variant="outline"><Play className="h-4 w-4" />View movie</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5"><Film className="h-8 w-8 text-ink-300" /></div>
              <h1 className="mt-6 font-display text-4xl font-bold text-ink-50 sm:text-5xl">Your next movie awaits</h1>
              <p className="mt-4 text-ink-300">Movies and showtimes will appear here when they are available.</p>
              <Link to="/movies" className="mt-7 inline-block"><Button size="lg">Explore movies<ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          )}
        </div>

        {/* Arrows sit at opposite screen edges, aligned on the same horizontal axis */}
        {showingMovies.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => changeFeaturedMovie(-1)}
              aria-label="Previous movie"
              className="absolute left-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white/60 sm:left-4 sm:h-12 sm:w-12 lg:left-5"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => changeFeaturedMovie(1)}
              aria-label="Next movie"
              className="absolute right-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white/60 sm:right-4 sm:h-12 sm:w-12 lg:right-5"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2" aria-label={`Movie ${selectedMovieIndex + 1} of ${showingMovies.length}`}>
              {showingMovies.slice(0, 8).map((movie, index) => (
                <button
                  key={movie.id}
                  type="button"
                  onClick={() => setSelectedMovieIndex(index)}
                  aria-label={`Show ${movie.title}`}
                  aria-pressed={movie.id === featuredMovie?.id}
                  className={`h-2 rounded-full transition-all duration-300 ${movie.id === featuredMovie?.id ? 'w-7 bg-white' : 'w-2 bg-white/45 hover:bg-white/80'}`}
                />
              ))}
            </div>
          </>
        )}
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