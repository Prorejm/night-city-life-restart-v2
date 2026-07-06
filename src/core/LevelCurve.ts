// ========== 等级曲线系统 LevelCurve ==========
import type { PlayerState } from '../types';

/** 等级经验基础倍率 */
const BASE_MULTIPLIER = 100;

/** 经验底数 */
const EXP_BASE = 2;

/**
 * 根据经验值计算当前等级
 * 核心公式：经验需求 = 100 * 2^(level-1)
 * 等级 = floor(log2(exp / 100)) + 1
 * @param exp 当前经验值
 * @returns 等级（从 1 开始）
 */
export function getLevel(exp: number): number {
  if (exp < 0) return 1;
  if (exp === 0) return 1;
  // level = floor(log2(exp / 100)) + 1  when exp >= 100
  // level = 1 when exp < 100
  const raw = Math.floor(Math.log(exp / BASE_MULTIPLIER) / Math.log(EXP_BASE)) + 1;
  return Math.max(1, raw);
}

/**
 * 获取升到指定等级所需的总经验值
 * @param level 目标等级（从 1 开始）
 * @returns 所需总经验值
 */
export function getExpNeededForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(BASE_MULTIPLIER * Math.pow(EXP_BASE, level - 1));
}

/**
 * 从当前经验值升级到下一级所需经验
 * @param currentExp 当前经验值
 * @returns 还需要多少经验才能升级
 */
export function getExpForNextLevel(currentExp: number): number {
  const currentLevel = getLevel(currentExp);
  const neededForCurrent = getExpNeededForLevel(currentLevel);
  const neededForNext = getExpNeededForLevel(currentLevel + 1);
  return neededForNext - neededForCurrent;
}

/**
 * 获取当前等级下，距离下一级的经验进度（0~1）
 * @param currentExp 当前经验值
 */
export function getLevelProgress(currentExp: number): number {
  const currentLevel = getLevel(currentExp);
  const neededForCurrent = getExpNeededForLevel(currentLevel);
  const neededForNext = getExpNeededForLevel(currentLevel + 1);
  const range = neededForNext - neededForCurrent;
  if (range <= 0) return 1;
  return (currentExp - neededForCurrent) / range;
}

/**
 * 获取技能效率（边际递减）
 * 效率 = 1 / (1 + level * 0.1)
 * 等级越高，每级提升带来的实际收益越低
 * @param level 当前等级
 * @returns 效率系数（0~1）
 */
export function getSkillEfficiency(level: number): number {
  if (level < 1) return 1;
  return 1 / (1 + level * 0.1);
}

/**
 * 根据等级获取属性增益衰减后的实际值
 * @param rawBonus 原始增益值
 * @param level 当前等级
 * @returns 衰减后的实际增益
 */
export function getDiminishedBonus(rawBonus: number, level: number): number {
  return rawBonus * getSkillEfficiency(level);
}

/**
 * 查看指定等级的经验值区间
 * @param level 等级
 * @returns { min: 本级最小经验, max: 本级最大经验 }
 */
export function getLevelExpRange(level: number): { min: number; max: number } {
  const min = getExpNeededForLevel(level);
  const max = getExpNeededForLevel(level + 1) - 1;
  return { min, max };
}

/**
 * 从玩家状态获取当前等级对应的属性理论最大值
 * @param playerState 玩家状态
 * @returns 等级相关的理论属性上限
 */
export function getLevelCap(playerState: PlayerState): number {
  // 每级提升一点能力上限
  return Math.min(100, 10 + playerState.level * 5);
}

/**
 * 获取跨等级的经验差（相邻两级所需的额外经验）
 * @param level 起始等级
 * @returns 从 level 升到 level+1 所需的经验
 */
export function getExpGap(level: number): number {
  if (level < 1) return getExpNeededForLevel(2);
  return getExpNeededForLevel(level + 1) - getExpNeededForLevel(level);
}
