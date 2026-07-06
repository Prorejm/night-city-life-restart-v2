// ========== 成瘾/药物系统 DrugSystem ==========
import type { Drug, PlayerState, AttributeEffects, AttributeType } from '../types';
import { applyAttributeEffects, modifyAttribute } from './PropertySystem';
import drugsData from '../../data/drugs.json';

/** 已加载的药物列表 */
let _drugs: Drug[] = [];

/** 玩家上次服药追踪（用于戒断检查） */
const _lastDoseTracker = new Map<string, Map<string, number>>();

/** 成瘾等级阈值 */
const ADDICTION_LEVELS: { min: number; label: string }[] = [
  { min: 0, label: '无成瘾' },
  { min: 1, label: '低风险' },
  { min: 20, label: '轻微依赖' },
  { min: 40, label: '中度依赖' },
  { min: 60, label: '重度依赖' },
  { min: 80, label: '极重度依赖' },
  { min: 100, label: '致命成瘾' },
];

/**
 * 从 JSON 数据初始化药物列表
 */
function ensureLoaded(): void {
  if (_drugs.length > 0) return;

  const data = drugsData as { allDrugs?: Drug[] } | Drug[];
  if (Array.isArray(data)) {
    _drugs = data;
  } else if (data.allDrugs) {
    _drugs = data.allDrugs;
  }
}

/**
 * 获取所有药物列表
 */
export function getAllDrugs(): Drug[] {
  ensureLoaded();
  return [..._drugs];
}

/**
 * 根据 ID 查找药物
 * @param drugId 药物 ID
 */
export function getDrugById(drugId: string): Drug | undefined {
  ensureLoaded();
  return _drugs.find((d) => d.id === drugId);
}

/**
 * 使用药物
 * @param drugId 药物 ID
 * @param playerState 玩家状态
 * @returns 药物产生的属性效果
 */
export function takeDrug(drugId: string, playerState: PlayerState): AttributeEffects {
  ensureLoaded();

  const drug = _drugs.find((d) => d.id === drugId);
  if (!drug) {
    console.warn(`[DrugSystem] 未找到药物: ${drugId}`);
    return {};
  }

  // 计算成瘾度增加量: addictionRate * (1 - CHROME/200)
  const chrome = playerState.attributes.CHROME ?? 10;
  const addictionIncrease = drug.addictionRate * (1 - chrome / 200);

  // 应用成瘾度
  const currentAddiction = playerState.attributes.ADDICTION ?? 0;
  const newAddiction = Math.max(0, Math.min(100, currentAddiction + addictionIncrease));
  playerState.attributes.ADDICTION = newAddiction;

  // 记录药物的个人成瘾跟踪
  const currentDrugAddiction = playerState.drugAddiction[drugId] ?? 0;
  playerState.drugAddiction[drugId] = Math.min(100, currentDrugAddiction + drug.addictionRate * 0.5);

  // 添加到当前正在使用的药物列表
  if (!playerState.currentDrugs.includes(drugId)) {
    playerState.currentDrugs.push(drugId);
  }

  // 记录服药时间
  const turn = playerState.totalPlayTime;
  if (!_lastDoseTracker.has(drugId)) {
    _lastDoseTracker.set(drugId, new Map());
  }
  _lastDoseTracker.get(drugId)!.set('lastDoseTurn', turn);

  // 应用药物效果
  const effects: AttributeEffects = { ...drug.effects };
  applyAttributeEffects(effects, playerState);

  return effects;
}

/**
 * 检查玩家是否有戒断反应
 * @param playerState 玩家状态
 * @returns 是否处于戒断状态
 */
export function checkWithdrawal(playerState: PlayerState): boolean {
  const addiction = playerState.attributes.ADDICTION ?? 0;

  // 如果 ADDICTION <= 50，无需戒断检查
  if (addiction <= 50) return false;

  // 检查是否有最近服用的药物（简单检测：如果 currentDrugs 为空表示没有按时服药）
  if (playerState.currentDrugs.length === 0) {
    return true;
  }

  // 检查每种药物的戒断情况
  for (const drugId of playerState.currentDrugs) {
    const drug = getDrugById(drugId);
    if (!drug) continue;

    const lastDoseTurn = _lastDoseTracker.get(drugId)?.get('lastDoseTurn');
    if (lastDoseTurn === undefined) return true;

    // 如果超过 duration*2 的回合没有服药，触发戒断
    const turnsSinceLastDose = playerState.totalPlayTime - lastDoseTurn;
    if (turnsSinceLastDose > (drug as any).duration * 2) {
      return true;
    }
  }

  return false;
}

/**
 * 触发戒断反应
 * 对玩家施加戒断效果
 * @param playerState 玩家状态
 * @returns 戒断产生的属性效果
 */
export function applyWithdrawalEffects(playerState: PlayerState): AttributeEffects {
  const totalEffects: AttributeEffects = {};

  for (const drugId of playerState.currentDrugs) {
    const drug = getDrugById(drugId);
    if (!drug || !drug.withdrawalEffects) continue;

    for (const [key, value] of Object.entries(drug.withdrawalEffects)) {
      const attr = key as AttributeType;
      totalEffects[attr] = (totalEffects[attr] ?? 0) + (value ?? 0);
    }
  }

  // 增加创伤值
  totalEffects.TRAUMA = (totalEffects.TRAUMA ?? 0) + 5;

  applyAttributeEffects(totalEffects, playerState);
  return totalEffects;
}

/**
 * 戒毒治疗
 * @param playerState 玩家状态
 * @param cost 治疗费用
 */
export function treatAddiction(playerState: PlayerState, cost: number): void {
  // 扣除费用
  if (cost > 0) {
    modifyAttribute('MONEY', -cost, playerState);
  }

  // 降低成瘾度
  const currentAddiction = playerState.attributes.ADDICTION ?? 0;
  const reduction = Math.min(currentAddiction, 30 + Math.floor(Math.random() * 20));
  playerState.attributes.ADDICTION = Math.max(0, currentAddiction - reduction);

  // 清除当前药物记录
  playerState.currentDrugs = [];
  playerState.drugAddiction = {};

  // 清除戒断追踪
  _lastDoseTracker.clear();
}

/**
 * 获取成瘾等级描述
 * @param addiction 成瘾度（0~100）
 * @returns 等级描述字符串
 */
export function getAddictionLevel(addiction: number): string {
  // 从高到低匹配
  for (let i = ADDICTION_LEVELS.length - 1; i >= 0; i--) {
    if (addiction >= ADDICTION_LEVELS[i].min) {
      return ADDICTION_LEVELS[i].label;
    }
  }
  return '未知';
}

/**
 * 获取玩家对特定药物的成瘾度
 * @param drugId 药物 ID
 * @param playerState 玩家状态
 */
export function getDrugAddiction(drugId: string, playerState: PlayerState): number {
  return playerState.drugAddiction[drugId] ?? 0;
}

/**
 * 清除所有玩家的药物状态（用于重开）
 * @param playerState 玩家状态
 */
export function clearDrugState(playerState: PlayerState): void {
  playerState.drugAddiction = {};
  playerState.currentDrugs = [];
  playerState.attributes.ADDICTION = 0;
  _lastDoseTracker.clear();
}

/**
 * 获取戒断减免后的治疗费用
 * @param playerState 玩家状态
 * @param baseCost 基础治疗费用
 * @returns 实际费用
 */
export function getTreatmentCost(playerState: PlayerState, baseCost: number): number {
  const addiction = playerState.attributes.ADDICTION ?? 0;
  // 成瘾越深，治疗越贵
  const multiplier = 1 + addiction / 50;
  return Math.round(baseCost * multiplier);
}
