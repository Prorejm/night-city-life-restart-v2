// ========== 随机数工具 ==========

/**
 * 生成 [min, max] 范围内的随机整数（包含两端）
 */
export function rand(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成 [min, max) 范围内的随机浮点数
 */
export function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 加权随机选择
 * @param items 待选项数组
 * @param weights 对应的权重数组
 * @returns 选中的项
 * @throws 如果 items 和 weights 长度不一致或 weights 全为 0
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  if (items.length !== weights.length) {
    throw new Error(`items.length (${items.length}) 与 weights.length (${weights.length}) 不一致`);
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) {
    throw new Error('权重总和必须大于 0');
  }

  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }

  // 兜底返回最后一项（因浮点精度问题）
  return items[items.length - 1];
}

/**
 * 概率判定
 * @param probability 0~1 之间的概率值
 * @returns 是否命中
 */
export function chance(probability: number): boolean {
  return Math.random() < probability;
}

/**
 * Fisher-Yates 洗牌算法（不修改原数组）
 * @param array 原数组
 * @returns 新打乱的数组
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 从不重复数组中随机选取 N 个元素
 * @param array 源数组
 * @param n 选取数量
 * @returns 选取的元素数组
 * @throws 如果 n > array.length
 */
export function pickN<T>(array: T[], n: number): T[] {
  if (n > array.length) {
    throw new Error(`n (${n}) 不能大于数组长度 (${array.length})`);
  }
  if (n <= 0) {
    return [];
  }
  return shuffle(array).slice(0, n);
}

/**
 * 简易种子随机数生成器（Mulberry32 算法）
 * 用于可重现事件
 * @param seed 种子值
 * @returns 一个包含 next 方法的对象，每次调用返回 0~1 之间的伪随机浮点数
 */
export function seededRandom(seed: number): { next: () => number; nextInt: (min: number, max: number) => number } {
  let s = seed | 0;

  function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(next() * (max - min + 1)) + min;
  }

  return { next, nextInt };
}
