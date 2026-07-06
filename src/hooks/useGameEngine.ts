import { useCallback, useRef, useMemo } from 'react';
import { GameEngine, createGameEngine } from '@/core/GameEngine';
import useGameStore from '@/stores/gameStore';
import usePlayerStore from '@/stores/playerStore';
import useUIStore from '@/stores/uiStore';
import type { EventLogEntry, GameEvent, DeathRecord, RebirthOptions, HousingLevel, InsuranceLevel } from '@/types';

function useGameEngine() {
  const engineRef = useRef<GameEngine | null>(null);

  // 延迟初始化 GameEngine
  const getEngine = useCallback((): GameEngine => {
    if (!engineRef.current) {
      const gameStore = useGameStore;
      const playerStore = usePlayerStore;
      const uiStore = useUIStore;

      // 适配 engine 接口
      const adaptedStores = {
        gameStore: {
          getState: () => {
            const s = gameStore.getState();
            return {
              phase: s.phase,
              turnCount: s.turnCount,
              currentAge: s.currentAge,
              currentYear: s.currentYear,
              autoMode: s.autoMode,
              autoSpeed: s.autoSpeed,
              runCount: s.runCount,
              totalDeaths: s.totalDeaths,
              rebirthPoints: s.rebirthPoints,
              inheritedTalents: s.inheritedTalents,
              deathHistory: s.deathHistory,
            };
          },
          setState: (partial: any) => {
            gameStore.setState(partial);
          },
        },
        playerStore: {
          getState: () => {
            const s = playerStore.getState();
            return {
              attributes: s.attributes as Record<string, number>,
              exp: {},
              level: 1,
              talents: s.talents,
              equippedCyberware: s.equippedCyberware,
              inventory: s.inventory,
              activeBuffs: s.activeBuffs,
              housing: s.housingLevel as HousingLevel,
              insurance: s.insuranceLevel as InsuranceLevel,
              drugAddiction: s.drugAddiction,
              currentDrugs: s.currentDrugs,
              deathCount: s.deathCount,
              totalPlayTime: 0,
            };
          },
          setState: (partial: any) => {
            // 将 engine 的 state 映射回 playerStore
            if (partial.attributes) {
              playerStore.setState({ attributes: partial.attributes });
            }
            if (partial.talents) {
              playerStore.setState({ talents: partial.talents });
            }
            if (partial.housing) {
              playerStore.setState({ housingLevel: partial.housing });
            }
            if (partial.insurance) {
              playerStore.setState({ insuranceLevel: partial.insurance });
            }
            if (partial.equippedCyberware) {
              playerStore.setState({ equippedCyberware: partial.equippedCyberware });
            }
            if (partial.inventory) {
              playerStore.setState({ inventory: partial.inventory });
            }
            if (partial.activeBuffs) {
              playerStore.setState({ activeBuffs: partial.activeBuffs });
            }
            if (partial.drugAddiction) {
              playerStore.setState({ drugAddiction: partial.drugAddiction });
            }
            if (partial.currentDrugs) {
              playerStore.setState({ currentDrugs: partial.currentDrugs });
            }
            if (partial.deathCount !== undefined) {
              playerStore.setState({ deathCount: partial.deathCount });
            }
          },
        },
        uiStore: {
          showEvent: (event: GameEvent, branches: string[]) => {
            console.log('[UI] Show event:', event.title, branches);
          },
          showDeathScreen: (record: DeathRecord) => {
            console.log('[UI] Death:', record.title);
          },
          showRebirthOptions: (options: RebirthOptions) => {
            console.log('[UI] Rebirth options:', options);
          },
          updateUI: () => {
            /* Zustand reactive - no-op */
          },
        },
      };

      engineRef.current = createGameEngine(adaptedStores);
    }
    return engineRef.current;
  }, []);

  const processTurn = useCallback((): EventLogEntry | null => {
    const engine = getEngine();
    const result = engine.processTurn();
    if (result) {
      useUIStore.getState().addEventLog(result);
    }
    return result;
  }, [getEngine]);

  const handleEventChoice = useCallback(
    (eventId: number, branchId: string) => {
      const engine = getEngine();
      engine.handleEventChoice(eventId, branchId);
    },
    [getEngine]
  );

  const startNewGame = useCallback(
    (talentCount?: number) => {
      const engine = getEngine();
      engine.startNewGame(talentCount);
    },
    [getEngine]
  );

  const prepareRebirth = useCallback((): RebirthOptions => {
    const engine = getEngine();
    return engine.prepareRebirth();
  }, [getEngine]);

  const executeRebirth = useCallback(
    (options: RebirthOptions) => {
      const engine = getEngine();
      engine.executeRebirth(options);
    },
    [getEngine]
  );

  const getPhase = useCallback(() => {
    return getEngine().getPhase();
  }, [getEngine]);

  return useMemo(
    () => ({
      processTurn,
      handleEventChoice,
      startNewGame,
      prepareRebirth,
      executeRebirth,
      getPhase,
      getEngine,
    }),
    [processTurn, handleEventChoice, startNewGame, prepareRebirth, executeRebirth, getPhase, getEngine]
  );
}

export default useGameEngine;
