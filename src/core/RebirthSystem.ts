// ========== 重开/继承系统 RebirthSystem ==========
import type {
  DeathRecord,
  PlayerState,
  Talent,
  RebirthOptions,
  AttributeType,
  CoreAttribute,
} from '../types';
import { getRebirthInheritable } from './TalentSystem';
import { modifyAttribute, applyAttributeEffects } from './PropertySystem';
import { INITIAL_STATS } from '../engine/GameConfig';

/** 继承项消耗的遗产点数 */
const INHERITANCE_COSTS = {
  talent: 10,
  attribute: 5,
  money: 3,
  extraTalent: 15,
  item: 8,
};

/** 每点遗产点可继承的天赋数量 */
const TALENTS_PER_POINT = 0.5;

/**
 * 计算遗产点数
 * 公式: 存活年龄*1 + 最高属性*0.5 + 成就数*3 + 累计财富/10000
 * @param deathRecord 死亡记录
 * @param gameStats 游戏统计数据
 * @returns 遗产点数
 */
export function calculateRebirthPoints(
  deathRecord: DeathRecord,
  gameStats: {
    age: number;
    achievements: string[];
    totalEarned: number;
  }
): number {
  const agePoints = gameStats.age * 1;

  // 最高属性值
  const attributeValues = Object.values(deathRecord.finalAttributes);
  const maxAttribute = Math.max(...attributeValues, 0);
  const attributePoints = maxAttribute * 0.5;

  // 成就点数
  const achievementCount = gameStats.achievements.length;
  const achievementPoints = achievementCount * 3;

  // 累计财富点数
  const wealthPoints = gameStats.totalEarned / 10000;

  const total = agePoints + attributePoints + achievementPoints + wealthPoints;
  return Math.max(1, Math.floor(total));
}

/**
 * 根据遗产点数获取可选继承项
 * @param points 遗产点数
 * @returns 可用的继承选项
 */
export function getRebirthOptions(points: number): RebirthOptions {
  return {
    canInheritTalent: points >= INHERITANCE_COSTS.talent,
    canBoostAttribute: points >= INHERITANCE_COSTS.attribute,
    canBoostMoney: points >= INHERITANCE_COSTS.money,
    canExtraTalent: points >= INHERITANCE_COSTS.extraTalent,
    inheritancePoints: points,
  };
}

/**
 * 检查是否可以继承特定项目
 * @param points 可用遗产点数
 * @param costKey 继承项标识
 */
export function canAffordInheritance(
  points: number,
  costKey: keyof typeof INHERITANCE_COSTS
): boolean {
  return points >= INHERITANCE_COSTS[costKey];
}

/**
 * 获取某继承项的消耗点数
 * @param costKey 继承项标识
 */
export function getInheritanceCost(costKey: keyof typeof INHERITANCE_COSTS): number {
  return INHERITANCE_COSTS[costKey];
}

/**
 * 应用继承选项到新游戏状态
 * @param options 继承选项
 * @param playerState 新玩家状态
 */
export function applyInheritance(
  options: RebirthOptions,
  playerState: PlayerState
): void {
  if (options.canBoostAttribute) {
    // 属性增强：所有核心属性 +3
    const coreAttrs: CoreAttribute[] = ['STYLE', 'TECH', 'CHROME', 'MONEY', 'HUMAN'];
    for (const attr of coreAttrs) {
      const current = playerState.attributes[attr] ?? 0;
      if (attr === 'MONEY') {
        // 金钱特殊处理
        modifyAttribute(attr, 200, playerState);
      } else {
        modifyAttribute(attr, 3, playerState);
      }
    }
  }

  if (options.canBoostMoney) {
    // 额外金钱加成
    modifyAttribute('MONEY', 1000, playerState);
  }
}

/**
 * 获取可继承的天赋（消耗遗产点）
 * @param previous 上一世的天赋列表
 * @param points 可用遗产点数
 * @returns 可继承的天赋列表
 */
export function getInheritedTalents(
  previous: Talent[],
  points: number
): Talent[] {
  // 获取标记为可继承的天赋
  const inheritable = getRebirthInheritable(previous);

  // 根据遗产点数决定能继承多少个
  const maxInheritable = Math.floor(points * TALENTS_PER_POINT);
  const count = Math.min(inheritable.length, maxInheritable);

  // 按稀有度排序，优先继承高稀有度天赋
  const sorted = [...inheritable].sort((a, b) => b.grade - a.grade);
  return sorted.slice(0, count);
}

/**
 * 消耗遗产点继承指定天赋
 * @param talent 要继承的天赋
 * @param playerState 玩家状态
 * @param points 剩余遗产点数（会被修改）
 * @returns 是否成功继承
 */
export function inheritTalent(
  talent: Talent,
  playerState: PlayerState,
  points: number
): { success: boolean; remainingPoints: number } {
  const cost = INHERITANCE_COSTS.talent;

  if (points < cost) {
    return { success: false, remainingPoints: points };
  }

  // 检查是否已拥有
  if (playerState.talents.find((t) => t.id === talent.id)) {
    return { success: false, remainingPoints: points };
  }

  playerState.talents.push({ ...talent });
  return { success: true, remainingPoints: points - cost };
}

/**
 * 为重生生成初始玩家状态
 * @param options 继承选项
 * @returns 初始化后的 PlayerState
 */
export function createRebirthPlayerState(options: RebirthOptions): PlayerState {
  const state: PlayerState = {
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
    deathCount: 0,
    totalPlayTime: 0,
  };

  // 应用继承
  applyInheritance(options, state);

  return state;
}

/**
 * 获取重开时可选的额外天赋数量
 * @param options 继承选项
 */
export function getExtraTalentCount(options: RebirthOptions): number {
  if (options.canExtraTalent) {
    return 1;
  }
  return 0;
}
