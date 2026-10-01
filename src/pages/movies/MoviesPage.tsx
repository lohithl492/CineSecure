import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Film,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import { Button, Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';

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
  start_time: string;
  status: string | null;
}

type MovieFilter = 'all' | 'now-showing' | 'upcoming';

function formatDuration(minutes: number | null) {
  if (!minutes) {
    return '';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/*
 * Supabase may return genre as either:
 * - a string
 * - an array of strings
 * - null
 *
 * Handle all three safely.
 */
function formatGenre(
  genre: string | string[] | null
): string {
  if (!genre) {
    return '';
  }

  if (Array.isArray(genre)) {
    return genre
      .filter(Boolean)
      .map((item) =>
        String(item)
          .replace(/([a-z])([A-Z])/g, '$1, $2')
          .trim()
      )
      .join(', ');
  }

  return genre
    .replace(/([a-z])([A-Z])/g, '$1, $2')
    .trim();
}

function formatReleaseDate(date: string | null) {
  if (!date) {
    return '';
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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

function MovieCard({
  movie,
  isNowShowing,
}: {
  movie: Movie;
  isNowShowing: boolean;
}) {
  return (
    <Link
      to={`/movies/${movie.id}`}
      className="group block min-w-0"
    >
      <article>
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-lg transition duration-300 group-hover:-translate-y-1 group-hover:border-primary-500/30 group-hover:shadow-2xl group-hover:shadow-primary-950/30">
          <MoviePoster
            movie={movie}
            className="transition duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-90" />

          {/* Status */}
          <div className="absolute left-3 top-3">
            <span
              className={`rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-md ${
                isNowShowing
                  ? 'border-primary-400/20 bg-primary-500/15 text-primary-200'
                  : 'border-white/10 bg-black/40 text-white/75'
              }`}
            >
              {isNowShowing ? 'Now showing' : 'Coming soon'}
            </span>
          </div>

          {/* Hover action */}
          <div className="absolute right-3 top-3 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ChevronRight className="h-4 w-4" />
          </div>

          {/* Movie information */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {movie.certificate && (
                <span className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-medium text-white/75 backdrop-blur-sm">
                  {movie.certificate}
                </span>
              )}

              {movie.language && (
                <span className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-medium text-white/75 backdrop-blur-sm">
                  {movie.language}
                </span>
              )}
            </div>

            <h3 className="line-clamp-2 text-base font-semibold leading-5 text-white">
              {movie.title}
            </h3>

            <div className="mt-2 flex items-center gap-2 text-xs text-white/55">
              {movie.genre && (
                <span className="line-clamp-1">
                  {formatGenre(movie.genre)}
                </span>
              )}

              {movie.genre && movie.duration_minutes && (
                <span className="h-1 w-1 shrink-0 rounded-full bg-white/30" />
              )}

              {movie.duration_minutes && (
                <span className="shrink-0">
                  {formatDuration(movie.duration_minutes)}
                </span>
              )}
            </div>
          </div>
        </div>

        {!isNowShowing && movie.release_date && (
          <div className="mt-3 flex items-center gap-2 text-xs text-ink-500">
            <CalendarDays className="h-3.5 w-3.5" />
            Releases {formatReleaseDate(movie.release_date)}
          </div>
        )}
      </article>
    </Link>
  );
}

function EmptyState({
  title,
  description,
  onClear,
}: {
  title: string;
  description: string;
  onClear?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <Film className="h-7 w-7 text-ink-600" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-ink-200">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500">
        {description}
      </p>

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 text-sm font-medium text-primary-300 transition hover:text-primary-200"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

export function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Show[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] =
    useState<MovieFilter>('all');

  const [selectedGenre, setSelectedGenre] =
    useState('all');

  const [selectedLanguage, setSelectedLanguage] =
    useState('all');

  useEffect(() => {
    let mounted = true;

    async function loadMovies() {
      setLoading(true);
      setError(null);

      try {
        const [moviesResult, showsResult] =
          await Promise.all([
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
              .order('release_date', {
                ascending: false,
              }),

            supabase
              .from('shows')
              .select(`
                id,
                movie_id,
                start_time,
                status
              `)
              .order('start_time', {
                ascending: true,
              }),
          ]);

        if (moviesResult.error) {
          throw moviesResult.error;
        }

        if (showsResult.error) {
          throw showsResult.error;
        }

        if (!mounted) {
          return;
        }

        setMovies(
          (moviesResult.data || []) as Movie[]
        );

        setShows(
          (showsResult.data || []) as Show[]
        );
      } catch (err) {
        console.error(
          'Failed to load movies:',
          err
        );

        if (mounted) {
          setMovies([]);
          setShows([]);

          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load movies.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMovies();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Determine which movies have shows.
   */
  const nowShowingIds = useMemo(() => {
    const ids = new Set<string>();

    for (const show of shows) {
      const status =
        show.status?.toLowerCase();

      if (
        status === 'cancelled' ||
        status === 'canceled' ||
        status === 'inactive'
      ) {
        continue;
      }

      ids.add(show.movie_id);
    }

    return ids;
  }, [shows]);

  /*
   * Build unique genre list.
   */
  const genres = useMemo(() => {
    const values = new Set<string>();

    for (const movie of movies) {
      if (!movie.genre) {
        continue;
      }

      const formatted =
        formatGenre(movie.genre);

      if (formatted) {
        values.add(formatted);
      }
    }

    return Array.from(values).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [movies]);

  /*
   * Build unique language list.
   */
  const languages = useMemo(() => {
    const values = new Set<string>();

    for (const movie of movies) {
      if (movie.language) {
        values.add(movie.language);
      }
    }

    return Array.from(values).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [movies]);

  /*
   * Apply search and filters.
   */
  const filteredMovies = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return movies.filter((movie) => {
      const genreText =
        formatGenre(movie.genre);

      const matchesSearch =
        !query ||
        movie.title
          .toLowerCase()
          .includes(query) ||
        movie.description
          ?.toLowerCase()
          .includes(query) ||
        genreText
          .toLowerCase()
          .includes(query);

      const matchesType =
        filter === 'all' ||
        (filter === 'now-showing' &&
          nowShowingIds.has(movie.id)) ||
        (filter === 'upcoming' &&
          !nowShowingIds.has(movie.id));

      const matchesGenre =
        selectedGenre === 'all' ||
        genreText === selectedGenre;

      const matchesLanguage =
        selectedLanguage === 'all' ||
        movie.language === selectedLanguage;

      return (
        matchesSearch &&
        matchesType &&
        matchesGenre &&
        matchesLanguage
      );
    });
  }, [
    movies,
    search,
    filter,
    selectedGenre,
    selectedLanguage,
    nowShowingIds,
  ]);

  const nowShowingMovies = useMemo(
    () =>
      filteredMovies.filter((movie) =>
        nowShowingIds.has(movie.id)
      ),
    [filteredMovies, nowShowingIds]
  );

  const upcomingMovies = useMemo(
    () =>
      filteredMovies.filter(
        (movie) =>
          !nowShowingIds.has(movie.id)
      ),
    [filteredMovies, nowShowingIds]
  );

  const hasActiveFilters =
    search.trim().length > 0 ||
    filter !== 'all' ||
    selectedGenre !== 'all' ||
    selectedLanguage !== 'all';

  function clearFilters() {
    setSearch('');
    setFilter('all');
    setSelectedGenre('all');
    setSelectedLanguage('all');
  }

  if (loading) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <main className="container-max section-pad py-16">
        <EmptyState
          title="Unable to load movies"
          description={error}
        />
      </main>
    );
  }

  return (
    <main className="animate-fadeIn">
      {/* PAGE HEADER */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(239,68,68,0.12),transparent_32%),radial-gradient(circle_at_80%_30%,rgba(37,99,235,0.10),transparent_35%)]" />

        <div className="container-max section-pad relative py-14 sm:py-16">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">
              <span className="h-px w-7 bg-primary-500" />
              CineSecure
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Movies
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-400 sm:text-lg">
              Discover what&apos;s playing, explore
              upcoming releases and find your next
              movie experience.
            </p>
          </div>

          {/* SEARCH */}
          <div className="mt-9 max-w-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search movies..."
                className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-12 pr-12 text-sm text-white outline-none backdrop-blur-sm transition placeholder:text-ink-600 focus:border-primary-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-primary-500/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-500 transition hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="border-b border-white/5 bg-white/[0.015]">
        <div className="container-max section-pad py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-1 hidden items-center gap-2 text-xs font-medium text-ink-500 sm:flex">
                <SlidersHorizontal className="h-4 w-4" />
                Browse
              </div>

              {[
                ['all', 'All movies'],
                ['now-showing', 'Now showing'],
                ['upcoming', 'Coming soon'],
              ].map(([value, label]) => {
                const active =
                  filter === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFilter(
                        value as MovieFilter
                      )
                    }
                    className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                      active
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-950/30'
                        : 'border border-white/10 bg-white/[0.02] text-ink-400 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {genres.length > 0 && (
                <select
                  value={selectedGenre}
                  onChange={(event) =>
                    setSelectedGenre(
                      event.target.value
                    )
                  }
                  className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-ink-300 outline-none transition focus:border-primary-500/40"
                >
                  <option value="all">
                    All genres
                  </option>

                  {genres.map((genre) => (
                    <option
                      key={genre}
                      value={genre}
                    >
                      {genre}
                    </option>
                  ))}
                </select>
              )}

              {languages.length > 0 && (
                <select
                  value={selectedLanguage}
                  onChange={(event) =>
                    setSelectedLanguage(
                      event.target.value
                    )
                  }
                  className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-ink-300 outline-none transition focus:border-primary-500/40"
                >
                  <option value="all">
                    All languages
                  </option>

                  {languages.map((language) => (
                    <option
                      key={language}
                      value={language}
                    >
                      {language}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/5 pt-3">
              <p className="text-xs text-ink-500">
                Showing{' '}
                <span className="font-medium text-ink-300">
                  {filteredMovies.length}
                </span>{' '}
                {filteredMovies.length === 1
                  ? 'movie'
                  : 'movies'}
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs font-medium text-primary-300 transition hover:text-primary-200"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* MOVIES */}
      <div className="container-max section-pad py-14 sm:py-16">
        {filteredMovies.length === 0 ? (
          <EmptyState
            title="No movies found"
            description={
              hasActiveFilters
                ? 'Try changing your search or filters to find more movies.'
                : 'Movies will appear here when they are added to CineSecure.'
            }
            onClear={
              hasActiveFilters
                ? clearFilters
                : undefined
            }
          />
        ) : (
          <div className="space-y-16">
            {/* NOW SHOWING */}
            {nowShowingMovies.length > 0 &&
              (filter === 'all' ||
                filter === 'now-showing') && (
                <section>
                  <div className="mb-7 flex items-end justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">
                        <span className="h-px w-6 bg-primary-500" />
                        In cinemas
                      </div>

                      <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        Now showing
                      </h2>
                    </div>

                    <span className="text-sm text-ink-600">
                      {nowShowingMovies.length}{' '}
                      {nowShowingMovies.length === 1
                        ? 'movie'
                        : 'movies'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {nowShowingMovies.map(
                      (movie) => (
                        <MovieCard
                          key={movie.id}
                          movie={movie}
                          isNowShowing
                        />
                      )
                    )}
                  </div>
                </section>
              )}

            {/* UPCOMING */}
            {upcomingMovies.length > 0 &&
              (filter === 'all' ||
                filter === 'upcoming') && (
                <section>
                  <div className="mb-7 flex items-end justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">
                        <span className="h-px w-6 bg-primary-500" />
                        Coming soon
                      </div>

                      <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        Upcoming releases
                      </h2>
                    </div>

                    <span className="text-sm text-ink-600">
                      {upcomingMovies.length}{' '}
                      {upcomingMovies.length === 1
                        ? 'movie'
                        : 'movies'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {upcomingMovies.map(
                      (movie) => (
                        <MovieCard
                          key={movie.id}
                          movie={movie}
                          isNowShowing={false}
                        />
                      )
                    )}
                  </div>
                </section>
              )}
          </div>
        )}
      </div>

      {/* BOTTOM CTA */}
      {movies.length > 0 && (
        <section className="container-max section-pad pb-16 sm:pb-20">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary-600/10 via-slate-900 to-slate-950 px-6 py-10 sm:px-10">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary-500/10 blur-3xl" />

            <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-red-500/5 blur-3xl" />

            <div className="relative flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
              <div>
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <Clock3 className="h-4 w-4 text-primary-400" />

                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-400">
                    Your next experience
                  </span>
                </div>

                <h2 className="mt-2 font-display text-2xl font-bold text-white">
                  Found something you&apos;d like to watch?
                </h2>

                <p className="mt-2 text-sm text-ink-500">
                  Select a movie and find an available
                  showtime.
                </p>
              </div>

              <Link to="/movies">
                <Button variant="outline">
                  Browse movies
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}