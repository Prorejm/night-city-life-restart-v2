import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import useGameStore from '@/stores/gameStore';

const LOADING_TIPS = [
  '正在连接夜之城数据库...',
  '校准义体接口...',
  '下载街头情报...',
  '同步企业信用评级...',
  '加载赛博空间地图...',
  '初始化创伤小组协议...',
  '解析黑市交易记录...',
  '编译神经接口驱动...',
  '更新NCPD通缉名单...',
  '验证基因序列档案...',
];

const LOADING_DURATION = 3000; // ms
const TICK_INTERVAL = 120; // ms

interface LoadingScreenProps {
  onComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const setPhase = useGameStore((s) => s.setPhase);

  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const totalTicks = Math.floor(LOADING_DURATION / TICK_INTERVAL);

  const handleComplete = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      setPhase('MENU');
      onComplete?.();
    }, 600);
  }, [setPhase, onComplete]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + 1, totalTicks);
        if (next >= totalTicks) {
          clearInterval(timer);
          return totalTicks;
        }
        return next;
      });

      // 随机切换提示文本
      if (Math.random() < 0.15) {
        setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
      }

      // 随机故障效果
      if (Math.random() < 0.12) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 150);
      }
    }, TICK_INTERVAL);

    return () => clearInterval(timer);
  }, [totalTicks]);

  useEffect(() => {
    if (progress >= totalTicks) {
      const delay = setTimeout(() => handleComplete(), 400);
      return () => clearTimeout(delay);
    }
  }, [progress, totalTicks, handleComplete]);

  const percent = Math.round((progress / totalTicks) * 100);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-600',
        fadeOut ? 'opacity-0' : 'opacity-100'
      )}
    >
      {/* Logo / Title */}
      <div className="mb-12 text-center">
        <h1
          className={cn(
            'font-display text-4xl font-bold tracking-[0.3em] text-neon-cyan md:text-5xl',
            glitchActive && 'animate-glitch'
          )}
          data-text="NIGHT CITY LIFE"
        >
          NIGHT CITY LIFE
        </h1>
        <h1
          className={cn(
            'font-display text-4xl font-bold tracking-[0.3em] text-neon-magenta md:text-5xl',
            glitchActive && 'animate-glitch'
          )}
          data-text="RESTART"
        >
          RESTART
        </h1>
      </div>

      {/* Deck of spinning cards animation */}
      <div className="relative mb-10 h-20 w-20">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-t-neon-cyan border-r-neon-magenta border-b-neon-cyan border-l-transparent" />
        <div className="absolute inset-2 animate-spin rounded-full border-2 border-t-neon-magenta border-r-neon-cyan border-b-neon-magenta border-l-transparent" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-xs text-neon-cyan">{percent}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 w-72 max-w-[80vw]">
        <div className="stat-bar w-full">
          <div
            className="stat-bar-fill bg-gradient-to-r from-neon-cyan to-neon-magenta"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Loading tip */}
      <p className="font-mono text-sm text-muted-foreground">
        <span className="inline-block w-2 animate-pulse text-neon-cyan">{'>'}</span>{' '}
        {LOADING_TIPS[tipIndex]}
      </p>
    </div>
  );
};

export default LoadingScreen;
