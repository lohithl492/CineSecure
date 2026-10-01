import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  CalendarDays,
  Clock3,
  MapPin,
  Monitor,
  Pencil,
  Plus,
  RefreshCw,
  Ticket,
  Trash2,
  X,
} from 'lucide-react';

import { Badge, Button, Card, Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, formatTime } from '@/utils/format';

interface Movie {
  id: string;
  title: string;
  duration_minutes: number | null;
  language: string | null;
}

interface Theater {
  id: string;
  name: string;
}

interface Screen {
  id: string;
  theater_id: string;
  name: string;
  total_seats: number | null;
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
  movies?: Movie | Movie[] | null;
  screens?: {
    name: string;
    theater_id: string;
    theaters?: Theater | Theater[] | null;
  } | {
    name: string;
    theater_id: string;
    theaters?: Theater | Theater[] | null;
  }[] | null;
}

type ShowStatus = 'scheduled' | 'cancelled' | 'inactive';

type FormState = {
  movieId: string;
  theaterId: string;
  screenId: string;
  date: string;
  startTime: string;
  endTime: string;
  basePrice: string;
  language: string;
  format: string;
  status: ShowStatus;
};

const emptyForm: FormState = {
  movieId: '',
  theaterId: '',
  screenId: '',
  date: '',
  startTime: '',
  endTime: '',
  basePrice: '200',
  language: 'English',
  format: '2D',
  status: 'scheduled',
};

function getMovie(show: Show) {
  return Array.isArray(show.movies) ? show.movies[0] : show.movies;
}

function getScreen(show: Show) {
  return Array.isArray(show.screens) ? show.screens[0] : show.screens;
}

function getTheater(show: Show) {
  const screen = getScreen(show);
  if (!screen?.theaters) return null;
  return Array.isArray(screen.theaters)
    ? screen.theaters[0]
    : screen.theaters;
}

function localDateTimeParts(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { date: '', time: '' };
  }

  const pad = (number: number) => String(number).padStart(2, '0');

  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function toIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function inputClassName() {
  return 'h-11 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 text-sm text-white outline-none transition placeholder:text-ink-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/10';
}

function labelClassName() {
  return 'mb-2 block text-sm font-medium text-ink-200';
}

