import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Film,
  LockKeyhole,
  Ticket,
  Users,
} from 'lucide-react';

import {
  Button,
  Card,
  Spinner,
} from '@/components/ui';

import {
  formatCurrency,
  formatDate,
  formatTime,
} from '@/utils/format';

import { supabase } from '@/lib/supabase';

interface MovieRelation {
  title: string;
  poster_url: string | null;
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

  movies:
    | MovieRelation[]
    | MovieRelation
    | null;
}

interface ScreenSeat {
  id: string;
  screen_id: string;
  seat_number: string;
  row_label: string;
  seat_type: string | null;
  price_multiplier: number | null;
}

interface BookedSeat {
  seat_id: string;
}

function getMovie(
  movieRelation: Show['movies'],
) {
  if (Array.isArray(movieRelation)) {
    return movieRelation[0] || null;
  }

  return movieRelation;
}

/*
 * The database may contain values such as:
 * AA1, AA2, BB1, BB2
 *
 * Since the row is already displayed separately,
 * show them as:
 * A1, A2, B1, B2
 */
function displaySeatNumber(
  seat: ScreenSeat,
) {
  const row = seat.row_label?.trim() || '';
  const number = seat.seat_number?.trim() || '';

  if (
    row &&
    number.startsWith(`${row}${row}`)
  ) {
    return number.slice(row.length);
  }

  return number;
}

function seatPrice(
  basePrice: number,
  seat: ScreenSeat,
) {
  const multiplier =
    Number(seat.price_multiplier) || 1;

  return basePrice * multiplier;
}

function isPremiumSeat(
  seat: ScreenSeat,
) {
  const multiplier =
    Number(seat.price_multiplier) || 1;

  return (
    multiplier > 1 ||
    seat.seat_type?.toLowerCase() === 'premium'
  );
}

