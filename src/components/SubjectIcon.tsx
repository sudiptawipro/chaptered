import * as Icons from 'lucide-react';

interface SubjectIconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

export default function SubjectIcon({ name, size = 16, className = '', color = 'currentColor' }: SubjectIconProps) {
  const IconComponent = (Icons as any)[name];

  if (!IconComponent) {
    // Fallback if the stored icon name is invalid or an old emoji is still in state
    if (name && name.length <= 4) {
      // It's likely an old emoji string
      return <span className={className} style={{ fontSize: size }}>{name}</span>;
    }
    return <Icons.BookOpen size={size} className={className} color={color} />;
  }

  return <IconComponent size={size} className={className} color={color} />;
}
