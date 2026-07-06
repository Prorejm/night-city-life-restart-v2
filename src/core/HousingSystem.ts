// ========== 住房系统 HousingSystem ==========
import type { HousingLevel, PlayerState, AttributeEffects, AttributeType } from '../types';
import { applyAttributeEffects, modifyAttribute } from './PropertySystem';
import { HOUSING_RENT_INTERVAL } from '../engine/GameConfig';
import housingData from '../../data/housing.json';

/** 住房最低等级排序 */
const HOUSING_ORDER: HousingLevel[] = ['S', 'A', 'B', 'C', 'D', 'F'];

/** 住户驱逐跟踪：记录玩家连续欠租次数 */
const _evictionTracker = new Map<string, number>();

/** 住房数据缓存 */
let _housingMap: Record<HousingLevel, {
  level: HousingLevel;
  name: string;
  monthlyRent: number;
  safety: number;
  comfort: number;
  effects: Record<string, number>;
  description: string;
}> | null = null;

/**
 * 初始化住房数据
 */
function ensureLoaded(): void {
  if (_housingMap) return;

  const data = housingData as any;

  const map: Record<string, any> = {};
  if (data.levels) {
    for (const level of data.levels) {
      map[level.id] = level;
    }
  }
  _housingMap = map as Record<HousingLevel, any>;
}

/**
 * 获取住房信息
 * @param level 住房等级
 */
export function getHousingInfo(level: HousingLevel): {
  level: HousingLevel;
  name: string;
  monthlyRent: number;
  safety: number;
  comfort: number;
  effects: Record<string, number>;
  description: string;
} | undefined {
  ensureLoaded();
  return _housingMap?.[level];
}

/**
 * 获取所有住房等级信息
 */
export function getAllHousingLevels(): HousingLevel[] {
  return [...HOUSING_ORDER];
}

/**
 * 从当前等级提升到目标等级
 * @param current 当前住房等级
 * @param target 目标住房等级
 * @param playerState 玩家状态
 * @returns 是否升级成功
 */
export function upgradeHousing(
  current: HousingLevel,
  target: HousingLevel,
  playerState: PlayerState
): boolean {
  const currentRank = HOUSING_ORDER.indexOf(current);
  const targetRank = HOUSING_ORDER.indexOf(target);

  // 目标等级必须比当前高（rank 值越小等级越高：S=0, A=1, B=2...）
  if (targetRank >= currentRank) {
    console.warn(`[HousingSystem] 目标等级 ${target} 不高于当前等级 ${current}`);
    return false;
  }

  const targetInfo = getHousingInfo(target);
  if (!targetInfo) return false;

  // 检查是否有足够的钱支付押金（首月房租 * 2）
  const depositCost = targetInfo.monthlyRent * 2;
  const currentMoney = playerState.attributes.MONEY ?? 0;
  if (currentMoney < depositCost) {
    console.warn(`[HousingSystem] 资金不足: 需要 ${depositCost}，当前 ${currentMoney}`);
    return false;
  }

  // 扣除押金
  modifyAttribute('MONEY', -depositCost, playerState);

  // 升级住房
  playerState.housing = target;

  return true;
}

/**
 * 降级住房（被迫搬入更差的住房）
 * @param target 目标等级
 * @param playerState 玩家状态
 * @returns 是否成功
 */
export function downgradeHousing(target: HousingLevel, playerState: PlayerState): boolean {
  playerState.housing = target;
  return true;
}

/**
 * 处理房租扣除
 * 每 HOUSING_RENT_INTERVAL 回合扣除一次房租
 * @param playerState 玩家状态
 * @param turn 当前回合数
 * @returns 处理结果
 */
