import { useEffect, useRef, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import useGameStore from '@/stores/gameStore';
import usePlayerStore from '@/stores/playerStore';
import useUIStore from '@/stores/uiStore';
import useGameEngine from '@/hooks/useGameEngine';
import useAutoPlay from '@/hooks/useAutoPlay';
import useKeyboard from '@/hooks/useKeyboard';
import { checkCriticalThresholds } from '@/core/PropertySystem';
import { STAT_NAMES } from '@/engine/GameConfig';
import type { AttributeType } from '@/types';
import './GameScreen.css';

/** 所有属性 key */
const ALL_ATTRS = [
  'STYLE', 'TECH', 'CHROME', 'MONEY', 'HUMAN',
  'LIFE', 'TRAUMA', 'ADDICTION', 'DEBT', 'REP',
] as const;

const ATTR_COLORS: Record<string, string> = {
  STYLE: '#ff2d7a', TECH: '#00d4aa', CHROME: '#f0a030',
  MONEY: '#4ade80', HUMAN: '#e04040',
  LIFE: '#4ade80', TRAUMA: '#e04040',
  ADDICTION: '#a855f7', DEBT: '#f97316', REP: '#38bdf8',
};

const ATTR_MAX: Record<string, number> = {
  STYLE: 100, TECH: 100, CHROME: 100, MONEY: 1000, HUMAN: 100,
  LIFE: 100, TRAUMA: 100, ADDICTION: 100, DEBT: 100, REP: 100,
};

// 四周分布：顶3 + 左2 + 右2 + 底3
const TOP_ATTRS: AttributeType[] = ['STYLE', 'TECH', 'CHROME'];
const LEFT_ATTRS: AttributeType[] = ['LIFE', 'TRAUMA'];
const RIGHT_ATTRS: AttributeType[] = ['HUMAN', 'REP'];
const BOTTOM_ATTRS: AttributeType[] = ['MONEY', 'ADDICTION', 'DEBT'];

/* ===== 四周属性条 ===== */

interface StatEdgeItemProps {
  attrKey: string;
  value: number;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const StatEdgeItem: React.FC<StatEdgeItemProps> = ({ attrKey, value, position }) => {
  const max = ATTR_MAX[attrKey] ?? 100;
  const pct = Math.min(100, (value / max) * 100);
  const color = ATTR_COLORS[attrKey] ?? '#666';
  const displayName = STAT_NAMES[attrKey as keyof typeof STAT_NAMES] ?? attrKey;

  // 垂直方向（左右）时条横向；水平方向（顶底）时条也横向
  return (
    <div className="stat-edge-item">
      <span style={{ color: `${color}88`, fontSize: '10px' }}>{displayName}</span>
      <div className="stat-edge-bar">
        <div className="stat-edge-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span style={{ color, fontWeight: 700, fontSize: '11px', minWidth: '24px', textAlign: 'right' }}>
        {Math.round(value)}
      </span>
    </div>
  );
};

const StatEdges: React.FC = () => {
  const attributes = usePlayerStore((s) => s.attributes);

  return (
    <>
      <div className="stat-edge-top">
        {TOP_ATTRS.map((k) => (
          <StatEdgeItem key={k} attrKey={k} value={attributes[k] ?? 0} position="top" />
        ))}
      </div>
      <div className="stat-edge-left">
        {LEFT_ATTRS.map((k) => (
          <StatEdgeItem key={k} attrKey={k} value={attributes[k] ?? 0} position="left" />
        ))}
      </div>
      <div className="stat-edge-right">
        {RIGHT_ATTRS.map((k) => (
          <StatEdgeItem key={k} attrKey={k} value={attributes[k] ?? 0} position="right" />
        ))}
      </div>
      <div className="stat-edge-bottom">
        {BOTTOM_ATTRS.map((k) => (
          <StatEdgeItem key={k} attrKey={k} value={attributes[k] ?? 0} position="bottom" />
        ))}
      </div>
    </>
  );
};

/* ===== 中央事件卡片 ===== */

/** 当前展示的卡片数据 */
interface CardData {
  id: string;
  title: string;
  description: string;
  effects: Record<string, number> | null | undefined;
  turn: number;
  age: number;
  hasBranches: boolean;
  branches: { id: string; text: string }[];
  isPending: boolean; // 是否等待玩家选择
}

const SWIPE_THRESHOLD = 60;
const MAX_SWIPE_OFFSET = 120;

/** 检测是否为触摸设备 */
const isTouchDevice = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;

const EventCardReigns: React.FC<{
  card: CardData | null;
  onContinue: () => void;
  onBranchSelect: (branchId: string) => void;
}> = ({ card, onContinue, onBranchSelect }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // 触摸状态用 ref（避免高频重渲染）
  const touchRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    isDragging: boolean;
    directionLocked: 'none' | 'horizontal' | 'vertical';
  }>({
    startX: 0, startY: 0, startTime: 0, isDragging: false, directionLocked: 'none',
  });

  // 刚完成滑动，短暂阻止 click 触发
  const justSwipedRef = useRef(false);

  // 滑动视觉状态
  const [swipe, setSwipe] = useState<{
    offsetX: number;
    direction: 'left' | 'right' | null;
    progress: number;
    active: boolean;
  }>({ offsetX: 0, direction: null, progress: 0, active: false });

  /* ---- 触摸事件 ---- */

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = {
      startX: t.clientX,
      startY: t.clientY,
      startTime: Date.now(),
      isDragging: true,
      directionLocked: 'none',
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const tr = touchRef.current;
    if (!tr.isDragging || !card) return;

    const t = e.touches[0];
    const dx = t.clientX - tr.startX;
    const dy = t.clientY - tr.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // 首次移动时锁定方向
    if (tr.directionLocked === 'none' && (absDx > 8 || absDy > 8)) {
      tr.directionLocked = absDx > absDy ? 'horizontal' : 'vertical';
    }

    if (tr.directionLocked === 'horizontal') {
      e.preventDefault(); // 阻止横向默认滚动
      const clampedX = Math.max(-MAX_SWIPE_OFFSET, Math.min(MAX_SWIPE_OFFSET, dx));
      const progress = Math.min(1, absDx / SWIPE_THRESHOLD);
      setSwipe({
        offsetX: clampedX,
        direction: dx > 0 ? 'right' : 'left',
        progress,
        active: true,
      });
    }
    // 垂直方向不拦截，由 card-body 自然滚动处理
  };

  const handleTouchEnd = () => {
    const tr = touchRef.current;
    if (!tr.isDragging || !card) {
      resetSwipe();
      return;
    }
    tr.isDragging = false;

    if (tr.directionLocked === 'horizontal' && swipe.progress >= 1) {
      justSwipedRef.current = true;
      setTimeout(() => { justSwipedRef.current = false; }, 60);

      // 有且仅有 2 个分支时，左右滑直接选择
      if (card.isPending && card.branches.length === 2) {
        if (swipe.direction === 'left') {
          onBranchSelect(card.branches[0].id);
        } else if (swipe.direction === 'right') {
          onBranchSelect(card.branches[1].id);
        }
      }
    }

    resetSwipe();
  };

  const resetSwipe = () => {
    touchRef.current.directionLocked = 'none';
    setSwipe({ offsetX: 0, direction: null, progress: 0, active: false });
  };

  /* ---- 点击继续 ---- */

  const handleCardClick = () => {
    if (justSwipedRef.current) return;
    if (!card || card.isPending) return;
    onContinue();
  };

  /* ---- 动态样式 ---- */

  const dynamicStyle: React.CSSProperties = swipe.active
    ? {
        transform: `translateX(${swipe.offsetX}px) rotate(${swipe.offsetX * 0.04}deg)`,
        transition: 'none',
        opacity: 1 - swipe.progress * 0.25,
      }
    : {
        transform: 'translateX(0) rotate(0)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
      };

  /* ---- 提示文字 ---- */

  const getHint = () => {
    if (!card) return '';
    if (card.isPending) {
      if (card.branches.length === 2) {
        return isTouchDevice
          ? '← 左滑选① · 右滑选② →'
          : '按 1-2 选择分支';
      }
      return '点击按钮选择分支';
    }
    return isTouchDevice ? '点击继续' : '点击或按 Space 继续';
  };

  if (!card) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">◇</div>
        <div className="empty-state-text">等待事件...</div>
      </div>
    );
  }

  const canSwipeBranch = card.isPending && card.branches.length === 2;
  const leftLabel = canSwipeBranch ? card.branches[0].text : '';
  const rightLabel = canSwipeBranch ? card.branches[1].text : '';

  return (
    <div
      ref={cardRef}
      className={cn('event-card-reigns', 'card-enter')}
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={dynamicStyle}
    >
      {/* 左滑方向指示器 */}
      {canSwipeBranch && swipe.active && swipe.direction === 'left' && (
        <div className="swipe-indicator swipe-indicator-left" style={{ opacity: swipe.progress }}>
          <div className="swipe-indicator-icon">←</div>
          <div className="swipe-indicator-text">{leftLabel}</div>
        </div>
      )}

      {/* 右滑方向指示器 */}
      {canSwipeBranch && swipe.active && swipe.direction === 'right' && (
        <div className="swipe-indicator swipe-indicator-right" style={{ opacity: swipe.progress }}>
          <div className="swipe-indicator-icon">→</div>
          <div className="swipe-indicator-text">{rightLabel}</div>
        </div>
      )}

      <div className="card-header">
        <div className="card-title">{card.title}</div>
        <div className="card-meta">T{card.turn} · {Math.round(card.age * 10) / 10}岁</div>
      </div>

      <div className="card-body" ref={bodyRef}>
        <p className="card-description">{card.description}</p>

        {/* 效果标签 */}
        {card.effects && Object.keys(card.effects).length > 0 && (
          <div className="card-effects">
            {Object.entries(card.effects).map(([k, v]) => {
              const val = v ?? 0;
              return (
                <span
                  key={k}
                  className={cn(
                    'card-effect-tag',
                    val > 0 ? 'card-effect-positive' : 'card-effect-negative'
                  )}
                >
                  {STAT_NAMES[k as keyof typeof STAT_NAMES] ?? k} {val > 0 ? '+' : ''}{val}
                </span>
              );
            })}
          </div>
        )}

        {/* 分支选项 */}
        {card.isPending && card.branches.length > 0 && (
          <div className="card-branches">
            {card.branches.map((b, idx) => (
              <button
                key={b.id}
                className="card-branch-btn"
                style={{ pointerEvents: swipe.active ? 'none' : 'auto' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (justSwipedRef.current) return;
                  onBranchSelect(b.id);
                }}
              >
                <span className="branch-key">{idx + 1}</span>
                {b.text}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card-hint">{getHint()}</div>
    </div>
  );
};

/* ===== 危险告警 ===== */

const CriticalAlertBar: React.FC = () => {
  const attributes = usePlayerStore((s) => s.attributes);
  const alerts = useMemo(() => {
    return checkCriticalThresholds({ attributes } as any);
  }, [attributes]);

  if (alerts.length === 0) return null;

  const visible = alerts
    .sort((a, b) => (a.level === 'danger' ? -1 : 1) - (b.level === 'danger' ? -1 : 1))
    .slice(0, 3);

  return (
    <div className="alert-bar-reigns">
      <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: '#e04040', animation: 'pulse 1s infinite' }}>
        ⚠
      </span>
      {visible.map((a, i) => (
        <span
          key={`${a.type}-${i}`}
          style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            color: a.level === 'danger' ? '#e04040' : '#f0a030',
          }}
        >
          {a.message}
        </span>
      ))}
    </div>
  );
};

