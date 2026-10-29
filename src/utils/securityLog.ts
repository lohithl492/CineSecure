
import type { SecurityLog } from '@/types';
import { supabase } from '@/lib/supabase';

const LOG_KEY = 'cs_security_logs';

const SECURITY_AUDIT_URL =
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/security-audit`;

const allowedEvents = new Set<SecurityLog['eventType']>([
  'login_success',
  'login_failed',
  'failed_login',
  'blocked_ip',
  'rate_limited',
  'jwt_failure',
  'rbac_denied',
  'booking_created',
  'payment_success',
  'payment_failed',
  'user_registered',
  'logout',
  'user_blocked',
  'seat_lock',
]);

const allowedSeverities = new Set<SecurityLog['severity']>([
  'low',
  'medium',
  'high',
  'critical',
]);

/**
 * Save audit events locally for the existing Security Dashboard.
 */
function saveLocalLog(entry: SecurityLog): void {
  try {
    const existing = readSecurityLogs();

    existing.unshift(entry);

    localStorage.setItem(
      LOG_KEY,
      JSON.stringify(existing.slice(0, 100)),
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('security-log-updated'));
    }
  } catch {
    // Local storage may be unavailable.
  }
}

/**
 * Send authenticated audit events to the Supabase Edge Function.
 * The server determines user_id from the verified access token.
 */
async function sendServerAudit(
  entry: SecurityLog,
): Promise<void> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return;
    }

    const response = await fetch(SECURITY_AUDIT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        eventType: entry.eventType,
        message: entry.message,
        severity: entry.severity,
        metadata: entry.metadata ?? {},
      }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));

      console.error(
        'Server audit logging failed:',
        response.status,
        result,
      );
    }
  } catch (error) {
    console.error(
      'Could not reach the server audit logger:',
      error,
    );
  }
}

/**
 * Preserve the existing synchronous logging API.
 * Local logging happens immediately; server logging runs in the background.
 */
export function logSecurityEvent(
  eventType: SecurityLog['eventType'],
  message: string,
  severity: SecurityLog['severity'] = 'low',
  metadata?: Record<string, unknown>,
): SecurityLog {
  const safeEventType = allowedEvents.has(eventType)
    ? eventType
    : 'rbac_denied';

  const safeSeverity = allowedSeverities.has(severity)
    ? severity
    : 'low';

  const entry: SecurityLog = {
    id: crypto.randomUUID(),
    eventType: safeEventType,
    severity: safeSeverity,
    message: message.slice(0, 500),
    ip: 'client',
    createdAt: new Date().toISOString(),
    metadata,
  };

  saveLocalLog(entry);

  if (
    safeSeverity === 'critical' ||
    safeSeverity === 'high'
  ) {
    console.warn(
      `[security] ${safeEventType}: ${entry.message}`,
    );
  }

  void sendServerAudit(entry);

  return entry;
}

/**
 * Read recent locally stored security events.
 */
export function readSecurityLogs(): SecurityLog[] {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(LOG_KEY) ?? '[]',
    );

    return Array.isArray(parsed)
      ? (parsed as SecurityLog[])
      : [];
  } catch {
    return [];
  }
}

/**
 * Clear locally stored security events.
 */
export function clearSecurityLogs(): void {
  try {
    localStorage.removeItem(LOG_KEY);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('security-log-updated'));
    }
  } catch {
    // Local storage may be unavailable.
  }
}
