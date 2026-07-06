import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  title: string;
  description?: string;
  age?: number;
  turn?: number;
  effects?: Record<string, number>;
  timestamp: number;
}

interface EventLogProps {
  entries: LogEntry[];
  className?: string;
}

export default function EventLog({ entries, className }: EventLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(entries.length);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (entries.length > prevLengthRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    prevLengthRef.current = entries.length;
  }, [entries.length]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col gap-1 overflow-y-auto',
        'scrollbar-thin',
        className
      )}
      role="log"
      aria-live="polite"
      aria-label="事件日志"
    >
      {entries.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <span className="text-xs text-muted-foreground/50 font-mono">
            [ 等待事件触发... ]
          </span>
        </div>
      )}

      {entries.map((entry, index) => (
        <EventLogItem key={entry.id} entry={entry} index={index} />
      ))}
    </div>
  );
}

function EventLogItem({
  entry,
  index,
}: {
  entry: LogEntry;
  index: number;
}) {
  return (
    <div
      className={cn(
        'group px-3 py-2 rounded-sm transition-colors',
        'hover:bg-white/5',
        'animate-in slide-in-from-bottom-2 fade-in duration-300'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header: title + age/turn */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground truncate">
          {entry.title}
        </span>
        {(entry.age !== undefined || entry.turn !== undefined) && (
          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
            {entry.age !== undefined && `AGE ${entry.age}`}
            {entry.age !== undefined && entry.turn !== undefined && ' '}
            {entry.turn !== undefined && `TURN ${entry.turn}`}
          </span>
        )}
      </div>

      {/* Description */}
      {entry.description && (
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-0.5 line-clamp-2">
          {entry.description}
        </p>
      )}

      {/* Effects */}
      {entry.effects && Object.keys(entry.effects).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {Object.entries(entry.effects).map(([key, value]) => {
            const isPositive = value > 0;
            return (
              <span
                key={key}
                className={cn(
                  'text-[10px] font-mono px-1 py-0.5 rounded-sm',
                  isPositive
                    ? 'text-neon-cyan bg-neon-cyan/5'
                    : 'text-neon-red bg-neon-red/5'
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
