import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Monitor,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import { Badge, Button, Card, Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface Theater {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
}

interface Screen {
  id: string;
  theater_id: string;
  name: string;
  total_seats: number;
}

interface Seat {
  id: string;
  screen_id: string;
  seat_number: string;
  row_label: string;
  seat_type: string | null;
  price_multiplier: number | null;
}

type TheaterForm = {
  name: string;
  address: string;
  city: string;
};

type ScreenForm = {
  theater_id: string;
  name: string;
  total_seats: string;
};

type SeatForm = {
  seat_number: string;
  row_label: string;
  seat_type: string;
  price_multiplier: string;
};

const emptyTheater: TheaterForm = {
  name: '',
  address: '',
  city: '',
};

const emptyScreen: ScreenForm = {
  theater_id: '',
  name: '',
  total_seats: '100',
};

const emptySeat: SeatForm = {
  seat_number: '',
  row_label: '',
  seat_type: 'Regular',
  price_multiplier: '1',
};

export function AdminTheatersPage() {
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [theaterForm, setTheaterForm] = useState<TheaterForm>(emptyTheater);
  const [screenForm, setScreenForm] = useState<ScreenForm>(emptyScreen);
  const [seatForm, setSeatForm] = useState<SeatForm>(emptySeat);

  const [editingTheaterId, setEditingTheaterId] = useState<string | null>(null);
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [editingSeatId, setEditingSeatId] = useState<string | null>(null);

  const [showTheaterForm, setShowTheaterForm] = useState(false);
  const [showScreenForm, setShowScreenForm] = useState(false);
  const [showSeatForm, setShowSeatForm] = useState(false);

  const [expandedTheater, setExpandedTheater] = useState<string | null>(null);
  const [expandedScreen, setExpandedScreen] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  const filteredTheaters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return theaters;
    return theaters.filter((theater) =>
      [theater.name, theater.address ?? '', theater.city ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [theaters, search]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [
        { data: theaterData, error: theaterError },
        { data: screenData, error: screenError },
        { data: seatData, error: seatError },
      ] = await Promise.all([
        supabase
          .from('theaters')
          .select('id, name, address, city')
          .order('name'),
        supabase
          .from('screens')
          .select('id, theater_id, name, total_seats')
          .order('name'),
        supabase
          .from('screen_seats')
          .select(
            'id, screen_id, seat_number, row_label, seat_type, price_multiplier',
          )
          .order('row_label')
          .order('seat_number'),
      ]);

      if (theaterError) throw new Error(theaterError.message);
      if (screenError) throw new Error(screenError.message);
      if (seatError) throw new Error(seatError.message);

      setTheaters((theaterData ?? []) as Theater[]);
      setScreens((screenData ?? []) as Screen[]);
      setSeats((seatData ?? []) as Seat[]);
    } catch (err) {
      console.error('Failed to load theater management:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load theater management.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForms() {
    setTheaterForm(emptyTheater);
    setScreenForm({
      ...emptyScreen,
      theater_id: theaters[0]?.id ?? '',
    });
    setSeatForm(emptySeat);
    setEditingTheaterId(null);
    setEditingScreenId(null);
    setEditingSeatId(null);
    setShowTheaterForm(false);
    setShowScreenForm(false);
    setShowSeatForm(false);
  }

  async function saveTheater() {
    if (!theaterForm.name.trim()) {
      setError('Theater name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        name: theaterForm.name.trim(),
        address: theaterForm.address.trim() || null,
        city: theaterForm.city.trim() || null,
      };

      const result = editingTheaterId
        ? await supabase
            .from('theaters')
            .update(payload)
            .eq('id', editingTheaterId)
        : await supabase.from('theaters').insert(payload);

      if (result.error) throw new Error(result.error.message);

      setMessage(editingTheaterId ? 'Theater updated.' : 'Theater added.');
      setTheaterForm(emptyTheater);
      setEditingTheaterId(null);
      setShowTheaterForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save theater.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTheater(theater: Theater) {
    const theaterScreens = screens.filter((s) => s.theater_id === theater.id);
    if (theaterScreens.length > 0) {
      setError(
        'Delete the screens in this theater first. This prevents existing show data from becoming invalid.',
      );
      return;
    }

    if (!window.confirm(`Delete "${theater.name}"?`)) return;

    setSaving(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('theaters')
        .delete()
        .eq('id', theater.id);

      if (deleteError) throw new Error(deleteError.message);

      setMessage('Theater deleted.');
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to delete theater.',
      );
    } finally {
      setSaving(false);
    }
  }

  function editTheater(theater: Theater) {
    setTheaterForm({
      name: theater.name,
      address: theater.address ?? '',
      city: theater.city ?? '',
    });
    setEditingTheaterId(theater.id);
    setShowTheaterForm(true);
    setShowScreenForm(false);
    setShowSeatForm(false);
  }

  async function saveScreen() {
    if (!screenForm.theater_id) {
      setError('Select a theater.');
      return;
    }

    if (!screenForm.name.trim()) {
      setError('Screen name is required.');
      return;
    }

    const totalSeats = Number(screenForm.total_seats);
    if (!Number.isInteger(totalSeats) || totalSeats < 1) {
      setError('Total seats must be a positive whole number.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        theater_id: screenForm.theater_id,
        name: screenForm.name.trim(),
        total_seats: totalSeats,
      };

      const result = editingScreenId
        ? await supabase
            .from('screens')
            .update(payload)
            .eq('id', editingScreenId)
        : await supabase.from('screens').insert(payload);

      if (result.error) throw new Error(result.error.message);

      setMessage(editingScreenId ? 'Screen updated.' : 'Screen added.');
      setScreenForm({
        ...emptyScreen,
        theater_id: screenForm.theater_id,
      });
      setEditingScreenId(null);
      setShowScreenForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save screen.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteScreen(screen: Screen) {
    const screenSeats = seats.filter((s) => s.screen_id === screen.id);

    if (screenSeats.length > 0) {
      setError(
        `Delete the ${screenSeats.length} seats belonging to "${screen.name}" first.`,
      );
      return;
    }

    if (!window.confirm(`Delete "${screen.name}"?`)) return;

    setSaving(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('screens')
        .delete()
        .eq('id', screen.id);

      if (deleteError) throw new Error(deleteError.message);

      setMessage('Screen deleted.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete screen.');
    } finally {
      setSaving(false);
    }
  }

  function editScreen(screen: Screen) {
    setScreenForm({
      theater_id: screen.theater_id,
      name: screen.name,
      total_seats: String(screen.total_seats),
    });
    setEditingScreenId(screen.id);
    setShowScreenForm(true);
    setShowTheaterForm(false);
    setShowSeatForm(false);
  }

  async function saveSeat() {
    if (!screenForm.theater_id) {
      setError('Select a screen from the Screen field before adding a seat.');
      return;
    }

    const screenId = screenForm.theater_id;
    if (!seatForm.seat_number.trim() || !seatForm.row_label.trim()) {
      setError('Seat number and row label are required.');
      return;
    }

    const multiplier = Number(seatForm.price_multiplier);
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      setError('Price multiplier must be greater than 0.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        screen_id: screenId,
        seat_number: seatForm.seat_number.trim().toUpperCase(),
        row_label: seatForm.row_label.trim().toUpperCase(),
        seat_type: seatForm.seat_type.trim() || 'Regular',
        price_multiplier: multiplier,
      };

      const result = editingSeatId
        ? await supabase
            .from('screen_seats')
            .update({
              seat_number: payload.seat_number,
              row_label: payload.row_label,
              seat_type: payload.seat_type,
              price_multiplier: payload.price_multiplier,
            })
            .eq('id', editingSeatId)
        : await supabase.from('screen_seats').insert(payload);

      if (result.error) throw new Error(result.error.message);

      setMessage(editingSeatId ? 'Seat updated.' : 'Seat added.');
      setSeatForm(emptySeat);
      setEditingSeatId(null);
      setShowSeatForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save seat.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteSeat(seat: Seat) {
    if (!window.confirm(`Delete seat ${seat.seat_number}?`)) return;

    setSaving(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('screen_seats')
        .delete()
        .eq('id', seat.id);

      if (deleteError) throw new Error(deleteError.message);

      setMessage(`Seat ${seat.seat_number} deleted.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete seat.');
    } finally {
      setSaving(false);
    }
  }

  function editSeat(seat: Seat) {
    setSeatForm({
      seat_number: seat.seat_number,
      row_label: seat.row_label,
      seat_type: seat.seat_type ?? 'Regular',
      price_multiplier: String(seat.price_multiplier ?? 1),
    });
    setScreenForm((current) => ({
      ...current,
      theater_id: seat.screen_id,
    }));
    setEditingSeatId(seat.id);
    setShowSeatForm(true);
    setShowTheaterForm(false);
    setShowScreenForm(false);
  }

  function openAddSeat(screenId: string) {
    setSeatForm(emptySeat);
    setScreenForm((current) => ({
      ...current,
      theater_id: screenId,
    }));
    setEditingSeatId(null);
    setShowSeatForm(true);
    setShowTheaterForm(false);
    setShowScreenForm(false);
  }

  function generateSeats(screen: Screen) {
    const rows = Math.ceil(screen.total_seats / 10);
    const seatCount = screen.total_seats;
    const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    if (
      !window.confirm(
        `Generate ${seatCount} seats for "${screen.name}" as ${rows} rows with up to 10 seats per row? Existing seats will remain.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    (async () => {
      try {
        const existing = seats.filter((s) => s.screen_id === screen.id);
        const existingKeys = new Set(
          existing.map((s) => `${s.row_label}-${s.seat_number}`),
        );

        const rowsToInsert: Array<{
          screen_id: string;
          seat_number: string;
          row_label: string;
          seat_type: string;
          price_multiplier: number;
        }> = [];

        for (let i = 0; i < seatCount; i += 1) {
          const rowIndex = Math.floor(i / 10);
          const number = (i % 10) + 1;
          const row = rowLetters[rowIndex] ?? `R${rowIndex + 1}`;
          const seatNumber = `${row}${number}`;

          if (existingKeys.has(`${row}-${seatNumber}`)) continue;

          rowsToInsert.push({
            screen_id: screen.id,
            seat_number: seatNumber,
            row_label: row,
            seat_type: rowIndex >= rows - 2 ? 'Premium' : 'Regular',
            price_multiplier: rowIndex >= rows - 2 ? 1.25 : 1,
          });
        }

        if (rowsToInsert.length === 0) {
          setMessage('All generated seats already exist.');
        } else {
          const { error: insertError } = await supabase
            .from('screen_seats')
            .insert(rowsToInsert);

          if (insertError) throw new Error(insertError.message);

          setMessage(`${rowsToInsert.length} seats generated.`);
        }

        await loadData();
        setExpandedScreen(screen.id);
        setExpandedTheater(screen.theater_id);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to generate seats.',
        );
      } finally {
        setSaving(false);
      }
    })();
  }

  function getTheaterScreens(theaterId: string) {
    return screens.filter((screen) => screen.theater_id === theaterId);
  }

  function getScreenSeats(screenId: string) {
    return seats
      .filter((seat) => seat.screen_id === screenId)
      .sort((a, b) =>
        a.seat_number.localeCompare(b.seat_number, undefined, {
          numeric: true,
        }),
      );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Spinner size="lg" className="py-20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Building2 className="h-7 w-7 text-primary-400" />
              <h1 className="text-3xl font-bold text-ink-50">
                Theater & Screen Management
              </h1>
            </div>
            <p className="mt-2 text-ink-400">
              Manage theaters, screens and seat layouts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setMessage(null);
                loadData();
              }}
              disabled={saving}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => {
                resetForms();
                setShowTheaterForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add theater
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-7">
          <Card className="p-5">
            <p className="text-sm text-ink-400">Theaters</p>
            <p className="mt-2 text-3xl font-bold text-ink-50">{theaters.length}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-ink-400">Screens</p>
            <p className="mt-2 text-3xl font-bold text-ink-50">{screens.length}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-ink-400">Configured seats</p>
            <p className="mt-2 text-3xl font-bold text-ink-50">{seats.length}</p>
          </Card>
        </div>

        {(error || message) && (
          <div
            className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
              error
                ? 'border-error-500/30 bg-error-500/10 text-error-200'
                : 'border-success-500/30 bg-success-500/10 text-success-200'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <span>{error ?? message}</span>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMessage(null);
                }}
                className="opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-7">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search theaters..."
            className="w-full rounded-xl border border-ink-700 bg-ink-900/70 px-4 py-3 text-ink-100 outline-none focus:border-primary-500"
          />
        </div>

        {showTheaterForm && (
          <Card className="mt-5 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-ink-50">
                {editingTheaterId ? 'Edit theater' : 'Add theater'}
              </h2>
              <button
                type="button"
                onClick={() => setShowTheaterForm(false)}
                className="text-ink-400 hover:text-ink-100"
              >
                <X />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="Theater name"
                value={theaterForm.name}
                onChange={(value) =>
                  setTheaterForm((current) => ({ ...current, name: value }))
                }
                placeholder="e.g. INOX GVK One"
              />
              <Field
                label="Address"
                value={theaterForm.address}
                onChange={(value) =>
                  setTheaterForm((current) => ({ ...current, address: value }))
                }
                placeholder="Street / location"
              />
              <Field
                label="City"
                value={theaterForm.city}
                onChange={(value) =>
                  setTheaterForm((current) => ({ ...current, city: value }))
                }
                placeholder="City"
              />
            </div>

            <div className="flex gap-3 mt-5">
              <Button onClick={saveTheater} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save theater'}
              </Button>
              <Button variant="outline" onClick={() => setShowTheaterForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {showScreenForm && (
          <Card className="mt-5 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-ink-50">
                {editingScreenId ? 'Edit screen' : 'Add screen'}
              </h2>
              <button
                type="button"
                onClick={() => setShowScreenForm(false)}
                className="text-ink-400 hover:text-ink-100"
              >
                <X />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectField
                label="Theater"
                value={screenForm.theater_id}
                onChange={(value) =>
                  setScreenForm((current) => ({
                    ...current,
                    theater_id: value,
                  }))
                }
                options={theaters.map((theater) => ({
                  value: theater.id,
                  label: theater.name,
                }))}
              />
              <Field
                label="Screen name"
                value={screenForm.name}
                onChange={(value) =>
                  setScreenForm((current) => ({ ...current, name: value }))
                }
                placeholder="e.g. Screen 1"
              />
              <Field
                label="Total seats"
                type="number"
                value={screenForm.total_seats}
                onChange={(value) =>
                  setScreenForm((current) => ({
                    ...current,
                    total_seats: value,
                  }))
                }
                placeholder="100"
              />
            </div>

            <div className="flex gap-3 mt-5">
              <Button onClick={saveScreen} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save screen'}
              </Button>
              <Button variant="outline" onClick={() => setShowScreenForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {showSeatForm && (
          <Card className="mt-5 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold text-ink-50">
                  {editingSeatId ? 'Edit seat' : 'Add seat'}
                </h2>
                <p className="text-sm text-ink-400 mt-1">
                  {editingSeatId
                    ? 'Update the selected seat.'
                    : 'Add an individual seat to a screen.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSeatForm(false)}
                className="text-ink-400 hover:text-ink-100"
              >
                <X />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SelectField
                label="Screen"
                value={screenForm.theater_id}
                onChange={(value) =>
                  setScreenForm((current) => ({
                    ...current,
                    theater_id: value,
                  }))
                }
                options={screens.map((screen) => ({
                  value: screen.id,
                  label: `${
                    theaters.find((t) => t.id === screen.theater_id)?.name ??
                    'Theater'
                  } · ${screen.name}`,
                }))}
              />
              <Field
                label="Row"
                value={seatForm.row_label}
                onChange={(value) =>
                  setSeatForm((current) => ({
                    ...current,
                    row_label: value,
                  }))
                }
                placeholder="A"
              />
              <Field
                label="Seat number"
                value={seatForm.seat_number}
                onChange={(value) =>
                  setSeatForm((current) => ({
                    ...current,
                    seat_number: value,
                  }))
                }
                placeholder="A1"
              />
              <SelectField
                label="Seat type"
                value={seatForm.seat_type}
                onChange={(value) =>
                  setSeatForm((current) => ({
                    ...current,
                    seat_type: value,
                  }))
                }
                options={[
                  { value: 'Regular', label: 'Regular' },
                  { value: 'Premium', label: 'Premium' },
                  { value: 'Recliner', label: 'Recliner' },
                ]}
              />
              <Field
                label="Price multiplier"
                type="number"
                step="0.05"
                value={seatForm.price_multiplier}
                onChange={(value) =>
                  setSeatForm((current) => ({
                    ...current,
                    price_multiplier: value,
                  }))
                }
                placeholder="1"
              />
            </div>

            <div className="flex gap-3 mt-5">
              <Button onClick={saveSeat} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save seat'}
              </Button>
              <Button variant="outline" onClick={() => setShowSeatForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <div className="mt-7 space-y-4">
          {filteredTheaters.length === 0 ? (
            <Card className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-ink-600" />
              <h2 className="mt-4 text-xl font-semibold text-ink-100">
                No theaters found
              </h2>
              <p className="mt-2 text-ink-400">
                Add your first theater to start configuring screens.
              </p>
            </Card>
          ) : (
            filteredTheaters.map((theater) => {
              const theaterScreens = getTheaterScreens(theater.id);
              const isExpanded = expandedTheater === theater.id;

              return (
                <Card key={theater.id} className="overflow-hidden">
                  <div className="p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTheater(isExpanded ? null : theater.id)
                      }
                      className="flex items-start gap-4 text-left min-w-0"
                    >
                      <div className="rounded-xl bg-primary-500/10 p-3">
                        <Building2 className="h-6 w-6 text-primary-400" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-ink-50">
                          {theater.name}
                        </h2>
                        <p className="text-sm text-ink-400 mt-1">
                          {[theater.address, theater.city]
                            .filter(Boolean)
                            .join(', ') || 'No address provided'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge tone="primary" variant="soft">
                            {theaterScreens.length} screen
                            {theaterScreens.length === 1 ? '' : 's'}
                          </Badge>
                        </div>
                      </div>
                    </button>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          editTheater(theater);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => deleteTheater(theater)}
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                      <Button
                        onClick={() => {
                          resetForms();
                          setScreenForm({
                            ...emptyScreen,
                            theater_id: theater.id,
                          });
                          setShowScreenForm(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add screen
                      </Button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTheater(isExpanded ? null : theater.id)
                        }
                        className="rounded-lg border border-ink-700 p-2 text-ink-300 hover:text-ink-50"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-ink-800 bg-ink-950/40 p-5">
                      {theaterScreens.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-ink-700 p-8 text-center">
                          <Monitor className="h-10 w-10 mx-auto text-ink-600" />
                          <p className="mt-3 text-ink-400">
                            No screens configured for this theater.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {theaterScreens.map((screen) => {
                            const screenSeats = getScreenSeats(screen.id);
                            const screenExpanded = expandedScreen === screen.id;

                            return (
                              <div
                                key={screen.id}
                                className="rounded-xl border border-ink-800 bg-ink-900/60 overflow-hidden"
                              >
                                <div className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedScreen(
                                        screenExpanded ? null : screen.id,
                                      )
                                    }
                                    className="flex items-center gap-3 text-left"
                                  >
                                    <Monitor className="h-5 w-5 text-primary-400" />
                                    <div>
                                      <p className="font-medium text-ink-100">
                                        {screen.name}
                                      </p>
                                      <p className="text-sm text-ink-500">
                                        Capacity: {screen.total_seats} · Configured:{' '}
                                        {screenSeats.length}
                                      </p>
                                    </div>
                                  </button>

                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => editScreen(screen)}
                                    >
                                      <Edit3 className="h-4 w-4" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => deleteScreen(screen)}
                                      disabled={saving}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => generateSeats(screen)}
                                      disabled={saving}
                                    >
                                      <Users className="h-4 w-4" />
                                      Generate seats
                                    </Button>
                                    <Button onClick={() => openAddSeat(screen.id)}>
                                      <Plus className="h-4 w-4" />
                                      Add seat
                                    </Button>
                                  </div>
                                </div>

                                {screenExpanded && (
                                  <div className="border-t border-ink-800 p-4">
                                    {screenSeats.length === 0 ? (
                                      <p className="py-6 text-center text-ink-500">
                                        No seats configured yet. Use Generate seats
                                        or Add seat.
                                      </p>
                                    ) : (
                                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                                        {screenSeats.map((seat) => (
                                          <div
                                            key={seat.id}
                                            className="rounded-lg border border-ink-800 bg-ink-950 p-2"
                                          >
                                            <div className="flex items-center justify-between gap-1">
                                              <span className="font-medium text-ink-100 text-sm">
                                                {seat.seat_number}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => editSeat(seat)}
                                                className="text-ink-500 hover:text-primary-400"
                                                title="Edit seat"
                                              >
                                                <Edit3 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                            <p className="text-xs text-ink-500 mt-1">
                                              {seat.seat_type ?? 'Regular'}
                                            </p>
                                            <p className="text-xs text-ink-600">
                                              ×{seat.price_multiplier ?? 1}
                                            </p>
                                            <button
                                              type="button"
                                              onClick={() => deleteSeat(seat)}
                                              className="mt-2 text-xs text-error-400 hover:text-error-300"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-300 mb-2">{label}</span>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-ink-700 bg-ink-900/70 px-3.5 py-2.5 text-ink-100 outline-none focus:border-primary-500"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-300 mb-2">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-ink-700 bg-ink-900/70 px-3.5 py-2.5 text-ink-100 outline-none focus:border-primary-500"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
