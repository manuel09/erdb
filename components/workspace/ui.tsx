'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Info, AlertTriangle, CheckCircle2, XCircle, ChevronDown, type LucideIcon } from 'lucide-react';
import { CARD_CLASS } from './constants';

const ACCENTS = {
  orange: 'border-orange-500/20 bg-orange-500/10 text-orange-400',
  sky: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
  teal: 'border-teal-500/20 bg-teal-500/10 text-teal-400',
  violet: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
} as const;

export type PanelAccent = keyof typeof ACCENTS;

export function PanelHeader({
  icon,
  title,
  subtitle,
  accent = 'orange',
  actions,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  accent?: PanelAccent;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${ACCENTS[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 truncate text-[11px] text-slate-400">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Section({
  icon: Icon,
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.10] transition-colors">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors duration-200 hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-orange-400/60 focus-visible:outline-none"
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            open ? 'border-orange-400/30 bg-orange-500/10 text-orange-300' : 'border-white/[0.12] text-slate-100'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="mono-label block text-white">{title}</span>
          {hint && <span className="mt-1 block text-[11px] leading-snug text-slate-400">{hint}</span>}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="shrink-0 text-slate-400"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 px-3 pb-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div data-card className={`${CARD_CLASS} [&_[data-row]]:rounded-none [&_[data-row]]:border-0 [&_[data-row]]:px-0 [&_[data-row]]:py-0.5 ${className ?? ''}`}>
      {(title || actions) && (
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <div className="mono-label text-slate-100">{title}</div>}
            {description && <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ''}`}>
      <span className="mono-label">{label}</span>
      {children}
      {hint && <span className="text-[10px] leading-relaxed text-slate-400">{hint}</span>}
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  className,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div data-row className={`flex items-center justify-between gap-2.5 rounded-xl border border-white/[0.10] bg-white/[0.015] px-3 py-2.5 ${className ?? ''}`}>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[12px] font-medium text-white">{label}</span>
        {hint && <span className="text-[10.5px] leading-snug text-slate-400">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-[2px] transition-colors focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-none ${checked ? 'bg-orange-500/80' : 'bg-white/10'}`}
      >
        <motion.span
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 26, mass: 0.6 }}
          className="block h-5 w-5 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  );
}

const NOTICE_TONES = {
  info: { className: 'border-sky-400/20 bg-sky-500/10 text-sky-200', icon: Info },
  warning: { className: 'border-amber-400/25 bg-amber-500/10 text-amber-200', icon: AlertTriangle },
  success: { className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200', icon: CheckCircle2 },
  danger: { className: 'border-rose-400/25 bg-rose-500/10 text-rose-200', icon: XCircle },
} as const;

export function Notice({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof NOTICE_TONES;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const { className: toneClass, icon: Icon } = NOTICE_TONES[tone];
  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-3.5 py-3 ${toneClass} ${className ?? ''}`}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.08]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5 text-[11px] leading-relaxed">
        {title && <span className="font-semibold">{title}</span>}
        <span className="opacity-90">{children}</span>
      </div>
    </div>
  );
}

export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  placeholder = 'Auto',
  onReset,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value === '' ? null : parseInt(event.target.value, 10))}
        placeholder={placeholder}
        className="h-9 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 text-xs text-white outline-none transition focus:border-orange-400/50 focus-visible:ring-2 focus-visible:ring-orange-400/40"
      />
      <button
        type="button"
        onClick={onReset}
        aria-label="Reset to auto"
        className="cursor-pointer rounded-xl border border-white/[0.08] px-2.5 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:bg-white/[0.05] hover:text-white"
      >
        Auto
      </button>
    </div>
  );
}
