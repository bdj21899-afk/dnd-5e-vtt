import { useState, useCallback, useRef } from 'react';
import { broadcastDiceRoll } from '@/lib/gameApi';
import { DiceRollOverlay } from './DiceRollOverlay';
import { DiceRollBroadcast } from '@/types/dnd';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  sessionId: string;
  playerId: string;
  playerName: string;
  compact?: boolean;
}

const DICE = [
  { sides: 4,  label: 'd4',  emoji: '▲', color: '#a855f7' },
  { sides: 6,  label: 'd6',  emoji: '⬡', color: '#3b82f6' },
  { sides: 8,  label: 'd8',  emoji: '◆', color: '#06b6d4' },
  { sides: 10, label: 'd10', emoji: '⬟', color: '#22c55e' },
  { sides: 12, label: 'd12', emoji: '⬠', color: '#f59e0b' },
  { sides: 20, label: 'd20', emoji: '⬣', color: '#ef4444' },
];

const DIE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

interface DieState {
  rolling: boolean;
  result: number | null;
  animFace: string;
}

export function PlayerDiceRoller({ sessionId, playerId, playerName, compact }: Props) {
  const [diceState, setDiceState] = useState<Record<string, DieState>>(() =>
    Object.fromEntries(DICE.map(d => [d.label, { rolling: false, result: null, animFace: '?' }]))
  );
  const [currentRoll, setCurrentRoll] = useState<DiceRollBroadcast | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const intervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const rollDie = useCallback(async (sides: number, label: string) => {
    if (diceState[label]?.rolling) return;

    setDiceState(prev => ({ ...prev, [label]: { ...prev[label], rolling: true, animFace: '?' } }));

    const result = Math.floor(Math.random() * sides) + 1;

    // Clear any previous interval
    if (intervalsRef.current[label]) clearInterval(intervalsRef.current[label]);

    let c = 0;
    intervalsRef.current[label] = setInterval(() => {
      setDiceState(prev => ({ ...prev, [label]: { ...prev[label], animFace: DIE_FACES[Math.floor(Math.random() * 6)] } }));
      c++;
      if (c >= 10) {
        clearInterval(intervalsRef.current[label]);
        setDiceState(prev => ({ ...prev, [label]: { rolling: false, result, animFace: String(result) } }));

        const roll: DiceRollBroadcast = {
          id: Date.now().toString(), sessionId, playerName, playerId,
          die: label, result, createdAt: new Date().toISOString(),
        };
        setCurrentRoll(roll);
        broadcastDiceRoll(sessionId, playerId, playerName, label, result).catch(console.error);
      }
    }, 70);
  }, [diceState, sessionId, playerId, playerName]);

  if (compact) {
    return (
      <>
        <DiceRollOverlay roll={currentRoll} isOwn />

        <div className="border-t border-amber-900/30 bg-[#0b0e1a] flex-shrink-0">
          {/* Header toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-amber-900/10 transition-colors"
          >
            <span className="text-amber-700 text-[10px] tracking-widest uppercase">Dice Roller</span>
            {collapsed
              ? <ChevronUp className="w-3.5 h-3.5 text-amber-800" />
              : <ChevronDown className="w-3.5 h-3.5 text-amber-800" />}
          </button>

          {!collapsed && (
            <div className="px-3 pb-3 grid grid-cols-3 gap-2">
              {DICE.map(die => {
                const state = diceState[die.label];
                const isCrit = die.sides === 20 && state.result === 20;
                const isFumble = die.sides === 20 && state.result === 1;
                return (
                  <button
                    key={die.label}
                    onClick={() => rollDie(die.sides, die.label)}
                    disabled={state.rolling}
                    className="flex flex-col items-center justify-center py-2.5 rounded-lg border transition-all group disabled:opacity-50"
                    style={{
                      borderColor: state.result !== null ? die.color + '60' : 'rgba(120,80,20,0.25)',
                      backgroundColor: state.result !== null ? die.color + '12' : 'rgba(13,21,37,0.8)',
                    }}
                  >
                    {/* Die symbol */}
                    <span
                      className="text-xl leading-none mb-1 transition-transform group-hover:scale-110"
                      style={{
                        color: die.color,
                        animation: state.rolling ? 'diceShake 0.07s infinite' : 'none',
                      }}
                    >
                      {state.rolling ? DIE_FACES[Math.floor(Math.random() * 6)] : die.emoji}
                    </span>

                    {/* Result or label */}
                    {state.rolling ? (
                      <span className="text-amber-500 font-mono text-sm font-bold">{state.animFace}</span>
                    ) : state.result !== null ? (
                      <span
                        className="font-mono font-bold text-base leading-none"
                        style={{ color: isCrit ? '#fbbf24' : isFumble ? '#f87171' : '#e5c97f' }}
                      >
                        {state.result}
                      </span>
                    ) : (
                      <span className="text-amber-800 text-[10px] font-mono">{die.label}</span>
                    )}

                    {/* Crit/Fumble badge */}
                    {isCrit && !state.rolling && (
                      <span className="text-amber-400 text-[8px] tracking-wide mt-0.5">CRIT!</span>
                    )}
                    {isFumble && !state.rolling && (
                      <span className="text-red-400 text-[8px] tracking-wide mt-0.5">MISS</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <style>{`
          @keyframes diceShake {
            0%,100% { transform: rotate(0deg) scale(1); }
            25% { transform: rotate(-25deg) scale(1.1); }
            75% { transform: rotate(25deg) scale(1.1); }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <DiceRollOverlay roll={currentRoll} isOwn />
      <div className="flex flex-wrap gap-2">
        {DICE.map(die => {
          const state = diceState[die.label];
          return (
            <button
              key={die.label}
              onClick={() => rollDie(die.sides, die.label)}
              disabled={state.rolling}
              className="relative flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 transition-all group disabled:opacity-50"
              style={{
                borderColor: state.result !== null ? die.color + '80' : 'rgba(120,80,20,0.4)',
                backgroundColor: state.result !== null ? die.color + '20' : '#0d1525',
              }}
            >
              <span className="text-3xl" style={{ color: die.color, animation: state.rolling ? 'diceShake 0.07s infinite' : 'none' }}>
                {die.emoji}
              </span>
              <span className="text-[10px] text-amber-700 tracking-widest">{die.label}</span>
              {state.result !== null && !state.rolling && (
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center border"
                  style={{ backgroundColor: die.color + '30', borderColor: die.color + '80', color: '#fde68a' }}>
                  {state.result}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
