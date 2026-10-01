import type { ReactNode } from 'react';
import { classNames } from '@/utils/format';

type Tone = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  variant?: 'solid' | 'soft' | 'outline';
  className?: string;
  icon?: ReactNode;
}

const toneMap: Record<Tone, { solid: string; soft: string; outline: string }> = {
  primary: {
    solid: 'bg-primary-600 text-white',
    soft: 'bg-primary-500/15 text-primary-300',
    outline: 'border border-primary-500/40 text-primary-300',
  },
  secondary: {
    solid: 'bg-secondary-600 text-white',
    soft: 'bg-secondary-500/15 text-secondary-300',
    outline: 'border border-secondary-500/40 text-secondary-300',
  },
  accent: {
    solid: 'bg-accent-600 text-white',
    soft: 'bg-accent-500/15 text-accent-300',
    outline: 'border border-accent-500/40 text-accent-300',
  },
  success: {
    solid: 'bg-success-600 text-white',
    soft: 'bg-success-500/15 text-success-300',
    outline: 'border border-success-500/40 text-success-300',
  },
  warning: {
    solid: 'bg-warning-600 text-white',
    soft: 'bg-warning-500/15 text-warning-300',
    outline: 'border border-warning-500/40 text-warning-300',
  },
  error: {
    solid: 'bg-error-600 text-white',
    soft: 'bg-error-500/15 text-error-300',
    outline: 'border border-error-500/40 text-error-300',
  },
  neutral: {
    solid: 'bg-ink-700 text-ink-100',
    soft: 'bg-ink-700/40 text-ink-300',
    outline: 'border border-white/15 text-ink-300',
  },
};

export function Badge({ children, tone = 'neutral', variant = 'soft', className, icon }: BadgeProps) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide',
        toneMap[tone][variant],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
