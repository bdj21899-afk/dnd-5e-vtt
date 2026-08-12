import { useState, useCallback } from 'react';
import { useCharacter } from '@/hooks/useCharacter';
import { ABILITIES, SKILLS, CLASSES, RACES, BACKGROUNDS, ALIGNMENTS, HIT_DICE, modStr } from '@/constants/dnd5e';
import { AbilityKey, EquipItem, Spell } from '@/types/dnd';
import { Plus, Trash2, Star, Heart, ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

const TABS = ['Stats','Skills','Combat','Spells','Gear','Notes'] as const;
type Tab = typeof TABS[number];

const inp = "bg-black/40 border border-amber-900/40 text-amber-100 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-amber-600 w-full";
const sel = `${inp} cursor-pointer`;

export function CharacterSheet() {
  const { char, update, profB, mod, skillBonus, saveBonus, spellSaveDC, spellAttackBonus } = useCharacter();
  const [tab, setTab] = useState<Tab>('Stats');
  const [newEquip, setNewEquip] = useState('');
  const [newSpell, setNewSpell] = useState({ name:'', level:1, school:'Evocation', castingTime:'1 action', range:'60 ft.', components:'V,S', duration:'Instantaneous', description:'' });
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const generateAvatar = useCallback(async () => {
    setGeneratingAvatar(true);
    setAvatarError(null);
    const { data, error } = await supabase.functions.invoke('ai-avatar-generate', {
      body: { name: char.name, race: char.race, charClass: char.charClass, alignment: char.alignment, background: char.background },
    });
    if (error) {
      let msg = error.message;
      if (error instanceof FunctionsHttpError) {
        try { msg = await error.context.text(); } catch {}
      }
      setAvatarError(msg);
    } else if (data?.url) {
      update({ avatarUrl: data.url });
    }
    setGeneratingAvatar(false);
  }, [char.name, char.race, char.charClass, char.alignment, char.background, update]);

  const upScore = (k: AbilityKey, v: number) => update({ abilityScores: { ...char.abilityScores, [k]: Math.max(1, Math.min(30, v)) } });
  const upSaveProf = (k: AbilityKey) => update({ saveProficiencies: { ...char.saveProficiencies, [k]: !char.saveProficiencies[k] } });
  const upSkillProf = (key: string) => {
    const cur = char.skillProficiencies[key] || { proficient: false, expertise: false };
    const next = !cur.proficient ? { proficient: true, expertise: false } : cur.expertise ? { proficient: false, expertise: false } : { proficient: true, expertise: true };
    update({ skillProficiencies: { ...char.skillProficiencies, [key]: next } });
  };
  const addEquip = () => {
    if (!newEquip.trim()) return;
    const item: EquipItem = { id: Date.now().toString(), name: newEquip.trim(), qty: 1, weight: 0, equipped: false };
    update({ equipment: [...char.equipment, item] });
    setNewEquip('');
  };
  const removeEquip = (id: string) => update({ equipment: char.equipment.filter(e => e.id !== id) });
  const addSpell = () => {
    if (!newSpell.name.trim()) return;
    const spell: Spell = { ...newSpell, id: Date.now().toString(), prepared: false };
    update({ spells: [...char.spells, spell] });
    setNewSpell({ name:'', level:1, school:'Evocation', castingTime:'1 action', range:'60 ft.', components:'V,S', duration:'Instantaneous', description:'' });
  };
  const removeSpell = (id: string) => update({ spells: char.spells.filter(s => s.id !== id) });
  const toggleSpellPrepared = (id: string) => update({ spells: char.spells.map(s => s.id === id ? {...s, prepared: !s.prepared} : s) });

  return (
    <div className="flex flex-col h-full bg-[#0b0e1a]">
      {/* Tab nav */}
      <div className="flex border-b border-amber-900/30 flex-shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-[10px] tracking-wider uppercase transition-colors whitespace-nowrap px-1 ${tab === t ? 'text-amber-400 border-b-2 border-amber-500' : 'text-amber-800 hover:text-amber-600'}`}>{t}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* ── STATS TAB ── */}
        {tab === 'Stats' && (
          <>
            {/* Avatar with AI generate button */}
            <div className="flex flex-col items-center gap-2 mb-1">
              {char.avatarUrl ? (
                <div className="relative">
                  <img src={char.avatarUrl} alt={char.name} className="w-24 h-24 rounded-full object-cover border-2 border-amber-700/60 shadow-lg"/>
                  <button
                    onClick={generateAvatar}
                    disabled={generatingAvatar}
                    title="Regenerate avatar with AI"
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-800 hover:bg-amber-700 border border-amber-600 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {generatingAvatar ? <Loader2 className="w-3.5 h-3.5 text-amber-200 animate-spin"/> : <Sparkles className="w-3.5 h-3.5 text-amber-200"/>}
                  </button>
                </div>
              ) : (
                <button
                  onClick={generateAvatar}
                  disabled={generatingAvatar}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-amber-800/50 hover:border-amber-600 flex flex-col items-center justify-center gap-1 bg-[#0d1525] transition-colors disabled:opacity-50 group"
                >
                  {generatingAvatar
                    ? <Loader2 className="w-6 h-6 text-amber-600 animate-spin"/>
                    : <>
                        <Sparkles className="w-6 h-6 text-amber-800 group-hover:text-amber-500 transition-colors"/>
                        <span className="text-amber-900 group-hover:text-amber-600 text-[9px] transition-colors text-center">AI Portrait</span>
                      </>
                  }
                </button>
              )}
              {avatarError && <div className="text-red-400 text-[10px] text-center max-w-[200px]">{avatarError}</div>}
            </div>

            {/* Identity */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="col-span-2"><label className="text-amber-800 text-[10px] tracking-widest block mb-0.5">CHARACTER NAME</label><input value={char.name} onChange={e=>update({name:e.target.value})} className={inp}/></div>
              <div><label className="text-amber-800 text-[10px] tracking-widest block mb-0.5">RACE</label><select value={char.race} onChange={e=>update({race:e.target.value})} className={sel}>{RACES.map(r=><option key={r}>{r}</option>)}</select></div>
              <div><label className="text-amber-800 text-[10px] tracking-widest block mb-0.5">CLASS</label><select value={char.charClass} onChange={e=>update({charClass:e.target.value,hitDice:HIT_DICE[e.target.value]||'d8'})} className={sel}>{CLASSES.map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label className="text-amber-800 text-[10px] tracking-widest block mb-0.5">LEVEL</label><input type="number" min={1} max={20} value={char.level} onChange={e=>update({level:parseInt(e.target.value)||1})} className={inp}/></div>
              <div><label className="text-amber-800 text-[10px] tracking-widest block mb-0.5">BACKGROUND</label><select value={char.background} onChange={e=>update({background:e.target.value})} className={sel}>{BACKGROUNDS.map(b=><option key={b}>{b}</option>)}</select></div>
              <div><label className="text-amber-800 text-[10px] tracking-widest block mb-0.5">ALIGNMENT</label><select value={char.alignment} onChange={e=>update({alignment:e.target.value})} className={sel}>{ALIGNMENTS.map(a=><option key={a}>{a}</option>)}</select></div>
              <div><label className="text-amber-800 text-[10px] tracking-widest block mb-0.5">XP</label><input type="number" min={0} value={char.xp} onChange={e=>update({xp:parseInt(e.target.value)||0})} className={inp}/></div>
              <div className="col-span-2">
                <label className="text-amber-800 text-[10px] tracking-widest block mb-0.5 flex items-center gap-1"><ImageIcon className="w-2.5 h-2.5"/> AVATAR URL</label>
                <input value={char.avatarUrl || ''} onChange={e=>update({avatarUrl:e.target.value})} placeholder="https://… or use AI generator above" className={inp}/>
              </div>
            </div>

            {/* Proficiency + Inspiration */}
            <div className="flex gap-2">
              <div className="flex-1 bg-[#0d1525] border border-amber-900/30 rounded p-2 text-center">
                <div className="text-amber-500 font-bold text-lg font-mono">{modStr(profB)}</div>
                <div className="text-amber-800 text-[9px] tracking-widest">PROF BONUS</div>
              </div>
              <div className="flex-1 bg-[#0d1525] border border-amber-900/30 rounded p-2 text-center">
                <div className="text-amber-500 font-bold text-lg font-mono">{10 + mod('wisdom') + (char.skillProficiencies['perception']?.proficient ? profB : 0)}</div>
                <div className="text-amber-800 text-[9px] tracking-widest">PASSIVE PERC</div>
              </div>
              <button onClick={() => update({ inspiration: !char.inspiration })} className={`flex-1 rounded p-2 text-center border transition-colors ${char.inspiration ? 'bg-amber-800/40 border-amber-600/60' : 'bg-[#0d1525] border-amber-900/30'}`}>
                <Star className={`w-4 h-4 mx-auto mb-0.5 ${char.inspiration ? 'text-amber-400 fill-amber-400' : 'text-amber-800'}`}/>
                <div className="text-amber-800 text-[9px] tracking-widest">INSPIRE</div>
              </button>
            </div>

            {/* Ability scores */}
            <div className="grid grid-cols-3 gap-2">
              {ABILITIES.map(a => (
                <div key={a.key} className="bg-[#0d1525] border border-amber-900/30 rounded p-2 text-center">
                  <div className="text-amber-700 text-[9px] tracking-widest mb-1">{a.abbr}</div>
                  <input type="number" min={1} max={30} value={char.abilityScores[a.key]} onChange={e=>upScore(a.key, parseInt(e.target.value)||10)}
                    className="bg-transparent text-amber-200 font-bold text-lg w-full text-center focus:outline-none focus:text-amber-400"/>
                  <div className="text-amber-500 text-sm font-mono mt-0.5">{modStr(mod(a.key))}</div>
                </div>
              ))}
            </div>

            {/* Saving throws */}
            <div>
              <div className="text-amber-800 text-[10px] tracking-widest mb-1.5 uppercase">Saving Throws</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {ABILITIES.map(a => {
                  const filled = !!char.saveProficiencies[a.key];
                  return (
                    <div key={a.key} className="flex items-center gap-1.5">
                      <button
                        onClick={() => upSaveProf(a.key)}
                        className={`w-3.5 h-3.5 rounded-full border transition-colors flex-shrink-0 ${filled ? 'bg-amber-500 border-transparent' : 'text-amber-800 border-current'}`}
                      />
                      <span className="text-amber-600 font-mono text-[11px] w-7">{modStr(saveBonus(a.key))}</span>
                      <span className="text-amber-300 text-xs">{a.abbr}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── SKILLS TAB ── */}
        {tab === 'Skills' && (
          <div className="space-y-0.5">
            {SKILLS.map(s => {
              const prof = char.skillProficiencies[s.key];
              const bonus = skillBonus(s.key, s.ability);
              const isProficient = prof?.proficient;
              const isExpert = prof?.expertise;
              return (
                <button key={s.key} onClick={() => upSkillProf(s.key)} className="w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-amber-900/10 transition-colors group">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isExpert ? 'bg-amber-400 border-amber-400' : isProficient ? 'bg-amber-700 border-amber-600' : 'border-amber-900/50'}`}>
                    {isExpert && <div className="w-1.5 h-1.5 bg-amber-900 rounded-full"/>}
                  </div>
                  <span className="text-amber-600 font-mono text-[11px] w-8 text-right">{modStr(bonus)}</span>
                  <span className="flex-1 text-amber-300 text-xs text-left group-hover:text-amber-200 transition-colors">{s.name}</span>
                  <span className="text-amber-900 text-[9px]">{s.abbr}</span>
                </button>
              );
            })}
            <div className="mt-3 text-amber-900/50 text-[10px] text-center">Click to toggle proficiency → expertise</div>
          </div>
        )}

        {/* ── COMBAT TAB ── */}
        {tab === 'Combat' && (
          <>
            <div className="bg-[#0d1525] border border-amber-900/30 rounded p-3">
              <div className="text-amber-800 text-[10px] tracking-widest mb-2 uppercase flex items-center gap-1"><Heart className="w-3 h-3 text-red-700"/> Hit Points</div>
              <div className="flex items-center gap-2 mb-2">
                <button onClick={()=>update({currentHp:Math.max(0,char.currentHp-1)})} className="w-7 h-7 rounded bg-red-900/40 hover:bg-red-800/50 border border-red-900/50 text-red-400 text-sm font-bold flex items-center justify-center transition-colors">−</button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-bold text-amber-200 font-mono">{char.currentHp}</span>
                  <span className="text-amber-700 text-lg font-mono"> / </span>
                  <span className="text-xl font-bold text-amber-500 font-mono">{char.maxHp}</span>
                </div>
                <button onClick={()=>update({currentHp:Math.min(char.maxHp+char.tempHp,char.currentHp+1)})} className="w-7 h-7 rounded bg-green-900/40 hover:bg-green-800/50 border border-green-900/50 text-green-400 text-sm font-bold flex items-center justify-center transition-colors">+</button>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all" style={{width:`${Math.max(0,Math.min(100,(char.currentHp/char.maxHp)*100))}%`,backgroundColor:char.currentHp/char.maxHp>0.5?'#22c55e':char.currentHp/char.maxHp>0.25?'#f59e0b':'#ef4444'}}/>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div><label className="text-amber-800 text-[9px] tracking-widest block mb-0.5">MAX HP</label><input type="number" value={char.maxHp} onChange={e=>update({maxHp:parseInt(e.target.value)||0})} className={inp}/></div>
                <div><label className="text-amber-800 text-[9px] tracking-widest block mb-0.5">TEMP HP</label><input type="number" value={char.tempHp} onChange={e=>update({tempHp:parseInt(e.target.value)||0})} className={inp}/></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#0d1525] border border-amber-900/30 rounded p-2 text-center">
                <div className="text-amber-700 text-[9px] tracking-widest mb-1">AC</div>
                <input type="number" value={char.ac} onChange={e=>update({ac:parseInt(e.target.value)||0})} className="bg-transparent text-amber-200 font-bold text-xl w-full text-center focus:outline-none focus:text-amber-400"/>
              </div>
              <div className="bg-[#0d1525] border border-amber-900/30 rounded p-2 text-center">
                <div className="text-amber-700 text-[9px] tracking-widest mb-1">Speed</div>
                <input type="number" value={char.speed} onChange={e=>update({speed:parseInt(e.target.value)||0})} className="bg-transparent text-amber-200 font-bold text-xl w-full text-center focus:outline-none focus:text-amber-400"/>
              </div>
              <div className="bg-[#0d1525] border border-amber-900/30 rounded p-2 text-center">
                <div className="text-amber-700 text-[9px] tracking-widest mb-1">Init.</div>
                <div className="text-amber-200 font-bold text-xl font-mono">{modStr(mod('dexterity'))}</div>
              </div>
            </div>
            <div className="bg-[#0d1525] border border-amber-900/30 rounded p-2.5">
              <div className="text-amber-800 text-[9px] tracking-widest mb-1.5 uppercase">Hit Dice ({char.hitDice})</div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-mono font-bold">{char.level - char.hitDiceUsed}</span>
                <span className="text-amber-700 text-xs">/ {char.level} remaining</span>
                <div className="flex gap-1 ml-auto">
                  <button onClick={()=>update({hitDiceUsed:Math.min(char.level,char.hitDiceUsed+1)})} className="bg-red-900/30 hover:bg-red-800/40 border border-red-900/40 text-red-400 rounded px-2 py-1 text-[10px] transition-colors">Use</button>
                  <button onClick={()=>update({hitDiceUsed:0})} className="bg-green-900/30 hover:bg-green-800/40 border border-green-900/40 text-green-400 rounded px-2 py-1 text-[10px] transition-colors">Rest</button>
                </div>
              </div>
            </div>
            <div className="bg-[#0d1525] border border-amber-900/30 rounded p-2.5">
              <div className="text-amber-800 text-[9px] tracking-widest mb-2 uppercase">Death Saving Throws</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-[10px]">Success</span>
                  <div className="flex gap-1">
                    {[0,1,2].map(i=>(
                      <button key={i} onClick={()=>update({deathSuccesses:char.deathSuccesses===i+1?0:i+1})} className={`w-5 h-5 rounded-full border transition-colors ${i<char.deathSuccesses?'bg-green-600 border-green-500':'border-green-900/50'}`}/>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0,1,2].map(i=>(
                      <button key={i} onClick={()=>update({deathFailures:char.deathFailures===i+1?0:i+1})} className={`w-5 h-5 rounded-full border transition-colors ${i<char.deathFailures?'bg-red-600 border-red-500':'border-red-900/50'}`}/>
                    ))}
                  </div>
                  <span className="text-red-500 text-[10px]">Failure</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── SPELLS TAB ── */}
        {tab === 'Spells' && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-amber-800 text-[9px] tracking-widest block mb-0.5">ABILITY</label>
                <select value={char.spellcastingAbility} onChange={e=>update({spellcastingAbility:e.target.value as AbilityKey})} className={sel}>
                  {ABILITIES.map(a=><option key={a.key} value={a.key}>{a.abbr}</option>)}
                </select>
              </div>
              <div className="bg-[#0d1525] border border-amber-900/30 rounded p-2 text-center">
                <div className="text-amber-500 font-bold text-lg font-mono">{spellSaveDC()}</div>
                <div className="text-amber-800 text-[9px] tracking-widest">SAVE DC</div>
              </div>
              <div className="bg-[#0d1525] border border-amber-900/30 rounded p-2 text-center">
                <div className="text-amber-500 font-bold text-lg font-mono">{modStr(spellAttackBonus())}</div>
                <div className="text-amber-800 text-[9px] tracking-widest">ATK BONUS</div>
              </div>
            </div>
            <div className="bg-[#0d1525] border border-amber-900/30 rounded p-2.5">
              <div className="text-amber-800 text-[9px] tracking-widest mb-2 uppercase">Spell Slots</div>
              <div className="space-y-1.5">
                {[1,2,3,4,5,6,7,8,9].map(lvl => {
                  const slot = char.spellSlots[lvl] || { total:0, used:0 };
                  if (slot.total === 0 && lvl > 5) return null;
                  return (
                    <div key={lvl} className="flex items-center gap-2">
                      <span className="text-amber-700 text-[10px] w-14">Level {lvl}</span>
                      <input type="number" min={0} max={9} value={slot.total} onChange={e=>update({spellSlots:{...char.spellSlots,[lvl]:{...slot,total:parseInt(e.target.value)||0}}})} className="w-8 bg-black/40 border border-amber-900/40 text-amber-200 rounded px-1 py-0.5 text-[10px] text-center focus:outline-none"/>
                      <div className="flex gap-1 flex-wrap">
                        {Array.from({length:slot.total}).map((_,i)=>(
                          <button key={i} onClick={()=>update({spellSlots:{...char.spellSlots,[lvl]:{...slot,used:i<slot.used?i:i+1}}})} className={`w-4 h-4 rounded-full border transition-colors ${i<slot.used?'bg-amber-700 border-amber-600':'border-amber-900/50 hover:border-amber-700'}`}/>
                        ))}
                      </div>
                      {slot.used > 0 && <button onClick={()=>update({spellSlots:{...char.spellSlots,[lvl]:{...slot,used:0}}})} className="text-[9px] text-green-700 hover:text-green-500 ml-auto transition-colors">Restore</button>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-[#0d1525] border border-amber-900/30 rounded p-2.5 space-y-1.5">
              <div className="text-amber-800 text-[9px] tracking-widest uppercase mb-1">Add Spell</div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="col-span-2"><input value={newSpell.name} onChange={e=>setNewSpell(p=>({...p,name:e.target.value}))} placeholder="Spell name" className={inp}/></div>
                <input type="number" min={0} max={9} value={newSpell.level} onChange={e=>setNewSpell(p=>({...p,level:parseInt(e.target.value)||0}))} placeholder="Lvl" className={inp}/>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <input value={newSpell.castingTime} onChange={e=>setNewSpell(p=>({...p,castingTime:e.target.value}))} placeholder="Casting time" className={inp}/>
                <input value={newSpell.range} onChange={e=>setNewSpell(p=>({...p,range:e.target.value}))} placeholder="Range" className={inp}/>
              </div>
              <textarea value={newSpell.description} onChange={e=>setNewSpell(p=>({...p,description:e.target.value}))} placeholder="Description (optional)" className={`${inp} resize-none h-12`}/>
              <button onClick={addSpell} className="w-full py-1.5 bg-amber-800/40 hover:bg-amber-700/50 border border-amber-700/40 text-amber-300 rounded text-xs flex items-center justify-center gap-1 transition-colors"><Plus className="w-3 h-3"/>Add Spell</button>
            </div>
            {char.spells.length > 0 && (
              <div className="space-y-1">
                {[...Array(10).keys()].map(lvl => {
                  const spells = char.spells.filter(s=>s.level===lvl);
                  if (!spells.length) return null;
                  return (
                    <div key={lvl}>
                      <div className="text-amber-800 text-[9px] tracking-widest mb-1">{lvl===0?'CANTRIPS':`LEVEL ${lvl}`}</div>
                      {spells.map(s=>(
                        <div key={s.id} className="flex items-center gap-2 bg-[#0a0f1a] border border-amber-900/20 rounded px-2.5 py-1.5 mb-1">
                          <button onClick={()=>toggleSpellPrepared(s.id)} className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 transition-colors ${s.prepared?'bg-amber-500 border-amber-400':'border-amber-900/50 hover:border-amber-700'}`}/>
                          <span className="flex-1 text-amber-300 text-xs">{s.name}</span>
                          <span className="text-amber-800 text-[9px]">{s.castingTime}</span>
                          <button onClick={()=>removeSpell(s.id)} className="text-red-900 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3"/></button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── GEAR TAB ── */}
        {tab === 'Gear' && (
          <>
            <div className="bg-[#0d1525] border border-amber-900/30 rounded p-2.5">
              <div className="text-amber-800 text-[9px] tracking-widest mb-2 uppercase">Currency</div>
              <div className="grid grid-cols-5 gap-1.5">
                {(['cp','sp','ep','gp','pp'] as const).map(c=>(
                  <div key={c} className="text-center">
                    <div className="text-amber-700 text-[9px] tracking-widest mb-0.5 uppercase">{c}</div>
                    <input type="number" min={0} value={char[c]} onChange={e=>update({[c]:parseInt(e.target.value)||0})} className="bg-black/40 border border-amber-900/40 text-amber-200 rounded px-1 py-1 text-xs text-center focus:outline-none focus:border-amber-600 w-full"/>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-1.5">
              <input value={newEquip} onChange={e=>setNewEquip(e.target.value)} placeholder="Item name" className={inp} onKeyDown={e=>e.key==='Enter'&&addEquip()}/>
              <button onClick={addEquip} className="bg-amber-800/40 hover:bg-amber-700/50 border border-amber-700/40 text-amber-300 rounded px-3 py-1.5 text-xs transition-colors flex-shrink-0"><Plus className="w-3.5 h-3.5"/></button>
            </div>
            <div className="space-y-1">
              {char.equipment.map(item=>(
                <div key={item.id} className="flex items-center gap-2 bg-[#0d1525] border border-amber-900/20 rounded px-2.5 py-1.5">
                  <button onClick={()=>update({equipment:char.equipment.map(e=>e.id===item.id?{...e,equipped:!e.equipped}:e)})} className={`w-4 h-4 rounded border transition-colors ${item.equipped?'bg-amber-600 border-amber-500':'border-amber-900/50'}`}/>
                  <span className={`flex-1 text-xs ${item.equipped?'text-amber-200':'text-amber-500'}`}>{item.name}</span>
                  <input type="number" min={1} value={item.qty} onChange={e=>update({equipment:char.equipment.map(eq=>eq.id===item.id?{...eq,qty:parseInt(e.target.value)||1}:eq)})} className="w-10 bg-black/40 border border-amber-900/30 text-amber-700 rounded px-1 py-0.5 text-[10px] text-center focus:outline-none"/>
                  <button onClick={()=>removeEquip(item.id)} className="text-red-900 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3"/></button>
                </div>
              ))}
              {char.equipment.length===0&&<div className="text-amber-900/40 text-xs text-center py-4">No equipment</div>}
            </div>
          </>
        )}

        {/* ── NOTES TAB ── */}
        {tab === 'Notes' && (
          <div className="space-y-2">
            {([['PERSONALITY TRAITS','personalityTraits'],['IDEALS','ideals'],['BONDS','bonds'],['FLAWS','flaws'],['FEATURES & TRAITS','features'],['NOTES','notes']] as [string,string][]).map(([noteLabel, noteField]) => (
              <div key={noteField}>
                <label className="text-amber-800 text-[9px] tracking-widest block mb-0.5">{noteLabel}</label>
                <textarea value={char[noteField as keyof typeof char] as string} onChange={e=>update({[noteField]:e.target.value})}
                  placeholder={`Enter ${noteLabel.toLowerCase()}...`} className={`${inp} resize-none ${noteField==='notes'||noteField==='features'?'h-20':'h-12'}`}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
