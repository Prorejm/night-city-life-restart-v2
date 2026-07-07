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

  // Scroll to top handler
  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex flex-col h-full">
      <div
        ref={containerRef}
        className={cn(
          'flex flex-col gap-2 overflow-y-auto flex-1',
          'scrollbar-thin scroll-smooth',
          className
        )}
        role="log"
        aria-live="polite"
        aria-label="事件日志"
      >
        {entries.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-muted-foreground/50 font-mono">
              [ 等待事件触发... ]
            </span>
          </div>
        )}

        {entries.map((entry, index) => (
          <EventLogItem key={entry.id} entry={entry} index={index} isLast={index === entries.length - 1} />
        ))}
      </div>

      {/* Back to top button */}
      {entries.length > 5 && (
        <button
          onClick={scrollToTop}
          className="absolute bottom-2 right-2 z-10 px-2 py-1 text-[10px] font-mono text-neon-cyan border border-neon-cyan/20 bg-black/60 rounded-sm hover:bg-neon-cyan/10 transition-colors"
        >
          ↑ 顶部
        </button>
      )}
    </div>
  );
}

function EventLogItem({
  entry,
  index,
  isLast,
}: {
  entry: LogEntry;
  index: number;
  isLast: boolean;
}) {
  const timeStr = new Date(entry.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div
      className={cn(
        'group px-4 py-3 rounded-sm transition-colors min-h-[100px]',
        'hover:bg-white/5',
        'animate-in slide-in-from-bottom-2 fade-in duration-300',
        !isLast && 'border-b border-white/5'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header: title + age/turn + timestamp */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground truncate">
          {entry.title}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {(entry.age !== undefined || entry.turn !== undefined) && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {entry.age !== undefined && `${entry.age}岁`}
              {entry.age !== undefined && entry.turn !== undefined && ' · '}
              {entry.turn !== undefined && `第${entry.turn}回`}
            </span>
          )}
          <span className="text-[9px] text-muted-foreground/40 font-mono">{timeStr}</span>
        </div>
      </div>

      {/* Description */}
      {entry.description && (
        <p className="text-xs text-muted-foreground/80 leading-relaxed mt-1.5 line-clamp-3">
          {entry.description}
        </p>
      )}

      {/* Effects */}
      {entry.effects && Object.keys(entry.effects).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {Object.entries(entry.effects).map(([key, value]) => {
            const isPositive = value > 0;
            return (
              <span
                key={key}
                className={cn(
                  'text-[11px] font-mono px-1.5 py-0.5 rounded-sm',
                  isPositive
                    ? 'text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/20'
                    : 'text-neon-red bg-neon-red/10 border border-neon-red/20'
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
