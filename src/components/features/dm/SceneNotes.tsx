import { useState } from 'react';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { SceneNote } from '@/types/dnd';

interface Props { notes: SceneNote[]; onUpdate: (notes: SceneNote[]) => void; }

export function SceneNotes({ notes, onUpdate }: Props) {
  const [active, setActive] = useState<string|null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<SceneNote['type']>('note');

  const create = () => {
    if (!newTitle.trim()) return;
    const note: SceneNote = { id: Date.now().toString(), title: newTitle.trim(), content: '', type: newType };
    onUpdate([...notes, note]);
    setActive(note.id);
    setNewTitle(''); setCreating(false);
  };

  const remove = (id: string) => { onUpdate(notes.filter(n=>n.id!==id)); if (active===id) setActive(null); };

  const updateContent = (id: string, content: string) => onUpdate(notes.map(n=>n.id===id?{...n,content}:n));

  const typeColors: Record<SceneNote['type'], string> = {
    note: 'text-amber-400 border-amber-800/50',
    handout: 'text-blue-400 border-blue-800/50',
    secret: 'text-red-400 border-red-800/50',
  };

  const activeNote = notes.find(n=>n.id===active);

  return (
    <div className="flex flex-col h-full p-3 gap-2">
      <div className="flex items-center justify-between">
        <span className="text-amber-700 text-[10px] tracking-widest uppercase">Scene Notes</span>
        <button onClick={()=>setCreating(c=>!c)} className="bg-amber-900/30 hover:bg-amber-800/40 border border-amber-800/40 text-amber-400 rounded px-2 py-1 text-[11px] flex items-center gap-1 transition-colors">
          <Plus className="w-3 h-3"/> New
        </button>
      </div>

      {creating && (
        <div className="bg-[#0d1525] border border-amber-900/40 rounded p-2.5 space-y-2">
          <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Note title..." className="w-full bg-black/50 border border-amber-900/40 text-amber-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-amber-600" onKeyDown={e=>e.key==='Enter'&&create()}/>
          <div className="flex gap-1.5">
            {(['note','handout','secret'] as const).map(t=>(
              <button key={t} onClick={()=>setNewType(t)} className={`flex-1 py-1 rounded text-[10px] border capitalize transition-colors ${newType===t?'bg-amber-800/50 text-amber-200 border-amber-700':'bg-transparent text-amber-800 border-amber-900/40 hover:text-amber-500'}`}>{t}</button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button onClick={create} className="flex-1 py-1.5 bg-amber-700/50 hover:bg-amber-600/60 border border-amber-600/50 text-amber-200 rounded text-xs font-bold transition-colors">Create</button>
            <button onClick={()=>setCreating(false)} className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/40 text-gray-500 rounded text-xs transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-1 min-h-0">
        {/* List */}
        <div className="w-28 flex-shrink-0 overflow-y-auto space-y-1">
          {notes.map(n=>(
            <button key={n.id} onClick={()=>setActive(n.id)} className={`w-full text-left p-2 rounded border text-[11px] truncate transition-colors ${active===n.id?'bg-amber-900/30 border-amber-700/50 text-amber-200':'bg-[#0d1525] border-amber-900/20 text-amber-700 hover:text-amber-400 hover:border-amber-900/40'}`}>
              <div className={`text-[9px] uppercase tracking-wider mb-0.5 ${typeColors[n.type].split(' ')[0]}`}>{n.type}</div>
              {n.title}
            </button>
          ))}
          {notes.length === 0 && <div className="text-amber-900/40 text-[10px] text-center py-4">No notes</div>}
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeNote ? (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[11px] font-semibold ${typeColors[activeNote.type].split(' ')[0]}`}>{activeNote.title}</span>
                <button onClick={()=>remove(activeNote.id)} className="text-red-800 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
              <textarea value={activeNote.content} onChange={e=>updateContent(activeNote.id, e.target.value)}
                placeholder="Write your notes here..." className="flex-1 bg-[#0d1525] border border-amber-900/30 text-amber-200 rounded p-2.5 text-xs resize-none focus:outline-none focus:border-amber-700 leading-relaxed"/>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-amber-900/40 text-sm flex-col gap-2">
              <BookOpen className="w-6 h-6 opacity-30"/>
              <span className="text-xs">Select a note</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
