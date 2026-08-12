import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Upload, Loader2, BookOpen, Plus, Sparkles } from 'lucide-react';
import { MonsterData, LootItem, SceneNote } from '@/types/dnd';
import { Token } from '@/types/dnd';

interface ImportResult {
  monsters: MonsterData[];
  loot: LootItem[];
  notes: SceneNote[];
}

interface Props {
  onAddMonster?: (monster: MonsterData) => void;
  onAddLoot?: (items: LootItem[]) => void;
  onAddNotes?: (notes: SceneNote[]) => void;
  onAddToken?: (token: Token) => void;
}

export function AISourceImporter({ onAddMonster, onAddLoot, onAddNotes, onAddToken }: Props) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setError(null);
    setResult(null);

    // Preview
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Convert to base64 for API
    const toBase64 = (f: File): Promise<string> =>
      new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => {
          const b64 = (r.result as string).split(',')[1];
          res(b64);
        };
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
      if (fnError instanceof FunctionsHttpError) {
        try { msg = await fnError.context.text(); } catch {}
      }
      setError(msg);
      setLoading(false);
      return;
    }

    // Stamp IDs & isCustom on monsters
    const monsters: MonsterData[] = (data.monsters || []).map((m: any) => ({ ...m, isCustom: true }));
    const loot: LootItem[] = (data.loot || []).map((l: any) => ({
      id: Date.now().toString() + Math.random(), name: l.name, quantity: l.quantity ?? 1,
      value: l.value ?? '', description: l.description ?? '', given: false,
    }));
    const notes: SceneNote[] = (data.notes || []).map((n: any) => ({
      id: Date.now().toString() + Math.random(), title: n.title, content: n.content,
      type: n.type ?? 'note',
    }));

    setResult({ monsters, loot, notes });
    setLoading(false);
  };

  const addAll = () => {
    if (!result) return;
    if (result.loot.length > 0) onAddLoot?.(result.loot);
    if (result.notes.length > 0) onAddNotes?.(result.notes);
    // Don't auto-add monsters — they need to be placed intentionally
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-500"/>
        <div>
          <div className="text-amber-300 text-sm font-semibold" style={{ fontFamily: 'Georgia,serif' }}>AI Source Importer</div>
          <div className="text-amber-800 text-[10px]">Upload a sourcebook page to extract monsters, loot & notes</div>
        </div>
      </div>

      {/* Upload area */}
      <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${loading ? 'opacity-50 cursor-wait' : 'border-amber-900/40 hover:border-amber-700 hover:bg-amber-900/10'}`}>
        {preview
          ? <img src={preview} className="w-full max-h-40 object-contain rounded border border-amber-900/30" alt="preview"/>
          : <>
              <BookOpen className="w-8 h-8 text-amber-800"/>
              <span className="text-amber-700 text-xs text-center">Click or drag a sourcebook page image<br/><span className="text-amber-900/60">JPG, PNG, WebP</span></span>
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

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded p-2.5 text-red-300 text-xs">{error}</div>
      )}

      {result && (
        <div className="space-y-3">
          {/* Monsters */}
          {result.monsters.length > 0 && (
            <div>
              <div className="text-amber-700 text-[10px] tracking-widest uppercase mb-1.5 flex items-center gap-1">
                <span>Monsters ({result.monsters.length})</span>
              </div>
              <div className="space-y-1.5">
                {result.monsters.map((m, i) => (
                  <div key={i} className="bg-[#0d1525] border border-amber-900/25 rounded px-3 py-2 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-amber-200 text-xs font-semibold truncate">{m.name}</div>
                      <div className="text-amber-800 text-[10px]">CR {m.cr} · AC {m.ac} · {m.avgHp} HP</div>
                    </div>
                    <button
                      onClick={() => onAddMonster?.(m)}
                      title="Add to library"
                      className="flex-shrink-0 p-1.5 rounded bg-amber-800/30 hover:bg-amber-700/40 border border-amber-800/40 text-amber-400 transition-colors"
                    >
                      <Plus className="w-3 h-3"/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loot */}
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

          {/* Notes */}
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
            <div className="text-amber-900/50 text-xs text-center py-2">No game content detected in this image.</div>
          )}

          {/* Add all loot + notes button */}
          {(result.loot.length > 0 || result.notes.length > 0) && (
            <button
              onClick={addAll}
              className="w-full py-2 bg-amber-800/40 hover:bg-amber-700/50 border border-amber-700/40 text-amber-300 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5"/>
              Add All Loot & Notes to Session
            </button>
          )}

          {/* Re-upload */}
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
