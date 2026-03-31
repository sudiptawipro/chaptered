interface CountdownChipProps {
  days: number;
  label?: string;
}

export default function CountdownChip({ days, label = 'days' }: CountdownChipProps) {
  let colorClass = 'text-green border-green/30 bg-green/10';
  
  if (days <= 0) {
    colorClass = 'text-coral border-coral/30 bg-coral/10 shadow-[0_0_12px_rgba(255,107,107,0.3)]';
  } else if (days <= 3) {
    colorClass = 'text-coral border-coral/30 bg-coral/10 shadow-[0_0_8px_rgba(255,107,107,0.2)]';
  } else if (days <= 7) {
    colorClass = 'text-gold border-gold/30 bg-gold/10';
  }

  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
      {days <= 0 ? 'Urgent / Tdy' : `${days} ${label}`}
    </div>
  );
}
