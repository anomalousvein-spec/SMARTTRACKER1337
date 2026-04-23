import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { m } from 'framer-motion';

interface EmptyStateCardProps {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  compact?: boolean;
}

const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon: Icon,
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  compact = false,
}) => {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass relative overflow-hidden rounded-3xl border border-white/5 text-center ${compact ? 'px-6 py-14' : 'px-6 py-20'}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent" />
      <div className={`relative z-10 mx-auto flex items-center justify-center rounded-2xl border border-white/10 bg-theme-bg-secondary ${compact ? 'h-20 w-20' : 'h-28 w-28'}`}>
        <div className="absolute inset-0 rounded-full bg-blue-500/5 blur-2xl" />
        <Icon size={compact ? 32 : 56} className="relative z-10 text-theme-text-tertiary opacity-60" />
      </div>
      <div className="relative z-10 mt-8 space-y-3">
        {eyebrow && (
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-theme-text-tertiary">{eyebrow}</p>
        )}
        <p className={`${compact ? 'text-xl' : 'text-2xl'} font-black uppercase tracking-tight text-theme-text-primary`}>{title}</p>
        <p className="mx-auto max-w-xs text-sm font-bold leading-relaxed text-theme-text-tertiary">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="relative z-10 mt-8 inline-flex items-center gap-3 rounded-2xl bg-theme-accent px-8 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-1 hover:bg-blue-600 active:scale-95"
        >
          {actionLabel}
          {ActionIcon && <ActionIcon size={14} />}
        </button>
      )}
    </m.div>
  );
};

export default EmptyStateCard;
