// ========== 事件系统 EventSystem ==========
import type {
  GameEvent,
  EventBranch,
  PlayerState,
  AttributeEffects,
  AttributeType,
  Condition,
  CompoundCondition,
} from '../types';
import { weightedRandom } from '../engine/Random';
import { evaluateConditions } from '../engine/ConditionEvaluator';
import { applyAttributeEffects } from './PropertySystem';

import eventsBirth from '../../data/events/events-birth.json';
import eventsTeen from '../../data/events/events-teen.json';
import eventsAdult from '../../data/events/events-adult.json';
import eventsStreet from '../../data/events/events-street.json';
import eventsDrug from '../../data/events/events-drug.json';
import eventsHousing from '../../data/events/events-housing.json';
import eventsMedical from '../../data/events/events-medical.json';
import eventsDeath from '../../data/events/events-death.json';
import eventsCorp from '../../data/events/events-corp.json';
import eventsCyber from '../../data/events/events-cyber.json';
import eventsSocial from '../../data/events/events-social.json';
import eventsDrugEx from '../../data/events/events-drug-expanded.json';
import eventsElder from '../../data/events/events-elder.json';
import eventsNature from '../../data/events/events-nature.json';
import eventsCulture from '../../data/events/events-culture.json';

/** 全局事件列表 */
let _allEvents: GameEvent[] = [];

/** 最近触发事件的时间戳（用于冷却检查） */
const _eventCooldownTracker: Map<number, number> = new Map();

/** 事件冷却检查所需的 GameState 信息 */
interface EventContext {
  turn: number;
  age: number;
  currentEventIds: number[];
}

/** 事件日志记录 */
export interface EventTriggerRecord {
  eventId: number;
  turn: number;
  age: number;
  chosenBranch?: string;
}

/**
 * 从 JSON 文件加载所有事件
 */
function ensureLoaded(): void {
  if (_allEvents.length > 0) return;

  const sources = [
    eventsBirth, eventsTeen, eventsAdult,
    eventsStreet, eventsDrug, eventsHousing,
    eventsMedical, eventsDeath,
    eventsCorp, eventsCyber, eventsSocial,
    eventsDrugEx, eventsElder, eventsNature,
    eventsCulture,
  ];

  const loadedIds = new Set<number>();

  for (const source of sources) {
    const data = source as any;
    const events = data.events ?? [];
    for (const event of events) {
      // 全局 ID 唯一性验证
      if (loadedIds.has(event.id)) {
        console.warn(`[EventSystem] 重复事件 ID: ${event.id} ("${event.title}")，跳过`);
        continue;
      }
      loadedIds.add(event.id);
      _allEvents.push(event);
    }
  }
}

/**
 * 获取全部事件（只读副本）
 */
export function getAllEvents(): GameEvent[] {
  ensureLoaded();
  return [..._allEvents];
}

/**
 * 根据 ID 查找事件
 */
export function getEventById(eventId: number): GameEvent | undefined {
  ensureLoaded();
  return _allEvents.find((e) => e.id === eventId);
}

/**
 * 获取符合条件的事件列表
 * @param playerState 玩家状态
 * @param turn 当前回合数
 * @param age 当前年龄
 * @param excludeIds 已触发过的 ID 列表（可选）
 * @returns 符合条件的事件数组
 */
export function getEligibleEvents(
  playerState: PlayerState,
  turn: number,
  age: number,
  excludeIds: number[] = []
): GameEvent[] {
  ensureLoaded();

  const context: EventContext = { turn, age, currentEventIds: excludeIds };

  return _allEvents.filter((event) => isEligible(event, playerState, context));
}

/**
 * 单事件符合条件的判定
 */
function isEligible(
  event: GameEvent,
  playerState: PlayerState,
  context: EventContext
): boolean {
  // 1. 年龄范围过滤
  if (event.ageRange) {
    const [minAge, maxAge] = event.ageRange;
    if (context.age < minAge || context.age > maxAge) return false;
  }

  // 2. 回合范围过滤
  if (event.turnRange) {
    const [minTurn, maxTurn] = event.turnRange;
    if (context.turn < minTurn || context.turn > maxTurn) return false;
  }

  // 3. 条件表达式过滤
  if (event.conditions && event.conditions.length > 0) {
    const stateMap = buildStateMap(playerState);
    if (!evaluateConditions(event.conditions as (Condition | CompoundCondition)[], stateMap)) {
      return false;
    }
  }

  // 4. 冷却检查
  if (event.cooldown > 0) {
    const lastTriggered = _eventCooldownTracker.get(event.id);
    if (lastTriggered !== undefined) {
      if (context.turn - lastTriggered < event.cooldown) return false;
    }
  }

  // 5. 可重复性检查
  if (!event.repeatable) {
    if (context.currentEventIds.includes(event.id)) return false;
  }

  return true;
}

