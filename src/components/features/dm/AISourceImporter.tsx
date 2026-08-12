import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Loader2, BookOpen, Plus, Sparkles, Search, X, ChevronDown, ChevronUp, Sword, Wand2, Package } from 'lucide-react';
import { MonsterData, LootItem, SceneNote } from '@/types/dnd';
import { Token } from '@/types/dnd';

// ─── Open5e API types ────────────────────────────────────────────────────────
interface O5eMonster {
  slug: string; name: string; cr: string; ac: number; hit_points: number;
  size: string; type: string; alignment: string; speed: string;
  strength: number; dexterity: number; constitution: number;
  intelligence: number; wisdom: number; charisma: number;
  senses: string; languages: string; challenge_rating: string;
  special_abilities?: { name: string; desc: string }[];
  actions?: { name: string; desc: string }[];
  legendary_actions?: { name: string; desc: string }[];
  document__title: string; document__slug: string;
}

interface O5eSpell {
  slug: string; name: string; level_int: number; school: string;
  casting_time: string; range: string; components: string; duration: string;
  desc: string; document__title: string;
}

interface O5eItem {
  slug: string; name: string; type: string; cost: string; weight: string;
  desc: string; document__title: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const o5eMonsterToMonsterData = (m: O5eMonster): MonsterData => ({
  name: m.name,
  type: m.type,
  size: m.size,
  alignment: m.alignment,
  ac: m.ac,
  hp: `${m.hit_points}`,
  avgHp: m.hit_points,
  speed: typeof m.speed === 'object' ? Object.entries(m.speed as Record<string, number>).map(([k,v]) => `${k} ${v} ft.`).join(', ') : String(m.speed),
  str: m.strength, dex: m.dexterity, con: m.constitution,
  int: m.intelligence, wis: m.wisdom, cha: m.charisma,
  cr: m.cr || m.challenge_rating,
  xp: crToXp(m.cr || m.challenge_rating),
  profBonus: 2,
  senses: m.senses || 'Passive Perception 10',
  languages: m.languages || '—',
  saves: '', skills: '', immunities: '', resistances: '', conditionImmunities: '',
  traits: (m.special_abilities || []).map(a => ({ name: a.name, desc: a.desc })),
  actions: (m.actions || []).map(a => ({ name: a.name, desc: a.desc })),
  legendaryActions: (m.legendary_actions || []).map(a => ({ name: a.name, desc: a.desc })),
  isCustom: true,
});

const crToXp = (cr: string): number => {
  const table: Record<string, number> = {
    '0':10,'1/8':25,'1/4':50,'1/2':100,'1':200,'2':450,'3':700,'4':1100,
    '5':1800,'6':2300,'7':2900,'8':3900,'9':5000,'10':5900,'11':7200,
    '12':8400,'13':10000,'14':11500,'15':13000,'16':15000,'17':18000,
    '18':20000,'19':22000,'20':25000,'21':33000,'22':41000,'23':50000,
    '24':62000,'30':155000,
  };
  return table[cr] ?? 0;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ImportResult { monsters: MonsterData[]; loot: LootItem[]; notes: SceneNote[]; }

interface Props {
  onAddMonster?: (monster: MonsterData) => void;
  onAddLoot?: (items: LootItem[]) => void;
  onAddNotes?: (notes: SceneNote[]) => void;
  onAddToken?: (token: Token) => void;
}

// ── Book Search Tab ──────────────────────────────────────────────────────────
function BookSearchTab({ onAddMonster, onAddLoot }: Pick<Props, 'onAddMonster' | 'onAddLoot'>) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'monsters' | 'spells' | 'items'>('monsters');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monsters, setMonsters] = useState<O5eMonster[]>([]);
  const [spells, setSpells] = useState<O5eSpell[]>([]);
  const [items, setItems] = useState<O5eItem[]>([]);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    setMonsters([]); setSpells([]); setItems([]);
    setExpandedSlug(null);

    const q = encodeURIComponent(query.trim());

