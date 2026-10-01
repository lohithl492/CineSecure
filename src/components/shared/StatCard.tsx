import type { LucideIcon } from 'lucide-react';
import { classNames } from '@/utils/format';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  hint?: string;
  trend?: { value: string; positive?: boolean };
}

const toneMap = {
  primary: 'from-primary-500/20 to-primary-500/5 text-primary-300',
  secondary: 'from-secondary-500/20 to-secondary-500/5 text-secondary-300',
  accent: 'from-accent-500/20 to-accent-500/5 text-accent-300',
  success: 'from-success-500/20 to-success-500/5 text-success-300',
  warning: 'from-warning-500/20 to-warning-500/5 text-warning-300',
  error: 'from-error-500/20 to-error-500/5 text-error-300',
} as const;

export function StatCard({ label, value, icon: Icon, tone = 'primary', hint, trend }: StatCardProps) {
  return (
    <div className="glass-card p-5 animate-fadeIn">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-ink-400 font-medium">{label}</p>
          <p className="font-display text-3xl font-bold text-ink-50 mt-2 tracking-tight">{value}</p>
          {hint && <p className="text-xs text-ink-500 mt-1">{hint}</p>}
          {trend && (
            <p
              className={classNames(
                'text-xs font-semibold mt-2',
                trend.positive ? 'text-success-400' : 'text-error-400',
              )}
            >
              {trend.positive ? '▲' : '▼'} {trend.value}
            </p>
          )}
        </div>
        <div className={classNames('rounded-xl p-3 bg-gradient-to-br', toneMap[tone])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
