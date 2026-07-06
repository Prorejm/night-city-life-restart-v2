// ========== 死亡系统 DeathSystem ==========
import type { DeathType, PlayerState, DeathRecord, AttributeType } from '../types';
import { applyAttributeEffects } from './PropertySystem';
import { INITIAL_STATS } from '../engine/GameConfig';

/** 死亡类型对应的中文描述配置 */
const DEATH_DESCRIPTIONS: Record<DeathType, { title: string; description: string; epitaph: string }> = {
  gang: {
    title: '帮派仇杀',
    description: '在夜之城的街头，帮派的子弹永远不会问你的名字。你倒在了一个无人知晓的巷子里，鲜血染红了满地垃圾。',
    epitaph: '又一个倒在街头的无名之辈',
  },
  corp: {
    title: '企业清算',
    description: '你知道了太多不该知道的事情。企业的手段永远干净利落——没有目击者，没有证据，只有一个永远消失的人。',
    epitaph: '在巨兽的齿轮中化为齑粉',
  },
  cyberpsychosis: {
    title: '赛博精神病',
    description: '赛博植入物最终吞噬了你的人性。你变成了一个只知道杀戮的机器，在NCPD的子弹中结束了疯狂。',
    epitaph: '人性已逝，只剩机械的空壳',
  },
  overdose: {
    title: '药物过量',
    description: '追求最后一次快感，却付出了生命的代价。你的身体承受不了更多的化学物质，心脏在狂喜中停止了跳动。',
    epitaph: '在极乐中坠入永恒',
  },
  medical: {
    title: '医疗事故',
    description: '廉价的黑市诊所，过期的人造器官，不合格的义体医生。你本该活下来的，但在这个城市，医疗是奢侈品。',
    epitaph: '死于付不起的医疗账单',
  },
  poverty: {
    title: '贫困致死',
    description: '饥饿、寒冷、疾病——这座城市有无数种方式杀死一个穷人。你蜷缩在街角，像一片被遗忘的落叶。',
    epitaph: '被赛博都市遗忘的灵魂',
  },
  combat: {
    title: '战斗死亡',
    description: '你死在了枪林弹雨中，像一名真正的战士。也许是佣兵，也许是义警，无论如何，你战斗到了最后一刻。',
    epitaph: '战至最后一颗子弹',
  },
  accident: {
    title: '意外事故',
    description: '飞驰的车辆、坠落的建筑构件、失控的自动驾驶...在这座疯狂的城市里，意外从来不是意外。',
    epitaph: '死于这座城市的一万个意外之一',
  },
  braindance: {
    title: '超梦沉溺',
    description: '你沉迷在别人的记忆里无法自拔，最终大脑彻底离线。你的身体还活着，但真正的你已经死在了那段永恒的梦中。',
    epitaph: '在别人的梦里永远沉睡',
  },
  natural: {
    title: '自然死亡',
    description: '在这个人均寿命不到60岁的城市里，能活到寿终正寝本身就是一种奇迹。你闭上了眼睛，这一次不再是城市的声音，而是永恒的宁静。',
    epitaph: '在这座城市活到了最后',
  },
};

/** 死亡条件检查函数映射 */
type DeathCheckFn = (state: PlayerState) => boolean;

interface DeathConditionEntry {
  type: DeathType;
  check: DeathCheckFn;
}

/** 死亡条件列表（按优先级排序） */
const DEATH_CONDITIONS: DeathConditionEntry[] = [
  {
    type: 'overdose',
    check: (state) => (state.attributes.ADDICTION ?? 0) >= 100,
  },
  {
    type: 'cyberpsychosis',
    check: (state) => (state.attributes.HUMAN ?? 10) <= 0,
  },
  {
    type: 'combat',
    check: (state) => (state.attributes.LIFE ?? 50) <= 0,
  },
  {
    type: 'poverty',
    check: (state) => {
      const money = state.attributes.MONEY ?? 0;
      const debt = state.attributes.DEBT ?? 0;
      return money <= 0 && debt >= 100000;
    },
  },
  {
    type: 'medical',
    check: (state) => {
      const life = state.attributes.LIFE ?? 50;
      const trauma = state.attributes.TRAUMA ?? 0;
      return life <= 10 && trauma >= 90;
    },
  },
];

/** 创伤/心理崩溃导致的死亡 */
const TRAUMA_DEATH_CHECK: DeathConditionEntry = {
  type: 'braindance',
  check: (state) => (state.attributes.TRAUMA ?? 0) >= 100,
};

