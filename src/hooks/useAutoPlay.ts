import { useEffect, useRef, useCallback } from 'react';
import useGameStore from '@/stores/gameStore';

function useAutoPlay(processTurn: () => void) {
  const autoMode = useGameStore((s) => s.autoMode);
  const autoSpeed = useGameStore((s) => s.autoSpeed);
  const phase = useGameStore((s) => s.phase);

  const processTurnRef = useRef(processTurn);
  processTurnRef.current = processTurn;

  const stopRef = useRef<(() => void) | null>(null);

  const getDelay = useCallback((speed: number): number => {
    // speed 1-5，对应延迟 2000ms - 200ms
    const minDelay = 200;
    const maxDelay = 2000;
    const normalized = Math.max(1, Math.min(5, speed));
    const delay = maxDelay - ((normalized - 1) / 4) * (maxDelay - minDelay);
    return Math.round(delay);
  }, []);

  const stop = useCallback(() => {
    stopRef.current = null;
  }, []);

  const start = useCallback(() => {
    stop();
    const delay = getDelay(autoSpeed);
    const id = setInterval(() => {
      // 只在 PLAYING 阶段自动执行
      const state = useGameStore.getState();
      if (state.phase !== 'PLAYING' || stopRef.current === null) {
        clearInterval(id);
        return;
      }
      processTurnRef.current();
    }, delay);
    stopRef.current = () => clearInterval(id);
  }, [autoSpeed, getDelay]);

  // 自动模式切换时启停
  useEffect(() => {
    if (autoMode && phase === 'PLAYING') {
      start();
    } else {
      stop();
    }
    return stop;
  }, [autoMode, phase, start, stop]);

  // autoSpeed 变化时重新设定
  useEffect(() => {
    if (autoMode && phase === 'PLAYING') {
      start();
    }
  }, [autoSpeed, autoMode, phase, start]);

  // 当 phase 不是 PLAYING 时强制停止
  useEffect(() => {
    if (phase !== 'PLAYING') {
      stop();
    }
  }, [phase, stop]);

  return { start, stop };
}

export default useAutoPlay;
