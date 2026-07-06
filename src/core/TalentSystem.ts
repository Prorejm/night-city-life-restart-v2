// ========== 天赋系统 TalentSystem ==========
import type { Talent, TalentGrade, PlayerState, AttributeEffects, AttributeType, Condition, CompoundCondition } from '../types';
import { weightedRandom } from '../engine/Random';
import { evaluateConditions } from '../engine/ConditionEvaluator';
import talentsData from '../../data/talents.json';

/** 天赋稀有度权重映射 */
const GRADE_WEIGHTS: Record<TalentGrade, number> = {
  0: 80,  // 普通 80%
  1: 15,  // 稀有 15%
  2: 4,   // 史诗 4%
  3: 1,   // 传说 1%
};

/** 天赋稀有度中文标签 */
const GRADE_LABELS: Record<TalentGrade, string> = {
  0: '普通',
  1: '稀有',
  2: '史诗',
  3: '传说',
};

/** 已加载的天赋数据 */
let _talents: Talent[] = [];

/**
 * 从 JSON 数据初始化天赋列表
 */
function ensureLoaded(): void {
  if (_talents.length === 0) {
    // talents.json 文件结构: { talents: [...] } 或直接是数组
    const data = talentsData as { talents?: Talent[] } | Talent[];
    if (Array.isArray(data)) {
      _talents = data;
    } else if (data.talents) {
      _talents = data.talents;
    } else {
      console.warn('[TalentSystem] talents.json 数据格式异常');
      _talents = [];
    }
  }
}

/**
 * 获取全部天赋列表
 */
export function getAllTalents(): Talent[] {
  ensureLoaded();
  return [..._talents];
}

/**
 * 根据 ID 查找天赋
 * @param talentId 天赋 ID
 */
export function getTalentById(talentId: number): Talent | undefined {
  ensureLoaded();
  return _talents.find((t) => t.id === talentId);
}

/**
 * 按稀有度等级筛选天赋
 * @param grade 稀有度等级
 */
export function getTalentsByGrade(grade: TalentGrade): Talent[] {
  ensureLoaded();
  return _talents.filter((t) => t.grade === grade);
}

/**
 * 从天赋池中按稀有度权重抽取指定数量的天赋
 * @param count 抽取数量
 * @param excludeIds 需要排除的天赋 ID 列表（如已拥有的）
 * @returns 抽取到的天赋列表（不重复）
 */
export function generateTalentPool(count: number, excludeIds: number[] = []): Talent[] {
  ensureLoaded();

  const grades: TalentGrade[] = [0, 1, 2, 3];
  const pool: Talent[] = [];

  while (pool.length < count) {
    // 按权重选择稀有度
    const gradeWeights = grades.map((g) => GRADE_WEIGHTS[g]);
    const selectedGrade = weightedRandom(grades, gradeWeights);

    // 从该稀有度的天赋中筛选
    const candidates = _talents.filter(
      (t) =>
        t.grade === selectedGrade &&
        !excludeIds.includes(t.id) &&
        !pool.find((p) => p.id === t.id)
    );

    if (candidates.length === 0) {
      // 如果没有候选，降低稀有度继续寻找
      continue;
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    pool.push(picked);
  }

  return pool;
}

/**
 * 从天赋池中按稀有度权重抽取指定数量（可指定权重系数）
 * @param count 抽取数量
 * @param excludeIds 排除列表
 * @param customWeights 自定义权重（可选，覆盖默认权重）
 */
export function generateWeightedPool(
  count: number,
  excludeIds: number[] = [],
  customWeights?: Partial<Record<TalentGrade, number>>
): Talent[] {
  const weights = customWeights
    ? { ...GRADE_WEIGHTS, ...customWeights }
    : GRADE_WEIGHTS;

  const grades: TalentGrade[] = [0, 1, 2, 3];
  const pool: Talent[] = [];

  while (pool.length < count) {
    const gradeWeights = grades.map((g) => weights[g]);
    const selectedGrade = weightedRandom(grades, gradeWeights);

    const candidates = _talents.filter(
      (t) =>
        t.grade === selectedGrade &&
        !excludeIds.includes(t.id) &&
        !pool.find((p) => p.id === p.id)
    );

    if (candidates.length === 0) continue;

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    pool.push(picked);
  }

  return pool;
}

/**
 * 选择天赋（将天赋加入玩家天赋列表）
 * @param talentId 天赋 ID
 * @param playerState 玩家状态
 * @returns 是否成功选择
 */
export function selectTalent(talentId: number, playerState: PlayerState): boolean {
  ensureLoaded();

  const talent = _talents.find((t) => t.id === talentId);
  if (!talent) return false;

  // 检查是否已拥有
  if (playerState.talents.find((t) => t.id === talentId)) return false;

  // 检查互斥天赋
  if (talent.exclusive && talent.exclusive.length > 0) {
    const hasExclusive = playerState.talents.some((t) =>
      talent.exclusive!.includes(t.id)
    );
    if (hasExclusive) return false;
  }

  playerState.talents.push({ ...talent });
  return true;
}

/**
 * 获取已激活天赋的效果总和
 * @param talents 玩家已拥有的天赋列表
 * @returns 所有天赋效果的总和
 */
export function getActiveEffects(talents: Talent[]): AttributeEffects {
  const combined: AttributeEffects = {};

  for (const talent of talents) {
    if (talent.effects) {
      for (const [key, value] of Object.entries(talent.effects)) {
        const attr = key as AttributeType;
        combined[attr] = (combined[attr] ?? 0) + (value ?? 0);
      }
    }
  }

  return combined;
}

/**
 * 检查单个天赋的条件是否满足
 * @param talent 天赋对象
 * @param state 玩家状态属性的扁平映射
 * @returns 条件是否满足
 */
export function checkTalentCondition(
  talent: Talent,
  state: Record<string, number>
): boolean {
  if (!talent.conditions || talent.conditions.length === 0) {
    return true;
  }

  return evaluateConditions(talent.conditions as (Condition | CompoundCondition)[], state);
}

/**
 * 批量检查多个天赋的条件
 * @param talents 天赋列表
 * @param state 玩家状态
 * @returns 满足条件的天赋列表
 */
export function getEligibleTalents(
  talents: Talent[],
  state: Record<string, number>
): Talent[] {
  return talents.filter((t) => checkTalentCondition(t, state));
}

/**
 * 获取可继承的天赋（重生后可保留）
 * @param talents 玩家当前的天赋列表
 * @returns 可继承的天赋列表
 */
export function getRebirthInheritable(talents: Talent[]): Talent[] {
  return talents.filter((t) => t.rebirthInheritable === true);
}

/**
 * 获取天赋的稀有度名称
 * @param grade 稀有度等级
 */
export function getGradeLabel(grade: TalentGrade): string {
  return GRADE_LABELS[grade] ?? '未知';
}

/**
 * 获取天赋稀有度权重配置（只读）
 */
export function getGradeWeights(): Readonly<Record<TalentGrade, number>> {
  return GRADE_WEIGHTS;
}

/**
 * 重置天赋系统的内部缓存（用于热更新或测试）
 */
export function resetCache(): void {
  _talents = [];
}
