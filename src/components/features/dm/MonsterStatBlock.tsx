import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { MONSTERS, TOKEN_COLORS, abilityMod, modStr } from '@/constants/dnd5e';
import { MonsterData, Token } from '@/types/dnd';

interface Props { onAddToken?: (token: Token) => void; }

export function MonsterStatBlock({ onAddToken }: Props) {
  const [selected, setSelected] = useState<MonsterData | null>(null);
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [tokenColor, setTokenColor] = useState(TOKEN_COLORS[0]);
  const [tokenHp, setTokenHp] = useState(0);

  const select = (m: MonsterData) => { setSelected(m); setOpen(false); setTokenName(m.name); setTokenHp(m.avgHp); setShowAdd(false); };

  const addToMap = () => {
    if (!selected || !onAddToken) return;
    const token: Token = {
      id: Date.now().toString(), name: tokenName || selected.name,
      x: 50, y: 50, color: tokenColor, size: 44,
      hp: tokenHp, maxHp: tokenHp, ac: selected.ac,
      isPC: false, ownerId: 'dm',
    };
    onAddToken(token);
    setShowAdd(false);
  };

  const stat = (label: string, val: number) => (
    <div className="text-center">
      <div className="text-[10px] font-bold text-amber-700 tracking-widest">{label}</div>
      <div className="text-amber-100 font-bold">{val}</div>
      <div className="text-amber-600 text-[11px]">({modStr(abilityMod(val))})</div>
    </div>
  );

  const divider = <div className="h-px bg-gradient-to-r from-transparent via-amber-800/60 to-transparent my-2"/>;

  return (
    <div className="flex flex-col h-full p-3 gap-2">
      {/* Monster selector */}
      <div className="relative">
        <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between bg-[#0d1525] border border-amber-900/40 hover:border-amber-700 rounded px-3 py-2 text-left transition-colors">
          <span className={selected ? 'text-amber-200 text-sm' : 'text-amber-800 text-sm'}>{selected?.name || 'Select a monster...'}</span>
          <ChevronDown className="w-3.5 h-3.5 text-amber-700"/>
        </button>
        {open && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-[#0d1525] border border-amber-900/50 rounded shadow-xl z-50 max-h-48 overflow-y-auto">
            {MONSTERS.map(m => (
              <button key={m.name} onClick={() => select(m)} className="w-full text-left px-3 py-1.5 text-sm text-amber-300 hover:bg-amber-900/30 transition-colors flex justify-between items-center">
                <span>{m.name}</span>
                <span className="text-amber-700 text-[10px]">CR {m.cr}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stat block */}
      {selected && (
        <div className="flex-1 overflow-y-auto bg-[#0d1525] border border-amber-900/30 rounded p-3 text-xs space-y-1.5">
          {/* Header */}
          <div className="border-b-2 border-amber-800/60 pb-2">
            <h2 className="text-amber-300 font-bold text-base" style={{fontFamily:'Georgia,serif'}}>{selected.name}</h2>
            <p className="text-amber-600 italic">{selected.size} {selected.type}, {selected.alignment}</p>
          </div>
          {divider}
          <div className="space-y-0.5 text-amber-200/90">
            <div><span className="text-amber-500 font-semibold">AC</span> {selected.ac}{selected.acNote ? ` (${selected.acNote})` : ''}</div>
            <div><span className="text-amber-500 font-semibold">HP</span> {selected.avgHp} ({selected.hp})</div>
            <div><span className="text-amber-500 font-semibold">Speed</span> {selected.speed}</div>
          </div>
          {divider}
          <div className="grid grid-cols-6 gap-1 py-1">
            {stat('STR', selected.str)}{stat('DEX', selected.dex)}{stat('CON', selected.con)}
            {stat('INT', selected.int)}{stat('WIS', selected.wis)}{stat('CHA', selected.cha)}
          </div>
          {divider}
          <div className="space-y-0.5 text-amber-200/80">
            {selected.saves && <div><span className="text-amber-500 font-semibold">Saving Throws</span> {selected.saves}</div>}
            {selected.skills && <div><span className="text-amber-500 font-semibold">Skills</span> {selected.skills}</div>}
            {selected.immunities && <div><span className="text-amber-500 font-semibold">Immunities</span> {selected.immunities}</div>}
            {selected.resistances && <div><span className="text-amber-500 font-semibold">Resistances</span> {selected.resistances}</div>}
            {selected.conditionImmunities && <div><span className="text-amber-500 font-semibold">Condition Immunities</span> {selected.conditionImmunities}</div>}
            <div><span className="text-amber-500 font-semibold">Senses</span> {selected.senses}</div>
            <div><span className="text-amber-500 font-semibold">Languages</span> {selected.languages}</div>
            <div><span className="text-amber-500 font-semibold">Challenge</span> {selected.cr} ({selected.xp.toLocaleString()} XP)</div>
          </div>
          {selected.traits && selected.traits.length > 0 && (<>{divider}{selected.traits.map(t=><div key={t.name} className="text-amber-200/80"><span className="font-bold text-amber-400">{t.name}.</span> {t.desc}</div>)}</>)}
          {divider}
          <div className="text-amber-500 font-bold tracking-widest uppercase text-[10px]">Actions</div>
          {selected.actions.map(a=><div key={a.name} className="text-amber-200/80"><span className="font-bold text-amber-300">{a.name}.</span> {a.desc}</div>)}
          {selected.legendaryActions && (<>{divider}<div className="text-amber-500 font-bold tracking-widest uppercase text-[10px]">Legendary Actions</div>{selected.legendaryActions.map(a=><div key={a.name} className="text-amber-200/80"><span className="font-bold text-amber-300">{a.name}.</span> {a.desc}</div>)}</>)}

          {/* Add to map */}
          {onAddToken && (
            <div className="mt-3 pt-3 border-t border-amber-900/30">
              {!showAdd ? (
                <button onClick={() => setShowAdd(true)} className="w-full py-1.5 bg-amber-800/40 hover:bg-amber-700/50 border border-amber-700/50 text-amber-300 rounded text-xs flex items-center justify-center gap-1 transition-colors">
                  <Plus className="w-3 h-3"/> Add to Map as Token
                </button>
              ) : (
                <div className="space-y-2">
                  <input value={tokenName} onChange={e=>setTokenName(e.target.value)} placeholder="Token name" className="w-full bg-black/50 border border-amber-900/40 text-amber-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-amber-600"/>
                  <div className="flex items-center gap-2">
                    <input type="number" value={tokenHp} onChange={e=>setTokenHp(parseInt(e.target.value)||0)} className="flex-1 bg-black/50 border border-amber-900/40 text-amber-200 rounded px-2 py-1.5 text-xs focus:outline-none" placeholder="HP"/>
                    <div className="flex gap-1">{TOKEN_COLORS.slice(0,5).map(c=><button key={c} onClick={()=>setTokenColor(c)} className={`w-5 h-5 rounded-full transition-transform ${tokenColor===c?'scale-125 ring-1 ring-amber-400':''}`} style={{backgroundColor:c}}/>)}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={addToMap} className="flex-1 py-1.5 bg-amber-700/60 hover:bg-amber-600/70 border border-amber-600/50 text-amber-100 rounded text-xs font-bold transition-colors">Place on Map</button>
                    <button onClick={()=>setShowAdd(false)} className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 text-gray-400 rounded text-xs transition-colors">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {!selected && <div className="flex-1 flex items-center justify-center text-amber-900/40 text-sm">Select a monster above</div>}
    </div>
  );
}
