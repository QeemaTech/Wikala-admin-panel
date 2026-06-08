import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-[7px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wk-blue/40 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px',
  {
    variants: {
      variant: {
        primary: 'bg-wk-blue text-white hover:bg-wk-blue-700',
        ghost: 'border border-border bg-surface text-ink hover:bg-surface-2',
        danger: 'bg-red text-white hover:brightness-95',
        success: 'bg-green text-white hover:brightness-95',
      },
      size: {
        default: 'rounded-[10px] px-[14px] py-2 text-[13px]',
        sm: 'rounded-[8px] px-[10px] py-[5px] text-xs',
        icon: 'rounded-[10px] p-[7px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };
