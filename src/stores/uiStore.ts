import { create } from 'zustand';
import type { EventLogEntry } from '@/types';

interface UIStore {
  currentScreen: string;
  setScreen: (screen: string) => void;

  eventLog: EventLogEntry[];
  addEventLog: (entry: EventLogEntry) => void;
  clearEventLog: () => void;

  selectedTalents: number[];
  setSelectedTalents: (ids: number[]) => void;
  talentPool: any[];
  setTalentPool: (talents: any[]) => void;

  allocatePoints: number;
  setAllocatePoints: (points: number) => void;
  allocatedAttrs: Record<string, number>;
  setAllocatedAttr: (key: string, value: number) => void;

  // 面板状态
  questPanelOpen: boolean;
  inventoryPanelOpen: boolean;
  cyberwarePanelOpen: boolean;
  drugPanelOpen: boolean;
  housingPanelOpen: boolean;
  togglePanel: (panel: string) => void;
  closeAllPanels: () => void;

  // 弹窗
  activeModal: string | null;
  modalData: any;
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;

  // 动画队列
  animationQueue: any[];
  addAnimation: (anim: any) => void;
  clearAnimations: () => void;
}

const INITIAL_STATE = {
  currentScreen: 'MENU',
  eventLog: [] as EventLogEntry[],
  selectedTalents: [] as number[],
  talentPool: [] as any[],
  allocatePoints: 0,
  allocatedAttrs: {} as Record<string, number>,
  questPanelOpen: false,
  inventoryPanelOpen: false,
  cyberwarePanelOpen: false,
  drugPanelOpen: false,
  housingPanelOpen: false,
  activeModal: null as string | null,
  modalData: null as any,
  animationQueue: [] as any[],
};

const useUIStore = create<UIStore>()((set) => ({
  ...INITIAL_STATE,

  setScreen: (screen) => set({ currentScreen: screen }),

  addEventLog: (entry) =>
    set((state) => ({
      eventLog: [...state.eventLog, entry],
    })),

  clearEventLog: () => set({ eventLog: [] }),

  setSelectedTalents: (ids) => set({ selectedTalents: ids }),

  setTalentPool: (talents) => set({ talentPool: talents }),

  setAllocatePoints: (points) => set({ allocatePoints: points }),

  setAllocatedAttr: (key, value) =>
    set((state) => ({
      allocatedAttrs: { ...state.allocatedAttrs, [key]: value },
    })),

  togglePanel: (panel) =>
    set((state) => {
      switch (panel) {
        case 'quest':
          return { questPanelOpen: !state.questPanelOpen };
        case 'inventory':
          return { inventoryPanelOpen: !state.inventoryPanelOpen };
        case 'cyberware':
          return { cyberwarePanelOpen: !state.cyberwarePanelOpen };
        case 'drug':
          return { drugPanelOpen: !state.drugPanelOpen };
        case 'housing':
          return { housingPanelOpen: !state.housingPanelOpen };
        default:
          return {};
      }
    }),

  closeAllPanels: () =>
    set({
      questPanelOpen: false,
      inventoryPanelOpen: false,
      cyberwarePanelOpen: false,
      drugPanelOpen: false,
      housingPanelOpen: false,
    }),

  openModal: (modalId, data) =>
    set({ activeModal: modalId, modalData: data ?? null }),

  closeModal: () => set({ activeModal: null, modalData: null }),

  addAnimation: (anim) =>
    set((state) => ({
      animationQueue: [...state.animationQueue, anim],
    })),

  clearAnimations: () => set({ animationQueue: [] }),
}));

export default useUIStore;
