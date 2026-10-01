import { classNames } from '@/utils/format';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
} as const;

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div className={classNames('flex flex-col items-center justify-center gap-3', className)}>
      <span
        className={classNames(
          'rounded-full border-white/15 border-t-primary-500 animate-spin',
          sizeMap[size],
        )}
      />
      {label && <p className="text-sm text-ink-400 animate-pulse">{label}</p>}
    </div>
  );
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}
