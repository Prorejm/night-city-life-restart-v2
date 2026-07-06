import { useState } from 'react';
import { cn } from '@/lib/utils';
import StatBar from '@/components/Common/StatBar';
import type { CoreAttribute, DerivedAttribute } from '@/types';

interface HudPanelProps {
  coreAttributes: Partial<Record<CoreAttribute, number>>;
  derivedAttributes: Partial<Record<DerivedAttribute, number>>;
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

const CORE_NAMES: Record<CoreAttribute, string> = {
  STYLE: '时尚',
  TECH: '技术',
  CHROME: '义体',
  MONEY: '金钱',
  HUMAN: '人性',
};

const DERIVED_NAMES: Record<DerivedAttribute, string> = {
  LIFE: '生命',
  TRAUMA: '精神创伤',
  ADDICTION: '成瘾度',
  DEBT: '负债',
  REP: '声望',
};

const CORE_ATTRIBUTE_LIST: CoreAttribute[] = ['STYLE', 'TECH', 'CHROME', 'MONEY', 'HUMAN'];
const DERIVED_ATTRIBUTE_LIST: DerivedAttribute[] = ['LIFE', 'TRAUMA', 'ADDICTION', 'DEBT', 'REP'];

export default function HudPanel({
  coreAttributes,
  derivedAttributes,
  collapsed: controlledCollapsed,
  onToggle,
  className,
}: HudPanelProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;

  function handleToggle() {
    if (onToggle) {
      onToggle();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-30',
        'bg-black/60 backdrop-blur-sm',
        'border-r border-neon-cyan/10',
        'transition-all duration-300 ease-in-out',
        'pt-14', // offset for HudHeader
        collapsed ? 'w-10' : 'w-52',
        className
      )}
    >
      {/* Toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'absolute -right-3 top-1/2 -translate-y-1/2',
          'w-6 h-10 flex items-center justify-center',
          'bg-black/60 border border-neon-cyan/20 rounded-sm',
          'text-neon-cyan text-xs font-mono',
          'hover:bg-neon-cyan/10 transition-colors',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-cyan'
        )}
        aria-label={collapsed ? '展开属性面板' : '折叠属性面板'}
      >
        {collapsed ? '\u276F' : '\u276E'}
      </button>

      {/* Panel content */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          collapsed ? 'opacity-0 invisible w-0' : 'opacity-100 visible w-auto'
        )}
      >
        <div className="px-3 py-4 space-y-4">
          {/* Core attributes */}
          <div>
            <h3 className="text-[10px] font-mono text-neon-cyan uppercase tracking-widest mb-3">
              核心属性
            </h3>
            <div className="space-y-2">
              {CORE_ATTRIBUTE_LIST.map((attr) => (
                <StatBar
                  key={attr}
                  name={CORE_NAMES[attr]}
                  value={coreAttributes[attr] ?? 0}
                  max={100}
                  showLabel
                />
              ))}
            </div>
          </div>

          {/* Derived attributes */}
          <div>
            <h3 className="text-[10px] font-mono text-neon-magenta uppercase tracking-widest mb-3">
              衍生属性
            </h3>
            <div className="space-y-2">
              {DERIVED_ATTRIBUTE_LIST.map((attr) => (
                <StatBar
                  key={attr}
                  name={DERIVED_NAMES[attr]}
                  value={derivedAttributes[attr] ?? 0}
                  max={100}
                  showLabel
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
