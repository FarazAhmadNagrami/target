interface ProgressBarProps {
  value: number;   // 0-100
  color?: string;
  showLabel?: boolean;
  height?: string;
}

export function ProgressBar({ value, color = 'bg-blue-500', showLabel = true, height = 'h-3' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-end mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{pct.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
