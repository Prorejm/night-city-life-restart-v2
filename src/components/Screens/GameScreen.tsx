import { useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import useGameStore from '@/stores/gameStore';
import usePlayerStore from '@/stores/playerStore';
import useUIStore from '@/stores/uiStore';
import useGameEngine from '@/hooks/useGameEngine';
import useAutoPlay from '@/hooks/useAutoPlay';
import useKeyboard from '@/hooks/useKeyboard';
import { STAT_NAMES } from '@/engine/GameConfig';
import type { CoreAttribute, EventLogEntry } from '@/types';
import './GameScreen.css';

const CORE_ATTRS: CoreAttribute[] = ['STYLE', 'TECH', 'CHROME', 'MONEY', 'HUMAN'];

const ATTR_BAR_COLORS: Record<string, string> = {
  STYLE: 'bg-neon-magenta',
  TECH: 'bg-neon-cyan',
  CHROME: 'bg-neon-yellow',
  MONEY: 'bg-neon-green',
  HUMAN: 'bg-neon-red',
};

/** HudHeader - 顶部信息栏 */
const HudHeader: React.FC = () => {
  const currentAge = useGameStore((s) => s.currentAge);
  const currentYear = useGameStore((s) => s.currentYear);
  const turnCount = useGameStore((s) => s.turnCount);

  return (
    <div className="flex items-center justify-between border-b border-neon-cyan/10 bg-black/40 px-4 py-1.5">
      <div className="flex items-center gap-4 font-mono text-xs">
        <span className="text-neon-cyan">AGE: {Math.round(currentAge * 10) / 10}</span>
        <span className="text-muted-foreground">|</span>
        <span className="text-neon-magenta">YR: {currentYear}</span>
        <span className="text-muted-foreground">|</span>
        <span className="text-muted-foreground">TURN: {turnCount}</span>
      </div>
      <div className="font-display text-[10px] tracking-widest text-muted-foreground/40">
        NIGHT CITY LIFE RESTART
      </div>
    </div>
  );
};

/** HudPanel - 左侧状态面板 */
const HudPanel: React.FC = () => {
  const attributes = usePlayerStore((s) => s.attributes);
  const housingLevel = usePlayerStore((s) => s.housingLevel);
  const insuranceLevel = usePlayerStore((s) => s.insuranceLevel);

  const maxValues: Record<string, number> = {
    STYLE: 100,
    TECH: 100,
    CHROME: 100,
    MONEY: 9999,
    HUMAN: 100,
    LIFE: 100,
    TRAUMA: 100,
  };

  return (
    <div className="flex h-full flex-col gap-2 border-r border-neon-cyan/10 bg-black/30 p-3">
      {/* 核心属性 */}
      <div className="mb-1">
        <h4 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          CORE STATS
        </h4>
        <div className="space-y-2">
          {CORE_ATTRS.map((key) => {
            const val = attributes[key] ?? 0;
            const max = maxValues[key] ?? 100;
            const pct = Math.min(100, (val / max) * 100);
            return (
              <div key={key}>
                <div className="mb-0.5 flex items-center justify-between font-mono text-[10px]">
                  <span className="text-muted-foreground">{STAT_NAMES[key]}</span>
                  <span className="text-white/80">{Math.round(val)}</span>
                </div>
                <div className="hud-stat-bar">
                  <div
                    className={cn('hud-stat-fill', ATTR_BAR_COLORS[key])}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 衍生属性 */}
      <div>
        <h4 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          DERIVED
        </h4>
        <div className="space-y-1 font-mono text-[10px]">
          {(['LIFE', 'TRAUMA', 'ADDICTION', 'DEBT', 'REP'] as const).map((key) => {
            const val = attributes[key] ?? 0;
            const max = maxValues[key] ?? 100;
            const pct = Math.min(100, (val / max) * 100);
            const color =
              key === 'LIFE'
                ? val > 50 ? 'text-neon-green' : val > 20 ? 'text-neon-yellow' : 'text-neon-red'
                : key === 'TRAUMA'
                  ? val > 50 ? 'text-neon-red' : 'text-neon-yellow'
                  : 'text-muted-foreground';
            return (
              <div key={key}>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{STAT_NAMES[key]}</span>
                  <span className={color}>{Math.round(val)}</span>
                </div>
                <div className="hud-stat-bar">
                  <div
                    className="hud-stat-fill bg-white/20"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 状态信息 */}
      <div className="mt-auto border-t border-white/5 pt-2">
        <div className="space-y-1 font-mono text-[10px] text-muted-foreground">
          <div className="flex justify-between">
            <span>居住等级</span>
            <span className="text-neon-cyan">{housingLevel}</span>
          </div>
          <div className="flex justify-between">
            <span>保险</span>
            <span className="text-neon-magenta">{insuranceLevel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/** EventCard - 事件卡片 */
interface EventCardProps {
  entry: EventLogEntry;
}

const EventCard: React.FC<EventCardProps> = ({ entry }) => {
  return (
    <div className="event-card-enter border-l-2 border-neon-cyan/30 bg-white/[0.02] px-3 py-2">
      <div className="mb-0.5 flex items-center justify-between">
        <span className="font-display text-xs font-bold text-neon-cyan">
          {entry.title}
        </span>
        <span className="font-mono text-[9px] text-muted-foreground/60">
          T{entry.turn} Age {Math.round(entry.age * 10) / 10}
        </span>
      </div>
      <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/80">
        {entry.description}
      </p>
      {entry.effects && Object.keys(entry.effects).length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {Object.entries(entry.effects).map(([k, v]) => (
            <span
              key={k}
              className={cn(
                'font-mono text-[9px]',
                (v ?? 0) > 0 ? 'text-green-400/70' : 'text-red-400/70'
              )}
            >
              {k} {(v ?? 0) > 0 ? '+' : ''}{v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/** EventLog - 中央事件日志 */
const EventLog: React.FC = () => {
  const eventLog = useUIStore((s) => s.eventLog);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [eventLog.length]);

  return (
    <div className="flex h-full flex-col bg-black/20">
      <div className="border-b border-white/5 px-3 py-1">
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/50">
          EVENT LOG
        </h3>
      </div>
      <div
        ref={scrollRef}
        className="event-log-scroll flex-1 overflow-y-auto"
      >
        {eventLog.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-xs text-muted-foreground/30">
              等待事件到来...
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {eventLog.map((entry) => (
              <EventCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/** RightPanel - 右侧面板容器 */
const RightPanel: React.FC = () => {
  const questPanelOpen = useUIStore((s) => s.questPanelOpen);
  const inventoryPanelOpen = useUIStore((s) => s.inventoryPanelOpen);

  return (
    <div className="flex h-full flex-col border-l border-neon-cyan/10 bg-black/30">
      <div className="border-b border-white/5 px-3 py-1">
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/50">
          PANELS
        </h3>
      </div>
      <div className="flex-1 p-3">
        {questPanelOpen && (
          <div className="panel-slide-in space-y-2">
            <h4 className="font-display text-xs font-bold text-neon-cyan">任务</h4>
            <p className="font-mono text-[10px] text-muted-foreground/60">暂无活跃任务</p>
          </div>
        )}
        {inventoryPanelOpen && (
          <div className="panel-slide-in space-y-2">
            <h4 className="font-display text-xs font-bold text-neon-cyan">背包</h4>
            <p className="font-mono text-[10px] text-muted-foreground/60">背包为空</p>
          </div>
        )}
        {!questPanelOpen && !inventoryPanelOpen && (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-xs text-muted-foreground/20">
              按 1-5 切换面板
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/** Footer - 底部控制栏 */
const Footer: React.FC = () => {
  const autoMode = useGameStore((s) => s.autoMode);
  const autoSpeed = useGameStore((s) => s.autoSpeed);
  const toggleAuto = useGameStore((s) => s.toggleAuto);
  const setAutoSpeed = useGameStore((s) => s.setAutoSpeed);

  const { processTurn } = useGameEngine();

  const handleContinue = () => {
    processTurn();
  };

  return (
    <div className="flex items-center justify-between border-t border-neon-cyan/10 bg-black/40 px-4 py-2">
      {/* 继续按钮 */}
      <button
        onClick={handleContinue}
        className="cyber-button !px-8 !py-1.5 !text-xs"
      >
        [ 继续 ]
      </button>

      {/* 自动模式控制 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => toggleAuto()}
          className={cn(
            'font-mono text-xs transition-colors',
            autoMode
              ? 'text-neon-cyan'
              : 'text-muted-foreground hover:text-white'
          )}
        >
          [{autoMode ? 'AUTO:ON' : 'AUTO:OFF'}]
        </button>

        {autoMode && (
          <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <span>速度</span>
            {[1, 2, 3, 5].map((s) => (
              <button
                key={s}
                onClick={() => setAutoSpeed(s)}
                className={cn(
                  'px-1.5 py-0.5 transition-colors',
                  autoSpeed === s
                    ? 'text-neon-cyan'
                    : 'text-muted-foreground/50 hover:text-white'
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 快捷键提示 */}
      <div className="flex gap-3 font-mono text-[9px] text-muted-foreground/30">
        <span>Space:继续</span>
        <span>A:自动</span>
        <span>1-3:选择</span>
      </div>
    </div>
  );
};

/** GameScreen 主组件 */
const GameScreen: React.FC = () => {
  const { processTurn } = useGameEngine();

  // 自动播放
  useAutoPlay(processTurn);

  // 绑定键盘快捷键
  useKeyboard({
    onSpace: () => processTurn(),
    onAuto: () => useGameStore.getState().toggleAuto(),
    onNumber: (n) => {
      // 数字按键映射到面板切换
      if (n >= 1 && n <= 5) {
        const panels = ['quest', 'inventory', 'cyberware', 'drug', 'housing'];
        useUIStore.getState().togglePanel(panels[n - 1]);
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
      {/* 头部 */}
      <div className="game-header">
        <HudHeader />
      </div>

      {/* 左侧面板 */}
      <div className="game-left">
        <HudPanel />
      </div>

      {/* 中央事件日志 */}
      <div className="game-center">
        <EventLog />
      </div>

      {/* 右侧面板 */}
      <div className="game-right">
        <RightPanel />
      </div>

      {/* 底部控制栏 */}
      <div className="game-footer">
        <Footer />
      </div>
    </div>
  );
};

export default GameScreen;
