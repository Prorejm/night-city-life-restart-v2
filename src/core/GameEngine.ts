// ========== 游戏主循环 GameEngine ==========
import type {
  GamePhase,
  PlayerState,
  GameState,
  GameEvent,
  DeathType,
  DeathRecord,
  EventLogEntry,
  RebirthOptions,
  AttributeEffects,
  AttributeType,
  Talent,
} from '../types';
import { GameStateMachine } from '../engine/StateManager';
import { INITIAL_STATS, TURN_PER_YEAR } from '../engine/GameConfig';
import { rand, shuffle } from '../engine/Random';

import { applyAttributeEffects, modifyAttribute, getDerivedAttributes, checkCriticalThresholds } from './PropertySystem';
import { generateTalentPool, selectTalent, getActiveEffects } from './TalentSystem';
import {
  getEligibleEvents,
  getWeightedEvent,
  resolveBranch,
  checkDeathChain,
  getEventById,
  resetCooldowns,
} from './EventSystem';
import { checkDeathConditions, processDeath, getDeathDescription, getDeathTitle } from './DeathSystem';
import { processRent, getHousingEffects, getEvictionConsequences, resetEvictionTracker } from './HousingSystem';
import { takeDrug, checkWithdrawal, applyWithdrawalEffects, clearDrugState } from './DrugSystem';
import {
  processInjury,
  checkTraumaBreakdown,
  processTraumaBreakdown,
  reduceTrauma,
} from './HealthSystem';
import { calculateRebirthPoints, getRebirthOptions, applyInheritance, getInheritedTalents } from './RebirthSystem';

/** Store 接口定义 */
interface GameStore {
  getState(): GameState;
  setState(partial: Partial<GameState>): void;
}
interface PlayerStore {
  getState(): PlayerState;
  setState(partial: Partial<PlayerState>): void;
}
interface UIStore {
  showEvent(event: GameEvent, branches: string[]): void;
  showDeathScreen(record: DeathRecord): void;
  showRebirthOptions(options: RebirthOptions): void;
  updateUI(): void;
  setPendingChoice(choice: any): void;
}

interface GameStores {
  gameStore: GameStore;
  playerStore: PlayerStore;
  uiStore: UIStore;
}

/** 事件 ID 生成器 */
let _logIdCounter = 0;
function nextLogId(): string {
  return `evt_${Date.now()}_${++_logIdCounter}`;
}

export class GameEngine {
  private stores: GameStores;
  private stateMachine: GameStateMachine;
  private eventHistory: number[] = [];
  private totalEarned: number = 0;
  private achievements: string[] = [];
  /** 等待玩家选择分支的事件 */
  private pendingEvent: GameEvent | null = null;
  /** 上一次崩溃的回合数（冷却机制：每 3 回合最多崩溃 1 次） */
  private lastBreakdownTurn: number = -999;

  constructor(stores: GameStores) {
    this.stores = stores;
    this.stateMachine = new GameStateMachine('MENU');
  }

  /**
   * 初始化：加载所有数据并进入菜单
   */
  initialize(): void {
    console.log('[GameEngine] 初始化中...');
    this.stateMachine = new GameStateMachine('LOADING');

    console.log('[GameEngine] 数据加载完成。');

    this.stateMachine.transition('MENU');
    this.stores.gameStore.setState({ phase: 'MENU' });
    this.stores.uiStore.updateUI();
  }

  /**
   * 开始新游戏
   * @param talentCount 初始可选天赋数量（默认 3）
   */
  startNewGame(talentCount: number = 3): void {
    // 重置所有模块级状态（防止跨局污染）
    resetCooldowns();
    resetEvictionTracker();
    this.pendingEvent = null;
    this.lastBreakdownTurn = -999;

    // 重置游戏状态
    const gameState = this.stores.gameStore.getState();
    this.stores.gameStore.setState({
      phase: 'TALENT_SELECT',
      turnCount: 1,
      currentAge: 18,
      currentYear: 2077,
      autoMode: false,
      autoSpeed: 1,
      runCount: (gameState.runCount ?? 0) + 1,
      totalDeaths: gameState.totalDeaths ?? 0,
      rebirthPoints: 0,
      inheritedTalents: [],
      deathHistory: gameState.deathHistory ?? [],
    });

    // 重置玩家状态
    const basePlayer: PlayerState = {
      attributes: { ...INITIAL_STATS },
      exp: {},
      level: 1,
      talents: [],
      equippedCyberware: [],
      inventory: [],
      activeBuffs: [],
      housing: 'F',
      insurance: 'none',
      drugAddiction: {},
      currentDrugs: [],
      deathCount: this.stores.gameStore.getState().runCount - 1,
      totalPlayTime: 0,
    };

    this.stores.playerStore.setState(basePlayer);
    this.eventHistory = [];
    this.totalEarned = 0;
    this.achievements = [];

    // 生成天赋池并显示选择界面
    const talentPool = generateTalentPool(talentCount);
    this.stores.uiStore.showEvent(
      { id: 0, title: '选择初始天赋', description: '选择你的初始天赋', type: 'special', weight: 0, repeatable: false, cooldown: 0 },
      talentPool.map((t) => `选择: ${t.name} - ${t.description}`)
    );

    this.stateMachine.transition('TALENT_SELECT');
    this.stores.gameStore.setState({ phase: 'TALENT_SELECT' });
    this.stores.uiStore.updateUI();
  }

