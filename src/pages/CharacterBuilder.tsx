import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { saveCharacter, listCharacters } from '@/lib/charMapApi';
import { Character, AbilityKey, EquipItem, Spell } from '@/types/dnd';
import { defaultCharacter } from '@/hooks/useCharacter';
import { ABILITIES, SKILLS, CLASSES, RACES, BACKGROUNDS, ALIGNMENTS, HIT_DICE, profBonus, abilityMod, modStr } from '@/constants/dnd5e';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';

const TABS = ['Identity','Abilities','Combat','Skills','Spells','Equipment','Notes'] as const;
type Tab = typeof TABS[number];

const inp = "w-full bg-black/50 border border-amber-900/50 rounded px-3 py-2 text-amber-100 placeholder-amber-900/50 text-sm focus:outline-none focus:border-amber-600 transition-colors";
const sel = `${inp} cursor-pointer`;

export default function CharacterBuilder() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const editId = params.get('id');
  const [tab, setTab] = useState<Tab>('Identity');
  const [char, setChar] = useState<Character>({ ...defaultCharacter });
  const [charId, setCharId] = useState<string | null>(editId);
  const [saving, setSaving] = useState(false);
  const [newEquip, setNewEquip] = useState('');

  const sanitizeChar = (raw: Character): Character => {
    const validAbilities = ['strength','dexterity','constitution','intelligence','wisdom','charisma'] as const;
    const merged = { ...defaultCharacter, ...raw };
    if (typeof merged.spellcastingAbility !== 'string' || !validAbilities.includes(merged.spellcastingAbility as typeof validAbilities[number])) {
      merged.spellcastingAbility = 'intelligence';
    }
    return merged;
  };

  useEffect(() => {
    if (!user) return;
    if (editId) {
      listCharacters(user.id).then(cs => {
        const found = cs.find(c => c.id === editId);
        if (found) { setChar(sanitizeChar(found.characterData)); setCharId(found.id); }
      });
    }
  }, [user, editId]);

  const up = (partial: Partial<Character>) => setChar(prev => ({ ...prev, ...partial }));
  const upScore = (k: AbilityKey, v: number) => up({ abilityScores: { ...char.abilityScores, [k]: Math.max(1, Math.min(30, v)) } });
  const profB = profBonus(char.level);
  const mod = (k: AbilityKey) => abilityMod(char.abilityScores[k]);

  const handleSave = async () => {
    if (!user) { toast.error('Sign in to save'); return; }
    if (!char.name.trim()) { toast.error('Enter a character name'); return; }
    setSaving(true);
    const id = await saveCharacter(user.id, charId, char.name, char);
    if (id) {
      setCharId(id);
      toast.success(`${char.name} saved!`);
    } else {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const addEquip = () => {
    if (!newEquip.trim()) return;
    const item: EquipItem = { id: Date.now().toString(), name: newEquip.trim(), qty: 1, weight: 0, equipped: false };
    up({ equipment: [...char.equipment, item] });
    setNewEquip('');
  };

  const label = (text: string) => <label className="text-amber-800 text-[10px] tracking-widest block mb-1 uppercase">{text}</label>;

  return (
    <div className="min-h-screen bg-[#06090f] text-amber-100 flex flex-col">
      {/* Header */}
      <header className="bg-[#0b0e1a] border-b border-amber-900/30 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/dashboard')} className="text-amber-800 hover:text-amber-500 transition-colors">
          <ArrowLeft className="w-4 h-4"/>
        </button>
        <span className="text-amber-600 text-xs tracking-widest font-bold">CHARACTER BUILDER</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-amber-500 text-sm font-medium truncate max-w-40">{char.name || 'New Adventurer'}</span>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 bg-amber-800/50 hover:bg-amber-700/60 border border-amber-700/50 text-amber-200 rounded px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50">
            <Save className="w-3.5 h-3.5"/>{saving ? 'Saving…' : 'SAVE'}
          </button>
        </div>
      </header>

      {/* Tab nav */}
      <div className="bg-[#0b0e1a] border-b border-amber-900/30 px-4 flex gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-3 px-3 text-[11px] font-bold tracking-wider whitespace-nowrap transition-colors ${tab === t ? 'text-amber-400 border-b-2 border-amber-500' : 'text-amber-800 hover:text-amber-600'}`}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
        {/* IDENTITY */}
        {tab === 'Identity' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><div>{label('Character Name')}<input value={char.name} onChange={e => up({ name: e.target.value })} className={inp}/></div></div>
            <div>{label('Race')}<select value={char.race} onChange={e => up({ race: e.target.value })} className={sel}>{RACES.map(r => <option key={r}>{r}</option>)}</select></div>
            <div>{label('Class')}<select value={char.charClass} onChange={e => up({ charClass: e.target.value, hitDice: HIT_DICE[e.target.value] || 'd8' })} className={sel}>{CLASSES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div>{label('Level')}<input type="number" min={1} max={20} value={char.level} onChange={e => up({ level: parseInt(e.target.value) || 1 })} className={inp}/></div>
            <div>{label('Subclass')}<input value={char.subclass} onChange={e => up({ subclass: e.target.value })} placeholder="e.g. Champion" className={inp}/></div>
            <div>{label('Background')}<select value={char.background} onChange={e => up({ background: e.target.value })} className={sel}>{BACKGROUNDS.map(b => <option key={b}>{b}</option>)}</select></div>
            <div>{label('Alignment')}<select value={char.alignment} onChange={e => up({ alignment: e.target.value })} className={sel}>{ALIGNMENTS.map(a => <option key={a}>{a}</option>)}</select></div>
            <div>{label('Experience Points')}<input type="number" min={0} value={char.xp} onChange={e => up({ xp: parseInt(e.target.value) || 0 })} className={inp}/></div>
            <div className="col-span-2 p-3 bg-[#0d1525] border border-amber-900/30 rounded">
              <div className="text-amber-800 text-[10px] tracking-widest mb-2">QUICK STATS</div>
              <div className="flex gap-6 text-sm">
                <div><span className="text-amber-700">Proficiency Bonus: </span><span className="text-amber-400 font-mono font-bold">{modStr(profB)}</span></div>
                <div><span className="text-amber-700">Initiative: </span><span className="text-amber-400 font-mono font-bold">{modStr(mod('dexterity'))}</span></div>
                <div><span className="text-amber-700">Hit Die: </span><span className="text-amber-400 font-mono font-bold">{char.hitDice}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ABILITIES */}
        {tab === 'Abilities' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {ABILITIES.map(a => (
                <div key={a.key} className="bg-[#0d1525] border border-amber-900/30 rounded-lg p-4 text-center">
                  <div className="text-amber-700 text-[10px] tracking-widest mb-2">{a.abbr}</div>
                  <input type="number" min={1} max={30} value={char.abilityScores[a.key]}
                    onChange={e => upScore(a.key, parseInt(e.target.value) || 10)}
                    className="bg-transparent text-amber-200 font-bold text-2xl w-full text-center focus:outline-none"/>
                  <div className="text-3xl font-bold text-amber-500 font-mono mt-1">{modStr(mod(a.key))}</div>
                  <div className="text-amber-800 text-[9px] mt-1">{a.name}</div>
                </div>
              ))}
            </div>
            <div className="bg-[#0d1525] border border-amber-900/30 rounded p-4">
              <div className="text-amber-800 text-[10px] tracking-widest mb-3">SAVING THROW PROFICIENCIES</div>
              <div className="grid grid-cols-3 gap-2">
                {ABILITIES.map(a => (
                  <label key={a.key} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={!!char.saveProficiencies[a.key]} onChange={() => up({ saveProficiencies: { ...char.saveProficiencies, [a.key]: !char.saveProficiencies[a.key] } })} className="accent-amber-600 w-4 h-4"/>
                    <span className="text-amber-400 text-xs">{a.abbr}</span>
                    <span className="text-amber-700 text-[10px] font-mono">{modStr(abilityMod(char.abilityScores[a.key]) + (char.saveProficiencies[a.key] ? profB : 0))}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COMBAT */}
        {tab === 'Combat' && (
          <div className="grid grid-cols-2 gap-4">
            <div>{label('Max HP')}<input type="number" min={1} value={char.maxHp} onChange={e => up({ maxHp: parseInt(e.target.value) || 1, currentHp: parseInt(e.target.value) || 1 })} className={inp}/></div>
            <div>{label('Armor Class')}<input type="number" min={0} value={char.ac} onChange={e => up({ ac: parseInt(e.target.value) || 0 })} className={inp}/></div>
            <div>{label('Speed (ft.)')}<input type="number" min={0} value={char.speed} onChange={e => up({ speed: parseInt(e.target.value) || 0 })} className={inp}/></div>
            <div>{label('Temp HP')}<input type="number" min={0} value={char.tempHp} onChange={e => up({ tempHp: parseInt(e.target.value) || 0 })} className={inp}/></div>
            <div className="col-span-2">
              <div className="text-amber-800 text-[10px] tracking-widest mb-2 uppercase">Currency</div>
              <div className="grid grid-cols-5 gap-2">
                {(['cp','sp','ep','gp','pp'] as const).map(c => (
                  <div key={c}>
                    <div className="text-amber-700 text-[9px] text-center mb-1 uppercase">{c}</div>
                    <input type="number" min={0} value={char[c]} onChange={e => up({ [c]: parseInt(e.target.value) || 0 })} className="w-full bg-black/50 border border-amber-900/40 text-amber-200 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:border-amber-600"/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SKILLS */}
        {tab === 'Skills' && (
          <div>
            <p className="text-amber-800 text-xs mb-3">Click to cycle: none → proficient → expertise</p>
            <div className="space-y-0.5">
              {SKILLS.map(s => {
                const prof = char.skillProficiencies[s.key];
                const isProficient = prof?.proficient;
                const isExpert = prof?.expertise;
                const bonus = abilityMod(char.abilityScores[s.ability]) + (isProficient ? profB : 0) + (isExpert ? profB : 0);
                const toggleSkill = () => {
                  const next = !isProficient ? { proficient: true, expertise: false } : isExpert ? { proficient: false, expertise: false } : { proficient: true, expertise: true };
                  up({ skillProficiencies: { ...char.skillProficiencies, [s.key]: next } });
                };
                return (
                  <button key={s.key} onClick={toggleSkill} className="w-full flex items-center gap-3 py-2 px-3 rounded hover:bg-amber-900/10 transition-colors">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isExpert ? 'bg-amber-400 border-amber-400' : isProficient ? 'bg-amber-700 border-amber-600' : 'border-amber-900/50'}`}>
                      {isExpert && <div className="w-1.5 h-1.5 bg-amber-900 rounded-full"/>}
                    </div>
                    <span className="text-amber-500 font-mono text-xs w-8 text-right">{modStr(bonus)}</span>
                    <span className="flex-1 text-amber-300 text-sm text-left">{s.name}</span>
                    <span className="text-amber-800 text-[10px]">{s.abbr}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SPELLS */}
        {tab === 'Spells' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>{label('Casting Ability')}<select value={char.spellcastingAbility} onChange={e => up({ spellcastingAbility: e.target.value as AbilityKey })} className={sel}>{ABILITIES.map(a => <option key={a.key} value={a.key}>{a.abbr}</option>)}</select></div>
              <div className="bg-[#0d1525] border border-amber-900/30 rounded p-3 text-center"><div className="text-amber-500 text-xl font-mono font-bold">{8 + profB + mod(char.spellcastingAbility)}</div><div className="text-amber-800 text-[9px]">SAVE DC</div></div>
              <div className="bg-[#0d1525] border border-amber-900/30 rounded p-3 text-center"><div className="text-amber-500 text-xl font-mono font-bold">{modStr(profB + mod(char.spellcastingAbility))}</div><div className="text-amber-800 text-[9px]">ATK BONUS</div></div>
            </div>
            <div className="bg-[#0d1525] border border-amber-900/30 rounded p-3">
              <div className="text-amber-800 text-[9px] tracking-widest mb-3">SPELL SLOTS</div>
              <div className="grid grid-cols-3 gap-2">
                {[1,2,3,4,5,6,7,8,9].map(lvl => (
                  <div key={lvl} className="flex items-center gap-2">
                    <span className="text-amber-700 text-[10px] w-12">Lv {lvl}</span>
                    <input type="number" min={0} max={9} value={char.spellSlots[lvl]?.total || 0}
                      onChange={e => up({ spellSlots: { ...char.spellSlots, [lvl]: { ...char.spellSlots[lvl], total: parseInt(e.target.value) || 0, used: 0 } } })}
                      className="w-12 bg-black/50 border border-amber-900/40 text-amber-200 rounded px-2 py-1 text-xs text-center focus:outline-none"/>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {char.spells.map(s => (
                <div key={s.id} className="flex items-center gap-2 bg-[#0d1525] border border-amber-900/20 rounded px-3 py-2">
                  <span className="text-amber-700 text-[10px] w-12">Lv {s.level}</span>
                  <span className="flex-1 text-amber-300 text-sm">{s.name}</span>
                  <span className="text-amber-800 text-[10px]">{s.castingTime}</span>
                  <button onClick={() => up({ spells: char.spells.filter(sp => sp.id !== s.id) })} className="text-red-900 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              ))}
              <button onClick={() => {
                const name = prompt('Spell name?');
                if (!name) return;
                const level = parseInt(prompt('Spell level (0-9)?') || '0') || 0;
                const spell: Spell = { id: Date.now().toString(), name, level, school:'Evocation', castingTime:'1 action', range:'60 ft.', components:'V,S', duration:'Instantaneous', description:'', prepared:false };
                up({ spells: [...char.spells, spell] });
              }} className="w-full flex items-center justify-center gap-1.5 bg-amber-900/20 hover:bg-amber-900/30 border border-amber-900/30 border-dashed text-amber-700 rounded py-2 text-xs transition-colors">
                <Plus className="w-3.5 h-3.5"/> Add Spell
              </button>
            </div>
          </div>
        )}

        {/* EQUIPMENT */}
        {tab === 'Equipment' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input value={newEquip} onChange={e => setNewEquip(e.target.value)} placeholder="Item name" className={inp} onKeyDown={e => e.key === 'Enter' && addEquip()}/>
              <button onClick={addEquip} className="bg-amber-800/40 hover:bg-amber-700/50 border border-amber-700/40 text-amber-300 rounded px-4 py-2 text-xs transition-colors"><Plus className="w-4 h-4"/></button>
            </div>
            {char.equipment.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-[#0d1525] border border-amber-900/20 rounded px-3 py-2.5">
                <input type="checkbox" checked={item.equipped} onChange={() => up({ equipment: char.equipment.map(e => e.id === item.id ? { ...e, equipped: !e.equipped } : e) })} className="accent-amber-600 w-4 h-4"/>
                <span className={`flex-1 text-sm ${item.equipped ? 'text-amber-200' : 'text-amber-600'}`}>{item.name}</span>
                <input type="number" min={1} value={item.qty} onChange={e => up({ equipment: char.equipment.map(eq => eq.id === item.id ? { ...eq, qty: parseInt(e.target.value) || 1 } : eq) })} className="w-12 bg-black/40 border border-amber-900/30 text-amber-700 rounded px-2 py-1 text-xs text-center focus:outline-none"/>
                <button onClick={() => up({ equipment: char.equipment.filter(e => e.id !== item.id) })} className="text-red-900 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            ))}
          </div>
        )}

        {/* NOTES */}
        {tab === 'Notes' && (
          <div className="space-y-3">
            {([['Personality Traits','personalityTraits'],['Ideals','ideals'],['Bonds','bonds'],['Flaws','flaws'],['Features & Traits','features'],['Notes','notes']] as [string,string][]).map(([lbl,field]) => (
              <div key={field}>
                {label(lbl)}
                <textarea value={(char as any)[field] || ''} onChange={e => up({ [field]: e.target.value })} placeholder={`Enter ${lbl.toLowerCase()}…`}
                  className={`${inp} resize-none`} rows={field === 'notes' || field === 'features' ? 4 : 2}/>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-amber-900/20">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-amber-700 hover:text-amber-500 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4"/> Back to Dashboard
          </button>
          <button onClick={handleSave} disabled={saving} className="ml-auto flex items-center gap-2 bg-amber-800/50 hover:bg-amber-700/60 border border-amber-700/50 text-amber-200 rounded px-5 py-2.5 text-xs font-bold transition-colors disabled:opacity-50">
            <Save className="w-3.5 h-3.5"/>{saving ? 'Saving…' : 'SAVE CHARACTER'}
          </button>
        </div>
      </main>
    </div>
  );
}
