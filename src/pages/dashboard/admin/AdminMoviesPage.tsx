import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  Film,
  Globe2,
  ImagePlus,
  Link2,
  Play,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import { Badge, Button, Card, Input, Spinner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatDuration, formatReleaseDate } from '@/utils/format';

interface AdminMovie {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  genre: string[] | null;
  language: string;
  duration_minutes: number;
  certificate: string | null;
  release_date: string | null;
  rating: number | null;
  trailer_url: string | null;
  status: 'now_showing' | 'upcoming' | 'archived';
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

type MovieForm = {
  title: string;
  description: string;
  genre: string;
  language: string;
  duration_minutes: string;
  certificate: string;
  release_date: string;
  rating: string;
  trailer_url: string;
  backdrop_url: string;
  status: AdminMovie['status'];
  is_featured: boolean;
};

const EMPTY_FORM: MovieForm = {
  title: '',
  description: '',
  genre: '',
  language: '',
  duration_minutes: '',
  certificate: '',
  release_date: '',
  rating: '',
  trailer_url: '',
  backdrop_url: '',
  status: 'upcoming',
  is_featured: false,
};

const MOVIE_SELECT = `
  id,
  title,
  description,
  poster_url,
  backdrop_url,
  genre,
  language,
  duration_minutes,
  certificate,
  release_date,
  rating,
  trailer_url,
  status,
  is_featured,
  created_at,
  updated_at
`;

function formatGenres(value: string[] | null) {
  return Array.isArray(value) ? value.join(', ') : '';
}

function posterPathFromUrl(url: string | null) {
  if (!url) return null;

  const marker = '/storage/v1/object/public/movie-posters/';
  const index = url.indexOf(marker);
  if (index === -1) return null;

  return decodeURIComponent(url.slice(index + marker.length));
}

function extensionFor(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && ['jpg', 'jpeg', 'png', 'webp'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }

  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

export function AdminMoviesPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminMovie['status']>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MovieForm>(EMPTY_FORM);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  async function loadMovies() {
    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('movies')
      .select(MOVIE_SELECT)
      .order('is_featured', { ascending: false })
      .order('release_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (queryError) {
      setMovies([]);
      setError(queryError.message);
    } else {
      setMovies((data ?? []) as AdminMovie[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    void loadMovies();
  }, [isAdmin]);

  const filteredMovies = useMemo(() => {
    const query = search.trim().toLowerCase();

    return movies.filter((movie) => {
      const matchesSearch =
        !query ||
        movie.title.toLowerCase().includes(query) ||
        movie.language.toLowerCase().includes(query) ||
        formatGenres(movie.genre).toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' || movie.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [movies, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: movies.length,
      nowShowing: movies.filter((movie) => movie.status === 'now_showing').length,
      upcoming: movies.filter((movie) => movie.status === 'upcoming').length,
      featured: movies.filter((movie) => movie.is_featured).length,
    };
  }, [movies]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setPosterFile(null);
    setPosterPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    resetForm();
    setError(null);
  }

  function openCreate() {
    setNotice(null);
    setError(null);
    resetForm();
    setFormOpen(true);
  }

  function openEdit(movie: AdminMovie) {
    setNotice(null);
    setError(null);
    setEditingId(movie.id);
    setForm({
      title: movie.title,
      description: movie.description ?? '',
      genre: formatGenres(movie.genre),
      language: movie.language,
      duration_minutes: String(movie.duration_minutes ?? ''),
      certificate: movie.certificate ?? '',
      release_date: movie.release_date ?? '',
      rating: movie.rating == null ? '' : String(movie.rating),
      trailer_url: movie.trailer_url ?? '',
      backdrop_url: movie.backdrop_url ?? '',
      status: movie.status,
      is_featured: movie.is_featured,
    });
    setPosterFile(null);
    setPosterPreview(movie.poster_url);
    setFormOpen(true);
  }

  function handlePosterChange(file: File | undefined) {
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Poster must be JPG, PNG, or WebP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Poster must be 10 MB or smaller.');
      return;
    }

    setError(null);
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  }

  async function uploadPoster(file: File) {
    const path = `movies/${crypto.randomUUID()}.${extensionFor(file)}`;

    const { error: uploadError } = await supabase.storage
      .from('movie-posters')
      .upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('movie-posters')
      .getPublicUrl(path);

    return { path, publicUrl: data.publicUrl };
  }

  async function deletePoster(url: string | null) {
    const path = posterPathFromUrl(url);
    if (!path) return;

    const { error: removeError } = await supabase.storage
      .from('movie-posters')
      .remove([path]);

    if (removeError) {
      console.warn('Movie poster could not be removed:', removeError.message);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const title = form.title.trim();
      const language = form.language.trim();
      const duration = Number(form.duration_minutes);
      const rating = form.rating.trim() === '' ? null : Number(form.rating);

      if (!title) throw new Error('Movie title is required.');
      if (!language) throw new Error('Language is required.');
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error('Enter a valid runtime in minutes.');
      }
      if (rating !== null && (!Number.isFinite(rating) || rating < 0 || rating > 10)) {
        throw new Error('Rating must be between 0 and 10.');
      }
      if (!editingId && !posterFile) {
        throw new Error('Please choose a poster image.');
      }

      const genre = form.genre
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      let posterUrl: string | null | undefined;
      let newPosterPath: string | null = null;

      if (posterFile) {
        const uploaded = await uploadPoster(posterFile);
        posterUrl = uploaded.publicUrl;
        newPosterPath = uploaded.path;
      }

      const payload = {
        title,
        description: form.description.trim() || null,
        poster_url: posterUrl,
        backdrop_url: form.backdrop_url.trim() || null,
        genre: genre.length > 0 ? genre : null,
        language,
        duration_minutes: Math.round(duration),
        certificate: form.certificate.trim() || null,
        release_date: form.release_date || null,
        rating,
        trailer_url: form.trailer_url.trim() || null,
        status: form.status,
        is_featured: form.is_featured,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const existing = movies.find((movie) => movie.id === editingId);

        if (form.is_featured) {
          const { error: featureError } = await supabase
            .from('movies')
            .update({ is_featured: false })
            .neq('id', editingId);

          if (featureError) throw featureError;
        }

        const updatePayload = {
          ...payload,
          ...(posterUrl !== undefined
            ? { poster_url: posterUrl }
            : {}),
        };

        const { error: updateError } = await supabase
          .from('movies')
          .update(updatePayload)
          .eq('id', editingId);

        if (updateError) {
          if (newPosterPath) {
            await supabase.storage.from('movie-posters').remove([newPosterPath]);
          }
          throw updateError;
        }

        if (posterUrl && existing?.poster_url) {
          await deletePoster(existing.poster_url);
        }

        setNotice('Movie updated successfully.');
      } else {
        if (!posterUrl) throw new Error('Poster upload failed.');

        if (form.is_featured) {
          const { error: featureError } = await supabase
            .from('movies')
            .update({ is_featured: false })
            .neq('id', '00000000-0000-0000-0000-000000000000');

          if (featureError) {
            if (newPosterPath) {
              await supabase.storage.from('movie-posters').remove([newPosterPath]);
            }
            throw featureError;
          }
        }

        const { error: insertError } = await supabase
          .from('movies')
          .insert({
            ...payload,
            poster_url: posterUrl,
          });

        if (insertError) {
          if (newPosterPath) {
            await supabase.storage.from('movie-posters').remove([newPosterPath]);
          }
          throw insertError;
        }

        setNotice('Movie added successfully.');
      }

      await loadMovies();
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save movie.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(movie: AdminMovie) {
    if (!isAdmin) return;

    const confirmed = window.confirm(
      `Delete “${movie.title}”? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(movie.id);
    setError(null);
    setNotice(null);

    const { error: deleteError } = await supabase
      .from('movies')
      .delete()
      .eq('id', movie.id);

    if (deleteError) {
      setError(
        `Could not delete ${movie.title}. ${deleteError.message}`
      );
      setDeletingId(null);
      return;
    }

    await deletePoster(movie.poster_url);
    setMovies((current) => current.filter((item) => item.id !== movie.id));
    setNotice('Movie deleted successfully.');
    setDeletingId(null);
  }

  if (!isAdmin) {
    return (
      <Card className="p-12 text-center">
        <Film className="mx-auto h-12 w-12 text-ink-600" />
        <h1 className="mt-4 font-display text-2xl font-bold text-ink-50">Access denied</h1>
        <p className="mt-2 text-sm text-ink-500">This area is available to administrators only.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge tone="primary" variant="soft">Catalog</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-50 sm:text-4xl">
            Movie management
          </h1>
          <p className="mt-1 text-ink-400">Add, edit and organize the movies shown on CineSecure.</p>
        </div>
        <Button onClick={formOpen ? closeForm : openCreate}>
          {formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {formOpen ? 'Close form' : 'Add movie'}
        </Button>
      </div>

      {notice && (
        <div className="rounded-xl border border-success-500/20 bg-success-500/10 px-4 py-3 text-sm text-success-300">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-error-500/20 bg-error-500/10 px-4 py-3 text-sm text-error-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Total movies" value={stats.total} />
        <MiniStat label="Now showing" value={stats.nowShowing} />
        <MiniStat label="Upcoming" value={stats.upcoming} />
        <MiniStat label="Featured" value={stats.featured} />
      </div>

      {formOpen && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="font-display text-xl font-bold text-ink-50">
                {editingId ? 'Edit movie' : 'Add a movie'}
              </h2>
              <p className="mt-0.5 text-sm text-ink-500">Fill in the catalog details below.</p>
            </div>
            {editingId && <Badge tone="secondary">Editing</Badge>}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6 p-5 lg:grid-cols-[280px_1fr]">
            <div>
              <label className="block text-sm font-medium text-ink-200">Poster</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 flex aspect-[2/3] w-full overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-left transition hover:border-primary-400/50 hover:bg-primary-500/[0.04]"
              >
                {posterPreview ? (
                  <img src={posterPreview} alt="Poster preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="m-auto flex flex-col items-center gap-3 px-5 text-center">
                    <ImagePlus className="h-10 w-10 text-ink-600" />
                    <span className="text-sm font-semibold text-ink-300">Upload poster</span>
                    <span className="text-xs leading-5 text-ink-500">JPG, PNG or WebP · max 10 MB</span>
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => handlePosterChange(event.target.files?.[0])}
              />
              {posterPreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary-300 hover:text-primary-200"
                >
                  <Upload className="h-3.5 w-3.5" /> Replace poster
                </button>
              )}
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Title"
                  name="title"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="e.g. Avengers: Endgame"
                  required
                />
                <Input
                  label="Language"
                  name="language"
                  value={form.language}
                  onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}
                  placeholder="e.g. English"
                  icon={<Globe2 className="h-4 w-4" />}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-200">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={4}
                  placeholder="Short description of the movie..."
                  className="input-field mt-1.5 resize-y"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  label="Runtime (min)"
                  name="duration_minutes"
                  type="number"
                  min="1"
                  value={form.duration_minutes}
                  onChange={(event) => setForm((current) => ({ ...current, duration_minutes: event.target.value }))}
                  placeholder="148"
                  icon={<Clock3 className="h-4 w-4" />}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-ink-200">Certificate</label>
                  <select
                    value={form.certificate}
                    onChange={(event) => setForm((current) => ({ ...current, certificate: event.target.value }))}
                    className="input-field mt-1.5"
                  >
                    <option value="">Not set</option>
                    <option value="U">U</option>
                    <option value="UA">UA</option>
                    <option value="A">A</option>
                    <option value="S">S</option>
                  </select>
                </div>
                <Input
                  label="Rating / 10"
                  name="rating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={form.rating}
                  onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))}
                  placeholder="8.5"
                  icon={<Star className="h-4 w-4" />}
                />
                <Input
                  label="Release date"
                  name="release_date"
                  type="date"
                  value={form.release_date}
                  onChange={(event) => setForm((current) => ({ ...current, release_date: event.target.value }))}
                  icon={<CalendarDays className="h-4 w-4" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-200">Genres</label>
                <input
                  value={form.genre}
                  onChange={(event) => setForm((current) => ({ ...current, genre: event.target.value }))}
                  placeholder="Action, Adventure, Sci-Fi"
                  className="input-field mt-1.5"
                />
                <p className="mt-1.5 text-xs text-ink-600">Separate genres with commas.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Trailer URL"
                  name="trailer_url"
                  type="url"
                  value={form.trailer_url}
                  onChange={(event) => setForm((current) => ({ ...current, trailer_url: event.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  icon={<Play className="h-4 w-4" />}
                />
                <Input
                  label="Backdrop URL"
                  name="backdrop_url"
                  type="url"
                  value={form.backdrop_url}
                  onChange={(event) => setForm((current) => ({ ...current, backdrop_url: event.target.value }))}
                  placeholder="Optional wide background image URL"
                  icon={<Link2 className="h-4 w-4" />}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <label className="block text-sm font-medium text-ink-200">Status</label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as MovieForm['status'] }))}
                    className="input-field mt-1.5"
                  >
                    <option value="now_showing">Now Showing</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <label className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-ink-200">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(event) => setForm((current) => ({ ...current, is_featured: event.target.checked }))}
                    className="h-4 w-4 accent-primary-500"
                  />
                  <span>Featured on home</span>
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  <Check className="h-4 w-4" />
                  {editingId ? 'Save changes' : 'Add movie'}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink-50">Movie catalog</h2>
            <p className="mt-0.5 text-sm text-ink-500">{filteredMovies.length} movie{filteredMovies.length === 1 ? '' : 's'} shown</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              name="movie-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search movies..."
              icon={<Search className="h-4 w-4" />}
              className="sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="input-field sm:w-44"
            >
              <option value="all">All statuses</option>
              <option value="now_showing">Now Showing</option>
              <option value="upcoming">Upcoming</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filteredMovies.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
              <Film className="h-7 w-7 text-ink-600" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-ink-200">
              {movies.length === 0 ? 'No movies added yet' : 'No matching movies'}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500">
              {movies.length === 0
                ? 'Add the first movie to start building your CineSecure catalog.'
                : 'Try a different search or status filter.'}
            </p>
            {movies.length === 0 && (
              <Button className="mt-5" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add first movie
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredMovies.map((movie) => (
              <article key={movie.id} className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.02] md:flex-row md:items-center">
                <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-ink-900">
                  {movie.poster_url ? (
                    <img src={movie.poster_url} alt={movie.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Film className="h-6 w-6 text-ink-700" /></div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-ink-50">{movie.title}</h3>
                    {movie.is_featured && <Badge tone="accent" icon={<Star className="h-3 w-3" />}>Featured</Badge>}
                    <StatusBadge status={movie.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                    <span>{formatGenres(movie.genre) || 'Genre not set'}</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>{movie.language}</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>{formatDuration(movie.duration_minutes)}</span>
                    {movie.certificate && <><span className="h-1 w-1 rounded-full bg-white/20" /><span>{movie.certificate}</span></>}
                    {movie.rating != null && <><span className="h-1 w-1 rounded-full bg-white/20" /><span className="inline-flex items-center gap-1"><Star className="h-3 w-3" />{movie.rating}/10</span></>}
                  </div>
                  {movie.release_date && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-600"><CalendarDays className="h-3.5 w-3.5" />{formatReleaseDate(movie.release_date)}</p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(movie)}>
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="danger" loading={deletingId === movie.id} onClick={() => void handleDelete(movie)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink-50">{value}</p>
    </Card>
  );
}

function StatusBadge({ status }: { status: AdminMovie['status'] }) {
  if (status === 'now_showing') return <Badge tone="success">Now Showing</Badge>;
  if (status === 'upcoming') return <Badge tone="primary">Upcoming</Badge>;
  return <Badge tone="neutral">Archived</Badge>;
}