/**
 * 检查玩家是否满足死亡条件
 * @param playerState 玩家状态
 * @returns 如果满足条件，返回死亡类型；否则返回 null
 */
export function checkDeathConditions(playerState: PlayerState): DeathType | null {
  // 先检查创伤 >= 100（心理崩溃/自杀）
  if (TRAUMA_DEATH_CHECK.check(playerState)) {
    return TRAUMA_DEATH_CHECK.type;
  }

  // 按优先级检查其他死亡条件
  for (const entry of DEATH_CONDITIONS) {
    if (entry.check(playerState)) {
      return entry.type;
    }
  }

  return null;
}

/**
 * 获取死亡类型的文字描述
 * @param type 死亡类型
 * @param fullDescription 是否返回完整描述（包含 epitaph）
 * @returns 死亡描述字符串
 */
export function getDeathDescription(type: DeathType, fullDescription: boolean = false): string {
  const info = DEATH_DESCRIPTIONS[type] ?? DEATH_DESCRIPTIONS.natural;
  if (fullDescription) {
    return `${info.title}：${info.description}\n—— ${info.epitaph}`;
  }
  return info.description;
}

/**
 * 获取死亡标题
 * @param type 死亡类型
 */
export function getDeathTitle(type: DeathType): string {
  return DEATH_DESCRIPTIONS[type]?.title ?? '未知';
}

/**
 * 获取墓志铭
 * @param type 死亡类型
 */
export function getEpitaph(type: DeathType): string {
  return DEATH_DESCRIPTIONS[type]?.epitaph ?? '安息';
}

/**
 * 处理死亡，生成死亡记录
 * @param playerState 玩家状态
 * @param type 死亡类型
 * @returns 死亡记录对象
 */
export function processDeath(playerState: PlayerState, type: DeathType): DeathRecord {
  const deathInfo = DEATH_DESCRIPTIONS[type] ?? DEATH_DESCRIPTIONS.natural;

  const record: DeathRecord = {
    age: 0, // 由 GameEngine 填充
    cause: type,
    title: deathInfo.title,
    description: deathInfo.description,
    finalAttributes: { ...playerState.attributes },
    achievements: [],
    turnCount: 0, // 由 GameEngine 填充
  };

  return record;
}

/**
 * 根据玩家当前状态推断可能的死亡类型及权重（用于死亡事件随机）
 * @param playerState 玩家状态
 * @returns 死亡类型及其权重的列表
 */
export function getDeathWeights(playerState: PlayerState): { type: DeathType; weight: number }[] {
  const weights: { type: DeathType; weight: number }[] = [
    { type: 'combat', weight: 10 },
    { type: 'gang', weight: 8 },
    { type: 'accident', weight: 6 },
    { type: 'medical', weight: 5 },
    { type: 'corp', weight: 4 },
    { type: 'overdose', weight: 3 },
    { type: 'poverty', weight: 3 },
    { type: 'cyberpsychosis', weight: 2 },
    { type: 'braindance', weight: 2 },
    { type: 'natural', weight: 1 },
  ];

  // 根据玩家状态调整权重
  const trauma = playerState.attributes.TRAUMA ?? 0;
  const addiction = playerState.attributes.ADDICTION ?? 0;
  const debt = playerState.attributes.DEBT ?? 0;
  const money = playerState.attributes.MONEY ?? 0;

  // 高创伤增加死亡权重
  if (trauma > 50) {
    const traumaWeight = weights.find((w) => w.type === 'combat');
    if (traumaWeight) traumaWeight.weight += Math.floor(trauma / 10);
  }

  // 高成瘾增加 overdose 概率
  if (addiction > 50) {
    const odWeight = weights.find((w) => w.type === 'overdose');
    if (odWeight) odWeight.weight += Math.floor(addiction / 10);
  }

  // 高负债低收入增加 poverty 概率
  if (debt > 50000 && money < 100) {
    const povertyWeight = weights.find((w) => w.type === 'poverty');
    if (povertyWeight) povertyWeight.weight += 10;
  }

  return weights;
}

/**
 * 创建默认死亡记录（从玩家状态自动检测）
 * @param playerState 玩家状态
 * @param turnCount 当前回合数
 * @param age 当前年龄
 */
export function createDeathRecord(
  playerState: PlayerState,
  turnCount: number,
  age: number
): DeathRecord {
  const deathType = checkDeathConditions(playerState) ?? 'accident';
  const record = processDeath(playerState, deathType);
  record.age = age;
  record.turnCount = turnCount;
  return record;
}