  /**
   * 检查是否等待玩家选择事件分支
   */
  hasPendingChoice(): boolean {
    return this.pendingEvent !== null;
  }

  /**
   * 获取待处理事件
   */
  getPendingEvent(): GameEvent | null {
    return this.pendingEvent;
  }

  /**
   * 执行一回合
   * @returns 本回合产生的事件日志，如果没有事件返回 null
   */
  processTurn(): EventLogEntry | null {
    const gameState = this.stores.gameStore.getState();
    const playerState = this.stores.playerStore.getState();

    if (gameState.phase !== 'PLAYING') return null;

    // 1. 推进时间
    const newTurn = gameState.turnCount + 1;
    const newAge = gameState.currentAge + 1 / TURN_PER_YEAR;
    const roundedAge = Math.round(newAge * 100) / 100;

    this.stores.gameStore.setState({
      turnCount: newTurn,
      currentAge: roundedAge,
    });
    playerState.totalPlayTime = newTurn;

    // 2. 计算衍生属性（增量叠加，不覆盖）
    const core = {
      STYLE: playerState.attributes.STYLE ?? 0,
      TECH: playerState.attributes.TECH ?? 0,
      CHROME: playerState.attributes.CHROME ?? 0,
      MONEY: playerState.attributes.MONEY ?? 0,
      HUMAN: playerState.attributes.HUMAN ?? 0,
    };
    const derived = getDerivedAttributes(core);
    if ((playerState.attributes.LIFE ?? 0) < derived.LIFE) {
      playerState.attributes.LIFE = derived.LIFE;
    }
    if ((playerState.attributes.REP ?? 0) < derived.REP) {
      playerState.attributes.REP = derived.REP;
    }

    // 3. 处理房租
    const rentResult = processRent(playerState, newTurn);
    if (rentResult.evicted) {
      getEvictionConsequences(playerState);
    }

    // 4. 检查戒断反应
    if (checkWithdrawal(playerState)) {
      applyWithdrawalEffects(playerState);
    }

    // 5. 检查创伤崩溃（每 3 回合最多崩溃 1 次，崩溃后降低 5 点创伤）
    if (checkTraumaBreakdown(playerState) && (newTurn - this.lastBreakdownTurn) >= 3) {
      processTraumaBreakdown(playerState);
      reduceTrauma(5, playerState);
      this.lastBreakdownTurn = newTurn;
    }

    // 6. 应用住房效果（每回合都生效，不再只作用空回合）
    const housingEffects = getHousingEffects(playerState.housing);
    applyAttributeEffects(housingEffects, playerState);

    // 7. 保存当前状态（克隆attributes触发Zustand重渲染）
    this.stores.playerStore.setState({ ...playerState, attributes: { ...playerState.attributes } });

    // 8. 检查死亡条件
    const deathType = checkDeathConditions(playerState);
    if (deathType !== null) {
      this.handleDeath(deathType);
      return null;
    }

    // 9. 触发随机事件
    const eligibleEvents = getEligibleEvents(
      playerState,
      newTurn,
      Math.floor(roundedAge),
      this.eventHistory
    );

    if (eligibleEvents.length > 0) {
      const selectedEvent = getWeightedEvent(eligibleEvents);
      if (selectedEvent) {
        // 检查是否是死亡链起点（直接执行，不进入 UI 选择）
        if (checkDeathChain(selectedEvent)) {
          const branchEffects = resolveBranch(selectedEvent, 'branch_1', playerState, newTurn);
          this.eventHistory.push(selectedEvent.id);

          const deathChainLog: EventLogEntry = {
            id: nextLogId(),
            eventId: selectedEvent.id,
            age: roundedAge,
            turn: newTurn,
            title: selectedEvent.title,
            description: selectedEvent.description,
            effects: branchEffects,
            timestamp: Date.now(),
          };

          // 再次检查死亡条件
          const deathAfterEvent = checkDeathConditions(playerState);
          if (deathAfterEvent !== null) {
            this.stores.playerStore.setState({ ...playerState, attributes: { ...playerState.attributes } });
            this.handleDeath(deathAfterEvent);
            return deathChainLog;
          }

          this.stores.playerStore.setState({ ...playerState, attributes: { ...playerState.attributes } });
          return deathChainLog;
        }

        // 记录事件历史
        this.eventHistory.push(selectedEvent.id);

        // 如果事件有分支，等待玩家选择
        if (selectedEvent.branches && selectedEvent.branches.length > 0) {
          this.pendingEvent = selectedEvent;

          // 通知 UI 有分支待选
          this.stores.uiStore.setPendingChoice({
            eventId: selectedEvent.id,
            title: selectedEvent.title,
            description: selectedEvent.description,
            branches: selectedEvent.branches.map((b) => ({
              id: b.id,
              text: b.text ?? b.id,
            })),
          });

          const logEntry: EventLogEntry = {
            id: nextLogId(),
            eventId: selectedEvent.id,
            age: roundedAge,
            turn: newTurn,
            title: selectedEvent.title,
            description: selectedEvent.description,
            effects: undefined,
            timestamp: Date.now(),
          };
          return logEntry;
        }

        // 无分支：直接应用事件效果
        applyAttributeEffects(selectedEvent.effects ?? {}, playerState);

        // 更新金钱追踪（用于遗产计算）
        const moneyDelta = selectedEvent.effects?.MONEY ?? 0;
        if (moneyDelta > 0) {
          this.totalEarned += moneyDelta;
        }

        const logEntry: EventLogEntry = {
          id: nextLogId(),
          eventId: selectedEvent.id,
          age: roundedAge,
          turn: newTurn,
          title: selectedEvent.title,
          description: selectedEvent.description,
          effects: selectedEvent.effects,
          timestamp: Date.now(),
        };

        // 再次检查死亡条件
        const deathAfterEvent = checkDeathConditions(playerState);
        if (deathAfterEvent !== null) {
          this.stores.playerStore.setState({ ...playerState, attributes: { ...playerState.attributes } });
          this.handleDeath(deathAfterEvent);
          return logEntry;
        }

        this.stores.playerStore.setState({ ...playerState, attributes: { ...playerState.attributes } });
        return logEntry;
      }
    }

    // 10. 无事件空回合（住房效果已在步骤6应用）
    this.stores.playerStore.setState({ ...playerState, attributes: { ...playerState.attributes } });
    return null;
  }

