import { Building2, CalendarDays, Ticket, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardHeader, Badge } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export function OwnerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <Badge tone="secondary" variant="soft">Cinema management</Badge>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-50">Welcome back, {user?.name}</h1>
        <p className="mt-1 text-ink-400">Manage your cinema, showtimes and bookings from one place.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Theaters" value="0" icon={Building2} tone="primary" />
        <StatCard label="Active Shows" value="0" icon={CalendarDays} tone="accent" />
        <StatCard label="Bookings" value="0" icon={Ticket} tone="secondary" />
        <StatCard label="Revenue" value="₹0" icon={TrendingUp} tone="success" />
      </div>

      <Card>
        <CardHeader title="Bookings" subtitle="Live booking activity for your cinema" action={<Ticket className="h-5 w-5 text-ink-500" />} />
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <Ticket className="mx-auto h-10 w-10 text-ink-600" />
          <p className="mt-4 text-sm text-ink-500">No booking data is available yet.</p>
        </div>
      </Card>
    </div>
  );
}