/* ===== 顶部信息栏 ===== */

const HudHeader: React.FC = () => {
  const currentAge = useGameStore((s) => s.currentAge);
  const currentYear = useGameStore((s) => s.currentYear);
  const turnCount = useGameStore((s) => s.turnCount);
  const autoMode = useGameStore((s) => s.autoMode);

  return (
    <div className="flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-sm px-4 py-1.5">
      <div className="flex items-center gap-4 font-mono text-xs">
        <span style={{ color: '#00d4aa' }}>AGE {Math.round(currentAge * 10) / 10}</span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
        <span style={{ color: '#ff2d7a' }}>2077</span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>T{turnCount}</span>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.15)' }}>
        NIGHT CITY
      </div>
      {autoMode && (
        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#00d4aa' }}>AUTO</span>
      )}
    </div>
  );
};

/* ===== 底部控制栏 ===== */

interface FooterProps {
  processTurn: () => void;
}

const Footer: React.FC<FooterProps> = ({ processTurn }) => {
  const autoMode = useGameStore((s) => s.autoMode);
  const uiMode = useGameStore((s) => s.uiMode);
  const toggleAuto = useGameStore((s) => s.toggleAuto);
  const setUiMode = useGameStore((s) => s.setUiMode);

  return (
    <div className="flex items-center justify-between border-t border-white/5 bg-black/60 backdrop-blur-sm px-4 py-1.5">
      <button onClick={processTurn} className="font-mono text-xs text-white/40 hover:text-white/80 transition-colors">
        [ 继续 ]
      </button>
      <div className="flex items-center gap-4">
        <button onClick={() => toggleAuto()} className="font-mono text-xs text-white/30 hover:text-white/60 transition-colors">
          {autoMode ? '[AUTO:ON]' : '[AUTO:OFF]'}
        </button>
        <button
          onClick={() => setUiMode(uiMode === 'reigns' ? 'classic' : 'reigns')}
          className="font-mono text-xs text-white/20 hover:text-white/50 transition-colors"
        >
          [{uiMode === 'reigns' ? 'REIGNS' : 'CLASSIC'}]
        </button>
      </div>
    </div>
  );
};

