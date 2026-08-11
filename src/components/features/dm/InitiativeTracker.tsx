import { useState } from 'react';
import { Plus, Trash2, ChevronRight, RotateCcw } from 'lucide-react';
import { InitiativeEntry } from '@/types/dnd';
import { TOKEN_COLORS } from '@/constants/dnd5e';

interface Props {
  entries: InitiativeEntry[];
  activeIndex: number;
  onUpdate: (entries: InitiativeEntry[], idx: number) => void;
}

export function InitiativeTracker({ entries, activeIndex, onUpdate }: Props) {
  const [name, setName] = useState('');
  const [init, setInit] = useState('');
  const [hp, setHp] = useState('');
  const [ac, setAc] = useState('');
  const [isMonster, setIsMonster] = useState(false);
  const [colorIdx, setColorIdx] = useState(0);
  const [hpEditing, setHpEditing] = useState<string|null>(null);
  const [hpDelta, setHpDelta] = useState('');

  const add = () => {
    if (!name.trim() || !init.trim()) return;
    const entry: InitiativeEntry = {
      id: Date.now().toString(), name: name.trim(),
      initiative: parseInt(init)||0, hp: parseInt(hp)||10, maxHp: parseInt(hp)||10,
      ac: parseInt(ac)||10, color: TOKEN_COLORS[colorIdx % TOKEN_COLORS.length], isMonster,
    };
    const next = [...entries, entry].sort((a,b) => b.initiative - a.initiative);
    onUpdate(next, activeIndex);
    setName(''); setInit(''); setHp(''); setAc('');
  };

  const remove = (id: string) => {
    const next = entries.filter(e => e.id !== id);
    onUpdate(next, Math.min(activeIndex, next.length - 1));
  };

  const nextTurn = () => {
    if (entries.length === 0) return;
    onUpdate(entries, (activeIndex + 1) % entries.length);
  };

  const reset = () => onUpdate([], -1);

  const applyHpChange = (entry: InitiativeEntry) => {
    const delta = parseInt(hpDelta) || 0;
    const newHp = Math.max(0, Math.min(entry.maxHp, entry.hp + delta));
    onUpdate(entries.map(e => e.id === entry.id ? {...e, hp: newHp} : e), activeIndex);
    setHpEditing(null); setHpDelta('');
  };

  const inp = "bg-[#0d1525] border border-amber-900/40 text-amber-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-amber-600 w-full";

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      {/* Add form */}
      <div className="bg-[#0d1525] border border-amber-900/30 rounded p-3 space-y-2">
        <div className="grid grid-cols-3 gap-1.5">
          <div className="col-span-3"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className={inp} onKeyDown={e=>e.key==='Enter'&&add()}/></div>
          <input value={init} onChange={e=>setInit(e.target.value)} placeholder="Initiative" className={inp} type="number" onKeyDown={e=>e.key==='Enter'&&add()}/>
          <input value={hp} onChange={e=>setHp(e.target.value)} placeholder="HP" className={inp} type="number" onKeyDown={e=>e.key==='Enter'&&add()}/>
          <input value={ac} onChange={e=>setAc(e.target.value)} placeholder="AC" className={inp} type="number" onKeyDown={e=>e.key==='Enter'&&add()}/>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 flex-wrap flex-1">
            {TOKEN_COLORS.map((c,i) => (
              <button key={c} onClick={()=>setColorIdx(i)} className={`w-4 h-4 rounded-full transition-transform ${colorIdx===i?'scale-125 ring-1 ring-amber-400':''}`} style={{backgroundColor:c}}/>
            ))}
          </div>
          <label className="flex items-center gap-1 text-[11px] text-amber-700 cursor-pointer">
            <input type="checkbox" checked={isMonster} onChange={e=>setIsMonster(e.target.checked)} className="accent-red-600"/>Monster
          </label>
          <button onClick={add} className="bg-amber-800/50 hover:bg-amber-700/60 border border-amber-700/50 text-amber-300 rounded px-3 py-1.5 text-xs flex items-center gap-1 transition-colors">
            <Plus className="w-3 h-3"/> Add
          </button>
        </div>
      </div>

      {/* Controls */}
      {entries.length > 0 && (
        <div className="flex gap-2">
          <button onClick={nextTurn} className="flex-1 py-2 bg-amber-700/50 hover:bg-amber-600/60 border border-amber-600/50 text-amber-200 rounded text-xs font-bold tracking-wider transition-colors flex items-center justify-center gap-1">
            <ChevronRight className="w-3.5 h-3.5"/> NEXT TURN
          </button>
          <button onClick={reset} className="py-2 px-3 bg-red-900/30 hover:bg-red-800/40 border border-red-800/40 text-red-400 rounded text-xs transition-colors">
            <RotateCcw className="w-3.5 h-3.5"/>
          </button>
        </div>
      )}

      {/* Combat order */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        {entries.map((e, i) => {
          const isActive = i === activeIndex;
          const hpPct = e.hp / e.maxHp;
          const hpColor = hpPct>0.5?'bg-green-500':hpPct>0.25?'bg-yellow-500':'bg-red-500';
          return (
            <div key={e.id} className={`rounded border p-2.5 transition-colors ${isActive?'bg-amber-900/25 border-amber-600/60':'bg-[#0d1525] border-amber-900/20'}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{backgroundColor:e.color}}>
                  {e.initiative}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium truncate ${isActive?'text-amber-300':'text-amber-200'}`}>{e.name}</span>
                    <span className="text-amber-800 text-[10px] ml-1">AC {e.ac}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${hpColor}`} style={{width:`${hpPct*100}%`}}/>
                    </div>
                    {hpEditing === e.id ? (
                      <div className="flex items-center gap-1">
                        <input autoFocus type="number" value={hpDelta} onChange={ev=>setHpDelta(ev.target.value)}
                          className="w-14 bg-black/60 border border-amber-700 text-amber-200 rounded px-1 py-0.5 text-xs text-center"
                          placeholder="±HP" onKeyDown={ev=>ev.key==='Enter'&&applyHpChange(e)}/>
                        <button onClick={()=>applyHpChange(e)} className="text-[10px] bg-amber-800/50 text-amber-300 px-1.5 py-0.5 rounded">OK</button>
                      </div>
                    ) : (
                      <button onClick={()=>setHpEditing(e.id)} className="text-[11px] text-amber-700 hover:text-amber-400 font-mono transition-colors whitespace-nowrap">
                        {e.hp}/{e.maxHp}
                      </button>
                    )}
                  </div>
                </div>
                <button onClick={()=>remove(e.id)} className="text-red-800 hover:text-red-500 transition-colors flex-shrink-0 ml-1">
                  <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
          );
        })}
        {entries.length === 0 && <div className="text-center text-amber-900/50 text-sm py-8">No combatants yet...</div>}
      </div>
    </div>
  );
}
