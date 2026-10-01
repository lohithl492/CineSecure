import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Film,
  Loader2,
  MapPin,
  Ticket,
} from 'lucide-react';

import {
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  Badge,
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

  movies:
    | MovieRelation[]
    | MovieRelation
    | null;

  screens:
    | ScreenRelation[]
    | ScreenRelation
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

interface BookingState {
  showId: string;
  selectedSeatIds: string[];
  totalAmount: number;
}

interface BookingRecord {
  id: string;
  booking_reference: string;
  total_amount: number;
  status: string | null;
  payment_status: string | null;
  booked_at: string;
  show_id: string;
}

interface ConfirmedBooking {
  booking: BookingRecord;
  show: Show;
  seats: ScreenSeat[];
}

interface PayUResponse {
  success: boolean;
  paymentUrl: string;
  txnid: string;
  paymentIntentId: string;
  amount: string;
  fields: Record<string, string>;
}

export function BookingConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const bookingState =
    location.state as BookingState | null;

  const paymentStatus =
    searchParams.get('payment');

  const bookingReference =
    searchParams.get('booking');

  const showId =
    bookingState?.showId;

  const selectedSeatIds =
    bookingState?.selectedSeatIds ?? [];

  const totalAmount =
    Number(bookingState?.totalAmount) || 0;

  const [show, setShow] =
    useState<Show | null>(null);

  const [seats, setSeats] =
    useState<ScreenSeat[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [paying, setPaying] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [
    confirmedBooking,
    setConfirmedBooking,
  ] = useState<ConfirmedBooking | null>(null);

  /*
   * ============================================================
   * Load show + selected seats before payment
   * ============================================================
   */

  useEffect(() => {
    if (paymentStatus === 'success' && bookingReference) {
      loadConfirmedBooking(bookingReference);
      return;
    }

    if (
      paymentStatus === 'failed' ||
      paymentStatus === 'seat-conflict'
    ) {
      setLoading(false);
      return;
    }

    loadBookingDetails();
  }, [
    showId,
    selectedSeatIds.join(','),
    paymentStatus,
    bookingReference,
  ]);

  async function loadBookingDetails() {
    if (
      !showId ||
      selectedSeatIds.length === 0
    ) {
      setError(
        'Booking information is missing. Please select your seats again.',
      );

      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      /*
       * Load show
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
        .eq('id', showId)
        .single();

      if (showError) {
        throw new Error(showError.message);
      }

      if (!showData) {
        throw new Error('Show not found.');
      }

      setShow(showData as unknown as Show);

      /*
       * Load selected seats
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
        .in('id', selectedSeatIds);

      if (seatError) {
        throw new Error(seatError.message);
      }

      setSeats(
        (seatData as ScreenSeat[]) ?? [],
      );
    } catch (err) {
      console.error(
        'Failed to load booking details:',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load booking details.',
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================================================
   * Load completed booking after PayU redirect
   * ============================================================
   */

  async function loadConfirmedBooking(
    reference: string,
  ) {
    setLoading(true);
    setError(null);

    try {
      const {
        data: {
          user,
        },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error(
          'Your session could not be restored. Please sign in again.',
        );
      }

      /*
       * Only load the booking belonging to
       * the currently authenticated user.
       */
      const {
        data: bookingData,
        error: bookingError,
      } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_reference,
          total_amount,
          status,
          payment_status,
          booked_at,
          show_id
        `)
        .eq('booking_reference', reference)
        .eq('user_id', user.id)
        .single();

      if (bookingError) {
        throw new Error(
          bookingError.message,
        );
      }

      if (!bookingData) {
        throw new Error(
          'Booking could not be found.',
        );
      }

      /*
       * Load show information.
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
        .eq('id', bookingData.show_id)
        .single();

      if (showError) {
        throw new Error(showError.message);
      }

      if (!showData) {
        throw new Error(
          'Show information could not be found.',
        );
      }

      /*
       * Load seats attached to booking.
       */
      const {
        data: bookingSeatRows,
        error: bookingSeatsError,
      } = await supabase
        .from('booking_seats')
        .select('seat_id')
        .eq('booking_id', bookingData.id);

      if (bookingSeatsError) {
        throw new Error(
          bookingSeatsError.message,
        );
      }

      const seatIds = (
        bookingSeatRows ?? []
      ).map(
        (row) => row.seat_id as string,
      );

      let confirmedSeats: ScreenSeat[] = [];

      if (seatIds.length > 0) {
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
          .in('id', seatIds);

        if (seatError) {
          throw new Error(
            seatError.message,
          );
        }

        confirmedSeats =
          (seatData as ScreenSeat[]) ?? [];

        confirmedSeats.sort(
          (a, b) =>
            a.seat_number.localeCompare(
              b.seat_number,
              undefined,
              {
                numeric: true,
              },
            ),
        );
      }

      setConfirmedBooking({
        booking:
          bookingData as BookingRecord,
        show:
          showData as unknown as Show,
        seats: confirmedSeats,
      });
    } catch (err) {
      console.error(
        'Failed to load confirmed booking:',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your confirmed booking.',
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================================================
   * Start PayU payment
   * ============================================================
   */

  async function handlePayU() {
    if (
      !show ||
      !showId ||
      selectedSeatIds.length === 0
    ) {
      return;
    }

    if (paying) {
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const {
        data: {
          user,
        },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error(
          'You must be logged in to continue.',
        );
      }

      const firstname =
        String(
          user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            'Customer',
        ).trim();

      const email =
        String(
          user.email ?? '',
        ).trim();

      const phone =
        String(
          user.user_metadata?.phone ?? '',
        ).trim();

      if (!email) {
        throw new Error(
          'Your account does not have an email address.',
        );
      }

      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        'payu-create-payment',
        {
          body: {
            showId,
            selectedSeatIds,
            firstname,
            email,
            phone,
          },
        },
      );

      if (functionError) {
        throw new Error(
          functionError.message,
        );
      }

      const response =
        data as PayUResponse;

      if (
        !response?.success ||
        !response.paymentUrl ||
        !response.fields
      ) {
        throw new Error(
          'Unable to start PayU checkout.',
        );
      }

      /*
       * PayU Hosted Checkout expects a POST
       * containing the generated payment fields.
       */
      const form =
        document.createElement('form');

      form.method = 'POST';
      form.action =
        response.paymentUrl;
      form.style.display = 'none';

      for (
        const [key, value]
        of Object.entries(response.fields)
      ) {
        const input =
          document.createElement('input');

        input.type = 'hidden';
        input.name = key;
        input.value = String(value);

        form.appendChild(input);
      }

      document.body.appendChild(form);

      form.submit();
    } catch (err) {
      console.error(
        'PayU payment start failed:',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to start payment.',
      );

      setPaying(false);
    }
  }

  /*
   * ============================================================
   * Derived values
   * ============================================================
   */

  const movie = show
    ? Array.isArray(show.movies)
      ? show.movies[0]
      : show.movies
    : null;

  const screen = show
    ? Array.isArray(show.screens)
      ? show.screens[0]
      : show.screens
    : null;

  const theater =
    screen?.theaters
      ? Array.isArray(screen.theaters)
        ? screen.theaters[0]
        : screen.theaters
      : null;

  const movieTitle =
    movie?.title ??
    'Unknown movie';

  const screenName =
    screen?.name ??
    'Unknown screen';

  const theaterName =
    theater?.name ??
    'Unknown theater';

  const selectedSeatNumbers =
    useMemo(() => {
      return seats
        .filter((seat) =>
          selectedSeatIds.includes(
            seat.id,
          ),
        )
        .sort((a, b) =>
          a.seat_number.localeCompare(
            b.seat_number,
            undefined,
            {
              numeric: true,
            },
          ),
        )
        .map(
          (seat) => seat.seat_number,
        );
    }, [
      seats,
      selectedSeatIds.join(','),
    ]);

  /*
   * ============================================================
   * Loading
   * ============================================================
   */

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

  /*
   * ============================================================
   * Successful payment
   * ============================================================
   */

  if (
    paymentStatus === 'success' &&
    confirmedBooking
  ) {
    const confirmedShow =
      confirmedBooking.show;

    const confirmedMovie =
      Array.isArray(
        confirmedShow.movies,
      )
        ? confirmedShow.movies[0]
        : confirmedShow.movies;

    const confirmedScreen =
      Array.isArray(
        confirmedShow.screens,
      )
        ? confirmedShow.screens[0]
        : confirmedShow.screens;

    const confirmedTheater =
      confirmedScreen?.theaters
        ? Array.isArray(
            confirmedScreen.theaters,
          )
          ? confirmedScreen.theaters[0]
          : confirmedScreen.theaters
        : null;

    const confirmedMovieTitle =
      confirmedMovie?.title ??
      'Unknown movie';

    const confirmedScreenName =
      confirmedScreen?.name ??
      'Unknown screen';

    const confirmedTheaterName =
      confirmedTheater?.name ??
      'Unknown theater';

    return (
      <div className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-3xl">
          <Card className="overflow-hidden">
            <div className="border-b border-white/10 bg-success-500/10 px-6 py-8 text-center sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-500/15">
                <CheckCircle2 className="h-9 w-9 text-success-400" />
              </div>

              <Badge
                tone="success"
                variant="soft"
                className="mt-5"
              >
                Payment successful
              </Badge>

              <h1 className="mt-4 font-display text-3xl font-bold text-white">
                Booking confirmed
              </h1>

              <p className="mt-2 text-sm text-ink-400">
                Your movie ticket has been booked successfully.
              </p>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-400">
                  Booking reference
                </p>

                <p className="mt-2 font-mono text-xl font-bold text-white">
                  {
                    confirmedBooking.booking
                      .booking_reference
                  }
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  {confirmedMovieTitle}
                </h2>

                <div className="mt-4 space-y-3 text-sm text-ink-400">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-primary-400" />
                    <span>
                      {confirmedTheaterName} ·{' '}
                      {confirmedScreenName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-primary-400" />
                    <span>
                      {formatDate(
                        confirmedShow.start_time,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-primary-400" />
                    <span>
                      {formatTime(
                        confirmedShow.start_time,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-5">
                <p className="text-sm text-ink-500">
                  Seats
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {confirmedBooking.seats.map(
                    (seat) => (
                      <span
                        key={seat.id}
                        className="rounded-lg border border-primary-500/20 bg-primary-500/10 px-3 py-2 text-sm font-semibold text-primary-300"
                      >
                        {seat.seat_number}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
                <span className="text-sm text-ink-400">
                  Amount paid
                </span>

                <span className="text-xl font-bold text-white">
                  {formatCurrency(
                    Number(
                      confirmedBooking.booking
                        .total_amount,
                    ),
                  )}
                </span>
              </div>

              <Button
                fullWidth
                size="lg"
                onClick={() =>
                  navigate(
                    '/dashboard/customer/bookings',
                  )
                }
              >
                <Ticket className="h-4 w-4" />
                View my bookings
              </Button>

              <Button
                fullWidth
                variant="outline"
                onClick={() =>
                  navigate('/movies')
                }
              >
                Browse more movies
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * Payment failure
   * ============================================================
   */

  if (
    paymentStatus === 'failed' ||
    paymentStatus === 'seat-conflict'
  ) {
    return (
      <div className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-2xl">
          <Card className="p-8 text-center sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error-500/10">
              <Ticket className="h-7 w-7 text-error-400" />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-white">
              Payment was not completed
            </h1>

            <p className="mt-3 text-sm leading-6 text-ink-400">
              {paymentStatus ===
              'seat-conflict'
                ? 'One or more seats were booked before the payment could be completed.'
                : 'No booking was created for this payment.'}
            </p>

            <Button
              className="mt-7"
              onClick={() =>
                navigate('/shows')
              }
            >
              <ArrowLeft className="h-4 w-4" />
              Choose another show
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * General error
   * ============================================================
   */

  if (error || !show) {
    return (
      <div className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-4xl">
          <Card className="p-10 text-center">
            <Film className="mx-auto mb-5 h-14 w-14 text-error-400" />

            <h1 className="text-2xl font-bold text-ink-50">
              Unable to continue booking
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

  /*
   * ============================================================
   * Pre-payment review
   * ============================================================
   */

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
          className="mb-8 flex items-center gap-2 text-ink-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Change seats
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <Card className="p-6 sm:p-8">
            <Badge
              tone="primary"
              variant="soft"
            >
              Review booking
            </Badge>

            <h1 className="mt-4 font-display text-3xl font-bold text-white">
              {movieTitle}
            </h1>

            <div className="mt-5 space-y-3 text-sm text-ink-400">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary-400" />
                <span>
                  {theaterName} ·{' '}
                  {screenName}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-primary-400" />
                <span>
                  {formatDate(
                    show.start_time,
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary-400" />
                <span>
                  {formatTime(
                    show.start_time,
                  )}
                </span>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-sm font-medium text-ink-400">
                Selected seats
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {selectedSeatNumbers.map(
                  (seat) => (
                    <span
                      key={seat}
                      className="rounded-lg border border-primary-500/20 bg-primary-500/10 px-3 py-2 text-sm font-semibold text-primary-300"
                    >
                      {seat}
                    </span>
                  ),
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
                <Ticket className="h-5 w-5 text-primary-400" />
              </div>

              <div>
                <h2 className="font-semibold text-white">
                  Order summary
                </h2>

                <p className="text-xs text-ink-500">
                  Review before payment
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-1">
              <div className="flex items-center justify-between border-b border-white/10 py-3">
                <span className="text-sm text-ink-400">
                  Tickets
                </span>

                <span className="text-sm font-semibold text-white">
                  {selectedSeatIds.length}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/10 py-3">
                <span className="text-sm text-ink-400">
                  Base price
                </span>

                <span className="text-sm text-ink-200">
                  {formatCurrency(
                    Number(
                      show.base_price,
                    ),
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-ink-400">
                  Seats
                </span>

                <span className="text-sm text-ink-200">
                  {selectedSeatIds.length}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-primary-500/20 bg-primary-500/10 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-400">
                  Total
                </span>

                <span className="font-display text-3xl font-bold text-white">
                  {formatCurrency(
                    totalAmount,
                  )}
                </span>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-300"
              >
                {error}
              </div>
            )}

            <Button
              fullWidth
              size="lg"
              className="mt-5"
              disabled={paying}
              onClick={handlePayU}
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting to PayU...
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4" />
                  Pay with PayU
                </>
              )}
            </Button>

            <Button
              fullWidth
              variant="outline"
              className="mt-3"
              disabled={paying}
              onClick={() =>
                navigate(-1)
              }
            >
              <ArrowLeft className="h-4 w-4" />
              Change seats
            </Button>

            <p className="mt-4 text-center text-xs text-ink-500">
              You will be redirected to PayU&apos;s secure test checkout.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}