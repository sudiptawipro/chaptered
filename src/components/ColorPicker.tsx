import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

export default function ColorPicker({ color, onChange, onClose }: ColorPickerProps) {
  const [custom, setCustom] = useState(color);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={onClose}>
      <div className="bg-bg-card border border-border shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex items-center justify-between bg-bg-sidebar">
          <h3 className="font-bold text-white text-lg">Choose Colour</h3>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors bg-bg-raised p-1.5 rounded-lg"><X size={20}/></button>
        </div>
        
        <div className="p-6 space-y-8">
          <div>
            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Presets</div>
            <div className="grid grid-cols-8 gap-3">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => onChange(c)}
                  className="w-8 h-8 rounded-full border-2 border-transparent hover:border-white/50 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 duration-200"
                  style={{ backgroundColor: c, boxShadow: color.toLowerCase() === c.toLowerCase() ? `0 0 15px ${c}80` : 'none', borderColor: color.toLowerCase() === c.toLowerCase() ? 'white' : 'transparent' }}
                >
                  {color.toLowerCase() === c.toLowerCase() && <Check size={16} className="text-white drop-shadow-md" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          <div>
             <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Custom HSL</div>
             <div className="flex items-center gap-4 bg-bg rounded-xl p-3 border border-border">
               <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-border shadow-inner relative flex-shrink-0 group">
                 <input 
                   type="color" 
                   value={custom} 
                   onChange={e => { setCustom(e.target.value); onChange(e.target.value); }}
                   className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                 />
               </div>
               <input 
                 type="text" 
                 value={custom.toUpperCase()} 
                 onChange={e => { setCustom(e.target.value); onChange(e.target.value); }}
                 className="flex-1 bg-transparent border-none outline-none text-white font-mono text-lg font-bold uppercase tracking-wider focus:text-accent transition-colors"
               />
             </div>
          </div>
        </div>

        <div className="p-5 border-t border-border bg-bg-sidebar flex justify-end">
          <button onClick={onClose} className="bg-white hover:bg-gray-200 text-black px-8 py-3 rounded-xl font-bold transition-transform hover:scale-105 shadow-xl shadow-white/10">
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
