import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type NeonColor = 'cyan' | 'magenta' | 'yellow' | 'red';

interface NeonBorderProps {
  children: ReactNode;
  color?: NeonColor;
  className?: string;
  thickness?: number;
}

const COLOR_MAP: Record<NeonColor, { hex: string; rgba: string }> = {
  cyan: { hex: '#00fff7', rgba: 'rgba(0, 255, 247' },
  magenta: { hex: '#ff00ff', rgba: 'rgba(255, 0, 255' },
  yellow: { hex: '#ffea00', rgba: 'rgba(255, 234, 0' },
  red: { hex: '#ff0044', rgba: 'rgba(255, 0, 68' },
};

export default function NeonBorder({
  children,
  color = 'cyan',
  className,
  thickness = 1,
}: NeonBorderProps) {
  const c = COLOR_MAP[color];
  const glowSize = thickness * 5;

  return (
    <div
      className={cn('relative', className)}
      style={{
        border: `${thickness}px solid ${c.hex}`,
        boxShadow: `
          0 0 ${glowSize}px ${c.rgba}, 0.3),
          0 0 ${glowSize * 2}px ${c.rgba}, 0.15),
          inset 0 0 ${glowSize}px ${c.rgba}, 0.1)
        `,
      }}
    >
      {children}
    </div>
  );
}
