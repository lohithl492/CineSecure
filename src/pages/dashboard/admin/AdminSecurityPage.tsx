import { ShieldAlert, Eye, Activity, KeyRound, Ban, AlertTriangle, ScrollText } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardHeader, Badge } from '@/components/ui';
import { readSecurityLogs } from '@/utils/securityLog';
import { relativeTime } from '@/utils/format';

const toneFor = (severity: string) =>
  severity === 'high' || severity === 'critical' ? 'error' : severity === 'medium' ? 'warning' : 'neutral';

export function AdminSecurityPage() {
  const logs = readSecurityLogs();
  const failed = logs.filter((l) => l.eventType === 'failed_login').length;
  const blocked = logs.filter((l) => l.eventType === 'rbac_denied' || l.eventType === 'blocked_ip').length;
  const rateLimited = logs.filter((l) => l.eventType === 'rate_limited').length;
  const jwtFail = logs.filter((l) => l.eventType === 'jwt_failure').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <Badge tone="error" variant="soft">Security</Badge>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-50">Security Dashboard</h1>
        <p className="mt-1 text-ink-400">Failed logins, blocked IPs, rate-limited requests and security events.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Failed Logins" value={failed} icon={KeyRound} tone="error" />
        <StatCard label="Blocked IPs" value={blocked} icon={Ban} tone="warning" />
        <StatCard label="Rate Limited" value={rateLimited} icon={Activity} tone="secondary" />
        <StatCard label="JWT Failures" value={jwtFail} icon={ShieldAlert} tone="primary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Recent Security Events" subtitle="Live audit feed" action={<Eye className="h-5 w-5 text-ink-500" />} />
          {logs.length === 0 ? (
            <div className="text-center py-10 text-ink-500">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-ink-600" />
              No security events recorded yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
              {logs.slice(0, 20).map((l) => (
                <div key={l.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/5 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-ink-100 truncate">{l.message}</p>
                    <p className="text-xs text-ink-500 mt-0.5">{l.eventType} · {relativeTime(l.createdAt)}</p>
                  </div>
                  <Badge tone={toneFor(l.severity) as 'error' | 'warning' | 'neutral'} variant="soft">{l.severity}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Audit Logs" subtitle="All recorded actions" action={<ScrollText className="h-5 w-5 text-ink-500" />} />
          {logs.length === 0 ? (
            <div className="text-center py-10 text-ink-500">
              <ScrollText className="h-8 w-8 mx-auto mb-2 text-ink-600" />
              No audit entries yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
              {logs.map((l) => (
                <div key={l.id} className="rounded-xl bg-white/5 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-ink-200">{l.eventType}</p>
                    <span className="text-xs text-ink-500">{relativeTime(l.createdAt)}</span>
                  </div>
                  <p className="text-sm text-ink-400 mt-1">{l.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
