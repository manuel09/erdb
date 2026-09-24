'use client';

import type { ReactNode } from 'react';
import { Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
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
        {subtitle && <p className="mt-0.5 truncate text-[11px] text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
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
    <div className={`${CARD_CLASS} ${className ?? ''}`}>
      {(title || actions) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <div className="text-xs font-semibold text-slate-200">{title}</div>}
            {description && <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{description}</p>}
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
    <label className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      {children}
      {hint && <span className="text-[10px] leading-relaxed text-slate-500">{hint}</span>}
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
    <div className={`flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-black/30 px-3.5 py-3 ${className ?? ''}`}>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-medium text-slate-200">{label}</span>
        {hint && <span className="text-[10px] leading-relaxed text-slate-500">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors ${checked ? 'bg-orange-500/80' : 'bg-white/10'}`}
      >
        <span className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
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
    <div className={`flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 ${toneClass} ${className ?? ''}`}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
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
        className="w-24 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none transition focus:border-orange-400/50"
      />
      <button
        type="button"
        onClick={onReset}
        className="cursor-pointer rounded-xl border border-white/5 bg-[#0a0a0a] px-3 py-2 text-xs font-semibold text-slate-400 transition-colors hover:bg-[#121212] hover:text-slate-200"
      >
        Auto
      </button>
    </div>
  );
}
