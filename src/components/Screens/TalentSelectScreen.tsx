import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import useGameStore from '@/stores/gameStore';
import usePlayerStore from '@/stores/playerStore';
import { generateTalentPool, getGradeLabel } from '@/core/TalentSystem';
import type { Talent } from '@/types';

const MAX_SELECTION = 3;

const GRADE_BORDER_COLORS: Record<number, string> = {
  0: 'border-gray-500/50',
  1: 'border-blue-500/60',
  2: 'border-purple-500/70',
  3: 'border-yellow-500/80',
};

const GRADE_GLOW_COLORS: Record<number, string> = {
  0: 'shadow-[0_0_8px_rgba(107,114,128,0.3)]',
  1: 'shadow-[0_0_12px_rgba(59,130,246,0.4)]',
  2: 'shadow-[0_0_16px_rgba(168,85,247,0.5)]',
  3: 'shadow-[0_0_20px_rgba(234,179,8,0.6)]',
};

const GRADE_BADGE_COLORS: Record<number, string> = {
  0: 'bg-gray-600/50 text-gray-300',
  1: 'bg-blue-600/50 text-blue-200',
  2: 'bg-purple-600/50 text-purple-200',
  3: 'bg-yellow-600/50 text-yellow-200',
};

interface TalentSelectScreenProps {
  onConfirm?: (selectedIds: number[]) => void;
}

const TalentSelectScreen: React.FC<TalentSelectScreenProps> = ({ onConfirm }) => {
  const setPhase = useGameStore((s) => s.setPhase);

  const [talentPool, setTalentPool] = useState<Talent[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmed, setConfirmed] = useState(false);

  // 从缓存或继承天赋加载
  const inheritedTalents = useGameStore((s) => s.inheritedTalents);

  useEffect(() => {
    // 生成10个天赋
    const pool = generateTalentPool(10);
    setTalentPool(pool);
  }, []);

  // 如果已有继承天赋，标记为预选
  useEffect(() => {
    if (inheritedTalents.length > 0 && talentPool.length > 0) {
      const presetIds = new Set(
        talentPool
          .filter((t) => inheritedTalents.includes(t.id))
          .map((t) => t.id)
      );
      if (presetIds.size > 0) {
        setSelectedIds(presetIds);
      }
    }
  }, [talentPool, inheritedTalents]);

  const handleToggle = (talentId: number) => {
    if (confirmed) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(talentId)) {
        next.delete(talentId);
      } else if (next.size < MAX_SELECTION) {
        next.add(talentId);
      }
      return next;
    });
  };

  const canConfirm = selectedIds.size === MAX_SELECTION;

  const handleConfirm = () => {
    if (!canConfirm || confirmed) return;

    const selected = talentPool.filter((t) => selectedIds.has(t.id));
    // 将天赋写入 playerStore
    const playerStore = usePlayerStore.getState();
    for (const talent of selected) {
      if (!playerStore.talents.find((t) => t.id === talent.id)) {
        playerStore.talents.push({ ...talent });
      }
    }
    usePlayerStore.setState({
      talents: [...playerStore.talents],
    });

    setPhase('ALLOCATE');
  };

  const selectedList = useMemo(
    () => talentPool.filter((t) => selectedIds.has(t.id)),
    [talentPool, selectedIds]
  );

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-black/95 p-4">
      {/* Title */}
      <div className="mb-2 text-center">
        <h2 className="font-display text-2xl font-bold tracking-widest text-neon-cyan md:text-3xl">
          选择初始天赋
        </h2>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {selectedIds.size === 0
            ? '请从以下天赋中选择3项'
            : `已选择 ${selectedIds.size}/${MAX_SELECTION}`}
        </p>
      </div>

      {/* 已选天赋提示 */}
      {selectedList.length > 0 && (
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {selectedList.map((t) => (
            <span
              key={t.id}
              className={cn(
                'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-mono text-xs',
                GRADE_BADGE_COLORS[t.grade]
              )}
            >
              {t.name}
            </span>
          ))}
        </div>
      )}

      {/* 天赋卡片网格 */}
      <div className="grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {talentPool.map((talent) => {
          const isSelected = selectedIds.has(talent.id);
          const isMaxed = !isSelected && selectedIds.size >= MAX_SELECTION;

          return (
            <button
              key={talent.id}
              onClick={() => handleToggle(talent.id)}
              disabled={confirmed}
              className={cn(
                'group relative flex flex-col rounded-sm border-2 p-3 text-left transition-all duration-200',
                'bg-black/60 backdrop-blur-sm',
                'hover:bg-white/5',
                isSelected
                  ? [
                      GRADE_BORDER_COLORS[talent.grade],
                      GRADE_GLOW_COLORS[talent.grade],
                      'bg-white/5',
                    ]
                  : 'border-white/10 hover:border-white/30',
                isMaxed && !isSelected && 'cursor-not-allowed opacity-40',
                confirmed && 'cursor-default'
              )}
            >
              {/* 稀有度标签 */}
              <span
                className={cn(
                  'absolute right-2 top-2 rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase',
                  GRADE_BADGE_COLORS[talent.grade]
                )}
              >
                {getGradeLabel(talent.grade)}
              </span>

              {/* 天赋名称 */}
              <h3
                className={cn(
                  'mb-1 font-display text-sm font-bold tracking-wider',
                  isSelected ? 'text-neon-cyan' : 'text-white/80'
                )}
              >
                {talent.name}
              </h3>

              {/* 天赋描述 */}
              <p className="flex-1 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {talent.description}
              </p>

              {/* 效果预览 */}
              {talent.effects && Object.keys(talent.effects).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(talent.effects).map(([key, val]) => (
                    <span
                      key={key}
                      className={cn(
                        'font-mono text-[10px]',
                        (val ?? 0) > 0 ? 'text-green-400/80' : 'text-red-400/80'
                      )}
                    >
                      {key} {(val ?? 0) > 0 ? '+' : ''}
                      {val}
                    </span>
                  ))}
                </div>
              )}

              {/* 选中指示器 */}
              {isSelected && (
                <div className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-neon-cyan/20">
                  <span className="text-xs text-neon-cyan">{Array.from(selectedIds).indexOf(talent.id) + 1}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 确认按钮 */}
      <div className="mt-6 flex items-center gap-4">
        <div className="font-mono text-xs text-muted-foreground">
          <span className={cn(canConfirm ? 'text-neon-cyan' : 'text-red-400')}>
            {selectedIds.size}
          </span>
          <span> / {MAX_SELECTION} 已选择</span>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!canConfirm || confirmed}
          className={cn(
            'cyber-button',
            !canConfirm || confirmed
              ? 'cursor-not-allowed opacity-30'
              : 'cursor-pointer'
          )}
        >
          {confirmed ? '[ 已确认 ]' : '[ 确认选择 ]'}
        </button>
      </div>
    </div>
  );
};

export default TalentSelectScreen;
