import { Link } from 'react-router-dom';
import { Film, ShieldCheck } from 'lucide-react';
import { APP_CONFIG } from '@/constants/config';

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 shadow-glow transition-transform group-hover:scale-105">
        <Film className="h-5 w-5 text-white" />
        <ShieldCheck className="absolute -bottom-1 -right-1 h-4 w-4 text-accent-400 bg-ink-950 rounded-full p-0.5" />
      </span>
      {!compact && (
        <span className="font-display text-xl font-bold tracking-tight text-ink-50">
          Cine<span className="gradient-text">Secure</span>
        </span>
      )}
    </Link>
  );
}

export function LogoMark() {
  return (
    <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 shadow-glow">
      <Film className="h-6 w-6 text-white" />
      <ShieldCheck className="absolute -bottom-1 -right-1 h-5 w-5 text-accent-400 bg-ink-950 rounded-full p-0.5" />
    </span>
  );
}

export { APP_CONFIG };
