type ProgressBarProps = {
  current: number;
  target: number;
  label: string;
  compact?: boolean;
};

export function ProgressBar({ current, target, label, compact = false }: ProgressBarProps) {
  const value = Math.max(0, current);
  const percentage = target > 0 ? Math.min(Math.round(value / target * 100), 100) : 0;

  return <div className={compact ? "mt-2" : "mt-3"}>
    <div className="mb-1 flex items-baseline justify-between gap-3">
      <p className={compact ? "text-lg font-semibold tabular-nums" : "text-xl font-semibold tabular-nums"}>{value}<span className={compact ? "text-sm font-medium text-zinc-500" : "text-base font-medium text-zinc-500"}> / {target}</span></p>
      <p className={compact ? "text-xs font-semibold text-emerald-800" : "text-sm font-semibold text-emerald-800"}>{percentage}%</p>
    </div>
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(value, target)} className="h-2 overflow-hidden rounded-full bg-zinc-100">
      <div className="h-full rounded-full bg-emerald-700 transition-[width]" style={{ width: `${percentage}%` }} />
    </div>
  </div>;
}