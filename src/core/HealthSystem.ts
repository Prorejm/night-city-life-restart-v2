// ========== 健康/医疗系统 HealthSystem ==========
import type { PlayerState, InsuranceLevel, AttributeEffects } from '../types';
import { applyAttributeEffects, modifyAttribute } from './PropertySystem';

/** 保险等级对应的医疗费用倍率和应急响应时间 */
const INSURANCE_BENEFITS: Record<InsuranceLevel, { costMultiplier: number; responseTime: number; label: string }> = {
  platinum: { costMultiplier: 0, responseTime: 1, label: '白金' },
  gold: { costMultiplier: 1, responseTime: 3, label: '黄金' },
  silver: { costMultiplier: 2, responseTime: 5, label: '白银' },
  none: { costMultiplier: 5, responseTime: 10, label: '无保险' },
};

/** 不同伤势的基础治疗费用 */
const INJURY_BASE_COST: Record<string, number> = {
  light: 200,
  moderate: 800,
  severe: 3000,
  critical: 10000,
  cyberpsychosis: 20000,
};

/** 创伤崩溃阈值 */
const TRAUMA_BREAKDOWN_THRESHOLD = 70;

/**
 * 处理伤害
 * @param damage 伤害值
 * @param playerState 玩家状态
 */
export function processInjury(damage: number, playerState: PlayerState): void {
  if (damage <= 0) return;

  // 减少生命值
  const currentLife = playerState.attributes.LIFE ?? 50;
  const newLife = Math.max(0, currentLife - damage);
  playerState.attributes.LIFE = newLife;

  // 增加创伤值（伤害的 30% 转化为创伤）
  const traumaIncrease = Math.round(damage * 0.3);
  if (traumaIncrease > 0) {
    const currentTrauma = playerState.attributes.TRAUMA ?? 0;
    playerState.attributes.TRAUMA = Math.min(100, currentTrauma + traumaIncrease);
  }

  // 减少人性值（伤害的 10% 转化为人性损失）
  const humanityLoss = Math.round(damage * 0.1);
  if (humanityLoss > 0) {
    const currentHuman = playerState.attributes.HUMAN ?? 10;
    playerState.attributes.HUMAN = Math.max(0, currentHuman - humanityLoss);
  }
}

/**
 * 根据伤势和保险等级计算治疗费用
 * @param injury 伤势等级（'light' | 'moderate' | 'severe' | 'critical' | 'cyberpsychosis'）
 * @param insurance 保险等级
 * @returns 治疗费用
 */
export function getTreatmentCost(injury: string, insurance: InsuranceLevel): number {
  const baseCost = INJURY_BASE_COST[injury] ?? INJURY_BASE_COST.moderate;
  const benefit = INSURANCE_BENEFITS[insurance] ?? INSURANCE_BENEFITS.none;
  return baseCost * benefit.costMultiplier;
}

/**
 * 治疗：恢复生命值
 * @param amount 恢复量
 * @param playerState 玩家状态
 */
export function heal(amount: number, playerState: PlayerState): void {
  if (amount <= 0) return;

  const currentLife = playerState.attributes.LIFE ?? 50;
  playerState.attributes.LIFE = Math.min(100, currentLife + amount);
}

/**
 * 完全治疗（恢复到满血）
 * @param playerState 玩家状态
 */
export function fullHeal(playerState: PlayerState): void {
  playerState.attributes.LIFE = 100;
}

/**
 * 检查玩家是否处于创伤崩溃状态
 * @param playerState 玩家状态
 * @returns 是否创伤崩溃
 */
export function checkTraumaBreakdown(playerState: PlayerState): boolean {
  const trauma = playerState.attributes.TRAUMA ?? 0;
  return trauma >= TRAUMA_BREAKDOWN_THRESHOLD;
}

/**
 * 处理创伤崩溃效果
 * @param playerState 玩家状态
 * @returns 崩溃产生的属性效果
 */
export function processTraumaBreakdown(playerState: PlayerState): AttributeEffects {
  const effects: AttributeEffects = {
    HUMAN: -10,
    STYLE: -5,
    LIFE: -15,
  };

  applyAttributeEffects(effects, playerState);
  return effects;
}

/**
 * 降低创伤值
 * @param amount 降低量
 * @param playerState 玩家状态
 */
export function reduceTrauma(amount: number, playerState: PlayerState): void {
  if (amount <= 0) return;

  const currentTrauma = playerState.attributes.TRAUMA ?? 0;
  playerState.attributes.TRAUMA = Math.max(0, currentTrauma - amount);
}

/**
 * 获取保险福利信息
 * @param level 保险等级
 * @returns 费用倍率和响应时间
 */
export function getInsuranceBenefit(level: InsuranceLevel): { costMultiplier: number; responseTime: number } {
  const benefit = INSURANCE_BENEFITS[level] ?? INSURANCE_BENEFITS.none;
  return {
    costMultiplier: benefit.costMultiplier,
    responseTime: benefit.responseTime,
  };
}

/**
 * 升级保险
 * @param currentLevel 当前保险等级
 * @param playerState 玩家状态
 * @returns 是否升级成功
 */
export function upgradeInsurance(playerState: PlayerState): boolean {
  const costMap: Record<InsuranceLevel, number> = {
    none: 500,
    silver: 2000,
    gold: 8000,
    platinum: 25000,
  };

  const upgradePath: InsuranceLevel[] = ['none', 'silver', 'gold', 'platinum'];
  const currentIndex = upgradePath.indexOf(playerState.insurance);

  if (currentIndex >= upgradePath.length - 1) {
    return false; // 已经是最高等级
  }

  const nextLevel = upgradePath[currentIndex + 1];
  const cost = costMap[playerState.insurance];
  const money = playerState.attributes.MONEY ?? 0;

  if (money < cost) {
    return false; // 资金不足
  }

  modifyAttribute('MONEY', -cost, playerState);
  playerState.insurance = nextLevel;
  return true;
}

/**
 * 获取伤势严重程度的中文描述
 * @param lifePercent 当前生命值百分比
 */
export function getInjurySeverity(lifePercent: number): string {
  if (lifePercent <= 0) return '死亡';
  if (lifePercent <= 10) return '濒死';
  if (lifePercent <= 25) return '重伤';
  if (lifePercent <= 50) return '中度受伤';
  if (lifePercent <= 75) return '轻伤';
  return '健康';
}

/**
 * 获取创伤等级描述
 * @param trauma 创伤值
 */
export function getTraumaLevel(trauma: number): string {
  if (trauma >= 90) return '精神崩溃';
  if (trauma >= TRAUMA_BREAKDOWN_THRESHOLD) return '严重创伤';
  if (trauma >= 40) return '中度创伤';
  if (trauma >= 20) return '轻度创伤';
  return '心理稳定';
}