/**
 * 将 PlayerState 转换为扁平属性 map（供条件求值使用）
 */
function buildStateMap(playerState: PlayerState): Record<string, number> {
  return {
    ...playerState.attributes,
    LEVEL: playerState.level,
    DEATH_COUNT: playerState.deathCount,
  };
}

/**
 * 加权随机选择一个事件
 * @param events 候选事件列表
 * @returns 选中的事件，如果列表为空则返回 null
 */
export function getWeightedEvent(events: GameEvent[]): GameEvent | null {
  if (events.length === 0) return null;

  const weights = events.map((e) => e.weight ?? 1);
  try {
    return weightedRandom(events, weights);
  } catch {
    // 若所有权重为 0 或相等，随机返回
    return events[Math.floor(Math.random() * events.length)];
  }
}

/**
 * 解析分支选择并应用效果
 * @param event 事件对象
 * @param branchId 分支 ID（如 "branch_1"）
 * @param playerState 玩家状态
 * @param currentTurn 当前回合（用于更新冷却）
 * @returns 该分支的属性效果
 */
export function resolveBranch(
  event: GameEvent,
  branchId: string,
  playerState: PlayerState,
  currentTurn?: number
): AttributeEffects {
  // 更新冷却
  if (currentTurn !== undefined && event.cooldown > 0) {
    _eventCooldownTracker.set(event.id, currentTurn);
  }

  // 先应用事件基础效果
  const allEffects: AttributeEffects = { ...(event.effects ?? {}) };

  // 查找分支并应用分支效果
  if (event.branches) {
    const branch = event.branches.find((b) => b.id === branchId);
    if (branch) {
      // 分支条件检查（如果有）
      if (branch.conditions && branch.conditions.length > 0) {
        const stateMap = buildStateMap(playerState);
        if (!evaluateConditions(branch.conditions as (Condition | CompoundCondition)[], stateMap)) {
          console.warn(`[EventSystem] 分支 ${branchId} 条件不满足，仍然强制执行`);
        }
      }

      // 合并分支效果
      if (branch.effects) {
        for (const [key, value] of Object.entries(branch.effects)) {
          const attr = key as AttributeType;
          allEffects[attr] = (allEffects[attr] ?? 0) + (value ?? 0);
        }
      }

      // 标记已选择的分支
    }
  }

  // 应用所有效果到玩家状态
  applyAttributeEffects(allEffects, playerState);

  return allEffects;
}

/**
 * 事件分支解决后获取分支对象
 * @param event 事件
 * @param branchId 分支 ID
 */
export function getBranch(event: GameEvent, branchId: string): EventBranch | undefined {
  return event.branches?.find((b) => b.id === branchId);
}

/**
 * 检查事件是否是死亡链起点
 * @param event 事件对象
 * @returns 是否是死亡链起点
 */
export function checkDeathChain(event: GameEvent): boolean {
  return event.deathChainEntry === true;
}

/**
 * 获取最近被触发的事件冷却状态
 * @param eventId 事件 ID
 * @param currentTurn 当前回合
 * @returns 剩余冷却回合数（0 表示可用）
 */
export function getCooldownRemaining(eventId: number, currentTurn: number): number {
  const lastTriggered = _eventCooldownTracker.get(eventId);
  if (lastTriggered === undefined) return 0;
  const event = getEventById(eventId);
  if (!event) return 0;
  const elapsed = currentTurn - lastTriggered;
  return Math.max(0, event.cooldown - elapsed);
}

/**
 * 重置冷却跟踪器（用于测试或重开）
 */
export function resetCooldowns(): void {
  _eventCooldownTracker.clear();
}

/**
 * 按类型筛选事件
 * @param type 事件类型
 */
export function getEventsByType(type: string): GameEvent[] {
  ensureLoaded();
  return _allEvents.filter((e) => e.type === type);
}

/**
 * 重置事件缓存（热更新/测试用）
 */
export function resetEventCache(): void {
  _allEvents = [];
  _eventCooldownTracker.clear();
}
