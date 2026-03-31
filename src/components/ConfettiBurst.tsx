/**
 * ConfettiBurst — a lightweight CSS-only confetti burst.
 * Mount it temporarily when a homework task is completed.
 * Auto-destroys itself after the animation finishes.
 */
import { useEffect, useState } from 'react';

const COLORS = ['#FF6B9D', '#FBBF24', '#3DED7A', '#67E8F9', '#8B5CF6', '#FF6B6B', '#FFF'];

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  distance: number;
  size: number;
  duration: number;
  shape: 'circle' | 'rect';
}

interface ConfettiBurstProps {
  x: number;
  y: number;
  onDone: () => void;
}

export default function ConfettiBurst({ x, y, onDone }: ConfettiBurstProps) {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x,
      y,
      color: COLORS[i % COLORS.length],
      angle: (360 / 22) * i + (Math.random() * 20 - 10),
      distance: 60 + Math.random() * 80,
      size: 5 + Math.random() * 6,
      duration: 550 + Math.random() * 250,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }))
  );

  useEffect(() => {
    const timer = setTimeout(onDone, 900);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {particles.map(p => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.shape === 'rect' ? p.size * 0.5 : p.size,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
              backgroundColor: p.color,
              animation: `confetti-fly ${p.duration}ms ease-out forwards`,
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
