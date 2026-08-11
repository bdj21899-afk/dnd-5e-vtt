import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { CharacterRecord, MapRecord, listCharacters, listMaps, deleteCharacter, deleteMap } from '@/lib/charMapApi';
import { createSession, listSessionsByDM, SessionSummary, loadSession } from '@/lib/gameApi';
import { GameSession } from '@/types/dnd';
import { Plus, Trash2, Play, Edit, Scroll, Map, Sword, LogOut, Clock, Users, Shield } from 'lucide-react';

type Section = 'play' | 'characters' | 'maps';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [section, setSection] = useState<Section>('play');
  const [characters, setCharacters] = useState<CharacterRecord[]>([]);
  const [maps, setMaps] = useState<MapRecord[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    listCharacters(user.id).then(setCharacters);
    listMaps(user.id).then(setMaps);
    listSessionsByDM(user.username).then(setSessions);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    logout();
    navigate('/');
  };

  const startSession = async () => {
    if (!sessionName.trim()) { toast.error('Enter a campaign name'); return; }
    setLoading(true);
    try {
      const id = Math.random().toString(36).substring(2, 8).toUpperCase();
      const session: GameSession = {
        id, name: sessionName.trim(), dmName: user!.username,
        mapImage: null, tokens: [], fogRevealed: [],
        initiative: [], initiativeIndex: -1, notes: [], loot: [],
        mapOffsetX: 0, mapOffsetY: 0, mapScale: 1,
      };
      await createSession(session);
      localStorage.setItem(`dnd_session_${id}`, JSON.stringify(session));
      localStorage.setItem('dnd_current_session', id);
      localStorage.setItem('dnd_current_role', 'dm');
      navigate('/dm');
    } catch (e: any) {
      toast.error(e.message);
      setLoading(false);
    }
  };

  const resumeSession = (s: SessionSummary) => {
    localStorage.setItem('dnd_current_session', s.id);
    localStorage.setItem('dnd_current_role', 'dm');
    navigate('/dm');
  };

  const joinSession = async () => {
    if (!joinCode.trim()) { toast.error('Enter a session code'); return; }
    setLoading(true);
    try {
      const code = joinCode.toUpperCase();
      const remote = await loadSession(code);
      if (!remote) { toast.error('Session not found'); setLoading(false); return; }
      localStorage.setItem(`dnd_session_${code}`, JSON.stringify(remote));
      localStorage.setItem('dnd_current_session', code);
      localStorage.setItem('dnd_current_role', 'player');
      localStorage.setItem('dnd_player_name', user!.username);
      localStorage.setItem('dnd_player_id', user!.id);
      navigate('/player');
    } catch (e: any) {
      toast.error(e.message);
      setLoading(false);
    }
  };

  const removeChar = async (id: string) => {
    await deleteCharacter(id);
    setCharacters(cs => cs.filter(c => c.id !== id));
    toast.success('Character deleted');
  };

  const removeMap = async (id: string) => {
    await deleteMap(id);
    setMaps(ms => ms.filter(m => m.id !== id));
    toast.success('Map deleted');
  };

  const playChar = (c: CharacterRecord) => {
    // Store character for the player view
    const playerId = user!.id;
    localStorage.setItem(`dnd_char_${playerId}`, JSON.stringify(c.characterData));
    setSection('play');
    toast.success(`${c.name} ready — join a session below`);
  };

  const useMap = (m: MapRecord) => {
    // Store for quick-load in DM session
    localStorage.setItem('dnd_pending_map', m.imageUrl || '');
    setSection('play');
    toast.success(`${m.name} ready — start a session and the map will load`);
  };

  const fmt = (iso: string) => {
    const diffH = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    const d = Math.floor(diffH / 24);
    return d === 1 ? 'Yesterday' : `${d}d ago`;
  };

  const inp = "w-full bg-black/50 border border-amber-900/50 rounded px-3 py-2.5 text-amber-100 placeholder-amber-900/60 text-sm focus:outline-none focus:border-amber-600 transition-colors";

  const NAV = [
    { id: 'play' as Section, icon: <Sword className="w-4 h-4"/>, label: 'Play' },
    { id: 'characters' as Section, icon: <Scroll className="w-4 h-4"/>, label: 'Characters' },
    { id: 'maps' as Section, icon: <Map className="w-4 h-4"/>, label: 'Maps' },
  ];

  return (
    <div className="min-h-screen bg-[#06090f] text-amber-100 flex flex-col">
      {/* Header */}
      <header className="bg-[#0b0e1a] border-b border-amber-900/30 px-4 py-3 flex items-center gap-4">
        <span className="text-amber-500 font-bold tracking-widest text-sm hidden sm:block" style={{ fontFamily: 'Georgia,serif' }}>⚔ DUNGEON FORGE</span>
        <div className="w-px h-5 bg-amber-900/40 hidden sm:block"/>
        <nav className="flex gap-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setSection(n.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${section === n.id ? 'bg-amber-900/40 text-amber-300' : 'text-amber-700 hover:text-amber-500'}`}>
              {n.icon}{n.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-amber-600 text-xs hidden sm:block">{user?.username}</span>
          <button onClick={handleSignOut} className="text-amber-900 hover:text-amber-600 transition-colors" title="Sign out">
            <LogOut className="w-4 h-4"/>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* ── PLAY SECTION ── */}
        {section === 'play' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-amber-300 tracking-wider mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-red-500"/> Dungeon Master — Start Session</h2>
              <div className="bg-[#0b0f1c] border border-amber-900/40 rounded-lg p-5">
                <div className="flex gap-3">
                  <input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="Campaign name…" className={inp} onKeyDown={e => e.key === 'Enter' && startSession()}/>
                  <button onClick={startSession} disabled={loading} className="bg-red-900/60 hover:bg-red-800/70 border border-red-800/60 text-amber-100 rounded px-5 py-2.5 font-bold tracking-widest text-xs transition-colors disabled:opacity-50 whitespace-nowrap">
                    {loading ? '…' : 'FORGE REALM'}
                  </button>
                </div>
              </div>
            </div>

            {/* Saved Sessions */}
            {sessions.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-amber-700 tracking-wider mb-3 flex items-center gap-2"><Clock className="w-4 h-4"/> Resume Session</h3>
                <div className="grid gap-2">
                  {sessions.map(s => (
                    <div key={s.id} className="flex items-center gap-3 bg-[#0b0f1c] border border-amber-900/30 hover:border-amber-800/50 rounded-lg px-4 py-3 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="text-amber-300 text-sm font-medium">{s.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-amber-800 text-[10px] font-mono">{s.id}</span>
                          <span className="text-amber-900/50 text-[10px]">{fmt(s.updatedAt)}</span>
                        </div>
                      </div>
                      <button onClick={() => resumeSession(s)} className="flex items-center gap-1.5 bg-amber-900/30 hover:bg-amber-800/50 border border-amber-800/50 text-amber-300 rounded px-3 py-1.5 text-[11px] font-semibold transition-colors">
                        <Play className="w-3 h-3"/> Resume
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-amber-300 tracking-wider mb-4 flex items-center gap-2"><Sword className="w-5 h-5 text-blue-500"/> Player — Join Session</h2>
              <div className="bg-[#0b0f1c] border border-amber-900/40 rounded-lg p-5">
                <div className="flex gap-3">
                  <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Session code…" className={`${inp} font-mono tracking-widest uppercase`} onKeyDown={e => e.key === 'Enter' && joinSession()}/>
                  <button onClick={joinSession} disabled={loading} className="bg-blue-900/60 hover:bg-blue-800/70 border border-blue-800/60 text-amber-100 rounded px-5 py-2.5 font-bold tracking-widest text-xs transition-colors disabled:opacity-50 whitespace-nowrap">
                    {loading ? '…' : 'JOIN'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CHARACTERS SECTION ── */}
        {section === 'characters' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-amber-300 tracking-wider flex items-center gap-2"><Scroll className="w-5 h-5"/> My Characters</h2>
              <button onClick={() => navigate('/character-builder')} className="flex items-center gap-2 bg-amber-800/40 hover:bg-amber-700/50 border border-amber-700/40 text-amber-300 rounded px-4 py-2 text-xs font-bold transition-colors">
                <Plus className="w-3.5 h-3.5"/> NEW CHARACTER
              </button>
            </div>
            {characters.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4 opacity-20">📜</div>
                <p className="text-amber-800 text-sm">No characters yet. Create your first adventurer!</p>
                <button onClick={() => navigate('/character-builder')} className="mt-4 bg-amber-800/40 hover:bg-amber-700/50 border border-amber-700/40 text-amber-300 rounded px-5 py-2.5 text-xs font-bold transition-colors">
                  CREATE CHARACTER
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {characters.map(c => (
                  <div key={c.id} className="bg-[#0b0f1c] border border-amber-900/40 hover:border-amber-800/60 rounded-lg p-4 transition-colors group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-amber-200 font-bold text-base">{c.name}</div>
                        <div className="text-amber-700 text-xs mt-0.5">
                          {c.characterData.race} {c.characterData.charClass} · Lv {c.characterData.level}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/character-builder?id=${c.id}`)} className="p-1.5 text-amber-800 hover:text-amber-500 transition-colors"><Edit className="w-3.5 h-3.5"/></button>
                        <button onClick={() => removeChar(c.id)} className="p-1.5 text-red-900 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-amber-800 mb-3">
                      <span>❤ {c.characterData.currentHp}/{c.characterData.maxHp}</span>
                      <span>🛡 AC {c.characterData.ac}</span>
                      <span>✨ {c.characterData.background}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => playChar(c)} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-900/40 hover:bg-blue-800/50 border border-blue-800/50 text-blue-300 rounded py-1.5 text-[11px] font-semibold transition-colors">
                        <Play className="w-3 h-3"/> Play This
                      </button>
                      <button onClick={() => navigate(`/character-builder?id=${c.id}`)} className="flex-1 flex items-center justify-center gap-1.5 bg-amber-900/30 hover:bg-amber-800/40 border border-amber-800/40 text-amber-400 rounded py-1.5 text-[11px] font-semibold transition-colors">
                        <Edit className="w-3 h-3"/> Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MAPS SECTION ── */}
        {section === 'maps' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-amber-300 tracking-wider flex items-center gap-2"><Map className="w-5 h-5"/> My Maps</h2>
              <button onClick={() => navigate('/map-builder')} className="flex items-center gap-2 bg-amber-800/40 hover:bg-amber-700/50 border border-amber-700/40 text-amber-300 rounded px-4 py-2 text-xs font-bold transition-colors">
                <Plus className="w-3.5 h-3.5"/> NEW MAP
              </button>
            </div>
            {maps.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4 opacity-20">🗺</div>
                <p className="text-amber-800 text-sm">No maps yet. Build your first dungeon!</p>
                <button onClick={() => navigate('/map-builder')} className="mt-4 bg-amber-800/40 hover:bg-amber-700/50 border border-amber-700/40 text-amber-300 rounded px-5 py-2.5 text-xs font-bold transition-colors">
                  BUILD MAP
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {maps.map(m => (
                  <div key={m.id} className="bg-[#0b0f1c] border border-amber-900/40 hover:border-amber-800/60 rounded-lg overflow-hidden transition-colors group">
                    <div className="aspect-video bg-[#06090f] flex items-center justify-center overflow-hidden">
                      {m.imageUrl ? (
                        <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover"/>
                      ) : (
                        <span className="text-4xl opacity-20">🗺</span>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div className="text-amber-200 font-medium text-sm">{m.name}</div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigate(`/map-builder?id=${m.id}`)} className="p-1 text-amber-800 hover:text-amber-500 transition-colors"><Edit className="w-3 h-3"/></button>
                          <button onClick={() => removeMap(m.id)} className="p-1 text-red-900 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3"/></button>
                        </div>
                      </div>
                      <div className="text-amber-900 text-[10px] mb-3">{m.width}×{m.height}px · {fmt(m.updatedAt)}</div>
                      <button onClick={() => useMap(m)} className="w-full flex items-center justify-center gap-1.5 bg-amber-900/30 hover:bg-amber-800/40 border border-amber-800/40 text-amber-400 rounded py-1.5 text-[11px] font-semibold transition-colors">
                        <Play className="w-3 h-3"/> Use in Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
