import { create } from 'zustand';

interface PlayerStore {
  // 基础属性
  attributes: Record<string, number>;

  // 装备/状态
  equippedCyberware: string[];
  inventory: string[];
  activeBuffs: any[];
  housingLevel: string;
  insuranceLevel: string;

  // 天赋
  talents: any[];

  // 药物状态
  drugAddiction: Record<string, number>;
  currentDrugs: string[];

  // 死亡统计
  deathCount: number;

  // 方法
  setAttribute: (key: string, value: number) => void;
  modifyAttribute: (key: string, delta: number) => void;
  setAttributes: (attrs: Record<string, number>) => void;
  addItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  equipCyberware: (id: string) => void;
  removeCyberware: (id: string) => void;
  setHousing: (level: string) => void;
  setInsurance: (level: string) => void;
  addBuff: (buff: any) => void;
  removeBuff: (buffId: string) => void;
  setDrugAddiction: (drugId: string, level: number) => void;
  addCurrentDrug: (drugId: string) => void;
  resetPlayer: () => void;
}

const INITIAL_ATTRIBUTES: Record<string, number> = {
  STYLE: 10,
  TECH: 10,
  CHROME: 10,
  MONEY: 500,
  HUMAN: 50,
  LIFE: 80,
  TRAUMA: 0,
  ADDICTION: 0,
  DEBT: 0,
  REP: 0,
};

const INITIAL_STATE = {
  attributes: { ...INITIAL_ATTRIBUTES },
  equippedCyberware: [] as string[],
  inventory: [] as string[],
  activeBuffs: [] as any[],
  housingLevel: 'F',
  insuranceLevel: 'none',
  talents: [] as any[],
  drugAddiction: {} as Record<string, number>,
  currentDrugs: [] as string[],
  deathCount: 0,
};

const usePlayerStore = create<PlayerStore>()((set) => ({
  ...INITIAL_STATE,

  setAttribute: (key, value) =>
    set((state) => ({
      attributes: { ...state.attributes, [key]: value },
    })),

  modifyAttribute: (key, delta) =>
    set((state) => ({
      attributes: {
        ...state.attributes,
        [key]: (state.attributes[key] ?? 0) + delta,
      },
    })),

  setAttributes: (attrs) =>
    set((state) => ({
      attributes: { ...state.attributes, ...attrs },
    })),

  addItem: (itemId) =>
    set((state) => ({
      inventory: [...state.inventory, itemId],
    })),

  removeItem: (itemId) =>
    set((state) => ({
      inventory: state.inventory.filter((id) => id !== itemId),
    })),

  equipCyberware: (id) =>
    set((state) => ({
      equippedCyberware: [...state.equippedCyberware, id],
    })),

  removeCyberware: (id) =>
    set((state) => ({
      equippedCyberware: state.equippedCyberware.filter((cid) => cid !== id),
    })),

  setHousing: (level) => set({ housingLevel: level }),

  setInsurance: (level) => set({ insuranceLevel: level }),

  addBuff: (buff) =>
    set((state) => ({
      activeBuffs: [...state.activeBuffs, buff],
    })),

  removeBuff: (buffId) =>
    set((state) => ({
      activeBuffs: state.activeBuffs.filter((b: any) => b.id !== buffId),
    })),

  setDrugAddiction: (drugId, level) =>
    set((state) => ({
      drugAddiction: { ...state.drugAddiction, [drugId]: level },
    })),

  addCurrentDrug: (drugId) =>
    set((state) => ({
      currentDrugs: [...state.currentDrugs, drugId],
    })),

  resetPlayer: () => set({ ...INITIAL_STATE, attributes: { ...INITIAL_ATTRIBUTES } }),
}));

export default usePlayerStore;
