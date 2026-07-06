// ========== 条件表达式求值器 ==========
import type { Condition, CompoundCondition } from '../types';

/**
 * 比较操作符映射
 */
type Comparator = (a: number, b: number) => boolean;

const COMPARATORS: Record<string, Comparator> = {
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
};

/**
 * 单条件求值
 * 检查玩家属性是否满足单个条件约束
 * @param condition 条件对象
 * @param playerState 玩家属性表
 * @returns 是否满足条件
 */
export function evaluateCondition(
  condition: Condition,
  playerState: Record<string, number>
): boolean {
  const playerValue = playerState[condition.attribute];

  // 如果玩家没有该属性，视为不满足
  if (playerValue === undefined) {
    return false;
  }

  const comparator = COMPARATORS[condition.operator];
  if (!comparator) {
    console.warn(`未知的操作符: ${condition.operator}`);
    return false;
  }

  return comparator(playerValue, condition.value);
}

/**
 * 复合条件递归求值
 * 支持 AND/OR 逻辑递归嵌套
 * @param condition 单个条件 或 复合条件
 * @param playerState 玩家属性表
 * @returns 是否满足条件
 */
export function evaluateCompound(
  condition: Condition | CompoundCondition,
  playerState: Record<string, number>
): boolean {
  // 如果是简单条件（有 attribute 字段）
  if ('attribute' in condition) {
    return evaluateCondition(condition, playerState);
  }

  // 复合条件
  const compound = condition as CompoundCondition;

  if (compound.operator === 'AND') {
    return compound.conditions.every((subCondition) =>
      evaluateCompound(subCondition, playerState)
    );
  }

  if (compound.operator === 'OR') {
    return compound.conditions.some((subCondition) =>
      evaluateCompound(subCondition, playerState)
    );
  }

  console.warn(`未知的复合操作符: ${compound.operator}`);
  return false;
}

/**
 * 条件数组求值（默认 AND 逻辑）
 * 数组中所有条件都满足时才返回 true
 * @param conditions 条件数组（可包含简单条件和复合条件）
 * @param playerState 玩家属性表
 * @returns 是否所有条件都满足
 */
export function evaluateConditions(
  conditions: (Condition | CompoundCondition)[],
  playerState: Record<string, number>
): boolean {
  if (conditions.length === 0) {
    return true;
  }

  return conditions.every((condition) =>
    evaluateCompound(condition, playerState)
  );
}
