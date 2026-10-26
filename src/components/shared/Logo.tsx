import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/constants/config';

const logoImage = '/cinesecure-logo.png';

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <img
        src={logoImage}
        alt="CineSecure logo"
        className="h-10 w-10 rounded-xl object-contain transition-transform group-hover:scale-105"
      />

      {!compact && (
        <span className="font-display text-xl font-bold tracking-tight text-ink-50">
          Cine<span className="text-primary-500">Secure</span>
        </span>
      )}
    </Link>
  );
}

export function LogoMark() {
  return (
    <span className="flex h-11 w-11 items-center justify-center">
      <img
        src={logoImage}
        alt="CineSecure logo"
        className="h-full w-full rounded-xl object-contain"
      />
    </span>
  );
}

export { APP_CONFIG };