export function processRent(
  playerState: PlayerState,
  turn: number
): { paid: boolean; evicted: boolean } {
  // 只有每 HOUSING_RENT_INTERVAL 回合才处理
  if (turn % HOUSING_RENT_INTERVAL !== 0) {
    return { paid: true, evicted: false };
  }

  // F 级（无家可归）不用交房租
  if (playerState.housing === 'F') {
    return { paid: true, evicted: false };
  }

  const housingInfo = getHousingInfo(playerState.housing);
  if (!housingInfo) return { paid: false, evicted: false };

  const rent = housingInfo.monthlyRent;
  const money = playerState.attributes.MONEY ?? 0;

  if (money >= rent) {
    // 正常支付
    modifyAttribute('MONEY', -rent, playerState);

    // 清除欠租记录
    const playerKey = `player_${playerState.deathCount}`;
    _evictionTracker.set(playerKey, 0);

    return { paid: true, evicted: false };
  } else {
    // 资金不足，无法支付房租
    // 不足部分转为债务
    const shortfall = rent - money;

    // 花光所有钱
    modifyAttribute('MONEY', -money, playerState);

    // 增加债务
    modifyAttribute('DEBT', shortfall, playerState);

    // 记录欠租
    const playerKey = `player_${playerState.deathCount}`;
    const missedPayments = (_evictionTracker.get(playerKey) ?? 0) + 1;
    _evictionTracker.set(playerKey, missedPayments);

    // 检查驱逐条件
    if (missedPayments >= 3) {
      // 第3次欠租被驱逐
      downgradeHousing('F', playerState);
      _evictionTracker.set(playerKey, 0);
      return { paid: false, evicted: true };
    }

    // 连续2次欠租发出警告（已记录到 evictionTracker）
    return { paid: false, evicted: false };
  }
}

/**
 * 获取住房对属性的影响
 * @param level 住房等级
 * @returns 属性效果（转换为 AttributeEffects 格式）
 */
export function getHousingEffects(level: HousingLevel): AttributeEffects {
  const info = getHousingInfo(level);
  if (!info) return {};

  const effects: AttributeEffects = {};
  const rawEffects = info.effects;

  // 将 housing 数据中的效果映射为系统属性
  if (rawEffects.healthRegen !== undefined) {
    effects.LIFE = rawEffects.healthRegen;
  }
  if (rawEffects.mentalHealthRegen !== undefined) {
    effects.HUMAN = rawEffects.mentalHealthRegen;
  }
  if (rawEffects.socialBonus !== undefined) {
    effects.STYLE = rawEffects.socialBonus;
  }
  if (rawEffects.reputationPerDay !== undefined) {
    effects.REP = rawEffects.reputationPerDay;
  }

  // D/F 级住房的负面效果
  if (rawEffects.diseaseRisk !== undefined) {
    effects.TRAUMA = rawEffects.diseaseRisk ? Math.ceil(rawEffects.diseaseRisk / 10) : 0;
  }
  if (rawEffects.theftRisk !== undefined) {
    // 偷窃风险：被偷后减少金钱
    effects.MONEY = rawEffects.theftRisk ? -Math.ceil(rawEffects.theftRisk / 10) : 0;
  }

  return effects;
}

/**
 * 获取被驱逐后的后果效果
 * @param playerState 玩家状态
 * @returns 驱逐带来的属性影响
 */
export function getEvictionConsequences(playerState: PlayerState): AttributeEffects {
  const consequences: AttributeEffects = {
    HUMAN: -5,
    STYLE: -3,
    TRAUMA: 10,
    REP: -5,
  };

  applyAttributeEffects(consequences, playerState);
  return consequences;
}

/**
 * 获取玩家连续欠租次数
 * @param playerState 玩家状态
 */
export function getMissedRentCount(playerState: PlayerState): number {
  const playerKey = `player_${playerState.deathCount}`;
  return _evictionTracker.get(playerKey) ?? 0;
}

/**
 * 重置驱逐跟踪（用于重开）
 */
export function resetEvictionTracker(): void {
  _evictionTracker.clear();
}

/**
 * 获取住房的排名索引（0 最高）
 * @param level 住房等级
 */
export function getHousingRank(level: HousingLevel): number {
  const index = HOUSING_ORDER.indexOf(level);
  return index >= 0 ? index : HOUSING_ORDER.length - 1;
}

/**
 * 从当前住房可升级到的最高等级（基于资金检查）
 * @param playerState 玩家状态
 * @returns 可负担的最高住房等级
 */
export function getAffordableHousing(playerState: PlayerState): HousingLevel {
  const money = playerState.attributes.MONEY ?? 0;
  const currentRank = getHousingRank(playerState.housing);

  for (let i = 0; i < currentRank; i++) {
    const level = HOUSING_ORDER[i];
    const info = getHousingInfo(level);
    if (info && money >= info.monthlyRent * 2) {
      return level;
    }
  }

  return playerState.housing;
}
