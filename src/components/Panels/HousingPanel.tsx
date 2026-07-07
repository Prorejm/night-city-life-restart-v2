import { cn } from '@/lib/utils';
import type { HousingLevel } from '@/types';

interface HousingData {
  id: string;
  name: string;
  rank: number;
  monthlyRent: number;
  safety: number;
  comfort: number;
  description: string;
  features: string[];
}

interface HousingPanelProps {
  currentLevel: HousingLevel;
  housingDatabase: HousingData[];
  monthlyIncome: number;
  className?: string;
}

function getHousingData(level: HousingLevel, database: HousingData[]): HousingData | undefined {
  return database.find((h) => h.id === level);
}

const LEVEL_RANK: Record<HousingLevel, number> = {
  S: 6,
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  F: 1,
};

function getComfortBarColor(comfort: number): string {
  if (comfort >= 80) return 'bg-neon-cyan';
  if (comfort >= 50) return 'bg-lime-400';
  if (comfort >= 20) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getSafetyBarColor(safety: number): string {
  if (safety >= 80) return 'bg-neon-cyan';
  if (safety >= 50) return 'bg-lime-400';
  if (safety >= 20) return 'bg-yellow-500';
  return 'bg-red-500';
}

const LEVEL_LABELS: Record<HousingLevel, string> = {
  S: 'S',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  F: 'F',
};

export default function HousingPanel({
  currentLevel,
  housingDatabase,
  monthlyIncome,
  className,
}: HousingPanelProps) {
  const data = getHousingData(currentLevel, housingDatabase);
  const rank = LEVEL_RANK[currentLevel];
  const canAfford = data ? monthlyIncome >= data.monthlyRent : false;

  return (
    <div className={cn('panel-card rounded-sm p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-display text-neon-cyan tracking-wider uppercase">
          住房信息
        </h3>
        <span
          className={cn(
            'text-[10px] font-mono px-1.5 py-0.5 rounded-sm border',
            rank >= 5 && 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/5',
            rank >= 3 && rank < 5 && 'text-lime-400 border-lime-400/30 bg-lime-400/5',
            rank < 3 && 'text-red-400 border-red-400/30 bg-red-400/5'
          )}
        >
          {LEVEL_LABELS[currentLevel]}
        </span>
      </div>

      {/* Housing name */}
      {data && (
        <p className="text-sm font-medium text-foreground mb-3">{data.name}</p>
      )}

      {/* Rent & affordability */}
      {data && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-mono text-muted-foreground">
            月租: <span className="text-foreground">{data.monthlyRent}</span>
          </span>
          <span
            className={cn(
              'text-[10px] font-mono',
              canAfford ? 'text-neon-cyan' : 'text-neon-red'
            )}
          >
            {canAfford ? '可负担' : '负担过重'}
          </span>
        </div>
      )}

      {/* Comfort gauge */}
      {data && (
        <div className="mb-3 p-2 rounded-sm border border-white/5 bg-white/[0.02]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-muted-foreground">舒适度</span>
            <span className={cn('text-xs font-mono font-bold', data.comfort >= 80 ? 'text-neon-cyan' : data.comfort >= 50 ? 'text-lime-400' : 'text-yellow-400')}>
              {data.comfort}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-sm overflow-hidden">
            <div
              className={cn('h-full rounded-sm transition-all duration-500', getComfortBarColor(data.comfort))}
              style={{ width: `${data.comfort}%` }}
            />
          </div>
        </div>
      )}

      {/* Safety gauge */}
      {data && (
        <div className="mb-3 p-2 rounded-sm border border-white/5 bg-white/[0.02]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-muted-foreground">安全评分</span>
            <span className={cn('text-xs font-mono font-bold', data.safety >= 80 ? 'text-neon-cyan' : data.safety >= 50 ? 'text-lime-400' : 'text-yellow-400')}>
              {data.safety}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-sm overflow-hidden">
            <div
              className={cn('h-full rounded-sm transition-all duration-500', getSafetyBarColor(data.safety))}
              style={{ width: `${data.safety}%` }}
            />
          </div>
        </div>
      )}

      {/* Features */}
      {data && data.features.length > 0 && (
        <div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">
            设施
          </span>
          <div className="flex flex-wrap gap-1">
            {data.features.map((feature, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground bg-white/5 rounded-sm"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No housing data fallback */}
      {!data && (
        <div className="flex items-center justify-center py-6">
          <span className="text-[11px] text-muted-foreground/50 font-mono">
            无住房数据
          </span>
        </div>
      )}
    </div>
  );
}