export function AdminShowsPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [shows, setShows] = useState<Show[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filteredScreens = useMemo(
    () => screens.filter((screen) => screen.theater_id === form.theaterId),
    [screens, form.theaterId],
  );

  const filteredShows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return shows.filter((show) => {
      const movie = getMovie(show);
      const screen = getScreen(show);
      const theater = getTheater(show);
      const status = show.status?.toLowerCase() || 'scheduled';

      const matchesSearch =
        !query ||
        movie?.title.toLowerCase().includes(query) ||
        screen?.name.toLowerCase().includes(query) ||
        theater?.name.toLowerCase().includes(query) ||
        show.language?.toLowerCase().includes(query) ||
        show.format?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [shows, search, statusFilter]);

  const stats = useMemo(() => {
    const scheduled = shows.filter(
      (show) => (show.status || 'scheduled').toLowerCase() === 'scheduled',
    ).length;
    const cancelled = shows.filter(
      (show) => (show.status || '').toLowerCase() === 'cancelled',
    ).length;

    return {
      total: shows.length,
      scheduled,
      cancelled,
    };
  }, [shows]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [moviesResult, theatersResult, screensResult, showsResult] =
        await Promise.all([
          supabase
            .from('movies')
            .select('id, title, duration_minutes, language')
            .order('title', { ascending: true }),
          supabase
            .from('theaters')
            .select('id, name')
            .order('name', { ascending: true }),
          supabase
            .from('screens')
            .select('id, theater_id, name, total_seats')
            .order('name', { ascending: true }),
          supabase
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
                id,
                title,
                duration_minutes,
                language
              ),
              screens (
                name,
                theater_id,
                theaters (
                  id,
                  name
                )
              )
            `)
            .order('start_time', { ascending: true }),
        ]);

      if (moviesResult.error) throw moviesResult.error;
      if (theatersResult.error) throw theatersResult.error;
      if (screensResult.error) throw screensResult.error;
      if (showsResult.error) throw showsResult.error;

      setMovies((moviesResult.data ?? []) as Movie[]);
      setTheaters((theatersResult.data ?? []) as Theater[]);
      setScreens((screensResult.data ?? []) as Screen[]);
      setShows((showsResult.data ?? []) as unknown as Show[]);
    } catch (err) {
      console.error('Failed to load show management data:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load show management data.',
      );
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    const firstMovie = movies[0];
    const firstTheater = theaters[0];
    const firstScreen = screens.find(
      (screen) => screen.theater_id === firstTheater?.id,
    );

    setEditingId(null);
    setForm({
      ...emptyForm,
      movieId: firstMovie?.id ?? '',
      theaterId: firstTheater?.id ?? '',
      screenId: firstScreen?.id ?? '',
      language: firstMovie?.language || 'English',
    });
    setNotice(null);
    setError(null);
    setShowForm(true);
  }

  function openEditForm(show: Show) {
    const screen = getScreen(show);
    const movie = getMovie(show);
    const parts = localDateTimeParts(show.start_time);
    const endParts = localDateTimeParts(show.end_time);

    setEditingId(show.id);
    setForm({
      movieId: show.movie_id,
      theaterId: screen?.theater_id ?? '',
      screenId: show.screen_id,
      date: parts.date,
      startTime: parts.time,
      endTime: endParts.time,
      basePrice: String(Number(show.base_price) || 0),
      language: show.language || movie?.language || 'English',
      format: show.format || '2D',
      status: (show.status as ShowStatus) || 'scheduled',
    });
    setNotice(null);
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingId(null);
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleMovieChange(movieId: string) {
    const movie = movies.find((item) => item.id === movieId);
    updateForm('movieId', movieId);
    if (movie?.language) {
      updateForm('language', movie.language);
    }
  }

  function handleTheaterChange(theaterId: string) {
    const firstScreen = screens.find(
      (screen) => screen.theater_id === theaterId,
    );

    setForm((current) => ({
      ...current,
      theaterId,
      screenId: firstScreen?.id ?? '',
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setNotice(null);

    if (!form.movieId || !form.theaterId || !form.screenId) {
      setError('Select a movie, theater and screen.');
      return;
    }

    if (!form.date || !form.startTime || !form.endTime) {
      setError('Select the show date, start time and end time.');
      return;
    }

    const start = new Date(`${form.date}T${form.startTime}:00`);
    const end = new Date(`${form.date}T${form.endTime}:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError('Enter a valid date and time.');
      return;
    }

    if (end <= start) {
      setError('End time must be later than the start time.');
      return;
    }

    const price = Number(form.basePrice);
    if (!Number.isFinite(price) || price <= 0) {
      setError('Enter a valid ticket price greater than ₹0.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        movie_id: form.movieId,
        screen_id: form.screenId,
        start_time: toIso(form.date, form.startTime),
        end_time: toIso(form.date, form.endTime),
        base_price: price,
        language: form.language.trim() || null,
        format: form.format.trim() || null,
        status: form.status,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from('shows')
          .update(payload)
          .eq('id', editingId);

        if (updateError) throw updateError;
        setNotice('Show updated successfully.');
      } else {
        const { error: insertError } = await supabase
          .from('shows')
          .insert(payload);

        if (insertError) throw insertError;
        setNotice('Show added successfully.');
      }

      setShowForm(false);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error('Failed to save show:', err);
      setError(
        err instanceof Error ? err.message : 'Unable to save the show.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(show: Show) {
    const movie = getMovie(show);
    const start = formatDate(show.start_time);
    const confirmed = window.confirm(
      `Delete the ${movie?.title || 'movie'} show on ${start}?`,
    );

    if (!confirmed) return;

    setError(null);
    setNotice(null);

    try {
      const { error: deleteError } = await supabase
        .from('shows')
        .delete()
        .eq('id', show.id);

      if (deleteError) throw deleteError;

      setNotice('Show deleted successfully.');
      await loadData();
    } catch (err) {
      console.error('Failed to delete show:', err);
      setError(
        err instanceof Error ? err.message : 'Unable to delete the show.',
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <main className="animate-fadeIn">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(239,68,68,0.10),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(37,99,235,0.08),transparent_35%)]" />

        <div className="container-max section-pad relative py-10 sm:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge tone="accent" variant="soft">
                Schedule
              </Badge>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink-50 sm:text-5xl">
                Show management
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-400 sm:text-base">
                Create and manage movie showtimes across your theaters and screens.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={loadData} disabled={loading || saving}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={openAddForm} disabled={movies.length === 0 || theaters.length === 0 || screens.length === 0}>
                <Plus className="h-4 w-4" />
                Add show
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard icon={<Ticket className="h-5 w-5" />} label="Total shows" value={stats.total} />
            <StatCard icon={<Clock3 className="h-5 w-5" />} label="Scheduled" value={stats.scheduled} />
            <StatCard icon={<X className="h-5 w-5" />} label="Cancelled" value={stats.cancelled} />
          </div>
        </div>
      </section>

      <div className="container-max section-pad py-10 sm:py-12">
        {(error || notice) && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${error ? 'border-error-500/30 bg-error-500/10 text-error-300' : 'border-success-500/30 bg-success-500/10 text-success-300'}`}>
            {error || notice}
          </div>
        )}

        {showForm && (
          <Card className="mb-8 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-400">
                  {editingId ? 'Edit show' : 'New show'}
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-white">
                  {editingId ? 'Update showtime' : 'Create showtime'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-ink-500 transition hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-5 lg:grid-cols-2">
                <Field label="Movie">
                  <select
                    value={form.movieId}
                    onChange={(event) => handleMovieChange(event.target.value)}
                    className={inputClassName()}
                    required
                  >
                    <option value="">Select movie</option>
                    {movies.map((movie) => (
                      <option key={movie.id} value={movie.id}>
                        {movie.title}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Theater">
                  <select
                    value={form.theaterId}
                    onChange={(event) => handleTheaterChange(event.target.value)}
                    className={inputClassName()}
                    required
                  >
                    <option value="">Select theater</option>
                    {theaters.map((theater) => (
                      <option key={theater.id} value={theater.id}>
                        {theater.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Screen">
                  <select
                    value={form.screenId}
                    onChange={(event) => updateForm('screenId', event.target.value)}
                    className={inputClassName()}
                    required
                    disabled={!form.theaterId}
                  >
                    <option value="">
                      {form.theaterId ? 'Select screen' : 'Select theater first'}
                    </option>
                    {filteredScreens.map((screen) => (
                      <option key={screen.id} value={screen.id}>
                        {screen.name}{screen.total_seats ? ` · ${screen.total_seats} seats` : ''}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Show date">
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => updateForm('date', event.target.value)}
                    className={inputClassName()}
                    required
                  />
                </Field>

                <Field label="Start time">
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(event) => updateForm('startTime', event.target.value)}
                    className={inputClassName()}
                    required
                  />
                </Field>

                <Field label="End time">
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(event) => updateForm('endTime', event.target.value)}
                    className={inputClassName()}
                    required
                  />
                </Field>

                <Field label="Base ticket price">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.basePrice}
                    onChange={(event) => updateForm('basePrice', event.target.value)}
                    className={inputClassName()}
                    placeholder="200"
                    required
                  />
                </Field>

                <Field label="Language">
                  <input
                    type="text"
                    value={form.language}
                    onChange={(event) => updateForm('language', event.target.value)}
                    className={inputClassName()}
                    placeholder="English"
                  />
                </Field>

                <Field label="Format">
<select
  value={form.format}
  onChange={(event) => updateForm('format', event.target.value)}
  className={inputClassName()}
>
  <option value="2D">2D</option>
  <option value="3D">3D</option>
  <option value="IMAX">IMAX</option>
  <option value="IMAX 3D">IMAX 3D</option>
  <option value="4DX">4DX</option>
  <option value="EPIC">EPIC</option>
</select>
                </Field>

                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(event) => updateForm('status', event.target.value as ShowStatus)}
                    className={inputClassName()}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </Field>
              </div>

              <div className="mt-7 flex justify-end gap-3 border-t border-white/10 pt-6">
                <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add show'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {movies.length === 0 || theaters.length === 0 || screens.length === 0 ? (
          <Card className="mb-8 border-warning-500/20 bg-warning-500/[0.04] p-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-500/10 text-warning-300">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Show setup needs more data</h2>
                <p className="mt-1 text-sm leading-6 text-ink-400">
                  {movies.length === 0 && 'Add at least one movie. '}
                  {theaters.length === 0 && 'Add at least one theater. '}
                  {screens.length === 0 && 'Add at least one screen linked to a theater.'}
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Show schedule</h2>
              <p className="mt-1 text-sm text-ink-500">
                {filteredShows.length} {filteredShows.length === 1 ? 'show' : 'shows'} shown
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search movie, theater or screen..."
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 text-sm text-white outline-none placeholder:text-ink-600 focus:border-primary-500/50 sm:w-80"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-slate-950/80 px-3.5 text-sm text-white outline-none focus:border-primary-500/50"
              >
                <option value="all">All statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="cancelled">Cancelled</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {filteredShows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                <CalendarDays className="h-7 w-7 text-ink-600" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-ink-200">No shows found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500">
                Add a showtime or change your search and status filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredShows.map((show) => {
                const movie = getMovie(show);
                const screen = getScreen(show);
                const theater = getTheater(show);
                const status = (show.status || 'scheduled').toLowerCase();

                return (
                  <div key={show.id} className="px-6 py-5 transition hover:bg-white/[0.02]">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            {movie?.title || 'Unknown movie'}
                          </h3>
                          <StatusBadge status={status} />
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-ink-400 sm:grid-cols-2 xl:grid-cols-4">
                          <Info icon={<MapPin className="h-4 w-4" />} value={theater?.name || 'Unknown theater'} />
                          <Info icon={<Monitor className="h-4 w-4" />} value={screen?.name || 'Unknown screen'} />
                          <Info icon={<CalendarDays className="h-4 w-4" />} value={formatDate(show.start_time)} />
                          <Info icon={<Clock3 className="h-4 w-4" />} value={`${formatTime(show.start_time)} – ${formatTime(show.end_time)}`} />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-500">
                          <span>{show.language || movie?.language || 'Language not set'}</span>
                          <span>{show.format || 'Format not set'}</span>
                          <span className="font-semibold text-ink-300">
                            {formatCurrency(Number(show.base_price) || 0)} base
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" onClick={() => openEditForm(show)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button variant="danger" onClick={() => handleDelete(show)}>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className={labelClassName()}>{label}</label>
      {children}
    </div>
  );
}

function Info({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="shrink-0 text-ink-600">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <Badge tone="error" variant="soft">
        Cancelled
      </Badge>
    );
  }

  if (status === 'inactive') {
    return (
      <Badge tone="neutral" variant="soft">
        Inactive
      </Badge>
    );
  }

  return (
    <Badge tone="success" variant="soft">
      Scheduled
    </Badge>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 text-ink-500">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-300">
          {icon}
        </div>
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-4 font-display text-3xl font-bold text-white">{value}</p>
    </Card>
  );
}
