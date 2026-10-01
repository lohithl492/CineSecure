import { forwardRef, type InputHTMLAttributes } from 'react';
import { classNames } from '@/utils/format';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink-200 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">{icon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={classNames(
              'input-field',
              icon && 'pl-11',
              error && 'border-error-500/60 focus:ring-error-500/40',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-error-400 animate-fadeIn">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