    try {
      const url =
        searchType === 'monsters' ? `https://api.open5e.com/v2/creatures/?search=${q}&limit=20` :
        searchType === 'spells'   ? `https://api.open5e.com/v1/spells/?search=${q}&limit=20` :
                                    `https://api.open5e.com/v1/magicitems/?search=${q}&limit=20`;

      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`Open5e error: ${res.status}`);
      const data = await res.json();

      if (searchType === 'monsters') setMonsters(data.results ?? []);
      else if (searchType === 'spells') setSpells(data.results ?? []);
      else setItems(data.results ?? []);
    } catch (e: any) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [query, searchType]);

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') search(); };

  const addMonsterToLibrary = (m: O5eMonster) => onAddMonster?.(o5eMonsterToMonsterData(m));
  const addItemToLoot = (item: O5eItem) => onAddLoot?.([{
    id: Date.now().toString() + Math.random(),
    name: item.name,
    quantity: 1,
    value: item.cost || '—',
    description: item.desc?.slice(0, 200) || '',
    given: false,
  }]);

  const typeBtn = (type: typeof searchType, Icon: React.ElementType, label: string) => (
    <button
      onClick={() => { setSearchType(type); setMonsters([]); setSpells([]); setItems([]); setExpandedSlug(null); setError(null); }}
      className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] tracking-widest uppercase transition-colors rounded ${searchType === type ? 'bg-amber-800/40 text-amber-400 border border-amber-700/50' : 'text-amber-800 hover:text-amber-600'}`}
    >
      <Icon className="w-3 h-3"/> {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Heading */}
      <div>
        <div className="text-amber-300 text-xs font-semibold mb-0.5" style={{ fontFamily: 'Georgia,serif' }}>Search SRD Library</div>
        <div className="text-amber-900/60 text-[10px]">Search the D&D 5e SRD — type a book name, monster name, spell or item</div>
      </div>

      {/* Type switcher */}
      <div className="flex gap-1">
        {typeBtn('monsters', Sword, 'Monsters')}
        {typeBtn('spells', Wand2, 'Spells')}
        {typeBtn('items', Package, 'Items')}
      </div>

      {/* Search input */}
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-800 pointer-events-none"/>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              searchType === 'monsters' ? 'e.g. "goblin", "dragon", "zombie"…' :
              searchType === 'spells'   ? 'e.g. "fireball", "sleep", "Xanathar"…' :
                                          'e.g. "sword of", "ring of", "wand"…'
            }
            className="w-full bg-black/50 border border-amber-900/40 text-amber-200 rounded pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-amber-600 placeholder-amber-900/40"
          />
          {query && (
            <button onClick={() => { setQuery(''); setMonsters([]); setSpells([]); setItems([]); setError(null); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-800 hover:text-amber-500 transition-colors">
              <X className="w-3 h-3"/>
            </button>
          )}
        </div>
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="px-3 py-1.5 bg-amber-800/50 hover:bg-amber-700/60 border border-amber-700/50 text-amber-300 rounded text-xs font-semibold transition-colors disabled:opacity-40 flex-shrink-0"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : 'Search'}
        </button>
      </div>

      {error && <div className="bg-red-900/20 border border-red-800/40 rounded p-2 text-red-300 text-xs">{error}</div>}

      {/* ── Monster results ── */}
      {searchType === 'monsters' && monsters.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-amber-700 text-[10px] tracking-widest uppercase">{monsters.length} result{monsters.length !== 1 ? 's' : ''}</div>
          {monsters.map(m => {
            const expanded = expandedSlug === m.slug;
            return (
              <div key={m.slug} className="bg-[#0d1525] border border-amber-900/25 rounded overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-amber-200 text-xs font-semibold truncate">{m.name}</div>
                    <div className="text-amber-800 text-[9px]">CR {m.cr} · AC {m.ac} · {m.hit_points} HP · {m.type}</div>
                    <div className="text-amber-900/50 text-[9px] truncate">{m.document__title}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => addMonsterToLibrary(m)} title="Add to monster library"
                      className="p-1.5 rounded bg-amber-800/30 hover:bg-amber-700/40 border border-amber-800/40 text-amber-400 transition-colors">
                      <Plus className="w-3 h-3"/>
                    </button>
                    <button onClick={() => setExpandedSlug(expanded ? null : m.slug)}
                      className="p-1.5 text-amber-800 hover:text-amber-500 transition-colors">
                      {expanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                    </button>
                  </div>
                </div>
                {expanded && (
                  <div className="px-3 pb-2.5 border-t border-amber-900/20 pt-2 space-y-1 text-[10px] text-amber-300/80">
                    <div className="grid grid-cols-6 gap-1 text-center text-[9px]">
                      {(['STR','DEX','CON','INT','WIS','CHA'] as const).map((label, i) => {
                        const vals = [m.strength, m.dexterity, m.constitution, m.intelligence, m.wisdom, m.charisma];
                        const v = vals[i];
                        const mod = Math.floor((v - 10) / 2);
                        return (
                          <div key={label} className="bg-black/30 rounded py-1">
                            <div className="text-amber-700 font-bold">{label}</div>
                            <div className="text-amber-200">{v}</div>
                            <div className="text-amber-600">{mod >= 0 ? `+${mod}` : mod}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div><span className="text-amber-600">Speed:</span> {typeof m.speed === 'object' ? Object.entries(m.speed as Record<string,number>).map(([k,v])=>`${k} ${v}ft`).join(', ') : m.speed}</div>
                    <div><span className="text-amber-600">Senses:</span> {m.senses}</div>
                    <div><span className="text-amber-600">Languages:</span> {m.languages || '—'}</div>
                    {m.actions && m.actions.length > 0 && (
                      <div className="pt-1">
                        <div className="text-amber-600 font-bold tracking-widest uppercase text-[9px] mb-0.5">Actions</div>
                        {m.actions.slice(0, 3).map(a => (
                          <div key={a.name} className="mb-0.5"><span className="text-amber-400 font-semibold">{a.name}.</span> {a.desc.slice(0, 120)}{a.desc.length > 120 ? '…' : ''}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Spell results ── */}
      {searchType === 'spells' && spells.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-amber-700 text-[10px] tracking-widest uppercase">{spells.length} result{spells.length !== 1 ? 's' : ''}</div>
          {spells.map(s => {
            const expanded = expandedSlug === s.slug;
            return (
              <div key={s.slug} className="bg-[#0d1525] border border-amber-900/25 rounded overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-amber-200 text-xs font-semibold truncate">{s.name}</div>
                    <div className="text-amber-800 text-[9px]">{s.level_int === 0 ? 'Cantrip' : `Level ${s.level_int}`} · {s.school} · {s.casting_time}</div>
                    <div className="text-amber-900/50 text-[9px] truncate">{s.document__title}</div>
                  </div>
                  <button onClick={() => setExpandedSlug(expanded ? null : s.slug)}
                    className="p-1.5 text-amber-800 hover:text-amber-500 transition-colors flex-shrink-0">
                    {expanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                  </button>
                </div>
                {expanded && (
                  <div className="px-3 pb-2.5 border-t border-amber-900/20 pt-2 space-y-1 text-[10px] text-amber-300/80">
                    <div className="flex gap-4 flex-wrap">
                      <div><span className="text-amber-600">Range:</span> {s.range}</div>
                      <div><span className="text-amber-600">Components:</span> {s.components}</div>
                      <div><span className="text-amber-600">Duration:</span> {s.duration}</div>
                    </div>
                    <div className="text-amber-300/70 leading-relaxed">{s.desc?.slice(0, 300)}{(s.desc?.length ?? 0) > 300 ? '…' : ''}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Item results ── */}
      {searchType === 'items' && items.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-amber-700 text-[10px] tracking-widest uppercase">{items.length} result{items.length !== 1 ? 's' : ''}</div>
          {items.map(item => {
            const expanded = expandedSlug === item.slug;
            return (
              <div key={item.slug} className="bg-[#0d1525] border border-amber-900/25 rounded overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-amber-200 text-xs font-semibold truncate">{item.name}</div>
                    <div className="text-amber-800 text-[9px]">{item.type} {item.cost ? `· ${item.cost}` : ''}</div>
                    <div className="text-amber-900/50 text-[9px] truncate">{item.document__title}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => addItemToLoot(item)} title="Add to session loot"
                      className="p-1.5 rounded bg-amber-800/30 hover:bg-amber-700/40 border border-amber-800/40 text-amber-400 transition-colors">
                      <Plus className="w-3 h-3"/>
                    </button>
                    <button onClick={() => setExpandedSlug(expanded ? null : item.slug)}
                      className="p-1.5 text-amber-800 hover:text-amber-500 transition-colors">
                      {expanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                    </button>
                  </div>
                </div>
                {expanded && (
                  <div className="px-3 pb-2.5 border-t border-amber-900/20 pt-2 text-[10px] text-amber-300/70 leading-relaxed">
                    {item.desc?.slice(0, 300)}{(item.desc?.length ?? 0) > 300 ? '…' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state after search */}
      {!loading && query && monsters.length === 0 && spells.length === 0 && items.length === 0 && !error && (
        <div className="text-amber-900/50 text-xs text-center py-3">No results. Try a different name or search type.</div>
      )}
    </div>
  );
}

// ── Image Upload Tab ─────────────────────────────────────────────────────────
function ImageUploadTab({ onAddMonster, onAddLoot, onAddNotes }: Pick<Props, 'onAddMonster' | 'onAddLoot' | 'onAddNotes'>) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setError(null); setResult(null);

    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    const toBase64 = (f: File): Promise<string> =>
      new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(f);
      });

    setLoading(true);
    const base64 = await toBase64(file);
    const { data, error: fnError } = await supabase.functions.invoke('ai-source-import', {
      body: { imageBase64: base64, mimeType: file.type },
    });

    if (fnError) {
      let msg = fnError.message;
      if (fnError instanceof FunctionsHttpError) { try { msg = await fnError.context.text(); } catch {} }
      setError(msg);
      setLoading(false);
      return;
    }

    setResult({
      monsters: (data.monsters || []).map((m: any) => ({ ...m, isCustom: true })),
      loot: (data.loot || []).map((l: any) => ({
        id: Date.now().toString() + Math.random(), name: l.name, quantity: l.quantity ?? 1,
        value: l.value ?? '', description: l.description ?? '', given: false,
      })),
      notes: (data.notes || []).map((n: any) => ({
        id: Date.now().toString() + Math.random(), title: n.title, content: n.content, type: n.type ?? 'note',
      })),
    });
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-amber-900/60 text-[10px]">Upload a photo of a sourcebook page — Gemini AI extracts all game content</div>

      <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${loading ? 'opacity-50 cursor-wait' : 'border-amber-900/40 hover:border-amber-700 hover:bg-amber-900/10'}`}>
        {preview
          ? <img src={preview} className="w-full max-h-40 object-contain rounded border border-amber-900/30" alt="preview"/>
          : <>
              <BookOpen className="w-8 h-8 text-amber-800"/>
              <span className="text-amber-700 text-xs text-center">Click or drag a sourcebook page<br/><span className="text-amber-900/60">JPG, PNG, WebP</span></span>
            </>
        }
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={loading}/>
      </label>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-amber-600">
          <Loader2 className="w-4 h-4 animate-spin"/>
          <span className="text-xs">Analyzing with Gemini AI…</span>
        </div>
      )}

      {error && <div className="bg-red-900/20 border border-red-800/40 rounded p-2.5 text-red-300 text-xs">{error}</div>}

      {result && (
        <div className="space-y-3">
          {result.monsters.length > 0 && (
            <div>
              <div className="text-amber-700 text-[10px] tracking-widest uppercase mb-1.5">Monsters ({result.monsters.length})</div>
              <div className="space-y-1.5">
                {result.monsters.map((m, i) => (
                  <div key={i} className="bg-[#0d1525] border border-amber-900/25 rounded px-3 py-2 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-amber-200 text-xs font-semibold truncate">{m.name}</div>
                      <div className="text-amber-800 text-[10px]">CR {m.cr} · AC {m.ac} · {m.avgHp} HP</div>
                    </div>
                    <button onClick={() => onAddMonster?.(m)} title="Add to library"
                      className="flex-shrink-0 p-1.5 rounded bg-amber-800/30 hover:bg-amber-700/40 border border-amber-800/40 text-amber-400 transition-colors">
                      <Plus className="w-3 h-3"/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.loot.length > 0 && (
            <div>
              <div className="text-amber-700 text-[10px] tracking-widest uppercase mb-1.5">Loot ({result.loot.length})</div>
              <div className="space-y-1">
                {result.loot.map((l, i) => (
                  <div key={i} className="bg-[#0d1525] border border-amber-900/25 rounded px-3 py-1.5 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-amber-200 text-xs truncate">{l.name}</div>
                      <div className="text-amber-700 text-[10px]">{l.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.notes.length > 0 && (
            <div>
              <div className="text-amber-700 text-[10px] tracking-widest uppercase mb-1.5">Notes ({result.notes.length})</div>
              <div className="space-y-1">
                {result.notes.map((n, i) => (
                  <div key={i} className="bg-[#0d1525] border border-amber-900/25 rounded px-3 py-1.5">
                    <div className="text-amber-300 text-xs font-semibold">{n.title}</div>
                    <div className="text-amber-700 text-[10px] line-clamp-2 mt-0.5">{n.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.monsters.length === 0 && result.loot.length === 0 && result.notes.length === 0 && (
            <div className="text-amber-900/50 text-xs text-center py-2">No game content detected.</div>
          )}

          {(result.loot.length > 0 || result.notes.length > 0) && (
            <button
              onClick={() => {
                if (result.loot.length > 0) onAddLoot?.(result.loot);
                if (result.notes.length > 0) onAddNotes?.(result.notes);
              }}
              className="w-full py-2 bg-amber-800/40 hover:bg-amber-700/50 border border-amber-700/40 text-amber-300 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5"/> Add All Loot & Notes to Session
            </button>
          )}

          <button
            onClick={() => { setResult(null); setPreview(null); setError(null); }}
            className="w-full py-1.5 border border-amber-900/30 text-amber-800 hover:text-amber-600 rounded text-xs transition-colors"
          >
            Import Another Image
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function AISourceImporter({ onAddMonster, onAddLoot, onAddNotes, onAddToken }: Props) {
  const [mode, setMode] = useState<'search' | 'image'>('search');

  const tabBtn = (m: typeof mode, label: string) => (
    <button
      onClick={() => setMode(m)}
      className={`flex-1 py-2 text-[10px] tracking-widest uppercase transition-colors ${mode === m ? 'text-amber-400 bg-amber-900/15 border-b border-amber-600' : 'text-amber-800 hover:text-amber-600'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 flex-shrink-0">
        <Sparkles className="w-4 h-4 text-amber-500"/>
        <div className="text-amber-300 text-sm font-semibold" style={{ fontFamily: 'Georgia,serif' }}>AI Source Importer</div>
      </div>

      {/* Mode tabs */}
      <div className="flex border-b border-amber-900/30 flex-shrink-0">
        {tabBtn('search', '🔍 Book Search')}
        {tabBtn('image', '📷 Scan Page')}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {mode === 'search'
          ? <BookSearchTab onAddMonster={onAddMonster} onAddLoot={onAddLoot}/>
          : <ImageUploadTab onAddMonster={onAddMonster} onAddLoot={onAddLoot} onAddNotes={onAddNotes}/>
        }
      </div>
    </div>
  );
}
