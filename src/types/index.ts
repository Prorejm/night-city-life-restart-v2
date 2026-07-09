// ========== 基础类型 ==========
export type GamePhase = 'LOADING' | 'MENU' | 'TALENT_SELECT' | 'ALLOCATE' | 'PLAYING' | 'DEATH';
export type EventType = 'daily' | 'social' | 'combat' | 'medical' | 'economy' | 'cyber' | 'drug' | 'housing' | 'special';
export type HousingLevel = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
export type InsuranceLevel = 'platinum' | 'gold' | 'silver' | 'none';
export type TalentGrade = 0 | 1 | 2 | 3;
export type DeathType = 'gang' | 'corp' | 'cyberpsychosis' | 'overdose' | 'medical' | 'poverty' | 'combat' | 'accident' | 'braindance' | 'natural';

// ========== 属性系统 ==========
export type CoreAttribute = 'STYLE' | 'TECH' | 'CHROME' | 'MONEY' | 'HUMAN';
export type DerivedAttribute = 'LIFE' | 'TRAUMA' | 'ADDICTION' | 'DEBT' | 'REP';
export type AttributeType = CoreAttribute | DerivedAttribute;
export type AttributeEffects = Partial<Record<AttributeType, number>>;

// ========== 条件系统 ==========
export interface Condition {
  attribute: AttributeType;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
}
export interface CompoundCondition {
  operator: 'AND' | 'OR';
  conditions: (Condition | CompoundCondition)[];
}

// ========== 事件系统 ==========
export interface EventBranch {
  id: string;
  text: string;
  effects: AttributeEffects;
  conditions?: (Condition | CompoundCondition)[];
  nextEventId?: number;
  deathChainId?: string;
}
export interface GameEvent {
  id: number;
  title: string;
  description: string;
  type: EventType;
  ageRange?: [number, number];
  turnRange?: [number, number];
  conditions?: (Condition | CompoundCondition)[];
  weight: number;
  repeatable: boolean;
  cooldown: number;
  noRandom?: boolean;
  branches?: EventBranch[];
  effects?: AttributeEffects;
  tags?: string[];
  deathChainEntry?: boolean;
  imagePrompt?: string;
}

// ========== 天赋系统 ==========
export interface Talent {
  id: number;
  name: string;
  description: string;
  grade: TalentGrade;
  effects: AttributeEffects;
  conditions?: (Condition | CompoundCondition)[];
  exclusive?: number[];
  tags?: string[];
  rebirthInheritable?: boolean;
  minAge?: number;
}

// ========== 义体系统 ==========
export interface Cyberware {
  id: string;
  name: string;
  description: string;
  type: 'neural' | 'ocular' | 'limb' | 'dermal' | 'audio' | 'internal' | 'fashion';
  humanityCost: number;
  price: number;
  effects: AttributeEffects;
  requirements?: (Condition | CompoundCondition)[];
  grade: TalentGrade;
}

// ========== 物品系统 ==========
export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'drug' | 'consumable' | 'quest' | 'valuable';
  price: number;
  effects?: AttributeEffects;
  grade?: TalentGrade;
}

// ========== 药物系统 ==========
export interface Drug {
  id: string;
  name: string;
  type: string;
  addictionRate: number;
  addictionThreshold: number;
  effects: Record<string, number | undefined>;
  withdrawalEffects: Record<string, number | undefined>;
  price: number;
  legal: boolean;
  description: string;
  duration: number;
  overdoseRisk?: number;
}

// ========== 住房系统 ==========
export interface Housing {
  level: HousingLevel;
  name: string;
  description: string;
  monthlyRent: number;
  security: number;
  comfort: number;
  location: string;
}

// ========== 死亡系统 ==========
export interface DeathCause {
  type: DeathType;
  title: string;
  description: string;
  conditions: (Condition | CompoundCondition)[];
  weight: number;
  deathChainId?: string;
}
export interface DeathChainStage {
  id: string;
  description: string;
  effects: AttributeEffects;
  branches?: EventBranch[];
}

// ========== 游戏状态 ==========
export interface PlayerState {
  attributes: Record<AttributeType, number>;
  exp: Partial<Record<CoreAttribute, number>>;
  level: number;
  talents: Talent[];
  equippedCyberware: string[];
  inventory: string[];
  activeBuffs: Buff[];
  housing: HousingLevel;
  insurance: InsuranceLevel;
  drugAddiction: Record<string, number>;
  currentDrugs: string[];
  deathCount: number;
  totalPlayTime: number;
}
export interface Buff {
  id: string;
  name: string;
  source: string;
  effects: AttributeEffects;
  duration: number;
  remainingTurns: number;
}
export interface GameState {
  phase: GamePhase;
  turnCount: number;
  currentAge: number;
  currentYear: number;
  autoMode: boolean;
  autoSpeed: number;
  runCount: number;
  totalDeaths: number;
  rebirthPoints: number;
  inheritedTalents: number[];
  deathHistory: DeathRecord[];
}
export interface DeathRecord {
  age: number;
  cause: DeathType;
  title: string;
  description: string;
  finalAttributes: Record<AttributeType, number>;
  achievements: string[];
  turnCount: number;
}
export interface RebirthOptions {
  canInheritTalent: boolean;
  canBoostAttribute: boolean;
  canBoostMoney: boolean;
  canExtraTalent: boolean;
  inheritancePoints: number;
}
export interface EventLogEntry {
  id: string;
  eventId: number;
  age: number;
  turn: number;
  title: string;
  description: string;
  effects?: AttributeEffects;
  choice?: string;
  timestamp: number;
}
