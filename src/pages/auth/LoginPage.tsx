import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  LogIn,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';
import { logSecurityEvent } from '@/utils/securityLog';

type LoginLocationState = {
  from?: string;
};

function getRoleDashboard(
  role: 'customer' | 'owner' | 'admin'
) {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';

    case 'owner':
      return '/dashboard/owner';

    case 'customer':
    default:
      return '/dashboard/customer';
  }
}

function isAllowedDestination(
  path: string | undefined,
  role: 'customer' | 'owner' | 'admin'
) {
  if (!path) {
    return false;
  }

  /*
   * Never allow an authenticated user to be redirected
   * into another role's dashboard.
   */
  if (role === 'admin') {
    return path.startsWith('/dashboard/admin');
  }

  if (role === 'owner') {
    return path.startsWith('/dashboard/owner');
  }

  /*
   * Customers may return to customer pages or booking flow.
   */
  if (role === 'customer') {
    return (
      path.startsWith('/dashboard/customer') ||
      path.startsWith('/booking/')
    );
  }

  return false;
}

export function LoginPage() {
  const { signIn } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const from = (
    location.state as LoginLocationState | null
  )?.from;

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError(null);
    setLoading(true);

    const normalizedEmail =
      email.trim().toLowerCase();

    try {
      /*
       * signIn now returns the complete application
       * user including the database role.
       */
      const signedInUser = await signIn(
        normalizedEmail,
        password
      );

      /*
       * Use the actual role returned from public.profiles.
       *
       * This is important because React state updates
       * are asynchronous. We should not depend on
       * user from useAuth() immediately after signIn().
       */
      const destination =
        isAllowedDestination(
          from,
          signedInUser.role
        )
          ? from!
          : getRoleDashboard(
              signedInUser.role
            );

      logSecurityEvent(
        'booking_created',
        'Login successful',
        'low',
        {
          email: normalizedEmail,
          userId: signedInUser.id,
          role: signedInUser.role,
        }
      );

      navigate('/', {
  replace: true,
});
    } catch (err) {
      console.error(
        'Login failed:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Check your email and password.';

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary-400/20 bg-primary-500/10">
          <ShieldCheck className="h-5 w-5 text-primary-400" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-400">
            CineSecure
          </p>

          <p className="text-xs text-ink-500">
            Movie ticket booking
          </p>
        </div>
      </div>

      <h1 className="mt-7 text-3xl font-bold tracking-tight text-white">
        Welcome back
      </h1>

      <p className="mt-2 text-ink-400">
        Sign in to continue to CineSecure.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5"
      >
        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={
            <Mail className="h-4 w-4" />
          }
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
          disabled={loading}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          icon={
            <Lock className="h-4 w-4" />
          }
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          required
          disabled={loading}
        />

        {error && (
          <div
            role="alert"
            className="animate-fadeIn rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm leading-6 text-error-300"
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          disabled={loading}
        >
          <LogIn className="h-4 w-4" />
          {loading
            ? 'Signing in...'
            : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400">
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-primary-400 transition hover:text-primary-300"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}