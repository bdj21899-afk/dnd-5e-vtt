import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Sword, LogIn, UserPlus } from 'lucide-react';
import { GameSession } from '@/types/dnd';
import { createSession, loadSession } from '@/lib/gameApi';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [playerName, setPlayerName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [dmName, setDmName] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [error, setError] = useState('');

  const startGuestSession = async () => {
    if (!dmName.trim() || !sessionName.trim()) { setError('Please fill all fields'); return; }
    setError('');
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const session: GameSession = {
      id, name: sessionName.trim(), dmName: dmName.trim(),
      mapImage: null, tokens: [], fogRevealed: [],
      initiative: [], initiativeIndex: -1, notes: [], loot: [],
      mapOffsetX: 0, mapOffsetY: 0, mapScale: 1,
    };
    await createSession(session);
    localStorage.setItem(`dnd_session_${id}`, JSON.stringify(session));
    localStorage.setItem('dnd_current_session', id);
    localStorage.setItem('dnd_current_role', 'dm');
    localStorage.setItem('dnd_dm_name', dmName.trim());
    navigate('/dm');
  };

  const joinSession = async () => {
    if (!playerName.trim() || !sessionCode.trim()) { setError('Please fill all fields'); return; }
    setError('');
    const code = sessionCode.toUpperCase();
    const remote = await loadSession(code);
    if (remote) {
      localStorage.setItem(`dnd_session_${code}`, JSON.stringify(remote));
    } else if (!localStorage.getItem(`dnd_session_${code}`)) {
      setError('Session not found — check the code.'); return;
    }
    localStorage.setItem('dnd_current_session', code);
    localStorage.setItem('dnd_current_role', 'player');
    localStorage.setItem('dnd_player_name', playerName.trim());
    localStorage.setItem('dnd_player_id', playerName.trim().toLowerCase().replace(/\s+/g, '_'));
    navigate('/player');
  };

  const inp = "w-full bg-black/50 border border-amber-900/50 rounded px-3 py-2.5 text-amber-100 placeholder-amber-900/70 text-sm focus:outline-none focus:border-amber-600 transition-colors";

  return (
    <div className="min-h-screen bg-[#06090f] text-amber-100 flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      <div className="absolute inset-0 opacity-[0.035]"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1614851099511-773084f6911d?w=1600&auto=format)', backgroundSize: 'cover', backgroundPosition: 'center' }}/>
      <div className="absolute inset-0 bg-gradient-to-b from-[#06090f] via-transparent to-[#06090f]"/>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-900/20 border-2 border-amber-700/60 rounded-lg mb-5">
            <span className="text-3xl">⚔️</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-[0.15em] text-amber-400 mb-2" style={{ fontFamily: 'Georgia,serif' }}>
            DUNGEON FORGE
          </h1>
          <p className="text-amber-600/80 tracking-[0.3em] text-xs uppercase">D&D 5e Virtual Tabletop</p>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-700 to-transparent mx-auto mt-4"/>
        </div>

        {/* Account CTA */}
        <div className="bg-amber-900/10 border border-amber-800/30 rounded-lg px-5 py-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-amber-300 text-sm font-bold">Sign in for full features</div>
            <div className="text-amber-800 text-xs mt-0.5">Save characters, build maps, resume sessions from any device</div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 bg-amber-800/50 hover:bg-amber-700/60 border border-amber-700/50 text-amber-200 rounded px-4 py-2 text-xs font-bold transition-colors">
                Go to Dashboard →
              </button>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-1.5 bg-[#0d1525] hover:bg-[#141c30] border border-amber-900/40 text-amber-600 hover:text-amber-400 rounded px-3 py-2 text-xs font-bold transition-colors">
                  <LogIn className="w-3.5 h-3.5"/> Sign In
                </Link>
                <Link to="/login" className="flex items-center gap-1.5 bg-amber-800/50 hover:bg-amber-700/60 border border-amber-700/50 text-amber-200 rounded px-3 py-2 text-xs font-bold transition-colors">
                  <UserPlus className="w-3.5 h-3.5"/> Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Guest play */}
        <div className="text-center mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-amber-900/30"/>
            <span className="text-amber-800 text-[10px] tracking-widest uppercase">Or play as guest</span>
            <div className="flex-1 h-px bg-amber-900/30"/>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* DM Card */}
          <div className="bg-[#0b0f1c] border border-amber-900/40 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-red-900/30 border border-red-800/50 rounded flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-red-400"/>
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-300 tracking-wider">DUNGEON MASTER</h2>
                <p className="text-[11px] text-amber-800">Create a guest session</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="Campaign Name" className={inp} onKeyDown={e => e.key === 'Enter' && startGuestSession()}/>
              <input value={dmName} onChange={e => setDmName(e.target.value)} placeholder="Your Name (DM)" className={inp} onKeyDown={e => e.key === 'Enter' && startGuestSession()}/>
              <button onClick={startGuestSession} className="w-full py-2.5 bg-red-900/60 hover:bg-red-800/70 border border-red-800/60 text-amber-100 rounded font-semibold tracking-widest text-xs transition-colors mt-1">
                FORGE THE REALM →
              </button>
            </div>
          </div>

          {/* Player Card */}
          <div className="bg-[#0b0f1c] border border-amber-900/40 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-blue-900/30 border border-blue-800/50 rounded flex items-center justify-center flex-shrink-0">
                <Sword className="w-4 h-4 text-blue-400"/>
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-300 tracking-wider">PLAYER</h2>
                <p className="text-[11px] text-amber-800">Join with a session code</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <input value={sessionCode} onChange={e => setSessionCode(e.target.value.toUpperCase())} placeholder="Session Code (e.g. AB12CD)" className={`${inp} tracking-widest uppercase font-mono`} onKeyDown={e => e.key === 'Enter' && joinSession()}/>
              <input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Your Character Name" className={inp} onKeyDown={e => e.key === 'Enter' && joinSession()}/>
              <button onClick={joinSession} className="w-full py-2.5 bg-blue-900/60 hover:bg-blue-800/70 border border-blue-800/60 text-amber-100 rounded font-semibold tracking-widest text-xs transition-colors mt-1">
                ENTER THE REALM →
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded px-4 py-2 text-center">{error}</div>
        )}

        <p className="text-center text-amber-900/40 text-xs mt-6">
          Sessions sync across devices · Voice chat built-in · Maps save forever with an account
        </p>
      </div>
    </div>
  );
}
