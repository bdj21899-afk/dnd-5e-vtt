import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Token } from '@/types/dnd';
import { TOKEN_COLORS } from '@/constants/dnd5e';

interface Props {
  tokens: Token[];
  sessionCode: string;
  onAddPlayerToken: (token: Token) => void;
  onRemoveToken: (id: string) => void;
}

export function MapSessionPanel({ tokens, sessionCode, onAddPlayerToken, onRemoveToken }: Props) {
  const [playerName, setPlayerName] = useState('');
  const [colorIdx, setColorIdx] = useState(0);

  const addPlayer = () => {
    if (!playerName.trim()) return;
    const token: Token = {
      id: Date.now().toString(), name: playerName.trim(),
      x: 50, y: 50, color: TOKEN_COLORS[colorIdx % TOKEN_COLORS.length], size: 44,
      hp: 10, maxHp: 10, ac: 10, isPC: true,
      ownerId: playerName.trim().toLowerCase().replace(/\s+/g, '_'),
    };
    onAddPlayerToken(token);
    setPlayerName('');
  };

  const pcTokens = tokens.filter(t => t.isPC);
  const npcTokens = tokens.filter(t => !t.isPC);

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

      {/* Token list */}
      {pcTokens.length > 0 && (
        <div>
          <div className="text-amber-800 text-[10px] tracking-widest uppercase mb-1.5">Player Tokens</div>
          <div className="space-y-1">
            {pcTokens.map(t => (
              <div key={t.id} className="flex items-center gap-2 bg-[#0d1525] border border-amber-900/20 rounded px-2.5 py-1.5">
                <div className="w-5 h-5 rounded-full flex-shrink-0 border border-amber-600/50" style={{ backgroundColor: t.color }} />
                <span className="flex-1 text-amber-300 text-xs truncate">{t.name}</span>
                <button onClick={() => onRemoveToken(t.id)} className="text-red-900 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {npcTokens.length > 0 && (
        <div>
          <div className="text-amber-800 text-[10px] tracking-widest uppercase mb-1.5">Monster Tokens</div>
          <div className="space-y-1">
            {npcTokens.map(t => (
              <div key={t.id} className="flex items-center gap-2 bg-[#0d1525] border border-amber-900/20 rounded px-2.5 py-1.5">
                <div className="w-5 h-5 rounded-full flex-shrink-0 border border-gray-600/50" style={{ backgroundColor: t.color }} />
                <span className="flex-1 text-amber-300 text-xs truncate">{t.name}</span>
                <span className="text-amber-800 text-[10px]">{t.hp}/{t.maxHp}</span>
                <button onClick={() => onRemoveToken(t.id)} className="text-red-900 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tokens.length === 0 && <div className="text-center text-amber-900/40 text-xs py-4">No tokens on map</div>}
    </div>
  );
}
