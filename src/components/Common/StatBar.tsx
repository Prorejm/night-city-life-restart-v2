import { cn } from '@/lib/utils';

interface StatBarProps {
  name: string;
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  className?: string;
}

function getColorClass(value: number, max: number): string {
  const ratio = value / max;
  if (ratio <= 0.25) return 'bg-red-500';
  if (ratio <= 0.5) return 'bg-yellow-500';
  if (ratio <= 0.75) return 'bg-lime-500';
  return 'bg-neon-cyan';
}

export default function StatBar({
  name,
  value,
  max = 100,
  color,
  showLabel = true,
  className,
}: StatBarProps) {
  const clampedValue = Math.max(0, Math.min(value, max));
  const percentage = max > 0 ? (clampedValue / max) * 100 : 0;
  const barColor = color ?? getColorClass(value, max);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-sm font-mono">
          <span className="text-muted-foreground uppercase tracking-wider">
            {name}
          </span>
          <span className="text-foreground font-bold text-base">{value}</span>
        </div>
      )}
      <div
        className="stat-bar"
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={name}
      >
        <div
          className={cn('stat-bar-fill', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
