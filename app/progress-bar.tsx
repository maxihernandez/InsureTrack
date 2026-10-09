type ProgressBarProps = {
  current: number;
  target: number;
  label: string;
};

export function ProgressBar({ current, target, label }: ProgressBarProps) {
  const value = Math.max(0, current);
  const percentage = target > 0 ? Math.min(Math.round(value / target * 100), 100) : 0;

  return <div className="mt-3">
    <div className="mb-1 flex items-baseline justify-between gap-3">
      <p className="text-xl font-semibold tabular-nums">{value}<span className="text-base font-medium text-zinc-500"> / {target}</span></p>
      <p className="text-sm font-semibold text-emerald-800">{percentage}%</p>
    </div>
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(value, target)} className="h-2 overflow-hidden rounded-full bg-zinc-100">
      <div className="h-full rounded-full bg-emerald-700 transition-[width]" style={{ width: `${percentage}%` }} />
    </div>
  </div>;
}
