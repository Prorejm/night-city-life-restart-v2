import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import useGameStore from '@/stores/gameStore';
import useGameEngine from '@/hooks/useGameEngine';

const VERSION = 'v0.1.0-alpha';

interface MenuScreenProps {
  onNewGame?: () => void;
  onLoadGame?: () => void;
  onSettings?: () => void;
}

const MenuScreen: React.FC<MenuScreenProps> = ({ onNewGame, onLoadGame, onSettings }) => {
  const setPhase = useGameStore((s) => s.setPhase);
  const runCount = useGameStore((s) => s.runCount);
  const totalDeaths = useGameStore((s) => s.totalDeaths);

  const [glitchActive, setGlitchActive] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const hasSave = runCount > 0;

  // 数据雨背景动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const columns = Math.floor(canvas.width / 20);
    const drops: number[] = Array(columns).fill(0);
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = '14px JetBrains Mono';
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 20;
        const y = drops[i] * 20;

        // 渐变颜色 - 顶部亮绿色，底部渐隐
        const gradient = ctx.createLinearGradient(x, y - 20, x, y);
        gradient.addColorStop(0, 'rgba(0, 255, 247, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 255, 247, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 45);

    // 入口动画
    const enterTimer = setTimeout(() => setShowButtons(true), 800);

    // 定时故障
    const glitchTimer = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 5000);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      clearInterval(glitchTimer);
      clearTimeout(enterTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const { startNewGame } = useGameEngine();

  const handleNewGame = () => {
    onNewGame?.();
    startNewGame(); // 初始化 GameEngine stateMachine，内部会设置 phase 为 TALENT_SELECT
  };

  const handleLoadGame = () => {
    onLoadGame?.();
    // TODO: 加载存档逻辑
  };

  const handleSettings = () => {
    onSettings?.();
    // TODO: 设置面板逻辑
  };

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden">
      {/* 数据雨 Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 opacity-40"
      />

      {/* 内容层 */}
      <div className="relative z-10 flex flex-col items-center">
        {/* 主标题 */}
        <div className="mb-2 text-center">
          <h1
            className={cn(
              'font-display text-5xl font-black tracking-[0.4em] md:text-7xl',
              'text-neon-cyan',
              glitchActive && 'animate-glitch'
            )}
            data-text="NIGHT CITY LIFE"
          >
            NIGHT CITY LIFE
          </h1>
          <h1
            className={cn(
              'font-display text-5xl font-black tracking-[0.4em] md:text-7xl',
              'text-neon-magenta',
              glitchActive && 'animate-glitch'
            )}
            data-text="RESTART"
          >
            RESTART
          </h1>
        </div>

        {/* 副标题 */}
        <p className="mb-10 font-mono text-sm tracking-widest text-muted-foreground md:text-base">
          {'< '}赛博朋克美国生存重开模拟器{' />'}
        </p>

        {/* 统计信息 */}
        {totalDeaths > 0 && (
          <div className="mb-8 flex gap-6 text-center font-mono text-xs text-muted-foreground">
            <div>
              <span className="block text-neon-cyan">{runCount}</span>
              <span>开局次数</span>
            </div>
            <div>
              <span className="block text-neon-magenta">{totalDeaths}</span>
              <span>死亡次数</span>
            </div>
          </div>
        )}

        {/* 按钮组 */}
        <div
          className={cn(
            'flex flex-col items-center gap-4 transition-all duration-700',
            showButtons ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <button
            onClick={handleNewGame}
            className="cyber-button group relative w-56 text-center"
          >
            <span className="relative z-10">[ 新游戏 ]</span>
            <span className="absolute inset-0 bg-neon-cyan/5 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>

          <button
            onClick={handleLoadGame}
            disabled={!hasSave}
            className={cn(
              'cyber-button relative w-56 text-center transition-opacity',
              hasSave
                ? 'cursor-pointer opacity-100'
                : 'cursor-not-allowed opacity-30'
            )}
          >
            <span className="relative z-10">[ 读取存档 ]</span>
          </button>

          <button
            onClick={handleSettings}
            className="cyber-button relative w-56 text-center"
          >
            <span className="relative z-10">[ 设置 ]</span>
          </button>
        </div>

        {/* 底部信息 */}
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1">
          <p className="font-mono text-[10px] text-muted-foreground/50">
            {VERSION} | 基于赛博朋克规则书
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/30">
            &copy; {new Date().getFullYear()} Night City Life Team
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuScreen;
