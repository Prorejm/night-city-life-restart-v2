import { cn } from '@/lib/utils';
import type { CoreAttribute } from '@/types';

interface HudHeaderProps {
  currentAge: number;
  currentYear: number;
  turnCount: number;
  coreAttributes: Partial<Record<CoreAttribute, number>>;
  className?: string;
}

const CORE_LABELS: Record<CoreAttribute, string> = {
  STYLE: 'STYLE',
  TECH: 'TECH',
  CHROME: 'CHROME',
  MONEY: 'MONEY',
  HUMAN: 'HUMAN',
};

export default function HudHeader({
  currentAge,
  currentYear,
  turnCount,
  coreAttributes,
  className,
}: HudHeaderProps) {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40',
        'bg-black/60 backdrop-blur-sm',
        'border-b border-neon-cyan/10',
        'px-4 py-2',
        className
      )}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
        {/* Age / Year / Turn info */}
        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">AGE</span>
            <span className="text-neon-cyan font-bold">{currentAge}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">YEAR</span>
            <span className="text-foreground font-bold">{currentYear}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">TURN</span>
            <span className="text-foreground font-bold">{turnCount}</span>
          </div>
        </div>

        {/* Spacer */}
        <div />

        {/* Core attributes */}
        <div className="flex items-center gap-3">
          {(Object.keys(CORE_LABELS) as CoreAttribute[]).map((key) => {
            const val = coreAttributes[key] ?? 0;
            return (
              <div key={key} className="flex items-center gap-1 font-mono text-xs">
                <span className="text-muted-foreground">{CORE_LABELS[key]}</span>
                <span
                  className={cn(
                    'font-bold tabular-nums',
                    val >= 80 && 'text-neon-cyan',
                    val >= 50 && val < 80 && 'text-lime-400',
                    val >= 20 && val < 50 && 'text-yellow-400',
                    val < 20 && 'text-red-400'
                  )}
                >
                  {val}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
