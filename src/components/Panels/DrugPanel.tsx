import { cn } from '@/lib/utils';
import StatBar from '@/components/Common/StatBar';

interface DrugInfo {
  id: string;
  name: string;
  type: string;
  addictionRate: number;
}

interface DrugPanelProps {
  addictionLevel: number;
  currentDrugs: string[];
  drugAddiction: Record<string, number>;
  drugDatabase: DrugInfo[];
  className?: string;
}

function getDrugName(drugId: string, database: DrugInfo[]): string {
  return database.find((d) => d.id === drugId)?.name ?? drugId;
}

export default function DrugPanel({
  addictionLevel,
  currentDrugs,
  drugAddiction,
  drugDatabase,
  className,
}: DrugPanelProps) {
  const hasActiveDrugs = currentDrugs.length > 0;
  const hasAddictions = Object.keys(drugAddiction).length > 0;

  return (
    <div className={cn('panel-card rounded-sm p-4', className)}>
      {/* Header */}
      <h3 className="text-xs font-display text-neon-magenta tracking-wider mb-4 uppercase">
        药物状态
      </h3>

      {/* Overall addiction */}
      <div className="mb-4">
        <StatBar
          name="总体成瘾度"
          value={addictionLevel}
          max={100}
          color={addictionLevel >= 60 ? 'bg-red-500' : addictionLevel >= 30 ? 'bg-yellow-500' : 'bg-orange-500'}
        />
      </div>

      {/* Currently active drugs */}
      {hasActiveDrugs && (
        <div className="mb-4">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 block">
            体内药物
          </span>
          <div className="flex flex-wrap gap-1.5">
            {currentDrugs.map((drugId) => (
              <span
                key={drugId}
                className="px-2 py-0.5 text-[10px] font-mono text-neon-cyan bg-neon-cyan/5 border border-neon-cyan/20 rounded-sm"
              >
                {getDrugName(drugId, drugDatabase)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Drug-specific addiction levels */}
      {hasAddictions && (
        <div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 block">
            各药物成瘾度
          </span>
          <div className="space-y-1.5">
            {Object.entries(drugAddiction).map(([drugId, level]) => (
              <div
                key={drugId}
                className="flex items-center gap-2"
              >
                <span className="text-[11px] font-mono text-foreground w-20 truncate shrink-0">
                  {getDrugName(drugId, drugDatabase)}
                </span>
                <div className="flex-1 h-1.5 bg-muted rounded-sm overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-sm transition-all duration-500',
                      level >= 70 ? 'bg-red-500' : level >= 40 ? 'bg-yellow-500' : 'bg-orange-400'
                    )}
                    style={{ width: `${Math.min(level, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground w-6 text-right tabular-nums">
                  {level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasActiveDrugs && !hasAddictions && (
        <div className="flex items-center justify-center py-6">
          <span className="text-[11px] text-muted-foreground/50 font-mono">
            无药物记录
          </span>
        </div>
      )}
    </div>
  );
}