  /**
   * 处理事件分支选择
   * @param eventId 事件 ID
   * @param branchId 分支 ID
   * @param playerState 当前玩家状态（可选，默认从 store 获取）
   * @returns 包含实际效果的事件日志，或 null
   */
  handleEventChoice(eventId: number, branchId: string, playerState?: PlayerState): EventLogEntry | null {
    const state = playerState ?? this.stores.playerStore.getState();
    const gameState = this.stores.gameStore.getState();

    const event = getEventById(eventId);
    if (!event) {
      console.warn(`[GameEngine] 找不到事件 ID: ${eventId}`);
      return null;
    }

    // 清除待处理状态
    this.pendingEvent = null;
    this.stores.uiStore.setPendingChoice(null);

    // 查找分支文本
    const branch = event.branches?.find((b) => b.id === branchId);

    // 解析分支并应用效果（resolveBranch 会应用事件+分支效果）
    const effects = resolveBranch(event, branchId, state, gameState.turnCount);

    // 更新金钱追踪（用于遗产计算）
    const moneyDelta = effects.MONEY ?? 0;
    if (moneyDelta > 0) {
      this.totalEarned += moneyDelta;
    }

    // 创建分支选择日志
    const logEntry: EventLogEntry = {
      id: nextLogId(),
      eventId: eventId,
      age: Math.round(gameState.currentAge * 100) / 100,
      turn: gameState.turnCount,
      title: event.title,
      description: event.description,
      effects: effects,
      choice: branch?.text ?? branchId,
      timestamp: Date.now(),
    };

    // 检查事件后死亡
    const deathType = checkDeathConditions(state);
    if (deathType !== null) {
      this.stores.playerStore.setState({ ...state, attributes: { ...state.attributes } });
      this.handleDeath(deathType);
      return logEntry;
    }

    this.stores.playerStore.setState({ ...state, attributes: { ...state.attributes } });
    this.stores.uiStore.updateUI();

    return logEntry;
  }

