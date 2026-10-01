import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export function ForbiddenPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 animate-fadeIn">
      <div className="text-center max-w-md">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-error-500/20 to-primary-500/10 flex items-center justify-center text-error-300 mb-6">
          <ShieldX className="h-10 w-10" />
        </div>
        <p className="font-display text-6xl font-bold gradient-text">403</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-ink-50">Access denied</h1>
        <p className="mt-2 text-ink-400">
          You don&apos;t have permission to view this page. This event has been logged to the security audit trail.
        </p>
        <Link to="/" className="inline-block mt-6">
          <Button variant="outline"><ArrowLeft className="h-4 w-4" /> Back to safety</Button>
        </Link>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 animate-fadeIn">
      <div className="text-center max-w-md">
        <p className="font-display text-7xl font-bold gradient-text">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-ink-50">Page not found</h1>
        <p className="mt-2 text-ink-400">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link to="/" className="inline-block mt-6">
          <Button variant="outline"><ArrowLeft className="h-4 w-4" /> Back home</Button>
        </Link>
      </div>
    </div>
  );
}
