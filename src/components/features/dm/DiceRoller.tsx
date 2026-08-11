import { useState } from 'react';
import { DICE_TYPES } from '@/constants/dnd5e';

interface Roll { rolls: number[]; dt: string; n: number; mod: number; total: number; ts: number; adv?: string; }

export function DiceRoller() {
  const [count, setCount] = useState(1);
  const [dt, setDt] = useState('d20');
  const [mod, setMod] = useState(0);
  const [adv, setAdv] = useState<'none'|'advantage'|'disadvantage'>('none');
  const [history, setHistory] = useState<Roll[]>([]);

  const die = (s: number) => Math.ceil(Math.random() * s);

  const roll = () => {
    const sides = parseInt(dt.slice(1));
    let rolls: number[];
    let total: number;
    let advLabel: string | undefined;

    if (dt === 'd20' && adv !== 'none') {
      const r1 = die(sides), r2 = die(sides);
      rolls = [r1, r2];
      const picked = adv === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2);
      total = picked + mod;
      advLabel = adv;
    } else {
      rolls = Array.from({length: count}, () => die(sides));
      total = rolls.reduce((a, b) => a + b, 0) + mod;
    }

    setHistory(prev => [{rolls, dt, n: count, mod, total, ts: Date.now(), adv: advLabel}, ...prev].slice(0, 20));
  };

  const fmt = (r: Roll) => {
    const picked = r.adv ? (r.adv === 'advantage' ? Math.max(...r.rolls) : Math.min(...r.rolls)) : null;
    const rollStr = r.rolls.map((v, i) => r.adv ? (v === picked ? `[${v}]` : `(${v})`) : v).join(', ');
    const modStr = r.mod !== 0 ? ` ${r.mod >= 0 ? '+' : ''}${r.mod}` : '';
    return `${rollStr}${modStr}`;
  };

  const labelColor = (total: number, dt: string) => {
    const sides = parseInt(dt.slice(1));
    if (total >= sides) return 'text-amber-300';
    if (dt === 'd20' && total === 1) return 'text-red-400';
    return 'text-amber-100';
  };

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      <div className="grid grid-cols-4 gap-1.5">
        {DICE_TYPES.map(d => (
          <button key={d} onClick={() => setDt(d)} className={`py-2 rounded text-sm font-bold font-mono transition-colors ${dt === d ? 'bg-amber-700 text-amber-100 border border-amber-500' : 'bg-[#0d1525] border border-amber-900/40 text-amber-700 hover:text-amber-400 hover:border-amber-700'}`}>{d}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-amber-800 text-[10px] mb-1 block tracking-widest">COUNT</label>
          <input type="number" min={1} max={20} value={count} onChange={e => setCount(Math.max(1, parseInt(e.target.value)||1))}
            className="w-full bg-[#0d1525] border border-amber-900/40 text-amber-200 rounded px-2 py-1.5 text-center text-sm focus:outline-none focus:border-amber-600"/>
        </div>
        <div>
          <label className="text-amber-800 text-[10px] mb-1 block tracking-widest">MODIFIER</label>
          <input type="number" value={mod} onChange={e => setMod(parseInt(e.target.value)||0)}
            className="w-full bg-[#0d1525] border border-amber-900/40 text-amber-200 rounded px-2 py-1.5 text-center text-sm focus:outline-none focus:border-amber-600"/>
        </div>
      </div>

      {dt === 'd20' && (
        <div className="flex border border-amber-900/40 rounded overflow-hidden text-[11px]">
          {(['none','advantage','disadvantage'] as const).map(a => (
            <button key={a} onClick={() => setAdv(a)} className={`flex-1 py-1.5 transition-colors ${adv === a ? 'bg-amber-800/60 text-amber-200' : 'text-amber-700 hover:text-amber-400 hover:bg-amber-900/30'}`}>
              {a === 'none' ? 'Normal' : a === 'advantage' ? 'Adv.' : 'Dis.'}
            </button>
          ))}
        </div>
      )}

      <button onClick={roll} className="w-full py-3 bg-gradient-to-b from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 border border-amber-600/70 text-amber-100 rounded font-bold tracking-widest text-sm transition-all shadow-lg shadow-amber-900/40">
        🎲 ROLL {count > 1 ? `${count}${dt}` : dt}{mod !== 0 ? ` ${mod >= 0 ? '+' : ''}${mod}` : ''}
      </button>

      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        {history.map((r, i) => (
          <div key={r.ts} className={`p-2.5 rounded border ${i === 0 ? 'bg-amber-900/20 border-amber-700/50' : 'bg-[#0d1525] border-amber-900/20'}`}>
            <div className="flex items-center justify-between">
              <span className="text-amber-700 text-[11px] font-mono">{r.n}{r.dt}{r.mod!==0?`${r.mod>=0?'+':''}${r.mod}`:''}{r.adv?` (${r.adv})`:''}</span>
              <span className={`text-xl font-bold font-mono ${labelColor(r.total, r.dt)}`}>{r.total}</span>
            </div>
            <div className="text-amber-900 text-[10px] font-mono mt-0.5">{fmt(r)}</div>
          </div>
        ))}
        {history.length === 0 && <div className="text-center text-amber-900/60 text-sm py-8">Roll the dice...</div>}
      </div>
    </div>
  );
}
