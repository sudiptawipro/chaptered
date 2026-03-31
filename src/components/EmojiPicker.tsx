import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import * as Icons from 'lucide-react';

const ICON_CATEGORIES = [
  {
    name: 'Academic',
    icons: ['BookOpen', 'GraduationCap', 'Microscope', 'FlaskConical', 'Library',
            'PenTool', 'Calculator', 'BookMarked', 'NotebookPen', 'Scroll',
            'Ruler', 'Compass', 'FileText', 'ClipboardList', 'PenLine'],
  },
  {
    name: 'Science & Nature',
    icons: ['Atom', 'TestTube', 'Leaf', 'Bug', 'Waves', 'Mountain', 'Sun', 'Moon',
            'Zap', 'Flame', 'Droplets', 'Wind', 'Snowflake', 'Globe', 'Dna'],
  },
  {
    name: 'Maths & Logic',
    icons: ['Sigma', 'Divide', 'Percent', 'Hash', 'BrainCircuit', 'Network',
            'GitBranch', 'Infinity', 'BarChart2', 'PieChart', 'TrendingUp',
            'Scale', 'Binary', 'CircleDot', 'Layers'],
  },
  {
    name: 'History & Culture',
    icons: ['Landmark', 'Building', 'Globe2', 'MapPin', 'Flag', 'Crown',
            'Scroll', 'Theater', 'Map', 'Compass', 'Shield',
            'Sword', 'Columns', 'Monument', 'Castle'],
  },
  {
    name: 'Tech & Code',
    icons: ['Cpu', 'Code', 'Database', 'Terminal', 'Fingerprint', 'Wifi',
            'Monitor', 'Laptop', 'Server', 'HardDrive', 'GitMerge',
            'Bug', 'Lock', 'Key', 'Webhook'],
  },
  {
    name: 'Creative & Arts',
    icons: ['Palette', 'Music', 'Camera', 'Feather', 'Lightbulb', 'Wand2',
            'Pen', 'Brush', 'Film', 'Headphones', 'Star',
            'Sparkles', 'Heart', 'Diamond', 'Gem'],
  },
  {
    name: 'Language & Communication',
    icons: ['MessageCircle', 'Languages', 'BookA', 'Quote', 'Type',
            'AlignLeft', 'Mic', 'Radio', 'Newspaper', 'Mail',
            'Speech', 'Subtitles', 'LetterText', 'TextCursorInput', 'FileCode'],
  },
  {
    name: 'Sports & Health',
    icons: ['Activity', 'Bike', 'Dumbbell', 'Trophy', 'Medal',
            'Heart', 'Timer', 'Target', 'Crosshair', 'Footprints',
            'Waves', 'PersonStanding', 'TreePine', 'Flower2', 'Apple'],
  },
];

interface EmojiPickerProps {
  onSelect: (iconName: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [query, setQuery] = useState('');

  const lq = query.toLowerCase();

  const filteredCategories = ICON_CATEGORIES.map(cat => ({
    ...cat,
    icons: cat.icons.filter(iconName => {
      if (!query) return true;
      // Match icon name or category name
      return iconName.toLowerCase().includes(lq) || cat.name.toLowerCase().includes(lq);
    }),
  })).filter(cat => cat.icons.length > 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden"
        style={{
          background: 'rgba(16,16,26,0.90)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 32px 80px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="font-bold text-white text-lg">Choose Icon</h3>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/8">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Search size={15} className="text-text-muted flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search icons..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none text-white outline-none text-sm font-medium placeholder:text-text-muted"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-text-muted hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Icons grid */}
        <div className="max-h-[380px] overflow-y-auto p-4 space-y-5">
          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-text-muted text-sm">No icons match "{query}"</div>
          )}
          {filteredCategories.map(cat => (
            <div key={cat.name}>
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">{cat.name}</div>
              <div className="grid grid-cols-5 gap-2">
                {cat.icons.map(iconName => {
                  const LucideIcon = (Icons as any)[iconName];
                  if (!LucideIcon) return null;
                  return (
                    <button
                      key={iconName}
                      onClick={() => { onSelect(iconName); onClose(); }}
                      className="p-3 text-text-muted hover:text-white rounded-xl border transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                      title={iconName}
                    >
                      <LucideIcon size={22} strokeWidth={1.8} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