  /**
   * 处理死亡
   * @param deathType 死亡类型
   */
  private handleDeath(deathType: DeathType): void {
    const playerState = this.stores.playerStore.getState();
    const gameState = this.stores.gameStore.getState();

    const record = processDeath(playerState, deathType);
    record.age = Math.floor(gameState.currentAge);
    record.turnCount = gameState.turnCount;
    record.achievements = [...this.achievements];

    // 更新游戏状态
    const deathHistory = [...(gameState.deathHistory ?? []), record];
    this.stores.gameStore.setState({
      phase: 'DEATH',
      totalDeaths: (gameState.totalDeaths ?? 0) + 1,
      deathHistory,
    });

    this.stateMachine.transition('DEATH');

    // 计算遗产点
    const rebirthPoints = calculateRebirthPoints(record, {
      age: record.age,
      achievements: this.achievements,
      totalEarned: this.totalEarned,
    });

    this.stores.gameStore.setState({ rebirthPoints });

    // 显示死亡界面
    this.stores.uiStore.showDeathScreen(record);
    this.stores.uiStore.updateUI();
  }

  /**
   * 设置自动模式
   */
  setAutoMode(enabled: boolean, speed: number = 1): void {
    this.stores.gameStore.setState({
      autoMode: enabled,
      autoSpeed: Math.max(1, Math.min(5, speed)),
    });
  }

  /**
   * 准备重生
   * @returns 可用的重开选项
   */
  prepareRebirth(): RebirthOptions {
    const gameState = this.stores.gameStore.getState();
    const points = gameState.rebirthPoints ?? 0;
    return getRebirthOptions(points);
  }

  /**
   * 执行重生
   * @param options 重开选项
   * @param specificTalentIds 玩家手动选择继承的天赋 ID 列表（可选）
   */
  executeRebirth(options: RebirthOptions, specificTalentIds?: number[]): void {
    // 重置模块级状态
    resetCooldowns();
    resetEvictionTracker();
    this.pendingEvent = null;
    this.lastBreakdownTurn = -999;

    const playerState = this.stores.playerStore.getState();
    const gameState = this.stores.gameStore.getState();

    // 应用继承
    applyInheritance(options, playerState);

    // 继承天赋
    const previousTalents = playerState.talents;
    let inheritedTalents: Talent[] = [];

    if (specificTalentIds && specificTalentIds.length > 0) {
      // 玩家手动选择了特定天赋
      for (const id of specificTalentIds) {
        const talent = previousTalents.find((t) => t.id === id);
        if (talent && !inheritedTalents.find((t) => t.id === id)) {
          inheritedTalents.push({ ...talent });
        }
      }
    } else if (options.canInheritTalent) {
      // 自动选择最佳可继承天赋
      inheritedTalents = getInheritedTalents(previousTalents, options.inheritancePoints);
    }

    for (const talent of inheritedTalents) {
      if (!playerState.talents.find((t) => t.id === talent.id)) {
        playerState.talents.push({ ...talent });
      }
    }

    // 重置状态
    playerState.deathCount += 1;
    playerState.totalPlayTime = 0;
    playerState.activeBuffs = [];
    playerState.equippedCyberware = [];
    playerState.housing = 'F';
    playerState.insurance = 'none';
    playerState.level = 1;

    const inheritedIds = inheritedTalents.map((t) => t.id);

    this.stores.playerStore.setState({ ...playerState });
    this.stores.gameStore.setState({
      phase: 'PLAYING',
      turnCount: 1,
      currentAge: 18,
      inheritedTalents: inheritedIds,
      rebirthPoints: 0,
    });

    this.stateMachine.transition('PLAYING');
    this.eventHistory = [];
    this.totalEarned = 0;
    this.achievements = [];

    this.stores.uiStore.updateUI();
  }

  /**
   * 获取当前游戏状态
   */
  getState(): GameState {
    return this.stores.gameStore.getState();
  }

  /**
   * 获取当前玩家状态
   */
  getPlayerState(): PlayerState {
    return this.stores.playerStore.getState();
  }

  /**
   * 获取当前游戏阶段
   */
  getPhase(): GamePhase {
    return this.stateMachine.getCurrentPhase();
  }

  /**
   * 获取事件历史记录
   */
  getEventHistory(): number[] {
    return [...this.eventHistory];
  }

  /**
   * 强制状态转换（供外部使用）
   */
  transitionTo(newPhase: GamePhase): void {
    this.stateMachine.transition(newPhase);
    this.stores.gameStore.setState({ phase: newPhase });
    this.stores.uiStore.updateUI();
  }

  /**
   * 获取临界阈值检查结果
   */
  getCriticalAlerts(): {
    type: AttributeType;
    level: 'warning' | 'danger';
    currentValue: number;
    message: string;
  }[] {
    const playerState = this.stores.playerStore.getState();
    return checkCriticalThresholds(playerState);
  }
}

/** 工厂函数：创建 GameEngine 实例 */
export function createGameEngine(stores: GameStores): GameEngine {
  return new GameEngine(stores);
}
