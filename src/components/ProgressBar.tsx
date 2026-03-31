interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string; // hex code
  height?: number; // default 6
}

export default function ProgressBar({ progress, color = '#FF6B9D', height = 6 }: ProgressBarProps) {
  return (
    <div 
      className="w-full bg-border rounded-full overflow-hidden" 
      style={{ height: `${height}px` }}
    >
      <div 
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}
