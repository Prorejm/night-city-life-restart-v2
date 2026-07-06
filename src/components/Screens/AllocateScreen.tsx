import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import useGameStore from '@/stores/gameStore';
import usePlayerStore from '@/stores/playerStore';

const CORE_ATTRIBUTES = ['STYLE', 'TECH', 'CHROME', 'MONEY', 'HUMAN'] as const;

const ATTR_LABELS: Record<string, string> = {
  STYLE: '街头风格',
  TECH: '技术能力',
  CHROME: '义体适应',
  MONEY: '经济状况',
  HUMAN: '人性值',
};

const ATTR_SHORT: Record<string, string> = {
  STYLE: 'STL',
  TECH: 'TCH',
  CHROME: 'CHR',
  MONEY: 'MON',
  HUMAN: 'HUM',
};

const ATTR_COLORS: Record<string, string> = {
  STYLE: 'text-neon-magenta',
  TECH: 'text-neon-cyan',
  CHROME: 'text-neon-yellow',
  MONEY: 'text-neon-green',
  HUMAN: 'text-neon-red',
};

const ATTR_BAR_COLORS: Record<string, string> = {
  STYLE: 'bg-neon-magenta',
  TECH: 'bg-neon-cyan',
  CHROME: 'bg-neon-yellow',
  MONEY: 'bg-neon-green',
  HUMAN: 'bg-neon-red',
};

interface AllocateScreenProps {
  onConfirm?: (attrs: Record<string, number>) => void;
}

const INITIAL_BASE = 10;
const MAX_PER_ATTR = 30;
const TOTAL_POINTS = 25;

const AllocateScreen: React.FC<AllocateScreenProps> = ({ onConfirm }) => {
  const setPhase = useGameStore((s) => s.setPhase);

  const [attrs, setAttrs] = useState<Record<string, number>>(() => {
    const base: Record<string, number> = {};
    for (const key of CORE_ATTRIBUTES) {
      base[key] = INITIAL_BASE;
    }
    return base;
  });

  // 计算已用点数
  const pointsUsed = useMemo(
    () =>
      CORE_ATTRIBUTES.reduce((sum, key) => sum + (attrs[key] - INITIAL_BASE), 0),
    [attrs]
  );
  const pointsRemaining = TOTAL_POINTS - pointsUsed;

  const adjust = (key: string, delta: number) => {
    setAttrs((prev) => {
      const current = prev[key];
      const next = current + delta;

      // 边界检查
      if (next < INITIAL_BASE || next > MAX_PER_ATTR) return prev;

      // 如果增加则需要检查是否有剩余点数
      if (delta > 0 && pointsRemaining <= 0) return prev;

      return { ...prev, [key]: next };
    });
  };

  const handleConfirm = () => {
    // 写入 playerStore
    const playerStore = usePlayerStore.getState();
    const finalAttrs: Record<string, number> = {};
    for (const key of CORE_ATTRIBUTES) {
      finalAttrs[key] = attrs[key];
    }
    // 保留其他属性
    usePlayerStore.setState({
      attributes: {
        ...playerStore.attributes,
        ...finalAttrs,
      },
    });

    onConfirm?.(finalAttrs);
    setPhase('PLAYING');
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-black/95 p-4">
      {/* Title */}
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl font-bold tracking-widest text-neon-cyan md:text-3xl">
          属性分配
        </h2>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          分配 25 点属性点
        </p>
      </div>

      {/* 剩余点数 */}
      <div className="mb-8 text-center">
        <div className="font-display text-4xl font-bold tracking-wider text-neon-magenta">
          {pointsRemaining}
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          剩余分配点数
        </div>
      </div>

      {/* 属性列表 */}
      <div className="w-full max-w-md space-y-5">
        {CORE_ATTRIBUTES.map((key) => {
          const value = attrs[key];
          const barPercent = ((value - INITIAL_BASE) / (MAX_PER_ATTR - INITIAL_BASE)) * 100;

          return (
            <div key={key} className="space-y-1.5">
              {/* 标签行 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn('font-display text-xs font-bold tracking-wider', ATTR_COLORS[key])}>
                    {ATTR_SHORT[key]}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {ATTR_LABELS[key]}
                  </span>
                </div>
                <span className={cn('font-display text-sm font-bold', ATTR_COLORS[key])}>
                  {value}
                </span>
              </div>

              {/* 进度条 */}
              <div className="stat-bar w-full">
                <div
                  className={cn('stat-bar-fill', ATTR_BAR_COLORS[key])}
                  style={{ width: `${barPercent}%` }}
                />
              </div>

              {/* 加减按钮 */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => adjust(key, -1)}
                  disabled={value <= INITIAL_BASE}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center border text-xs transition-all',
                    'font-mono font-bold',
                    value > INITIAL_BASE
                      ? 'border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10'
                      : 'border-white/10 text-white/20 cursor-not-allowed'
                  )}
                >
                  -
                </button>
                <button
                  onClick={() => adjust(key, 1)}
                  disabled={value >= MAX_PER_ATTR || pointsRemaining <= 0}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center border text-xs transition-all',
                    'font-mono font-bold',
                    value < MAX_PER_ATTR && pointsRemaining > 0
                      ? 'border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10'
                      : 'border-white/10 text-white/20 cursor-not-allowed'
                  )}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 确认按钮 */}
      <div className="mt-8 flex items-center gap-3">
        <div className="font-mono text-xs text-muted-foreground">
          <span className={cn(pointsRemaining === 0 ? 'text-neon-cyan' : 'text-yellow-400')}>
            {pointsRemaining === 0 ? '点数已分配完' : `剩余 ${pointsRemaining} 点`}
          </span>
        </div>

        <button
          onClick={handleConfirm}
          disabled={pointsRemaining > 0}
          className={cn(
            'cyber-button',
            pointsRemaining > 0
              ? 'cursor-not-allowed opacity-30'
              : 'cursor-pointer'
          )}
        >
          [ 开始游戏 ]
        </button>
      </div>
    </div>
  );
};

export default AllocateScreen;
