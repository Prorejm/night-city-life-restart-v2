import { useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import useGameStore from '@/stores/gameStore';
import usePlayerStore from '@/stores/playerStore';
import useUIStore from '@/stores/uiStore';
import useGameEngine from '@/hooks/useGameEngine';
import useAutoPlay from '@/hooks/useAutoPlay';
import useKeyboard from '@/hooks/useKeyboard';
import DrugPanel from '@/components/Panels/DrugPanel';
import HousingPanel from '@/components/Panels/HousingPanel';
import drugsData from '../../../data/drugs.json';
import housingData from '../../../data/housing.json';
import { STAT_NAMES } from '@/engine/GameConfig';
import { checkCriticalThresholds } from '@/core/PropertySystem';
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

/** HudPanel - 左侧状态面板（加大字体版） */
const HudPanel: React.FC = () => {
  const attributes = usePlayerStore((s) => s.attributes);
  const housingLevel = usePlayerStore((s) => s.housingLevel);
  const insuranceLevel = usePlayerStore((s) => s.insuranceLevel);

  const maxValues: Record<string, number> = {
    STYLE: 100, TECH: 100, CHROME: 100, MONEY: 1000, HUMAN: 100,
    LIFE: 100, TRAUMA: 100,
  };

  return (
    <div className="flex h-full flex-col gap-2 border-r border-neon-cyan/10 bg-black/30 p-3">
      {/* 核心属性 */}
      <div className="mb-1">
        <h4 className="mb-2 font-mono text-sm uppercase tracking-widest text-muted-foreground/60">
          CORE STATS
        </h4>
        <div className="space-y-2">
          {CORE_ATTRS.map((key) => {
            const val = attributes[key] ?? 0;
            const max = maxValues[key] ?? 100;
            const pct = Math.min(100, (val / max) * 100);
            return (
              <div key={key}>
                <div className="mb-0.5 flex items-center justify-between font-mono text-xs">
                  <span className="text-muted-foreground">{STAT_NAMES[key]}</span>
                  <span className="text-white/90 font-bold text-sm">{Math.round(val)}</span>
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
        <h4 className="mb-2 font-mono text-sm uppercase tracking-widest text-muted-foreground/60">
          DERIVED
        </h4>
        <div className="space-y-1 font-mono text-xs">
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
                  <span className={cn('font-bold text-sm', color)}>{Math.round(val)}</span>
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
        <div className="space-y-1 font-mono text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>居住等级</span>
            <span className="text-neon-cyan font-bold">{housingLevel}</span>
          </div>
          <div className="flex justify-between">
            <span>保险</span>
            <span className="text-neon-magenta font-bold">{insuranceLevel}</span>
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
    <div className="event-card-enter border-l-2 border-neon-cyan/30 bg-white/[0.02] px-4 py-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-display text-base font-bold text-neon-cyan">
          {entry.title}
        </span>
        <span className="font-mono text-xs text-muted-foreground/60">
          T{entry.turn} Age {Math.round(entry.age * 10) / 10}
        </span>
      </div>
      <p className="font-sans text-sm leading-relaxed text-muted-foreground/90">
        {entry.description}
      </p>
      {entry.choice && (
        <p className="mt-1 font-mono text-[11px] text-neon-magenta/70 italic">
          → {entry.choice}
        </p>
      )}
      {entry.effects && Object.keys(entry.effects).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(entry.effects).map(([k, v]) => {
            const val = v ?? 0;
            const isPositive = val > 0;
            return (
              <span
                key={k}
                className={cn(
                  'font-mono text-xs px-1.5 py-0.5 rounded-sm border',
                  isPositive
                    ? 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20'
                    : 'text-neon-red bg-neon-red/10 border-neon-red/20'
                )}
              >
                {k} {isPositive ? '+' : ''}{val}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** CriticalAlertBar - 危险阈值告警条 */
const CriticalAlertBar: React.FC = () => {
  const attributes = usePlayerStore((s) => s.attributes);

  const alerts = useMemo(() => {
    return checkCriticalThresholds({ attributes } as any);
  }, [attributes]);

  if (alerts.length === 0) return null;

  // 优先显示 danger 级别，最多显示 3 条
  const visible = alerts
    .sort((a, b) => (a.level === 'danger' ? -1 : 1) - (b.level === 'danger' ? -1 : 1))
    .slice(0, 3);

  return (
    <div className="shrink-0 flex items-center gap-2 overflow-hidden bg-black/60 border-b border-neon-red/20 px-3 py-1">
      <span className="shrink-0 text-[10px] font-mono font-bold text-neon-red animate-pulse">
        ⚠ ALERT
      </span>
      <div className="flex gap-3 overflow-hidden">
        {visible.map((alert, i) => (
          <span
            key={`${alert.type}-${i}`}
            className={cn(
              'text-[10px] font-mono whitespace-nowrap',
              alert.level === 'danger' ? 'text-neon-red' : 'text-yellow-400'
            )}
          >
            {alert.message}
          </span>
        ))}
      </div>
    </div>
  );
};

/** EventLog - 终端式事件日志：column-reverse实现自然底部对齐 */
const EventLog: React.FC = () => {
  const eventLog = useUIStore((s) => s.eventLog);

  return (
    <div className="flex h-full flex-col bg-black/20" style={{ height: '100%', minHeight: 0 }}>
      <div className="border-b border-white/5 px-3 py-1 shrink-0">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground/50">
          EVENT LOG
        </h3>
      </div>
      <CriticalAlertBar />
      <div
        className="event-log-scroll overflow-y-auto"
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column-reverse',
        }}
      >
        <div className="p-2">
          {eventLog.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="font-mono text-sm text-muted-foreground/30">
                等待事件到来...
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {eventLog.map((entry) => (
                <EventCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** BranchPanel - 事件分支选择面板 */
const BranchPanel: React.FC = () => {
  const pendingChoice = useUIStore((s) => s.pendingChoice);
  const { handleEventChoice } = useGameEngine();

  if (!pendingChoice) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="mx-4 w-full max-w-lg rounded-sm border border-neon-cyan/30 bg-black/90 p-5 shadow-[0_0_30px_rgba(0,212,170,0.15)]">
        <h3 className="mb-2 font-display text-lg font-bold text-neon-cyan">
          {pendingChoice.title}
        </h3>
        <p className="mb-4 font-mono text-sm leading-relaxed text-muted-foreground/80">
          {pendingChoice.description}
        </p>
        <div className="space-y-2">
          {pendingChoice.branches.map((branch, idx) => (
            <button
              key={branch.id}
              onClick={() => handleEventChoice(pendingChoice.eventId, branch.id)}
              className="w-full rounded-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-left font-mono text-sm text-muted-foreground/90 transition-all hover:border-neon-cyan/30 hover:bg-neon-cyan/5 hover:text-white"
            >
              <span className="mr-2 text-neon-cyan/50">{idx + 1}.</span>
              {branch.text}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center font-mono text-[10px] text-muted-foreground/30">
          数字键 1-3 快速选择
        </p>
      </div>
    </div>
  );
};

/** RightPanel - 右侧面板容器 */
const RightPanel: React.FC = () => {
  const drugPanelOpen = useUIStore((s) => s.drugPanelOpen);
  const housingPanelOpen = useUIStore((s) => s.housingPanelOpen);
  const closeAllPanels = useUIStore((s) => s.closeAllPanels);

  const attributes = usePlayerStore((s) => s.attributes);
  const drugs = usePlayerStore((s) => s.currentDrugs);
  const drugAddiction = usePlayerStore((s) => s.drugAddiction);
  const housingLevel = usePlayerStore((s) => s.housingLevel);

  const drugDb = ((drugsData as any).allDrugs ?? []) as any[];
  const housingDb = ((housingData as any).levels ?? []) as any[];

  return (
    <div className="flex h-full flex-col border-l border-neon-cyan/10 bg-black/30 min-h-0">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-1 shrink-0">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground/50">
          PANELS
        </h3>
        {(drugPanelOpen || housingPanelOpen) && (
          <button onClick={closeAllPanels} className="text-[10px] font-mono text-muted-foreground/40 hover:text-neon-cyan">
            ✕
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2" style={{ minHeight: 0 }}>
        {drugPanelOpen && (
          <div className="panel-slide-in">
            <DrugPanel
              addictionLevel={attributes.ADDICTION ?? 0}
              currentDrugs={drugs}
              drugAddiction={drugAddiction}
              drugDatabase={drugDb}
            />
          </div>
        )}
        {housingPanelOpen && (
          <div className="panel-slide-in">
            <HousingPanel
              currentLevel={housingLevel as any}
              housingDatabase={housingDb}
              availableFunds={attributes.MONEY ?? 0}
            />
          </div>
        )}
        {!drugPanelOpen && !housingPanelOpen && (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-xs text-muted-foreground/20 text-center leading-relaxed">
              按 4-5 切换面板<br />
              4:药物 5:住房
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/** Footer - 底部控制栏 */
interface FooterProps {
  processTurn: () => void;
}

const Footer: React.FC<FooterProps> = ({ processTurn }) => {
  const autoMode = useGameStore((s) => s.autoMode);
  const autoSpeed = useGameStore((s) => s.autoSpeed);
  const toggleAuto = useGameStore((s) => s.toggleAuto);
  const setAutoSpeed = useGameStore((s) => s.setAutoSpeed);

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
        <span>4:药物 5:住房</span>
      </div>
    </div>
  );
};

/** GameScreen 主组件 */
const GameScreen: React.FC = () => {
  const { processTurn, handleEventChoice } = useGameEngine();
  const pendingChoice = useUIStore((s) => s.pendingChoice);

  // 自动播放
  useAutoPlay(processTurn);

  // 绑定键盘快捷键
  useKeyboard({
    onSpace: () => {
      // 有分支待选时，Space不处理
      if (useUIStore.getState().pendingChoice) return;
      processTurn();
    },
    onAuto: () => useGameStore.getState().toggleAuto(),
    onNumber: (n) => {
      // 如果有分支待选，数字键用于选择分支
      const pc = useUIStore.getState().pendingChoice;
      if (pc) {
        const idx = n - 1;
        if (idx >= 0 && idx < pc.branches.length) {
          handleEventChoice(pc.eventId, pc.branches[idx].id);
        }
        return;
      }
      // 没有分支待选时，数字键映射到面板切换
      if (n >= 4 && n <= 5) {
        const panels = ['drug', 'housing'];
        useUIStore.getState().togglePanel(panels[n - 4]);
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

      {/* 中央事件日志 + 分支选择叠加层 */}
      <div className="game-center relative">
        <EventLog />
        {pendingChoice && <BranchPanel />}
      </div>

      {/* 右侧面板 */}
      <div className="game-right">
        <RightPanel />
      </div>

      {/* 底部控制栏 */}
      <div className="game-footer">
        <Footer processTurn={processTurn} />
      </div>
    </div>
  );
};

export default GameScreen;
