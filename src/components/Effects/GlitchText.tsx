import { cn } from '@/lib/utils';

interface GlitchTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  color?: string;
  glitchOnHover?: boolean;
}

const TAG_MAP = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  p: 'p',
} as const;

export default function GlitchText({
  text,
  as = 'h1',
  className,
  color,
  glitchOnHover = false,
}: GlitchTextProps) {
  const Tag = TAG_MAP[as];

  return (
    <Tag
      data-text={text}
      className={cn(
        'relative inline-block',
        glitchOnHover ? 'glitch-hover' : 'glitch-auto',
        className
      )}
      style={color ? { color } : undefined}
    >
      {text}
      <style>{`
        .glitch-auto::before,
        .glitch-auto::after,
        .glitch-hover::before,
        .glitch-hover::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .glitch-auto::before {
          color: #ff00ff;
          z-index: -1;
          animation: glitch-shift 3s infinite;
        }
        .glitch-auto::after {
          color: #00fff7;
          z-index: -1;
          animation: glitch-shift 2.8s infinite -1s;
        }
        .glitch-hover:hover::before {
          color: #ff00ff;
          z-index: -1;
          animation: glitch-shift 0.3s ease-in-out;
        }
        .glitch-hover:hover::after {
          color: #00fff7;
          z-index: -1;
          animation: glitch-shift 0.28s ease-in-out -0.1s;
        }
        @keyframes glitch-shift {
          0%, 90%, 100% { transform: translate(0); }
          92% { transform: translate(-3px, 1px); }
          94% { transform: translate(3px, -1px); }
          96% { transform: translate(-2px, -1px); }
          98% { transform: translate(2px, 1px); }
        }
      `}</style>
    </Tag>
  );
}
