import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FieldWrapper({ label, error, hint, required, children, className }: FieldWrapperProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-[13px] font-medium text-ink">
          {label}
          {required && <span className="ms-0.5 text-red">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-[12px] text-muted">{hint}</p>}
      {error && <p className="text-[12px] text-red">{error}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-[8px] border bg-surface px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-muted',
        'focus:border-brand focus:ring-2 focus:ring-brand/10',
        error ? 'border-red' : 'border-border',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-[8px] border bg-surface px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-muted resize-y',
        'focus:border-brand focus:ring-2 focus:ring-brand/10',
        error ? 'border-red' : 'border-border',
        className,
      )}
      rows={4}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-[8px] border bg-surface px-3 py-2 text-[13px] text-ink outline-none transition-colors appearance-none',
        'focus:border-brand focus:ring-2 focus:ring-brand/10',
        error ? 'border-red' : 'border-border',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function Switch({ checked, onChange, disabled, label }: SwitchProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-brand' : 'bg-border',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
            checked ? 'start-[18px]' : 'start-0.5',
          )}
        />
      </button>
      {label && <span className="text-[13px] text-ink">{label}</span>}
    </label>
  );
}
