
interface SubjectBadgeProps {
  color: string;
  name?: string;
  icon?: string;
  className?: string;
}

export default function SubjectBadge({ color, name, icon, className = '' }: SubjectBadgeProps) {
  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${className}`}
      style={{ 
        backgroundColor: `${color}15`, 
        color: color,
        borderColor: `${color}30`
      }}
    >
      {icon && <span>{icon}</span>}
      {name && <span>{name}</span>}
    </div>
  );
}
