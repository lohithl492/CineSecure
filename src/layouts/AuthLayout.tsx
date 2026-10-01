import { Link, Outlet } from 'react-router-dom';
import { LogoMark } from '@/components/shared/Logo';

export function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ink-950">

      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12">

        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/40 via-ink-950 to-accent-950/20" />

        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary-500 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent-500 blur-3xl" />
        </div>

        {/* Brand */}
        <Link
          to="/"
          className="relative flex items-center gap-3 w-fit"
        >
          <LogoMark />

          <span className="font-display text-2xl font-bold text-ink-50">
            Cine<span className="gradient-text">Secure</span>
          </span>
        </Link>

        {/* Main message */}
        <div className="relative max-w-lg">
          <h1 className="font-display text-5xl font-bold leading-tight text-ink-50">
            The secure way to{' '}
            <span className="gradient-text">
              book your seats.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-300">
            Discover movies, choose your seats, and enjoy a
            simple and secure booking experience.
          </p>
        </div>

        {/* Small brand footer */}
        <p className="relative text-sm text-ink-500">
          Your movie experience starts here.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-ink-950 p-6 sm:p-12">

        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="mb-10 flex items-center justify-center lg:hidden">
            <Link
              to="/"
              className="flex items-center gap-3"
            >
              <LogoMark />

              <span className="font-display text-2xl font-bold text-ink-50">
                Cine<span className="gradient-text">Secure</span>
              </span>
            </Link>
          </div>

          <Outlet />

        </div>
      </div>

    </div>
  );
}