import { Link } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-ink-950/80">
      <div className="container-max section-pad py-10">

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">

          {/* Brand */}
          <div className="md:col-span-2">
            <Logo />

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">
              Discover movies, choose your seats, and book your
              next cinema experience with CineSecure.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-ink-200">
              Explore
            </h4>

            <ul className="space-y-2 text-sm text-ink-400">
              <li>
                <Link
                  to="/movies"
                  className="transition-colors hover:text-white"
                >
                  Movies
                </Link>
              </li>

              <li>
                <Link
                  to="/login"
                  className="transition-colors hover:text-white"
                >
                  Sign in
                </Link>
              </li>

              <li>
                <Link
                  to="/register"
                  className="transition-colors hover:text-white"
                >
                  Create account
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-ink-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} CineSecure. All rights reserved.
          </p>

          <p>
            Your movie experience starts here.
          </p>
        </div>

      </div>
    </footer>
  );
}