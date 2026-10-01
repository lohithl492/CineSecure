import type { SecurityLog } from '@/types';

const LOG_KEY = 'cs_security_logs';

/** Client-side audit log sink. In production these are mirrored server-side. */
export function logSecurityEvent(
  eventType: SecurityLog['eventType'],
  message: string,
  severity: SecurityLog['severity'] = 'low',
  metadata?: Record<string, unknown>,
) {
  const entry: SecurityLog = {
    id: crypto.randomUUID(),
    eventType,
    severity,
    message,
    ip: 'client',
    createdAt: new Date().toISOString(),
    metadata,
  };
  try {
    const existing: SecurityLog[] = JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]');
    existing.unshift(entry);
    localStorage.setItem(LOG_KEY, JSON.stringify(existing.slice(0, 100)));
  } catch {
    // localStorage may be unavailable; ignore silently
  }
  if (severity === 'critical' || severity === 'high') {
    // eslint-disable-next-line no-console
    console.warn(`[security] ${eventType}: ${message}`);
  }
  return entry;
}

export function readSecurityLogs(): SecurityLog[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]') as SecurityLog[];
  } catch {
    return [];
  }
}

export function clearSecurityLogs() {
  localStorage.removeItem(LOG_KEY);
}
