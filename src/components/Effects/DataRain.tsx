import { useEffect, useRef } from 'react';

const KATAKANA = [
  'ア', 'イ', 'ウ', 'エ', 'オ',
  'カ', 'キ', 'ク', 'ケ', 'コ',
  'サ', 'シ', 'ス', 'セ', 'ソ',
  'タ', 'チ', 'ツ', 'テ', 'ト',
  'ナ', 'ニ', 'ヌ', 'ネ', 'ノ',
  'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
  'マ', 'ミ', 'ム', 'メ', 'モ',
  'ヤ', 'ユ', 'ヨ',
  'ラ', 'リ', 'ル', 'レ', 'ロ',
  'ワ', 'ヲ', 'ン',
  'ガ', 'ギ', 'グ', 'ゲ', 'ゴ',
  'ザ', 'ジ', 'ズ', 'ゼ', 'ゾ',
  'ダ', 'ヂ', 'ヅ', 'デ', 'ド',
  'バ', 'ビ', 'ブ', 'ベ', 'ボ',
  'パ', 'ピ', 'プ', 'ペ', 'ポ',
];

const DIGITS = '0123456789';
const SYMBOLS = ':_;.,-=+*/<>[]{}|';

const CHARSET = [...KATAKANA, ...DIGITS, ...SYMBOLS];

interface Column {
  x: number;
  y: number;
  speed: number;
  length: number;
  chars: string[];
  lastUpdate: number;
}

const CHAR_SIZE = 14;
const FALL_INTERVAL = 40; // ms between character drops

function getRandomChar(): string {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)];
}

function createColumn(x: number, canvasHeight: number): Column {
  const length = Math.floor(Math.random() * 15) + 8;
  const chars: string[] = [];
  for (let i = 0; i < length; i++) {
    chars.push(getRandomChar());
  }
  return {
    x,
    y: -length * CHAR_SIZE,
    speed: Math.random() * 60 + 40, // pixels per second
    length,
    chars,
    lastUpdate: performance.now(),
  };
}

export default function DataRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let columns: Column[] = [];
    let animationId: number;
    let lastTime = performance.now();

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const colCount = Math.floor(canvas.width / CHAR_SIZE);
      columns = [];
      for (let i = 0; i < colCount; i++) {
        columns.push(createColumn(i * CHAR_SIZE, canvas.height));
      }
    }

    function draw(time: number) {
      if (!canvas || !ctx) return;

      const deltaSec = (time - lastTime) / 1000;
      lastTime = time;

      // Semi-transparent black to create fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${CHAR_SIZE}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      for (const col of columns) {
        col.y += col.speed * deltaSec;

        // Reset column when it goes off screen
        if (col.y - col.length * CHAR_SIZE > canvas.height) {
          const newCol = createColumn(col.x, canvas.height);
          col.y = newCol.y;
          col.chars = newCol.chars;
          col.speed = newCol.speed;
          col.length = newCol.length;
        }

        // Periodically change characters
        if (time - col.lastUpdate > FALL_INTERVAL * (Math.random() * 0.5 + 0.75)) {
          const changeIndex = Math.floor(Math.random() * col.length);
          col.chars[changeIndex] = getRandomChar();
          col.lastUpdate = time;
        }

        // Draw characters
        for (let i = 0; i < col.length; i++) {
          const charY = col.y - i * CHAR_SIZE;
          if (charY < -CHAR_SIZE || charY > canvas.height + CHAR_SIZE) continue;

          // Leading character is brightest
          if (i === 0) {
            ctx.fillStyle = 'rgba(180, 255, 180, 0.9)';
          } else if (i < 4) {
            ctx.fillStyle = `rgba(0, 255, 65, ${0.7 - i * 0.1})`;
          } else {
            ctx.fillStyle = `rgba(0, 255, 65, ${0.4 - (i / col.length) * 0.3})`;
          }

          ctx.fillText(col.chars[i], col.x, charY);
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0"
      style={{
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
