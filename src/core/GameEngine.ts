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
} from './EventSystem';
import { checkDeathConditions, processDeath, getDeathDescription, getDeathTitle } from './DeathSystem';
import { processRent, getHousingEffects, getEvictionConsequences } from './HousingSystem';
import { takeDrug, checkWithdrawal, applyWithdrawalEffects } from './DrugSystem';
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

    // 通知各子系统加载数据（在首次使用时延迟加载）
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
    // 重置游戏状态
    const gameState = this.stores.gameStore.getState();
    this.stores.gameStore.setState({
      phase: 'TALENT_SELECT',
      turnCount: 1,
      currentAge: 14,
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

    // 2. 计算衍生属性
    const core = {
      STYLE: playerState.attributes.STYLE ?? 0,
      TECH: playerState.attributes.TECH ?? 0,
      CHROME: playerState.attributes.CHROME ?? 0,
      MONEY: playerState.attributes.MONEY ?? 0,
      HUMAN: playerState.attributes.HUMAN ?? 0,
    };
    const derived = getDerivedAttributes(core);
    // 合并到 attributes 中（保留已有的 TRAUMA/ADDICTION/DEBT）
    playerState.attributes.LIFE = derived.LIFE;
    playerState.attributes.REP = derived.REP;

    // 3. 处理房租
    const rentResult = processRent(playerState, newTurn);
    if (rentResult.evicted) {
      getEvictionConsequences(playerState);
    }

    // 4. 检查戒断反应
    if (checkWithdrawal(playerState)) {
      applyWithdrawalEffects(playerState);
    }

    // 5. 检查创伤崩溃
    if (checkTraumaBreakdown(playerState)) {
      processTraumaBreakdown(playerState);
      // 创伤自动恢复一点点
      reduceTrauma(1, playerState);
    }

    // 6. 检查死亡条件
    const deathType = checkDeathConditions(playerState);
    if (deathType !== null) {
      this.handleDeath(deathType);
      return null;
    }

    // 7. 触发随机事件
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
          resolveBranch(selectedEvent, 'branch_1', playerState, newTurn);
          this.eventHistory.push(selectedEvent.id);

          // 再次检查死亡条件
          const deathAfterEvent = checkDeathConditions(playerState);
          if (deathAfterEvent !== null) {
            this.handleDeath(deathAfterEvent);
            return null;
          }
        }

        // 记录事件历史
        this.eventHistory.push(selectedEvent.id);

        // 创建事件日志
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

        return logEntry;
      }
    }

    // 8. 应用住房效果（每回合）
    const housingEffects = getHousingEffects(playerState.housing);
    applyAttributeEffects(housingEffects, playerState);

    // 保存状态
    this.stores.playerStore.setState({ ...playerState });

    return null;
  }

  /**
   * 处理事件分支选择
   * @param eventId 事件 ID
   * @param branchId 分支 ID
   * @param playerState 当前玩家状态（可选，默认从 store 获取）
   * @returns 应用的效果
   */
  handleEventChoice(eventId: number, branchId: string, playerState?: PlayerState): AttributeEffects {
    const state = playerState ?? this.stores.playerStore.getState();
    const gameState = this.stores.gameStore.getState();

    const event = getEventById(eventId);
    if (!event) {
      console.warn(`[GameEngine] 找不到事件 ID: ${eventId}`);
      return {};
    }

    const effects = resolveBranch(event, branchId, state, gameState.turnCount);

    // 应用事件基础效果（resolveBranch 已处理）
    // 更新金钱追踪（用于遗产计算）
    const moneyDelta = effects.MONEY ?? 0;
    if (moneyDelta > 0) {
      this.totalEarned += moneyDelta;
    }

    // 检查事件后死亡
    const deathType = checkDeathConditions(state);
    if (deathType !== null) {
      this.handleDeath(deathType);
    }

    this.stores.playerStore.setState({ ...state });
    this.stores.uiStore.updateUI();

    return effects;
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
   * @param enabled 是否启用
   * @param speed 自动模式速度（1~5，默认 1）
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
   */
  executeRebirth(options: RebirthOptions): void {
    const playerState = this.stores.playerStore.getState();
    const gameState = this.stores.gameStore.getState();

    // 应用继承
    applyInheritance(options, playerState);

    // 继承天赋
    const previousTalents = playerState.talents;
    const inheritedTalents = getInheritedTalents(previousTalents, options.inheritancePoints);
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
      currentAge: 14,
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
   * @returns 合并的 GameState 对象
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
   * @param newPhase 目标阶段
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
