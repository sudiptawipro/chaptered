import { useState } from 'react';

interface FlipCardProps {
  front: string;
  back: string;
  className?: string;
  onFlip?: (isFlipped: boolean) => void;
}

export default function FlipCard({ front, back, className = '', onFlip }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (onFlip) onFlip(!isFlipped);
  };

  return (
    <div 
      className={`relative w-full h-64 cursor-pointer ${className}`} 
      onClick={handleFlip}
      style={{ perspective: '1000px' }}
    >
      <div 
        className={`w-full h-full transition-transform duration-700 relative`}
        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Front */}
        <div 
          className="absolute w-full h-full backface-hidden bg-bg-card border border-border rounded-xl p-6 flex items-center justify-center text-center shadow-lg"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex flex-col items-center gap-4">
            <span className="text-sm font-semibold text-text-muted uppercase tracking-widest">Question</span>
            <p className="text-xl font-medium text-white">{front}</p>
          </div>
        </div>

        {/* Back */}
        <div 
          className="absolute w-full h-full backface-hidden bg-bg-raised border border-accent/20 rounded-xl p-6 flex items-center justify-center text-center shadow-lg transform rotate-y-180"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex flex-col items-center gap-4">
            <span className="text-sm font-semibold text-accent uppercase tracking-widest">Answer</span>
            <p className="text-lg text-text">{back}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
