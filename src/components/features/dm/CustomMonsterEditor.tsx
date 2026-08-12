import { useState } from 'react';
import { Plus, Trash2, ImageIcon } from 'lucide-react';
import { MonsterData, Token } from '@/types/dnd';
import { TOKEN_COLORS, abilityMod, modStr } from '@/constants/dnd5e';

interface Props {
  onAddToken?: (token: Token) => void;
  onSaveMonster?: (m: MonsterData) => void;
}

const blank: MonsterData = {
  name: '', type: 'Humanoid', size: 'Medium', alignment: 'Neutral',
  ac: 12, acNote: '', hp: '2d8', avgHp: 10, speed: '30 ft.',
  str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
  cr: '1/4', xp: 50, profBonus: 2,
  senses: 'Passive Perception 10', languages: 'Common',
  actions: [{ name: 'Slam', desc: 'Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 4 (1d6+1) bludgeoning damage.' }],
  traits: [], legendaryActions: [],
  imageUrl: '', isCustom: true,
};

const inp = 'w-full bg-black/50 border border-amber-900/40 text-amber-100 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-amber-600';

export function CustomMonsterEditor({ onAddToken, onSaveMonster }: Props) {
  const [m, setM] = useState<MonsterData>({ ...blank });
  const [tokenColor, setTokenColor] = useState(TOKEN_COLORS[1]);
  const up = (p: Partial<MonsterData>) => setM(prev => ({ ...prev, ...p }));

  const addTrait = () => up({ traits: [...(m.traits || []), { name: 'New Trait', desc: 'Description.' }] });
  const addAction = () => up({ actions: [...m.actions, { name: 'New Action', desc: 'Description.' }] });
  const addLegendary = () => up({ legendaryActions: [...(m.legendaryActions || []), { name: 'New Legendary Action', desc: 'Description.' }] });

  const placeToken = () => {
    if (!onAddToken) return;
    const token: Token = {
      id: Date.now().toString(), name: m.name || 'Custom Monster',
      x: 50, y: 50, color: tokenColor, size: m.size === 'Large' || m.size === 'Huge' ? 64 : 44,
      hp: m.avgHp, maxHp: m.avgHp, ac: m.ac, isPC: false, ownerId: 'dm',
      imageUrl: m.imageUrl || undefined,
    };
    onAddToken(token);
    onSaveMonster?.(m);
  };

  const statInput = (key: keyof Pick<MonsterData,'str'|'dex'|'con'|'int'|'wis'|'cha'>, label: string) => (
    <div className="text-center" key={key}>
      <div className="text-amber-700 text-[9px] tracking-widest mb-1">{label}</div>
      <input type="number" min={1} max={30} value={m[key] as number}
        onChange={e => up({ [key]: parseInt(e.target.value) || 10 })}
        className="bg-transparent text-amber-200 font-bold text-base w-full text-center focus:outline-none"/>
      <div className="text-amber-500 text-xs font-mono">{modStr(abilityMod(m[key] as number))}</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 gap-3 text-xs">
      <div className="text-amber-700 text-[10px] tracking-widest uppercase">Custom Monster Creator</div>

      {/* Basic info */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-amber-800 text-[9px] mb-0.5">Name</div>
            <input value={m.name} onChange={e => up({ name: e.target.value })} placeholder="Monster name" className={inp}/>
          </div>
          <div>
            <div className="text-amber-800 text-[9px] mb-0.5">Type</div>
            <input value={m.type} onChange={e => up({ type: e.target.value })} placeholder="e.g. Undead" className={inp}/>
          </div>
          <div>
            <div className="text-amber-800 text-[9px] mb-0.5">Size</div>
            <select value={m.size} onChange={e => up({ size: e.target.value })} className={`${inp} cursor-pointer`}>
              {['Tiny','Small','Medium','Large','Huge','Gargantuan'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className="text-amber-800 text-[9px] mb-0.5">Alignment</div>
            <input value={m.alignment} onChange={e => up({ alignment: e.target.value })} placeholder="Neutral Evil" className={inp}/>
          </div>
          <div>
            <div className="text-amber-800 text-[9px] mb-0.5">CR</div>
            <input value={m.cr} onChange={e => up({ cr: e.target.value })} placeholder="1/4" className={inp}/>
          </div>
          <div>
            <div className="text-amber-800 text-[9px] mb-0.5">XP</div>
            <input type="number" value={m.xp} onChange={e => up({ xp: +e.target.value || 0 })} className={inp}/>
          </div>
        </div>
      </div>

      {/* Combat stats */}
      <div className="bg-[#0d1525] border border-amber-900/30 rounded p-2.5 space-y-2">
        <div className="text-amber-800 text-[9px] tracking-widest uppercase">Combat</div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="text-amber-800 text-[9px] mb-0.5">AC</div>
            <input type="number" value={m.ac} onChange={e => up({ ac: +e.target.value || 10 })} className={inp}/>
          </div>
          <div>
            <div className="text-amber-800 text-[9px] mb-0.5">Avg HP</div>
            <input type="number" value={m.avgHp} onChange={e => up({ avgHp: +e.target.value || 1 })} className={inp}/>
          </div>
          <div>
            <div className="text-amber-800 text-[9px] mb-0.5">HP Dice</div>
            <input value={m.hp} onChange={e => up({ hp: e.target.value })} placeholder="2d8+4" className={inp}/>
          </div>
          <div className="col-span-3">
            <div className="text-amber-800 text-[9px] mb-0.5">Speed</div>
            <input value={m.speed} onChange={e => up({ speed: e.target.value })} placeholder="30 ft., fly 40 ft." className={inp}/>
          </div>
        </div>
      </div>

      {/* Ability scores */}
      <div className="bg-[#0d1525] border border-amber-900/30 rounded p-2.5">
        <div className="text-amber-800 text-[9px] tracking-widest uppercase mb-2">Ability Scores</div>
        <div className="grid grid-cols-6 gap-1">
          {statInput('str','STR')}{statInput('dex','DEX')}{statInput('con','CON')}
          {statInput('int','INT')}{statInput('wis','WIS')}{statInput('cha','CHA')}
        </div>
      </div>

      {/* Description fields */}
      <div className="space-y-1.5">
        {([['Senses','senses'],['Languages','languages'],['Saves','saves'],['Skills','skills'],['Immunities','immunities'],['Resistances','resistances']] as [string, keyof MonsterData][]).map(([fieldLabel, fieldKey]) => (
          <div key={String(fieldKey)}>
            <div className="text-amber-800 text-[9px] mb-0.5">{fieldLabel}</div>
            <input value={(m[fieldKey] as string) || ''} onChange={e => up({ [fieldKey]: e.target.value })} className={inp}/>
          </div>
        ))}
      </div>

      {/* Traits */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-amber-800 text-[9px] tracking-widest uppercase">Traits</div>
          <button onClick={addTrait} className="text-amber-800 hover:text-amber-500 transition-colors"><Plus className="w-3 h-3"/></button>
        </div>
        {(m.traits || []).map((t, i) => (
          <div key={i} className="bg-[#0d1525] border border-amber-900/20 rounded p-2 mb-1.5 space-y-1">
            <div className="flex items-center gap-1">
              <input value={t.name} onChange={e => { const ts = [...(m.traits||[])]; ts[i] = {...ts[i], name: e.target.value}; up({ traits: ts }); }} className={`${inp} flex-1`} placeholder="Trait name"/>
              <button onClick={() => up({ traits: (m.traits||[]).filter((_,j) => j !== i) })} className="text-red-900 hover:text-red-500 flex-shrink-0 transition-colors"><Trash2 className="w-3 h-3"/></button>
            </div>
            <textarea value={t.desc} onChange={e => { const ts = [...(m.traits||[])]; ts[i] = {...ts[i], desc: e.target.value}; up({ traits: ts }); }} className={`${inp} resize-none h-12`} placeholder="Description"/>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-amber-800 text-[9px] tracking-widest uppercase">Actions</div>
          <button onClick={addAction} className="text-amber-800 hover:text-amber-500 transition-colors"><Plus className="w-3 h-3"/></button>
        </div>
        {m.actions.map((a, i) => (
          <div key={i} className="bg-[#0d1525] border border-amber-900/20 rounded p-2 mb-1.5 space-y-1">
            <div className="flex items-center gap-1">
              <input value={a.name} onChange={e => { const ac = [...m.actions]; ac[i] = {...ac[i], name: e.target.value}; up({ actions: ac }); }} className={`${inp} flex-1`} placeholder="Action name"/>
              <button onClick={() => up({ actions: m.actions.filter((_,j) => j !== i) })} className="text-red-900 hover:text-red-500 flex-shrink-0 transition-colors"><Trash2 className="w-3 h-3"/></button>
            </div>
            <textarea value={a.desc} onChange={e => { const ac = [...m.actions]; ac[i] = {...ac[i], desc: e.target.value}; up({ actions: ac }); }} className={`${inp} resize-none h-12`} placeholder="Attack description"/>
          </div>
        ))}
      </div>

      {/* Legendary actions */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-amber-800 text-[9px] tracking-widest uppercase">Legendary Actions</div>
          <button onClick={addLegendary} className="text-amber-800 hover:text-amber-500 transition-colors"><Plus className="w-3 h-3"/></button>
        </div>
        {(m.legendaryActions || []).map((a, i) => (
          <div key={i} className="bg-[#0d1525] border border-amber-900/20 rounded p-2 mb-1.5 space-y-1">
            <div className="flex items-center gap-1">
              <input value={a.name} onChange={e => { const la = [...(m.legendaryActions||[])]; la[i] = {...la[i], name: e.target.value}; up({ legendaryActions: la }); }} className={`${inp} flex-1`} placeholder="Action name"/>
              <button onClick={() => up({ legendaryActions: (m.legendaryActions||[]).filter((_,j) => j !== i) })} className="text-red-900 hover:text-red-500 flex-shrink-0 transition-colors"><Trash2 className="w-3 h-3"/></button>
            </div>
            <textarea value={a.desc} onChange={e => { const la = [...(m.legendaryActions||[])]; la[i] = {...la[i], desc: e.target.value}; up({ legendaryActions: la }); }} className={`${inp} resize-none h-10`} placeholder="Description"/>
          </div>
        ))}
      </div>

      {/* Image URL */}
      <div>
        <div className="text-amber-800 text-[9px] mb-0.5 flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Monster Image URL (optional)</div>
        <input value={m.imageUrl || ''} onChange={e => up({ imageUrl: e.target.value })} placeholder="https://…" className={inp}/>
        {m.imageUrl && (
          <img src={m.imageUrl} alt={m.name} className="mt-1.5 w-full h-24 object-cover rounded border border-amber-900/30"/>
        )}
      </div>

      {/* Token color */}
      <div>
        <div className="text-amber-800 text-[9px] mb-1.5">Token Color</div>
        <div className="flex gap-1.5 flex-wrap">
          {TOKEN_COLORS.map(c => (
            <button key={c} onClick={() => setTokenColor(c)} className={`w-6 h-6 rounded-full transition-transform ${tokenColor === c ? 'scale-125 ring-2 ring-amber-400' : ''}`} style={{ backgroundColor: c }}/>
          ))}
        </div>
      </div>

      {/* Place on map */}
      <button
        onClick={placeToken}
        disabled={!m.name.trim()}
        className="w-full py-2.5 bg-amber-800/50 hover:bg-amber-700/60 border border-amber-700/50 text-amber-200 rounded font-bold tracking-widest text-xs transition-colors disabled:opacity-40"
      >
        PLACE ON MAP
      </button>
    </div>
  );
}
