// ========== 游戏配置常量 ==========
import type { CoreAttribute, DerivedAttribute, AttributeType } from '../types';

/**
 * 属性中文名映射
 */
export const STAT_NAMES: Record<AttributeType, string> = {
  STYLE: '街头声望',
  TECH: '技术能力',
  CHROME: '义体化程度',
  MONEY: '经济状况',
  HUMAN: '人性值',
  LIFE: '生命值',
  TRAUMA: '创伤值',
  ADDICTION: '成瘾度',
  DEBT: '负债',
  REP: '声望',
};

/**
 * 初始属性值
 */
export const INITIAL_STATS: Record<AttributeType, number> = {
  STYLE: 10,
  TECH: 10,
  CHROME: 10,
  MONEY: 500,
  HUMAN: 10,
  LIFE: 50,
  TRAUMA: 0,
  ADDICTION: 0,
  DEBT: 0,
  REP: 0,
};

/**
 * 属性最小值范围
 */
export const STAT_MIN: Record<AttributeType, number> = {
  STYLE: 0,
  TECH: 0,
  CHROME: 0,
  MONEY: 0,
  HUMAN: 0,
  LIFE: 0,
  TRAUMA: 0,
  ADDICTION: 0,
  DEBT: 0,
  REP: 0,
};

/**
 * 属性最大值范围
 */
export const STAT_MAX: Record<AttributeType, number> = {
  STYLE: 100,
  TECH: 100,
  CHROME: 100,
  MONEY: 99999,
  HUMAN: 100,
  LIFE: 100,
  TRAUMA: 100,
  ADDICTION: 100,
  DEBT: Infinity,
  REP: 100,
};

/**
 * 年龄阶段定义
 */
export const AGE_PHASES: { label: string; min: number; max: number }[] = [
  { label: '少年', min: 0, max: 14 },
  { label: '青年', min: 15, max: 25 },
  { label: '壮年', min: 26, max: 40 },
  { label: '中年', min: 41, max: 60 },
  { label: '老年', min: 61, max: Infinity },
];

/** 每年回合数 */
export const TURN_PER_YEAR = 12;

/** 房租扣除间隔（回合数） */
export const HOUSING_RENT_INTERVAL = 3;
