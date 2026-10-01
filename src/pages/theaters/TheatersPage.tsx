import { useEffect, useState } from 'react';
import { Building2, LayoutGrid, MapPin } from 'lucide-react';
import { Badge, Card, Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface Theater {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
}

export function TheatersPage() {
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [screenCounts, setScreenCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTheaters();
  }, []);

  async function loadTheaters() {
    setLoading(true);
    setError(null);

    try {
      const { data, error: theaterError } = await supabase
        .from('theaters')
        .select('id, name, address, city')
        .order('name', { ascending: true });

      if (theaterError) throw new Error(theaterError.message);
      const rows = (data ?? []) as Theater[];
      setTheaters(rows);

      if (rows.length > 0) {
        const { data: screens, error: screenError } = await supabase
          .from('screens')
          .select('id, theater_id')
          .in('theater_id', rows.map((theater) => theater.id));

        if (screenError) throw new Error(screenError.message);

        const counts: Record<string, number> = {};
        for (const screen of screens ?? []) {
          const theaterId = screen.theater_id as string;
          counts[theaterId] = (counts[theaterId] ?? 0) + 1;
        }
        setScreenCounts(counts);
      }
    } catch (err) {
      console.error('Failed to load theaters:', err);
      setError(err instanceof Error ? err.message : 'Unable to load theaters.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container-max section-pad py-10">
        <div className="mb-8">
          <Badge tone="primary" variant="soft">Cinema locations</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold text-ink-50 sm:text-4xl">Find your cinema</h1>
          <p className="mt-2 text-ink-400">Explore the cinema locations currently available on CineSecure.</p>
        </div>

        {loading && <Spinner size="lg" className="py-20" />}

        {!loading && error && (
          <Card className="p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-error-400" />
            <h2 className="mt-4 text-xl font-semibold text-ink-100">Unable to load cinemas</h2>
            <p className="mt-2 text-sm text-error-300">{error}</p>
            <button onClick={loadTheaters} className="mt-4 text-sm font-semibold text-primary-400">Try again</button>
          </Card>
        )}

        {!loading && !error && theaters.length === 0 && (
          <Card className="p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-ink-600" />
            <h2 className="mt-4 text-xl font-semibold text-ink-100">No cinemas available</h2>
            <p className="mt-2 text-sm text-ink-500">Cinema locations will appear here when they are added.</p>
          </Card>
        )}

        {!loading && !error && theaters.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {theaters.map((theater, index) => (
              <Card key={theater.id} hover className="animate-slideUp" style={{ animationDelay: `${index * 60}ms` }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10 text-primary-300">
                  <Building2 className="h-6 w-6" />
                </div>
                <h2 className="mt-5 font-display text-xl font-semibold text-ink-50">{theater.name}</h2>
                <div className="mt-3 space-y-2 text-sm text-ink-400">
                  {(theater.address || theater.city) && (
                    <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />{[theater.address, theater.city].filter(Boolean).join(', ')}</p>
                  )}
                  <p className="flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-ink-500" />{screenCounts[theater.id] ?? 0} screens</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
