import { useState } from 'react';
import { Plus, Trash2, ImageIcon, Edit2, Check, X } from 'lucide-react';
import { Token } from '@/types/dnd';
import { TOKEN_COLORS } from '@/constants/dnd5e';

interface Props {
  tokens: Token[];
  sessionCode: string;
  onAddPlayerToken: (token: Token) => void;
  onRemoveToken: (id: string) => void;
  onUpdateToken?: (id: string, patch: Partial<Token>) => void;
}

export function MapSessionPanel({ tokens, sessionCode, onAddPlayerToken, onRemoveToken, onUpdateToken }: Props) {
  const [playerName, setPlayerName] = useState('');
  const [colorIdx, setColorIdx] = useState(0);
  const [playerImageUrl, setPlayerImageUrl] = useState('');
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [editHp, setEditHp] = useState(0);
  const [editAc, setEditAc] = useState(0);

  const addPlayer = () => {
    if (!playerName.trim()) return;
    const token: Token = {
      id: Date.now().toString(), name: playerName.trim(),
      x: 50, y: 50, color: TOKEN_COLORS[colorIdx % TOKEN_COLORS.length], size: 44,
      hp: 10, maxHp: 10, ac: 10, isPC: true,
      ownerId: playerName.trim().toLowerCase().replace(/\s+/g, '_'),
      imageUrl: playerImageUrl.trim() || undefined,
    };
    onAddPlayerToken(token);
    setPlayerName('');
    setPlayerImageUrl('');
  };

  const startEdit = (t: Token) => {
    setEditingToken(t.id);
    setEditHp(t.maxHp);
    setEditAc(t.ac);
  };

  const saveEdit = (t: Token) => {
    onUpdateToken?.(t.id, { hp: editHp, maxHp: editHp, ac: editAc });
    setEditingToken(null);
  };

  const pcTokens = tokens.filter(t => t.isPC);
  const npcTokens = tokens.filter(t => !t.isPC);

  const TokenRow = ({ t }: { t: Token }) => {
    const isEditing = editingToken === t.id;
    const hpPct = t.maxHp > 0 ? t.hp / t.maxHp : 1;
    const hpColor = hpPct > 0.5 ? 'text-green-500' : hpPct > 0.25 ? 'text-amber-500' : 'text-red-500';
    return (
      <div className="bg-[#0d1525] border border-amber-900/20 rounded px-2.5 py-2 space-y-1.5">
        <div className="flex items-center gap-2">
          {t.imageUrl
            ? <img src={t.imageUrl} className="w-7 h-7 rounded-full object-cover border border-amber-900/40 flex-shrink-0" alt={t.name}/>
            : <div className="w-7 h-7 rounded-full flex-shrink-0 border border-amber-600/30 flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: t.color }}>{t.name.slice(0,2).toUpperCase()}</div>
          }
          <span className="flex-1 text-amber-300 text-xs truncate">{t.name}</span>
          {!isEditing && (
            <>
              <span className={`text-[10px] font-mono ${hpColor}`}>{t.hp}/{t.maxHp}</span>
              <button onClick={() => startEdit(t)} className="text-amber-900 hover:text-amber-500 transition-colors"><Edit2 className="w-3 h-3"/></button>
            </>
          )}
          <button onClick={() => onRemoveToken(t.id)} className="text-red-900 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3"/></button>
        </div>

        {isEditing && (
          <div className="flex items-center gap-1.5 pl-9">
            <span className="text-amber-800 text-[9px]">HP</span>
            <input type="number" value={editHp} onChange={e => setEditHp(+e.target.value)} className="w-14 bg-black/50 border border-amber-900/40 text-amber-200 rounded px-1.5 py-0.5 text-[10px] text-center focus:outline-none"/>
            <span className="text-amber-800 text-[9px]">AC</span>
            <input type="number" value={editAc} onChange={e => setEditAc(+e.target.value)} className="w-12 bg-black/50 border border-amber-900/40 text-amber-200 rounded px-1.5 py-0.5 text-[10px] text-center focus:outline-none"/>
            <button onClick={() => saveEdit(t)} className="text-green-500 hover:text-green-400 transition-colors"><Check className="w-3.5 h-3.5"/></button>
            <button onClick={() => setEditingToken(null)} className="text-red-700 hover:text-red-500 transition-colors"><X className="w-3 h-3"/></button>
          </div>
        )}

        {!isEditing && t.maxHp > 0 && (
          <div className="pl-9">
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${hpPct * 100}%`, backgroundColor: hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444' }}/>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full p-3 gap-4 overflow-y-auto">
      {/* Session code */}
      <div className="bg-[#0d1525] border border-amber-900/30 rounded p-3">
        <div className="text-amber-800 text-[10px] tracking-widest mb-2 uppercase">Session Code</div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-2xl font-bold text-amber-400 font-mono tracking-widest">{sessionCode}</span>
          <button onClick={() => navigator.clipboard.writeText(sessionCode)} className="text-amber-800 hover:text-amber-500 text-[11px] border border-amber-900/40 hover:border-amber-700 rounded px-2 py-1 transition-colors">Copy</button>
        </div>
        <p className="text-amber-900/60 text-[10px] mt-1">Share with players to join</p>
      </div>

      {/* Add Player Token */}
      <div className="bg-[#0d1525] border border-amber-900/30 rounded p-3 space-y-2">
        <div className="text-amber-800 text-[10px] tracking-widest uppercase">Add Player Token</div>
        <input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Player character name"
          className="w-full bg-black/50 border border-amber-900/40 text-amber-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-amber-600"
          onKeyDown={e => e.key === 'Enter' && addPlayer()} />
        <div className="flex items-center gap-1.5">
          <ImageIcon className="w-3 h-3 text-amber-800 flex-shrink-0"/>
          <input value={playerImageUrl} onChange={e => setPlayerImageUrl(e.target.value)} placeholder="Character image URL (optional)"
            className="flex-1 bg-black/50 border border-amber-900/40 text-amber-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-amber-600"/>
        </div>
        {playerImageUrl && (
          <img src={playerImageUrl} className="w-full h-20 object-cover rounded border border-amber-900/30" alt="preview"/>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {TOKEN_COLORS.map((c, i) => (
              <button key={c} onClick={() => setColorIdx(i)} className={`w-5 h-5 rounded-full transition-transform ${colorIdx === i ? 'scale-125 ring-1 ring-amber-400' : ''}`} style={{ backgroundColor: c }} />
            ))}
          </div>
          <button onClick={addPlayer} className="bg-amber-800/40 hover:bg-amber-700/50 border border-amber-700/40 text-amber-300 rounded px-2.5 py-1.5 text-[11px] flex items-center gap-1 transition-colors whitespace-nowrap">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      </div>

      {/* Token lists */}
      {pcTokens.length > 0 && (
        <div>
          <div className="text-amber-800 text-[10px] tracking-widest uppercase mb-1.5">Player Tokens</div>
          <div className="space-y-1.5">{pcTokens.map(t => <TokenRow key={t.id} t={t}/>)}</div>
        </div>
      )}

      {npcTokens.length > 0 && (
        <div>
          <div className="text-amber-800 text-[10px] tracking-widest uppercase mb-1.5">Monster Tokens</div>
          <div className="space-y-1.5">{npcTokens.map(t => <TokenRow key={t.id} t={t}/>)}</div>
        </div>
      )}

      {tokens.length === 0 && <div className="text-center text-amber-900/40 text-xs py-4">No tokens on map</div>}
    </div>
  );
}
