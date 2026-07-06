import { cn } from '@/lib/utils';
import CyberButton from '@/components/Common/CyberButton';

interface Branch {
  id: string;
  text: string;
  effects?: Record<string, number>;
}

interface EventBranchPanelProps {
  branches: Branch[];
  onSelect: (branchId: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function EventBranchPanel({
  branches,
  onSelect,
  disabled = false,
  className,
}: EventBranchPanelProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4',
        'bg-black/40 backdrop-blur-sm',
        'border-t border-neon-cyan/10',
        className
      )}
    >
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
        选择行动
      </span>

      {branches.map((branch) => (
        <div key={branch.id} className="flex flex-col">
          <CyberButton
            variant="primary"
            size="sm"
            disabled={disabled}
            onClick={() => onSelect(branch.id)}
            className="w-full"
          >
            {branch.text}
          </CyberButton>

          {/* Show branch effects as hint */}
          {branch.effects && Object.keys(branch.effects).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 ml-2">
              {Object.entries(branch.effects).map(([key, value]) => {
                const isPositive = value > 0;
                return (
                  <span
                    key={key}
                    className={cn(
                      'text-[9px] font-mono',
                      isPositive ? 'text-neon-cyan/60' : 'text-neon-red/60'
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
      ))}
    </div>
  );
}
