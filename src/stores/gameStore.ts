import { create } from 'zustand';
import type { GamePhase, DeathRecord } from '@/types';

interface GameStore {
  // 游戏阶段
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;

  // 回合与年龄
  turnCount: number;
  currentAge: number;
  currentYear: number;
  advanceTurn: () => void;

  // 自动模式
  autoMode: boolean;
  autoSpeed: number;
  toggleAuto: () => void;
  setAutoSpeed: (speed: number) => void;

  // 重开统计
  runCount: number;
  totalDeaths: number;
  rebirthPoints: number;
  inheritedTalents: number[];
  deathHistory: DeathRecord[];
  addDeathRecord: (record: DeathRecord) => void;
  setRebirthPoints: (points: number) => void;
  addInheritedTalent: (talentId: number) => void;
  incrementRunCount: () => void;

  // 重置
  resetGame: () => void;
  resetForRebirth: () => void;
}

const INITIAL_STATE = {
  phase: 'MENU' as GamePhase,
  turnCount: 0,
  currentAge: 18,
  currentYear: 2077,
  autoMode: false,
  autoSpeed: 1,
  runCount: 0,
  totalDeaths: 0,
  rebirthPoints: 0,
  inheritedTalents: [] as number[],
  deathHistory: [] as DeathRecord[],
};

const useGameStore = create<GameStore>()((set) => ({
  ...INITIAL_STATE,

  setPhase: (phase) => set({ phase }),

  advanceTurn: () =>
    set((state) => {
      const newTurnCount = state.turnCount + 1;
      // 每 4 回合增长 1 岁
      const ageIncrease = Math.floor(newTurnCount / 4) - Math.floor(state.turnCount / 4);
      return {
        turnCount: newTurnCount,
        currentAge: state.currentAge + ageIncrease,
        currentYear: state.currentYear + ageIncrease,
      };
    }),

  toggleAuto: () => set((state) => ({ autoMode: !state.autoMode })),

  setAutoSpeed: (speed) => set({ autoSpeed: speed }),

  addDeathRecord: (record) =>
    set((state) => ({
      deathHistory: [...state.deathHistory, record],
      totalDeaths: state.totalDeaths + 1,
    })),

  setRebirthPoints: (points) => set({ rebirthPoints: points }),

  addInheritedTalent: (talentId) =>
    set((state) => ({
      inheritedTalents: [...state.inheritedTalents, talentId],
    })),

  incrementRunCount: () =>
    set((state) => ({ runCount: state.runCount + 1 })),

  resetGame: () => set({ ...INITIAL_STATE }),

  resetForRebirth: () =>
    set((state) => ({
      phase: 'MENU' as GamePhase,
      turnCount: 0,
      currentAge: 18,
      currentYear: 2077,
      autoMode: false,
      autoSpeed: 1,
      // 保留转生相关状态
      runCount: state.runCount,
      totalDeaths: state.totalDeaths,
      rebirthPoints: state.rebirthPoints,
      inheritedTalents: state.inheritedTalents,
      deathHistory: state.deathHistory,
    })),
}));

export default useGameStore;
