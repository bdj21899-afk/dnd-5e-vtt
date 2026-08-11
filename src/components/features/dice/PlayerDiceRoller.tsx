import { useState, useCallback } from 'react';
import { broadcastDiceRoll } from '@/lib/gameApi';
import { DiceRollOverlay } from './DiceRollOverlay';
import { DiceRollBroadcast } from '@/types/dnd';

interface Props {
  sessionId: string;
  playerId: string;
  playerName: string;
  compact?: boolean;
}

const D20_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

export function PlayerDiceRoller({ sessionId, playerId, playerName, compact }: Props) {
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [currentRoll, setCurrentRoll] = useState<DiceRollBroadcast | null>(null);
  const [animFace, setAnimFace] = useState('?');

  const rollD20 = useCallback(async () => {
    if (rolling) return;
    setRolling(true);
    setAnimFace('?');

    const result = Math.floor(Math.random() * 20) + 1;

    // Spin animation (local)
    let c = 0;
    const interval = setInterval(() => {
      setAnimFace(D20_FACES[Math.floor(Math.random() * 6)]);
      c++;
      if (c >= 10) {
        clearInterval(interval);
        setAnimFace(String(result));
        setLastRoll(result);
        setRolling(false);
      }
    }, 70);

    // Broadcast
    await broadcastDiceRoll(sessionId, playerId, playerName, 'd20', result);
    const roll: DiceRollBroadcast = {
      id: Date.now().toString(), sessionId, playerName, playerId,
      die: 'd20', result, createdAt: new Date().toISOString(),
    };
    setCurrentRoll(roll);
  }, [rolling, sessionId, playerId, playerName]);

  const isCrit = lastRoll === 20;
  const isFumble = lastRoll === 1;

  if (compact) {
    return (
      <>
        <DiceRollOverlay roll={currentRoll} isOwn/>
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0b0e1a] border-t border-amber-900/30">
          <button
            onClick={rollD20}
            disabled={rolling}
            className={`flex items-center gap-2 rounded px-4 py-2 text-xs font-bold tracking-widest border transition-all ${
              isCrit ? 'bg-amber-700/60 border-amber-500/70 text-amber-200' :
              isFumble ? 'bg-red-900/50 border-red-700/60 text-red-300' :
              'bg-[#0d1525] border-amber-900/40 hover:border-amber-700 text-amber-600 hover:text-amber-400'
            } disabled:opacity-50`}
          >
            <span className="text-lg leading-none" style={{ animation: rolling ? 'diceShake 0.07s infinite' : 'none' }}>
              {rolling ? animFace : '🎲'}
            </span>
            {rolling ? 'Rolling…' : `Roll d20${lastRoll ? ` · ${lastRoll}` : ''}`}
            {isCrit && !rolling && <span className="text-amber-400 text-[10px]">✦ CRIT</span>}
            {isFumble && !rolling && <span className="text-red-400 text-[10px]">✦ MISS</span>}
          </button>
        </div>
        <style>{`
          @keyframes diceShake {
            0%,100% { transform: rotate(0deg); }
            25% { transform: rotate(-20deg); }
            75% { transform: rotate(20deg); }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <DiceRollOverlay roll={currentRoll} isOwn/>
      <button
        onClick={rollD20}
        disabled={rolling}
        className="group relative flex flex-col items-center justify-center w-20 h-20 rounded-xl border-2 border-amber-800/50 hover:border-amber-600 bg-[#0d1525] hover:bg-amber-900/20 transition-all disabled:opacity-50"
      >
        <span className="text-4xl leading-none" style={{ animation: rolling ? 'diceShake 0.07s infinite' : 'none' }}>
          {rolling ? animFace : '🎲'}
        </span>
        <span className="text-[10px] text-amber-700 tracking-widest mt-1">d20</span>
        {lastRoll !== null && !rolling && (
          <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center border ${isCrit ? 'bg-amber-500 border-amber-400 text-amber-900' : isFumble ? 'bg-red-600 border-red-500 text-white' : 'bg-[#1a1f2e] border-amber-800/60 text-amber-400'}`}>
            {lastRoll}
          </span>
        )}
      </button>
    </>
  );
}
