import { create } from 'zustand';
import { INITIAL_STATS } from '@/engine/GameConfig';
import type { AttributeType, HousingLevel, InsuranceLevel, Talent, Buff } from '@/types';

interface PlayerStore {
  attributes: Record<AttributeType, number>;
  equippedCyberware: string[];
  inventory: string[];
  activeBuffs: Buff[];
  housing: HousingLevel;
  insurance: InsuranceLevel;
  talents: Talent[];
  exp: Partial<Record<AttributeType, number>>;
  level: number;
  drugAddiction: Record<string, number>;
  currentDrugs: string[];
  deathCount: number;
  totalPlayTime: number;

  setAttribute: (key: AttributeType, value: number) => void;
  modifyAttribute: (key: AttributeType, delta: number) => void;
  setAttributes: (attrs: Partial<Record<AttributeType, number>>) => void;
  addItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  equipCyberware: (id: string) => void;
  removeCyberware: (id: string) => void;
  setHousing: (level: HousingLevel) => void;
  setInsurance: (level: InsuranceLevel) => void;
  addBuff: (buff: Buff) => void;
  removeBuff: (buffId: string) => void;
  setDrugAddiction: (drugId: string, level: number) => void;
  addCurrentDrug: (drugId: string) => void;
  setTalents: (talents: Talent[]) => void;
  resetPlayer: () => void;
}

const INITIAL_STATE = {
  attributes: { ...INITIAL_STATS },
  equippedCyberware: [] as string[],
  inventory: [] as string[],
  activeBuffs: [] as Buff[],
  housing: 'F' as HousingLevel,
  insurance: 'none' as InsuranceLevel,
  talents: [] as Talent[],
  exp: {} as Partial<Record<AttributeType, number>>,
  level: 1,
  drugAddiction: {} as Record<string, number>,
  currentDrugs: [] as string[],
  deathCount: 0,
  totalPlayTime: 0,
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

  setHousing: (level) => set({ housing: level }),

  setInsurance: (level) => set({ insurance: level }),

  addBuff: (buff) =>
    set((state) => ({
      activeBuffs: [...state.activeBuffs, buff],
    })),

  removeBuff: (buffId) =>
    set((state) => ({
      activeBuffs: state.activeBuffs.filter((b) => b.id !== buffId),
    })),

  setDrugAddiction: (drugId, level) =>
    set((state) => ({
      drugAddiction: { ...state.drugAddiction, [drugId]: level },
    })),

  addCurrentDrug: (drugId) =>
    set((state) => ({
      currentDrugs: [...state.currentDrugs, drugId],
    })),

  setTalents: (talents) => set({ talents }),

  resetPlayer: () => set({ ...INITIAL_STATE, attributes: { ...INITIAL_STATS } }),
}));

export default usePlayerStore;
