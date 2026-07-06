// ========== 对数曲线公式引擎 ==========

/**
 * 经验值转等级
 * 公式: level = floor(log_{base}(exp / multiplier + 1)) + 1
 * @param exp 当前经验值
 * @param base 对数底数（默认 2）
 * @param multiplier 经验倍率（默认 100）
 * @returns 等级（从 1 开始）
 */
export function expToLevel(exp: number, base: number = 2, multiplier: number = 100): number {
  if (exp < 0) return 1;
  return Math.floor(Math.log(exp / multiplier + 1) / Math.log(base)) + 1;
}

/**
 * 等级转经验值（从等级 1 到该等级所需总经验）
 * 公式: exp = multiplier * (base^{level - 1} - 1)
 * @param level 当前等级（从 1 开始）
 * @param base 对数底数（默认 2）
 * @param multiplier 经验倍率（默认 100）
 * @returns 所需总经验值
 */
export function levelToExp(level: number, base: number = 2, multiplier: number = 100): number {
  if (level <= 1) return 0;
  return Math.round(multiplier * (Math.pow(base, level - 1) - 1));
}

/**
 * 获取属性效果值（对数曲线）
 * 公式: baseValue + log2(1 + exp) * scaleFactor
 * @param baseValue 基础值
 * @param exp 经验/累积值
 * @param scaleFactor 缩放因子
 * @returns 计算后的属性效果值
 */
export function getStatEffect(baseValue: number, exp: number, scaleFactor: number): number {
  if (exp < 0) return baseValue;
  return baseValue + Math.log2(1 + exp) * scaleFactor;
}

/**
 * 获取升到下一级所需经验值
 * @param currentLevel 当前等级（从 1 开始）
 * @param base 对数底数（默认 2）
 * @param multiplier 经验倍率（默认 100）
 * @returns 下一级所需经验值
 */
export function getNextLevelExp(currentLevel: number, base: number = 2, multiplier: number = 100): number {
  const currentTotal = levelToExp(currentLevel, base, multiplier);
  const nextTotal = levelToExp(currentLevel + 1, base, multiplier);
  return nextTotal - currentTotal;
}

export type ModifierType = 'add' | 'multiply';

export interface Modifier {
  type: ModifierType;
  value: number;
}

/**
 * 复合属性计算
 * 先应用所有加法修正，再应用所有乘法修正
 * @param baseValue 基础值
 * @param modifiers 修正数组
 * @returns 计算结果
 */
export function compoundEffect(baseValue: number, modifiers: Modifier[]): number {
  let additive = 0;
  let multiplicative = 1;

  for (const mod of modifiers) {
    if (mod.type === 'add') {
      additive += mod.value;
    } else if (mod.type === 'multiply') {
      // 乘法修正：例如 value=0.1 表示增加 10%
      multiplicative *= 1 + mod.value;
    }
  }

  return (baseValue + additive) * multiplicative;
}

/**
 * 获取当前等级的增长速度（每增加一级所需的额外经验）
 * 增长速度 = multiplier * (base^{level - 1}) * (base - 1)
 * 用于判断当前等级的提升效率
 * @param currentLevel 当前等级
 * @param base 对数底数（默认 2）
 * @param multiplier 经验倍率（默认 100）
 * @returns 当前增长速度值
 */
export function getGrowthRate(currentLevel: number, base: number = 2, multiplier: number = 100): number {
  if (currentLevel < 1) return 0;
  return multiplier * Math.pow(base, currentLevel - 1) * (base - 1);
}
