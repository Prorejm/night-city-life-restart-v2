import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import useGameStore from '@/stores/gameStore';
import usePlayerStore from '@/stores/playerStore';
import useGameEngine from '@/hooks/useGameEngine';
import { calculateRebirthPoints, getRebirthOptions } from '@/core/RebirthSystem';
import { getEpitaph } from '@/core/DeathSystem';
import type { DeathType, CoreAttribute, RebirthOptions } from '@/types';

const CORE_ATTRS: CoreAttribute[] = ['STYLE', 'TECH', 'CHROME', 'MONEY', 'HUMAN'];

const ATTR_LABELS: Record<string, string> = {
  STYLE: '街头风格',
  TECH: '技术能力',
  CHROME: '义体适应',
  MONEY: '经济状况',
  HUMAN: '人性值',
};

interface DeathScreenProps {
  onRestart?: () => void;
  onBackToMenu?: () => void;
}

const DeathScreen: React.FC<DeathScreenProps> = ({ onRestart, onBackToMenu }) => {
  const setPhase = useGameStore((s) => s.setPhase);
  const deathHistory = useGameStore((s) => s.deathHistory);
  const rebirthPoints = useGameStore((s) => s.rebirthPoints);
  const setRebirthPoints = useGameStore((s) => s.setRebirthPoints);
  const turnCount = useGameStore((s) => s.turnCount);
  const currentAge = useGameStore((s) => s.currentAge);
  const resetForRebirth = useGameStore((s) => s.resetForRebirth);

  const attributes = usePlayerStore((s) => s.attributes);
  const talents = usePlayerStore((s) => s.talents);

  const [glitchActive, setGlitchActive] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedInherit, setSelectedInherit] = useState<string[]>([]);

  // 死亡记录
  const lastDeath = useMemo(() => {
    if (deathHistory.length === 0) return null;
    return deathHistory[deathHistory.length - 1];
  }, [deathHistory]);

  const deathType: DeathType = lastDeath?.cause ?? 'accident';
  const deathTitle = lastDeath?.title ?? '未知死因';
  const deathDescription = lastDeath?.description ?? '';
  const epitaph = lastDeath ? getEpitaph(lastDeath.cause) : '安息';

  // 统计
  const maxAttribute = useMemo(() => {
    let maxKey = CORE_ATTRS[0];
    let maxVal = -Infinity;
    for (const key of CORE_ATTRS) {
      const val = attributes[key] ?? 0;
      if (val > maxVal) {
        maxVal = val;
        maxKey = key;
      }
    }
    return { key: maxKey, label: ATTR_LABELS[maxKey], value: maxVal };
  }, [attributes]);

  const inheritableTalents = useMemo(
    () => talents.filter((t) => t.rebirthInheritable === true),
    [talents]
  );

  // 遗产点选项
  const rebirthOptions = useMemo(
    () => getRebirthOptions(rebirthPoints),
    [rebirthPoints]
  );

  // 入口动画
  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 300);
    const t2 = setTimeout(() => setShowDetails(true), 1200);

    // 故障效果
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(glitchInterval);
    };
  }, []);

  const { startNewGame, executeRebirth } = useGameEngine();

  const handleRestart = () => {
    onRestart?.();

    // 收集玩家选择的继承项
    const wantsAttr = selectedInherit.includes('boost_attr');
    const wantsMoney = selectedInherit.includes('boost_money');
    const selectedTalentNames = selectedInherit.filter(
      (i) => i !== 'boost_attr' && i !== 'boost_money'
    );

    // 查找选中的天赋 ID
    const selectedTalentIds = selectedTalentNames
      .map((name) => talents.find((t) => t.name === name)?.id)
      .filter((id): id is number => id !== undefined);

    if (wantsAttr || wantsMoney || selectedTalentIds.length > 0) {
      // 携带遗产重开
      const options: RebirthOptions = {
        canInheritTalent: selectedTalentIds.length > 0,
        canBoostAttribute: wantsAttr && rebirthPoints >= 5,
        canBoostMoney: wantsMoney && rebirthPoints >= 3,
        canExtraTalent: false,
        inheritancePoints: rebirthPoints,
      };
      executeRebirth(
        options,
        selectedTalentIds.length > 0 ? selectedTalentIds : undefined
      );
    } else {
      // 无继承，全新开局
      startNewGame();
    }
  };

  const handleBackToMenu = () => {
    onBackToMenu?.();
    resetForRebirth();
    setPhase('MENU');
  };

  const handleInheritToggle = (item: string) => {
    setSelectedInherit((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item]
    );
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-black p-4">
      {/* 死亡标题 - 故障效果 */}
      <div
        className={cn(
          'mb-4 text-center transition-all duration-700',
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        )}
      >
        <div className="relative inline-block">
          <h1
            className={cn(
              'font-display text-6xl font-black tracking-[0.3em] text-neon-red md:text-8xl',
              glitchActive && 'animate-glitch'
            )}
            data-text={deathTitle}
          >
            {deathTitle}
          </h1>
          {glitchActive && (
            <>
              <h1
                className="absolute left-0 top-0 font-display text-6xl font-black tracking-[0.3em] text-neon-cyan opacity-50 md:text-8xl"
                style={{ clipPath: 'inset(20% 0 40% 0)' }}
              >
                {deathTitle}
              </h1>
              <h1
                className="absolute left-0 top-0 font-display text-6xl font-black tracking-[0.3em] text-neon-magenta opacity-50 md:text-8xl"
                style={{ clipPath: 'inset(60% 0 10% 0)' }}
              >
                {deathTitle}
              </h1>
            </>
          )}
        </div>
      </div>

      {/* 墓志铭 */}
      <div
        className={cn(
          'mb-8 transition-all duration-700 delay-200',
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        )}
      >
        <p className="text-center font-mono text-sm italic text-muted-foreground/60">
          &ldquo;{epitaph}&rdquo;
        </p>
      </div>

      {/* 死亡描述 */}
      <div
        className={cn(
          'mb-6 max-w-lg text-center transition-all duration-700 delay-300',
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        )}
      >
        <p className="font-mono text-xs leading-relaxed text-muted-foreground/50">
          {deathDescription}
        </p>
      </div>

      {/* 统计详情 */}
      <div
        className={cn(
          'mb-8 w-full max-w-md transition-all duration-700 delay-500',
          showDetails ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        )}
      >
        <div className="panel-card rounded-sm p-4">
          <h3 className="mb-3 font-display text-xs font-bold tracking-widest text-neon-cyan">
            DEATH STATISTICS
          </h3>
          <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">存活年龄</span>
                <span className="text-white/80">{Math.floor(currentAge)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">总回合数</span>
                <span className="text-white/80">{turnCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">最高属性</span>
                <span className="text-neon-cyan">{maxAttribute.label} ({maxAttribute.value})</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">成就</span>
                <span className="text-white/80">{lastDeath?.achievements.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">遗产点数</span>
                <span className="text-neon-magenta">{rebirthPoints}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">天赋</span>
                <span className="text-white/80">{talents.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 继承选项 */}
      {showDetails && rebirthPoints > 0 && (
        <div className={cn(
          'mb-8 w-full max-w-md transition-all duration-700',
          'panel-card rounded-sm p-4'
        )}>
          <h3 className="mb-3 font-display text-xs font-bold tracking-widest text-neon-magenta">
            INHERITANCE OPTIONS
          </h3>
          <div className="space-y-2 font-mono text-[11px]">
            {rebirthOptions.canInheritTalent && inheritableTalents.length > 0 && (
              <div>
                <div className="mb-1 text-muted-foreground">可继承天赋:</div>
                <div className="flex flex-wrap gap-1.5">
                  {inheritableTalents.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleInheritToggle(t.name)}
                      className={cn(
                        'rounded-sm border px-2 py-0.5 text-[10px] transition-all',
                        selectedInherit.includes(t.name)
                          ? 'border-neon-cyan/50 text-neon-cyan bg-neon-cyan/10'
                          : 'border-white/10 text-muted-foreground hover:border-white/30'
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {rebirthOptions.canBoostAttribute && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">属性增强(+3)</span>
                <span className={cn(
                  'px-1.5 py-0.5 text-[10px]',
                  selectedInherit.includes('boost_attr')
                    ? 'text-neon-cyan'
                    : 'text-muted-foreground/50'
                )}>
                  {rebirthPoints >= 5 ? '[可用]' : '[点数不足]'}
                </span>
              </div>
            )}
            {rebirthOptions.canBoostMoney && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">额外资金(+1000)</span>
                <span className={cn(
                  'px-1.5 py-0.5 text-[10px]',
                  selectedInherit.includes('boost_money')
                    ? 'text-neon-cyan'
                    : 'text-muted-foreground/50'
                )}>
                  {rebirthPoints >= 3 ? '[可用]' : '[点数不足]'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className={cn(
        'flex gap-4 transition-all duration-700 delay-700',
        showDetails ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}>
        <button
          onClick={handleRestart}
          className="cyber-button"
        >
          [ 再次挑战 ]
        </button>
        <button
          onClick={handleBackToMenu}
          className="cyber-button !border-neon-magenta/50 text-neon-magenta hover:bg-neon-magenta/10 hover:shadow-[0_0_15px_rgba(255,0,255,0.3)]"
        >
          [ 返回菜单 ]
        </button>
      </div>
    </div>
  );
};

export default DeathScreen;
