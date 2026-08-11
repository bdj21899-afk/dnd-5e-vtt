import { useEffect, useState } from 'react';
import { DiceRollBroadcast } from '@/types/dnd';

interface Props {
  roll: DiceRollBroadcast | null;
  isOwn?: boolean;
}

const FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

export function DiceRollOverlay({ roll, isOwn }: Props) {
  const [phase, setPhase] = useState<'rolling' | 'result' | 'hidden'>('hidden');
  const [displayFace, setDisplayFace] = useState('?');
  const [spinCount, setSpinCount] = useState(0);

  useEffect(() => {
    if (!roll) return;
    setPhase('rolling');
    setSpinCount(0);

    // Spin animation: cycle through random faces
    let count = 0;
    const spinInterval = setInterval(() => {
      setDisplayFace(FACES[Math.floor(Math.random() * 6)]);
      count++;
      setSpinCount(count);
      if (count >= 12) {
        clearInterval(spinInterval);
        setDisplayFace(String(roll.result));
        setPhase('result');
        // Auto-hide after 2.5s
        setTimeout(() => setPhase('hidden'), 2500);
      }
    }, 80);

    return () => clearInterval(spinInterval);
  }, [roll]);

  if (phase === 'hidden' || !roll) return null;

  const isCrit = roll.result === 20 && roll.die === 'd20';
  const isFumble = roll.result === 1 && roll.die === 'd20';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Dramatic background flash */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: isCrit
            ? 'radial-gradient(ellipse at center, rgba(245,158,11,0.25) 0%, transparent 70%)'
            : isFumble
              ? 'radial-gradient(ellipse at center, rgba(239,68,68,0.2) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at center, rgba(30,20,5,0.4) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-2" style={{
        animation: phase === 'rolling' ? 'diceShake 0.08s infinite' : 'dicePop 0.3s ease-out',
      }}>
        {/* Die face */}
        <div
          className="flex items-center justify-center rounded-2xl border-4 shadow-2xl font-bold font-mono"
          style={{
            width: 140, height: 140,
            fontSize: phase === 'rolling' ? 72 : roll.result >= 10 ? 56 : 72,
            background: isCrit ? 'linear-gradient(135deg,#92400e,#d97706)' : isFumble ? 'linear-gradient(135deg,#7f1d1d,#dc2626)' : 'linear-gradient(135deg,#1e1a0a,#3d2c0a)',
            borderColor: isCrit ? '#f59e0b' : isFumble ? '#ef4444' : '#78350f',
            color: isCrit ? '#fef3c7' : isFumble ? '#fee2e2' : '#fde68a',
            boxShadow: isCrit ? '0 0 60px rgba(245,158,11,0.6)' : isFumble ? '0 0 60px rgba(239,68,68,0.4)' : '0 20px 60px rgba(0,0,0,0.8)',
          }}>
          {displayFace}
        </div>

        {/* Roll info */}
        {phase === 'result' && (
          <div className="text-center">
            <div className="text-amber-300 font-bold text-lg tracking-wide" style={{ fontFamily: 'Georgia,serif' }}>
              {roll.playerName}
            </div>
            <div className="text-amber-600 text-sm">rolled {roll.die}</div>
            {isCrit && <div className="text-amber-400 font-bold text-base tracking-widest mt-1 animate-pulse">✦ CRITICAL HIT! ✦</div>}
            {isFumble && <div className="text-red-400 font-bold text-base tracking-widest mt-1">✦ CRITICAL MISS ✦</div>}
          </div>
        )}
      </div>

      <style>{`
        @keyframes diceShake {
          0%,100% { transform: translate(0,0) rotate(0deg); }
          25% { transform: translate(-4px,2px) rotate(-8deg); }
          75% { transform: translate(4px,-2px) rotate(8deg); }
        }
        @keyframes dicePop {
          0% { transform: scale(0.6); opacity:0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity:1; }
        }
      `}</style>
    </div>
  );
}
