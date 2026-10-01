import { Activity, BarChart3, Film, ShieldAlert, Ticket, TrendingUp, Users } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardHeader, Badge } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { readSecurityLogs } from '@/utils/securityLog';
import { relativeTime } from '@/utils/format';

export function AdminDashboard() {
  const { user } = useAuth();
  const logs = readSecurityLogs().slice(0, 6);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <Badge tone="error" variant="soft">Administration</Badge>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-50">Welcome back, {user?.name}</h1>
        <p className="mt-1 text-ink-400">Manage CineSecure from one place.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Users" value="0" icon={Users} tone="primary" />
        <StatCard label="Movies" value="0" icon={Film} tone="secondary" />
        <StatCard label="Bookings" value="0" icon={Ticket} tone="accent" />
        <StatCard label="Revenue" value="₹0" icon={TrendingUp} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent bookings" subtitle="Live booking activity" />
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <Ticket className="mx-auto h-10 w-10 text-ink-600" />
            <p className="mt-4 text-sm text-ink-500">No booking data is available yet.</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent activity" subtitle="Local security events" action={<Activity className="h-5 w-5 text-ink-500" />} />
          {logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-ink-600" />
              <p className="mt-4 text-sm text-ink-500">No recent activity.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="rounded-xl bg-white/[0.035] px-4 py-3">
                  <p className="truncate text-sm text-ink-100">{log.message}</p>
                  <p className="mt-1 text-xs text-ink-500">{log.eventType} · {relativeTime(log.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Platform overview" subtitle="Live analytics will populate this area" action={<BarChart3 className="h-5 w-5 text-ink-500" />} />
        <p className="rounded-xl bg-white/[0.025] p-6 text-sm text-ink-500">Analytics will be connected to the database as the admin module is completed.</p>
      </Card>
    </div>
  );
}
