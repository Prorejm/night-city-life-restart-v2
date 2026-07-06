// ========== 属性系统 PropertySystem ==========
import type { CoreAttribute, DerivedAttribute, AttributeType, PlayerState, AttributeEffects } from '../types';
import { STAT_MIN, STAT_MAX, AGE_PHASES, INITIAL_STATS } from '../engine/GameConfig';

/**
 * 生成衍生属性阈值描述
 */
const CRITICAL_THRESHOLDS: Partial<Record<AttributeType, { warning: number; danger: number }>> = {
  LIFE: { warning: 25, danger: 10 },
  HUMAN: { warning: 20, danger: 5 },
  MONEY: { warning: 200, danger: 50 },
  TRAUMA: { warning: 50, danger: 80 },
  ADDICTION: { warning: 40, danger: 70 },
  DEBT: { warning: 10000, danger: 50000 },
  REP: { warning: 10, danger: 5 },
};

/**
 * 修改玩家属性值，并进行钳制
 * @param type 属性类型
 * @param delta 变化量（正数增加，负数减少）
 * @param playerState 玩家状态
 * @returns 实际变化量（钳制后的值）
 */
export function modifyAttribute(type: AttributeType, delta: number, playerState: PlayerState): number {
  const current = playerState.attributes[type] ?? INITIAL_STATS[type] ?? 0;
  const min = STAT_MIN[type] ?? 0;
  const max = STAT_MAX[type] ?? Infinity;

  let newValue = current + delta;

  // 钳制在 [min, max] 范围内
  if (newValue < min) {
    newValue = min;
  }
  if (newValue > max) {
    newValue = max;
  }

  const actualDelta = newValue - current;
  playerState.attributes[type] = newValue;

  return actualDelta;
}

/**
 * 批量修改属性
 * @param effects 属性效果集合
 * @param playerState 玩家状态
 * @returns 实际应用的效果映射
 */
export function applyAttributeEffects(effects: AttributeEffects, playerState: PlayerState): AttributeEffects {
  const applied: AttributeEffects = {};

  for (const [key, value] of Object.entries(effects)) {
    if (value !== undefined) {
      const actualDelta = modifyAttribute(key as AttributeType, value, playerState);
      applied[key as AttributeType] = actualDelta;
    }
  }

  return applied;
}

/**
 * 获取玩家当前属性值
 * @param type 属性类型
 * @param playerState 玩家状态
 */
export function getAttribute(type: AttributeType, playerState: PlayerState): number {
  return playerState.attributes[type] ?? INITIAL_STATS[type] ?? 0;
}

/**
 * 设置属性为指定值（含钳制）
 * @param type 属性类型
 * @param value 目标值
 * @param playerState 玩家状态
 */
export function setAttribute(type: AttributeType, value: number, playerState: PlayerState): void {
  const min = STAT_MIN[type] ?? 0;
  const max = STAT_MAX[type] ?? Infinity;
  playerState.attributes[type] = Math.max(min, Math.min(max, value));
}

/**
 * 计算衍生属性
 * LIFE = (STYLE + TECH + CHROME) / 3 * 0.5 + 30
 * REP = STYLE / 2 + 事件影响力（由调用方提供额外加成）
 * @param core 核心属性映射
 * @param eventRepBonus 事件影响力加成（可选）
 * @returns 衍生属性值
 */
export function getDerivedAttributes(
  core: Record<CoreAttribute, number>,
  eventRepBonus: number = 0
): Record<DerivedAttribute, number> {
  const life = Math.round(
    ((core.STYLE ?? 0) + (core.TECH ?? 0) + (core.CHROME ?? 0)) / 3 * 0.5 + 30
  );
  const rep = Math.floor((core.STYLE ?? 0) / 2) + eventRepBonus;

  return {
    LIFE: Math.max(0, Math.min(100, life)),
    TRAUMA: 0, // 由事件系统积累
    ADDICTION: 0, // 由药物系统积累
    DEBT: 0, // 由财务系统积累
    REP: Math.max(0, Math.min(100, rep)),
  };
}

/**
 * 根据年龄获取生命阶段
 * @param age 当前年龄
 * @returns 阶段标签字符串，如 "少年"、"青年" 等
 */
export function getLevelPhase(age: number): string {
  for (const phase of AGE_PHASES) {
    if (age >= phase.min && age <= phase.max) {
      return phase.label;
    }
  }
  return '未知';
}

/**
 * 获取当前年龄在阶段中的进度（0~1）
 * @param age 当前年龄
 */
export function getPhaseProgress(age: number): number {
  for (const phase of AGE_PHASES) {
    if (age >= phase.min && age <= phase.max) {
      if (phase.max === Infinity) return 0;
      const range = phase.max - phase.min;
      if (range <= 0) return 0;
      return (age - phase.min) / range;
    }
  }
  return 0;
}

/**
 * 检查玩家属性是否接近危险阈值
 * @param state 玩家状态
 * @returns 危险/警告信息数组
 */
export function checkCriticalThresholds(state: PlayerState): {
  type: AttributeType;
  level: 'warning' | 'danger';
  currentValue: number;
  message: string;
}[] {
  const results: {
    type: AttributeType;
    level: 'warning' | 'danger';
    currentValue: number;
    message: string;
  }[] = [];

  for (const [attr, thresholds] of Object.entries(CRITICAL_THRESHOLDS)) {
    if (!thresholds) continue;
    const attrType = attr as AttributeType;
    const value = state.attributes[attrType] ?? 0;

    // 正向属性（life, human, money, rep）：值越低越危险
    // 负向属性（trauma, addiction, debt）：值越高越危险
    const isPositive = ['LIFE', 'HUMAN', 'MONEY', 'REP'].includes(attr);

    if (isPositive) {
      if (value <= thresholds.danger) {
        results.push({
          type: attrType,
          level: 'danger',
          currentValue: value,
          message: `${attr} 处于危险水平 (${value})！`,
        });
      } else if (value <= thresholds.warning) {
        results.push({
          type: attrType,
          level: 'warning',
          currentValue: value,
          message: `${attr} 偏低 (${value})，请注意。`,
        });
      }
    } else {
      if (value >= thresholds.danger) {
        results.push({
          type: attrType,
          level: 'danger',
          currentValue: value,
          message: `${attr} 处于危险水平 (${value})！`,
        });
      } else if (value >= thresholds.warning) {
        results.push({
          type: attrType,
          level: 'warning',
          currentValue: value,
          message: `${attr} 偏高 (${value})，请注意。`,
        });
      }
    }
  }

  return results;
}

/**
 * 重置属性为核心初始值
 * @returns 核心属性初始值映射
 */
export function getInitialCoreAttributes(): Record<CoreAttribute, number> {
  return {
    STYLE: INITIAL_STATS.STYLE,
    TECH: INITIAL_STATS.TECH,
    CHROME: INITIAL_STATS.CHROME,
    MONEY: INITIAL_STATS.MONEY,
    HUMAN: INITIAL_STATS.HUMAN,
  };
}