export function SeatSelectionPage() {
  const { showId } =
    useParams<{ showId: string }>();

  const navigate = useNavigate();

  const [show, setShow] =
    useState<Show | null>(null);

  const [seats, setSeats] =
    useState<ScreenSeat[]>([]);

  const [bookedSeatIds, setBookedSeatIds] =
    useState<Set<string>>(new Set());

  const [selectedSeats, setSelectedSeats] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!showId) {
        setError('Show ID is missing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        /*
         * Load show information
         */
        const {
          data: showData,
          error: showError,
        } = await supabase
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
              title,
              poster_url
            )
          `)
          .eq('id', showId)
          .single();

        if (showError) {
          throw new Error(
            showError.message,
          );
        }

        if (!showData) {
          throw new Error(
            'Show not found.',
          );
        }

        const loadedShow =
          showData as unknown as Show;

        /*
         * Load seats for the screen
         */
        const {
          data: seatData,
          error: seatError,
        } = await supabase
          .from('screen_seats')
          .select(`
            id,
            screen_id,
            seat_number,
            row_label,
            seat_type,
            price_multiplier
          `)
          .eq(
            'screen_id',
            loadedShow.screen_id,
          );

        if (seatError) {
          throw new Error(
            seatError.message,
          );
        }

        /*
         * Load seats already booked for this show.
         */
        const {
          data: bookedData,
          error: bookedError,
        } = await supabase
          .from('booking_seats')
          .select('seat_id')
          .eq('show_id', showId);

        if (bookedError) {
          throw new Error(
            bookedError.message,
          );
        }

        if (!active) {
          return;
        }

        setShow(loadedShow);

        /*
         * Sort rows alphabetically and seat
         * numbers numerically.
         */
        const sortedSeats =
          ((seatData as ScreenSeat[]) || [])
            .sort((a, b) => {
              const rowCompare =
                a.row_label.localeCompare(
                  b.row_label,
                  undefined,
                  { numeric: true },
                );

              if (rowCompare !== 0) {
                return rowCompare;
              }

              const aDisplay =
                displaySeatNumber(a);

              const bDisplay =
                displaySeatNumber(b);

              const aMatch =
                aDisplay.match(/\d+/);

              const bMatch =
                bDisplay.match(/\d+/);

              const aNumber = aMatch
                ? Number(aMatch[0])
                : 0;

              const bNumber = bMatch
                ? Number(bMatch[0])
                : 0;

              return aNumber - bNumber;
            });

        setSeats(sortedSeats);

        setBookedSeatIds(
          new Set(
            ((bookedData as BookedSeat[]) || [])
              .map((item) => item.seat_id),
          ),
        );
      } catch (err) {
        console.error(
          'Failed to load seat selection:',
          err,
        );

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load seats.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [showId]);

  /*
   * Group seats by row.
   */
  const seatsByRow = useMemo(() => {
    const grouped: Record<
      string,
      ScreenSeat[]
    > = {};

    for (const seat of seats) {
      const row =
        seat.row_label || '?';

      if (!grouped[row]) {
        grouped[row] = [];
      }

      grouped[row].push(seat);
    }

    return grouped;
  }, [seats]);

  const rows = useMemo(
    () => Object.entries(seatsByRow),
    [seatsByRow],
  );

  const availableSeatCount =
    seats.length - bookedSeatIds.size;

  /*
   * Calculate total.
   */
  const totalAmount = useMemo(() => {
    if (!show) {
      return 0;
    }

    return selectedSeats.reduce(
      (total, seatId) => {
        const seat = seats.find(
          (item) => item.id === seatId,
        );

        if (!seat) {
          return total;
        }

        return (
          total +
          seatPrice(
            Number(show.base_price),
            seat,
          )
        );
      },
      0,
    );
  }, [
    show,
    seats,
    selectedSeats,
  ]);

  /*
   * Toggle seat.
   */
  function toggleSeat(
    seat: ScreenSeat,
  ) {
    if (bookedSeatIds.has(seat.id)) {
      return;
    }

    setSelectedSeats((current) => {
      if (current.includes(seat.id)) {
        return current.filter(
          (id) => id !== seat.id,
        );
      }

      return [
        ...current,
        seat.id,
      ];
    });
  }

  /*
   * Continue to confirmation.
   */
  function handleContinue() {
    if (
      !show ||
      selectedSeats.length === 0
    ) {
      return;
    }

    navigate(
      '/booking/confirmation',
      {
        state: {
          showId: show.id,
          selectedSeatIds:
            selectedSeats,
          totalAmount,
        },
      },
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Spinner
          size="lg"
          className="py-20"
        />
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-4xl">
          <Card className="p-12 text-center">
            <Film className="mx-auto h-14 w-14 text-error-400" />

            <h1 className="mt-5 text-2xl font-bold text-ink-50">
              Unable to load seat selection
            </h1>

            <p className="mt-3 text-ink-400">
              {error ||
                'Show information is missing.'}
            </p>

            <Button
              className="mt-6"
              onClick={() =>
                navigate('/shows')
              }
            >
              <ArrowLeft className="h-4 w-4" />
              Back to shows
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const movie = getMovie(
    show.movies,
  );

  const movieTitle =
    movie?.title || 'Movie';

  const posterUrl =
    movie?.poster_url || null;

  return (
    <div className="min-h-screen">
      {/* ================= HEADER ================= */}

      <section className="border-b border-white/5 bg-black/10">
        <div className="container-max section-pad py-7">
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="mb-7 inline-flex items-center gap-2 text-sm text-ink-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              {/* Poster */}

              <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-ink-900 shadow-xl">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={movieTitle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Film className="h-8 w-8 text-ink-600" />
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">
                  <span className="h-px w-6 bg-primary-500" />
                  Select your seats
                </div>

                <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {movieTitle}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-400">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary-400" />
                    {formatDate(
                      show.start_time,
                    )}
                  </span>

                  <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />

                  <span className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-primary-400" />
                    {formatTime(
                      show.start_time,
                    )}
                  </span>

                  {show.format && (
                    <>
                      <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />

                      <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-ink-300">
                        {show.format}
                      </span>
                    </>
                  )}

                  {show.language && (
                    <>
                      <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />

                      <span>
                        {show.language}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Available seats */}

            <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs text-ink-500">
                  Seats available
                </p>

                <p className="mt-0.5 text-lg font-bold text-white">
                  {Math.max(
                    availableSeatCount,
                    0,
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MAIN ================= */}

      <main className="container-max section-pad py-8 sm:py-10">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* ================= SEAT MAP ================= */}

          <Card className="overflow-hidden p-0">
            <div className="p-5 sm:p-7 lg:p-8">
              {/* Screen */}

              <div className="mx-auto max-w-3xl">
                <div className="relative">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-transparent via-primary-400 to-transparent shadow-[0_0_25px_rgba(255,80,40,0.4)]" />

                  <div className="absolute left-1/2 top-0 h-10 w-2/3 -translate-x-1/2 rounded-full bg-primary-500/10 blur-xl" />
                </div>

                <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-ink-600">
                  Screen
                </p>
              </div>

              {/* Seats */}

              {seats.length === 0 ? (
                <div className="py-20 text-center">
                  <Film className="mx-auto h-12 w-12 text-ink-600" />

                  <h2 className="mt-4 text-xl font-semibold text-ink-200">
                    No seats available
                  </h2>

                  <p className="mt-2 text-sm text-ink-500">
                    No seats have been configured
                    for this screen.
                  </p>
                </div>
              ) : (
                <div className="mt-10">
                  <div className="mx-auto max-w-4xl space-y-3 overflow-x-auto pb-2">
                    {rows.map(
                      ([row, rowSeats]) => (
                        <div
                          key={row}
                          className="flex min-w-max items-center justify-center gap-3"
                        >
                          {/* Left row label */}

                          <span className="w-5 text-center text-xs font-semibold text-ink-600">
                            {row}
                          </span>

                          {/* Seats */}

                          <div className="flex gap-2">
                            {rowSeats.map(
                              (seat) => {
                                const selected =
                                  selectedSeats.includes(
                                    seat.id,
                                  );

                                const booked =
                                  bookedSeatIds.has(
                                    seat.id,
                                  );

                                const premium =
                                  isPremiumSeat(
                                    seat,
                                  );

                                return (
                                  <button
                                    key={seat.id}
                                    type="button"
                                    disabled={booked}
                                    onClick={() =>
                                      toggleSeat(
                                        seat,
                                      )
                                    }
                                    title={
                                      booked
                                        ? `${displaySeatNumber(
                                            seat,
                                          )} • Booked`
                                        : `${displaySeatNumber(
                                            seat,
                                          )} • ${
                                            premium
                                              ? 'Premium'
                                              : 'Regular'
                                          }`
                                    }
                                    className={`
                                      group relative
                                      flex h-10 w-10
                                      items-center justify-center
                                      rounded-lg
                                      border
                                      text-[11px]
                                      font-semibold
                                      transition-all
                                      duration-200
                                      sm:h-11 sm:w-11
                                      ${
                                        booked
                                          ? `
                                            cursor-not-allowed
                                            border-white/5
                                            bg-white/[0.025]
                                            text-ink-700
                                          `
                                          : selected
                                          ? `
                                            scale-105
                                            border-primary-300
                                            bg-primary-500
                                            text-white
                                            shadow-[0_0_18px_rgba(255,80,40,0.45)]
                                          `
                                          : `
                                            border-white/10
                                            bg-white/[0.035]
                                            text-ink-300
                                            hover:-translate-y-0.5
                                            hover:border-primary-400/60
                                            hover:bg-primary-500/10
                                            hover:text-primary-200
                                          `
                                      }
                                    `}
                                  >
                                    {booked ? (
                                      <LockKeyhole className="h-3.5 w-3.5" />
                                    ) : selected ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      displaySeatNumber(
                                        seat,
                                      )
                                    )}

                                    {/* Premium dot */}

                                    {premium &&
                                      !booked &&
                                      !selected && (
                                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary-400 ring-2 ring-[#0b0d14]" />
                                      )}
                                  </button>
                                );
                              },
                            )}
                          </div>

                          {/* Right row label */}

                          <span className="w-5 text-center text-xs font-semibold text-ink-600">
                            {row}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Legend */}

              {seats.length > 0 && (
                <div className="mt-9 border-t border-white/5 pt-7">
                  <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 text-xs text-ink-400">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-md border border-white/10 bg-white/[0.035]" />
                      Available
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-md bg-primary-500">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                      Selected
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-md border border-white/5 bg-white/[0.025]">
                        <LockKeyhole className="h-2.5 w-2.5 text-ink-700" />
                      </span>
                      Booked
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary-400" />
                      Premium
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ================= SUMMARY ================= */}

          <aside className="xl:sticky xl:top-6 xl:h-fit">
            <Card className="overflow-hidden p-0">
              {/* Summary header */}

              <div className="border-b border-white/5 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400">
                    <Ticket className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">
                      Booking summary
                    </p>

                    <h2 className="mt-1 font-display text-xl font-bold text-white">
                      Your seats
                    </h2>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Movie */}

                <div className="flex gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-900">
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={movieTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Film className="h-6 w-6 text-ink-600" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">
                      {movieTitle}
                    </h3>

                    <p className="mt-2 text-xs text-ink-500">
                      {formatDate(
                        show.start_time,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-ink-500">
                      {formatTime(
                        show.start_time,
                      )}
                      {show.format
                        ? ` • ${show.format}`
                        : ''}
                    </p>
                  </div>
                </div>

                {/* Selected seats */}

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-400">
                      Selected seats
                    </span>

                    <span className="text-sm font-semibold text-white">
                      {selectedSeats.length}
                    </span>
                  </div>

                  {selectedSeats.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedSeats.map(
                        (seatId) => {
                          const seat =
                            seats.find(
                              (item) =>
                                item.id ===
                                seatId,
                            );

                          if (!seat) {
                            return null;
                          }

                          return (
                            <span
                              key={seat.id}
                              className="rounded-lg border border-primary-400/20 bg-primary-500/10 px-3 py-1.5 text-xs font-semibold text-primary-300"
                            >
                              {displaySeatNumber(
                                seat,
                              )}
                            </span>
                          );
                        },
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-dashed border-white/10 px-4 py-5 text-center">
                      <p className="text-xs text-ink-600">
                        Select seats from the layout.
                      </p>
                    </div>
                  )}
                </div>

                {/* Pricing */}

                <div className="mt-6 border-t border-white/5 pt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-500">
                      Base price
                    </span>

                    <span className="text-ink-300">
                      {formatCurrency(
                        Number(
                          show.base_price,
                        ),
                      )}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-ink-500">
                      Seats
                    </span>

                    <span className="text-ink-300">
                      {selectedSeats.length}
                    </span>
                  </div>
                </div>

                {/* Total */}

                <div className="mt-5 border-t border-white/5 pt-5">
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-medium text-ink-400">
                      Total
                    </span>

                    <span className="font-display text-3xl font-bold text-white">
                      {formatCurrency(
                        totalAmount,
                      )}
                    </span>
                  </div>
                </div>

                {/* Continue */}

                <Button
                  fullWidth
                  disabled={
                    selectedSeats.length === 0
                  }
                  onClick={
                    handleContinue
                  }
                  className="mt-6"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <p className="mt-4 text-center text-[11px] leading-5 text-ink-600">
                  Seat availability will be checked
                  again before your booking is completed.
                </p>
              </div>
            </Card>

            {/* Small reassurance */}

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-600">
              <LockKeyhole className="h-3.5 w-3.5" />
              Already booked seats are disabled automatically.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}