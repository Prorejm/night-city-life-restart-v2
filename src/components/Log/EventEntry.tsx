import { cn } from '@/lib/utils';

type EffectMap = Record<string, number>;

interface EventEntryProps {
  title: string;
  description?: string;
  effects?: EffectMap;
  age?: number;
  turn?: number;
  timestamp?: number;
  className?: string;
}

export default function EventEntry({
  title,
  description,
  effects,
  age,
  turn,
  className,
}: EventEntryProps) {
  return (
    <div
      className={cn(
        'group px-3 py-2 rounded-sm transition-all duration-200',
        'hover:bg-white/5',
        'animate-in slide-in-from-bottom-2 fade-in duration-300',
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground truncate">
          {title}
        </span>

        {/* Age / Turn badge */}
        {(age !== undefined || turn !== undefined) && (
          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
            {age !== undefined && `AGE ${age}`}
            {age !== undefined && turn !== undefined && ' '}
            {turn !== undefined && `#${turn}`}
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-1 line-clamp-3">
          {description}
        </p>
      )}

      {/* Effects tags */}
      {effects && Object.keys(effects).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {Object.entries(effects).map(([key, value]) => {
            const isPositive = value > 0;
            return (
              <span
                key={key}
                className={cn(
                  'inline-block text-[10px] font-mono px-1 py-[1px] rounded-sm',
                  isPositive
                    ? 'text-neon-cyan bg-neon-cyan/8'
                    : 'text-neon-red bg-neon-red/8'
                )}
              >
                {key} {isPositive ? '+' : ''}
                {value}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
