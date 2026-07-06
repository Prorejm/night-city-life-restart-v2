import { cn } from '@/lib/utils';
import type { Talent } from '@/types';

interface TalentCardProps {
  talent: Talent;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const GRADE_CONFIG = {
  0: {
    label: '普通',
    border: 'border-gray-500/40',
    glow: 'shadow-[0_0_5px_rgba(107,114,128,0.2)]',
    text: 'text-gray-400',
  },
  1: {
    label: '稀有',
    border: 'border-blue-500/40',
    glow: 'shadow-[0_0_5px_rgba(59,130,246,0.2)]',
    text: 'text-blue-400',
  },
  2: {
    label: '史诗',
    border: 'border-purple-500/40',
    glow: 'shadow-[0_0_5px_rgba(168,85,247,0.2)]',
    text: 'text-purple-400',
  },
  3: {
    label: '传说',
    border: 'border-yellow-500/40',
    glow: 'shadow-[0_0_8px_rgba(234,179,8,0.3)]',
    text: 'text-yellow-400',
  },
} as const;

export default function TalentCard({
  talent,
  selected = false,
  onClick,
  className,
}: TalentCardProps) {
  const grade = GRADE_CONFIG[talent.grade as keyof typeof GRADE_CONFIG] ?? GRADE_CONFIG[0];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 rounded-sm transition-all duration-200',
        'bg-black/40 backdrop-blur-sm border',
        'hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-cyan',
        grade.border,
        grade.glow,
        selected && [
          'ring-1 ring-neon-cyan bg-neon-cyan/5',
          'shadow-[0_0_12px_rgba(0,255,247,0.15)]',
        ],
        className
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-display text-sm font-bold text-foreground">
          {talent.name}
        </span>
        <span className={cn('text-[10px] font-mono uppercase tracking-wider', grade.text)}>
          {grade.label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {talent.description}
      </p>
    </button>
  );
}
