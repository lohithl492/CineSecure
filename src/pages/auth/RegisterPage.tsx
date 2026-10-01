import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, UserPlus, Film } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      // All public registrations are customers.
      await signUp(email, password, name, 'customer');

      navigate('/login', { replace: true });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to create account.';

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">
        Create your account
      </h1>

      <p className="mt-2 text-ink-400">
        Join CineSecure and start booking in minutes.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Input
          label="Full name"
          name="name"
          placeholder="Jane Doe"
          icon={<UserIcon className="h-4 w-4" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          icon={<Lock className="h-4 w-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <div className="rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-300 animate-fadeIn">
            {error}
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
        >
          <UserPlus className="h-4 w-4" />
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary-400 hover:text-primary-300"
        >
          Sign in
        </Link>
      </p>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-500">
        <Film className="h-3.5 w-3.5 text-primary-400" />
        Secure account authentication
      </div>
    </div>
  );
}