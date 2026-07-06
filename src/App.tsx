import { useEffect, useRef } from 'react';
import useGameStore from '@/stores/gameStore';
import useUIStore from '@/stores/uiStore';
import { cn } from '@/lib/utils';

import LoadingScreen from '@/components/Screens/LoadingScreen';
import MenuScreen from '@/components/Screens/MenuScreen';
import TalentSelectScreen from '@/components/Screens/TalentSelectScreen';
import AllocateScreen from '@/components/Screens/AllocateScreen';
import GameScreen from '@/components/Screens/GameScreen';
import DeathScreen from '@/components/Screens/DeathScreen';

/* ---- 全局装饰层 ---- */

/** 数据雨背景（简化版，全屏覆盖） */
const DataRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const columns = Math.floor(canvas.width / 24);
    const drops: number[] = Array(columns).fill(0);
    const chars = '日文片假名アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '12px JetBrains Mono';

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 24;
        const y = drops[i] * 18;
        ctx.fillStyle = `rgba(0, 255, 247, ${0.05 + Math.random() * 0.08})`;
        ctx.fillText(text, x, y);
        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 60);
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-30"
    />
  );
};

/** ScanLines - 扫描线覆盖层 */
const ScanLines: React.FC = () => (
  <div className="scanline-overlay" />
);

/** Vignette - 暗角效果 */
const Vignette: React.FC = () => (
  <div className="vignette-overlay" />
);

/** EventModal - 事件弹窗 */
const EventModal: React.FC = () => {
  const activeModal = useUIStore((s) => s.activeModal);
  const modalData = useUIStore((s) => s.modalData);
  const closeModal = useUIStore((s) => s.closeModal);

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="panel-card mx-4 w-full max-w-md rounded-sm p-6">
        <div className="mb-4">
          <h3 className="font-display text-lg font-bold tracking-wider text-neon-cyan">
            {activeModal}
          </h3>
        </div>
        {modalData && (
          <div className="mb-4 font-mono text-xs text-muted-foreground">
            {typeof modalData === 'string' ? (
              <p>{modalData}</p>
            ) : (
              <pre className="whitespace-pre-wrap">{JSON.stringify(modalData, null, 2)}</pre>
            )}
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={closeModal}
            className="cyber-button !px-6 !py-1.5 !text-xs"
          >
            [ 关闭 ]
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---- App 根组件 ---- */

const App: React.FC = () => {
  const phase = useGameStore((s) => s.phase);

  // 根据 phase 渲染对应页面
  const renderScreen = () => {
    switch (phase) {
      case 'LOADING':
        return <LoadingScreen />;
      case 'MENU':
        return <MenuScreen />;
      case 'TALENT_SELECT':
        return <TalentSelectScreen />;
      case 'ALLOCATE':
        return <AllocateScreen />;
      case 'PLAYING':
        return <GameScreen />;
      case 'DEATH':
        return <DeathScreen />;
      default:
        return <MenuScreen />;
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* 全局背景装饰 */}
      <DataRain />
      <ScanLines />
      <Vignette />

      {/* 页面内容 */}
      <div className="relative z-10 h-full w-full">
        {renderScreen()}
      </div>

      {/* 全局弹窗 */}
      <EventModal />
    </div>
  );
};

export default App;
