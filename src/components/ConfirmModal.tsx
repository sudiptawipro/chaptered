import { AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmModal({ isOpen, title, description, confirmLabel = 'Delete', onConfirm, onCancel, danger = true }: ConfirmModalProps) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 backdrop-blur-sm bg-black/70" onClick={onCancel}>
      <div
        className="bg-bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${danger ? 'bg-coral/15' : 'bg-accent/15'}`}>
            <AlertTriangle size={32} className={danger ? 'text-coral' : 'text-accent'} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            <p className="text-sm text-text-muted leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold border border-border text-text-muted hover:text-white hover:bg-bg-raised transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onCancel(); }}
            className={`flex-1 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-lg ${danger ? 'bg-coral hover:bg-red-500 text-white shadow-coral/20' : 'bg-accent hover:bg-accent-hover text-white shadow-accent/20'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
