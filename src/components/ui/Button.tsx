import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { classNames } from '@/utils/format';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary-600 hover:bg-primary-500 text-white shadow-glow hover:shadow-glow border border-primary-400/30',
  secondary:
    'bg-secondary-600 hover:bg-secondary-500 text-white border border-secondary-400/30',
  accent:
    'bg-accent-600 hover:bg-accent-500 text-white border border-accent-400/30',
  ghost: 'bg-transparent hover:bg-white/5 text-ink-100 border border-transparent',
  outline:
    'bg-transparent hover:bg-white/5 text-ink-100 border border-white/15 hover:border-white/25',
  danger: 'bg-error-600 hover:bg-error-500 text-white border border-error-400/30',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-13 px-7 text-base rounded-xl gap-2.5 py-3.5',
  icon: 'h-10 w-10 rounded-lg justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classNames(
          'inline-flex items-center justify-center font-semibold transition-all duration-200 select-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950',
          'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