/* ===== GameScreen 主组件 ===== */

const GameScreen: React.FC = () => {
  const { processTurn, handleEventChoice } = useGameEngine();
  const eventLog = useUIStore((s) => s.eventLog);
  const pendingChoice = useUIStore((s) => s.pendingChoice);
  const [cardAnimKey, setCardAnimKey] = useState(0);

  // 当前展示的卡片：优先 pendingChoice，否则取最新日志条目
  const currentCard: CardData | null = useMemo(() => {
    if (pendingChoice) {
      return {
        id: `pending-${pendingChoice.eventId}`,
        title: pendingChoice.title,
        description: pendingChoice.description,
        effects: null,
        turn: useGameStore.getState().turnCount,
        age: useGameStore.getState().currentAge,
        hasBranches: true,
        branches: pendingChoice.branches,
        isPending: true,
      };
    }
    if (eventLog.length > 0) {
      const last = eventLog[eventLog.length - 1];
      return {
        id: last.id,
        title: last.title,
        description: last.description,
        effects: last.effects,
        turn: last.turn,
        age: last.age,
        hasBranches: false,
        branches: [],
        isPending: false,
      };
    }
    return null;
  }, [eventLog, pendingChoice]);

  // 当 eventLog 变化时刷新卡片动画
  useEffect(() => {
    setCardAnimKey((k) => k + 1);
  }, [eventLog.length, pendingChoice]);

  // 继续按钮
  const handleContinue = () => {
    if (pendingChoice) return; // 有分支待选时不能继续
    processTurn();
  };

  // 分支选择
  const handleBranchSelect = (branchId: string) => {
    if (!pendingChoice) return;
    handleEventChoice(pendingChoice.eventId, branchId);
  };

  // 自动播放
  useAutoPlay(processTurn);

  // 键盘快捷键
  useKeyboard({
    onSpace: () => {
      if (useUIStore.getState().pendingChoice) return;
      processTurn();
    },
    onAuto: () => useGameStore.getState().toggleAuto(),
    onNumber: (n) => {
      const pc = useUIStore.getState().pendingChoice;
      if (pc) {
        const idx = n - 1;
        if (idx >= 0 && idx < pc.branches.length) {
          handleEventChoice(pc.eventId, pc.branches[idx].id);
        }
      }
    },
  });

  // 初始处理一回合
  useEffect(() => {
    processTurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="game-layout">
      <div className="game-header">
        <HudHeader />
      </div>

      <div className="game-center">
        {/* 四周属性条 */}
        <StatEdges />

        {/* 危险告警 */}
        <CriticalAlertBar />

        {/* 中央事件卡片 */}
        <div key={cardAnimKey} style={{ zIndex: 5, padding: '0 4px' }}>
          <EventCardReigns
            card={currentCard}
            onContinue={handleContinue}
            onBranchSelect={handleBranchSelect}
          />
        </div>
      </div>

      <div className="game-footer" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <Footer processTurn={processTurn} />
      </div>
    </div>
  );
};

export default GameScreen;
