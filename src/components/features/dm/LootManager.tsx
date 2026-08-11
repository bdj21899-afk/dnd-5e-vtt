import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { LootItem } from '@/types/dnd';

interface Props { loot: LootItem[]; onUpdate: (loot: LootItem[]) => void; }

export function LootManager({ loot, onUpdate }: Props) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [value, setValue] = useState('');
  const [desc, setDesc] = useState('');

  const add = () => {
    if (!name.trim()) return;
    const item: LootItem = { id: Date.now().toString(), name: name.trim(), quantity: parseInt(qty)||1, value: value.trim(), description: desc.trim(), given: false };
    onUpdate([...loot, item]);
    setName(''); setQty('1'); setValue(''); setDesc('');
  };

  const toggle = (id: string) => onUpdate(loot.map(l => l.id===id ? {...l, given: !l.given} : l));
  const remove = (id: string) => onUpdate(loot.filter(l => l.id!==id));

  const totalGP = loot.reduce((sum, l) => {
    const m = l.value.match(/^(\d+(?:\.\d+)?)\s*gp/i);
    return sum + (m ? parseFloat(m[1]) * l.quantity : 0);
  }, 0);

  const inp = "bg-[#0d1525] border border-amber-900/40 text-amber-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-amber-600 w-full";

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      {/* Add form */}
      <div className="bg-[#0d1525] border border-amber-900/30 rounded p-3 space-y-2">
        <div className="grid grid-cols-3 gap-1.5">
          <div className="col-span-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Item name" className={inp} onKeyDown={e=>e.key==='Enter'&&add()}/></div>
          <input value={qty} onChange={e=>setQty(e.target.value)} placeholder="Qty" className={inp} type="number" min="1"/>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <input value={value} onChange={e=>setValue(e.target.value)} placeholder="Value (e.g. 50 gp)" className={inp}/>
          <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description" className={inp}/>
        </div>
        <button onClick={add} className="w-full py-1.5 bg-amber-800/40 hover:bg-amber-700/50 border border-amber-700/40 text-amber-300 rounded text-xs flex items-center justify-center gap-1 transition-colors">
          <Plus className="w-3 h-3"/> Add Item
        </button>
      </div>

      {/* Summary */}
      {loot.length > 0 && (
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-amber-800">{loot.length} items</span>
          {totalGP > 0 && <span className="text-amber-600 font-mono">{totalGP.toLocaleString()} gp total</span>}
        </div>
      )}

      {/* Loot list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        {loot.map(item => (
          <div key={item.id} className={`flex items-start gap-2 p-2.5 rounded border transition-colors ${item.given ? 'bg-[#0a0f1a] border-amber-900/10 opacity-60' : 'bg-[#0d1525] border-amber-900/30'}`}>
            <button onClick={() => toggle(item.id)} className={`w-5 h-5 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${item.given ? 'bg-green-800/60 border-green-700' : 'border-amber-900/50 hover:border-amber-600'}`}>
              {item.given && <Check className="w-3 h-3 text-green-400"/>}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className={`text-sm font-medium truncate ${item.given ? 'line-through text-amber-800' : 'text-amber-200'}`}>{item.name}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {item.quantity > 1 && <span className="text-amber-700 text-[10px]">×{item.quantity}</span>}
                  {item.value && <span className="text-amber-600 text-[10px] font-mono">{item.value}</span>}
                </div>
              </div>
              {item.description && <p className="text-amber-800 text-[10px] mt-0.5 truncate">{item.description}</p>}
            </div>
            <button onClick={() => remove(item.id)} className="text-red-900 hover:text-red-500 transition-colors flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5"/>
            </button>
          </div>
        ))}
        {loot.length === 0 && <div className="text-center text-amber-900/40 text-sm py-8">No loot yet...</div>}
      </div>
    </div>
  );
}
