import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'text-neon-cyan border-neon-cyan/50 hover:bg-neon-cyan/10 hover:shadow-[0_0_15px_rgba(0,255,247,0.3)] hover:shadow-[inset_0_0_15px_rgba(0,255,247,0.1)]',
  secondary:
    'text-neon-magenta border-neon-magenta/50 hover:bg-neon-magenta/10 hover:shadow-[0_0_15px_rgba(255,0,255,0.3)] hover:shadow-[inset_0_0_15px_rgba(255,0,255,0.1)]',
  danger:
    'text-neon-red border-neon-red/50 hover:bg-neon-red/10 hover:shadow-[0_0_15px_rgba(255,0,68,0.3)] hover:shadow-[inset_0_0_15px_rgba(255,0,68,0.1)]',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

export default function CyberButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  ...rest
}: CyberButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative font-display font-bold tracking-wider uppercase',
        'bg-transparent border',
        'transition-all duration-200',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-transparent disabled:active:scale-100',
        'active:scale-95',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className
      )}
      style={{
        clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
      }}
      {...rest}
    >
      {/* Corner decorations */}
      <span
        className="absolute top-0 left-0 w-2 h-[1px] bg-current"
        aria-hidden="true"
      />
      <span
        className="absolute top-0 left-0 w-[1px] h-2 bg-current"
        aria-hidden="true"
      />
      <span
        className="absolute bottom-0 right-0 w-2 h-[1px] bg-current"
        aria-hidden="true"
      />
      <span
        className="absolute bottom-0 right-0 w-[1px] h-2 bg-current"
        aria-hidden="true"
      />
      {children}
    </button>
  );
}
