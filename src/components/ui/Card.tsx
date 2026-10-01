import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/utils/format';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'outline';
  hover?: boolean;
}

const variantClasses = {
  glass: 'glass',
  solid: 'bg-ink-900/80 border border-white/10',
  outline: 'bg-transparent border border-white/10',
} as const;

export function Card({ variant = 'glass', hover, className, children, ...props }: CardProps) {
  return (
    <div
      className={classNames(
        'rounded-2xl p-5 transition-all duration-300',
        variantClasses[variant],
        hover && 'hover:border-white/20 hover:shadow-glow hover:-translate-y-0.5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="font-display text-lg font-semibold text-ink-50">{title}</h3>
        {subtitle && <p className="text-sm text-ink-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
